import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

import { Topic, TopicDocument } from './schemas/topic.schema';
import { InfoPost, InfoPostDocument } from './schemas/info-post.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { CreateInfoPostDto } from './dto/create-info-post.dto';
import { UpdateInfoPostDto } from './dto/update-info-post.dto';
import { Role } from '../common/enums';
import {
  PaginationQueryDto,
  PaginatedResult,
} from '../common/dto/pagination-query.dto';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'general-info');

@Injectable()
export class GeneralInfoService {
  constructor(
    @InjectModel(Topic.name) private topicModel: Model<TopicDocument>,
    @InjectModel(InfoPost.name) private infoPostModel: Model<InfoPostDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  // ── helpers ──

  private async resolveCoachId(
    userId: string,
    role: Role,
  ): Promise<string> {
    if (role === Role.COACH) return userId;
    const user = await this.userModel.findById(userId).lean();
    if (!user || !user.coachId) {
      throw new ForbiddenException('No tenés un coach asignado');
    }
    return user.coachId.toString();
  }

  private async assertTopicOwner(
    topicId: string,
    coachId: string,
  ): Promise<TopicDocument> {
    const topic = await this.topicModel.findById(topicId);
    if (!topic) throw new NotFoundException('Tópico no encontrado');
    if (topic.coachId.toString() !== coachId) {
      throw new ForbiddenException('No tenés acceso a este tópico');
    }
    return topic;
  }

  private async assertPostOwner(
    postId: string,
    coachId: string,
  ): Promise<InfoPostDocument> {
    const post = await this.infoPostModel.findById(postId);
    if (!post) throw new NotFoundException('Publicación no encontrada');
    if (post.coachId.toString() !== coachId) {
      throw new ForbiddenException('No tenés acceso a esta publicación');
    }
    return post;
  }

  private deleteFiles(storedNames: string[]) {
    for (const name of storedNames) {
      const filePath = path.join(UPLOADS_DIR, name);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  // ── topics ──

  async createTopic(coachId: string, dto: CreateTopicDto) {
    return this.topicModel.create({ ...dto, coachId });
  }

  async getTopics(userId: string, role: Role) {
    const coachId = await this.resolveCoachId(userId, role);
    const topics = await this.topicModel
      .find({ coachId })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    const topicIds = topics.map((t) => t._id);
    const counts = await this.infoPostModel.aggregate([
      { $match: { topicId: { $in: topicIds } } },
      { $group: { _id: '$topicId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(
      counts.map((c) => [c._id.toString(), c.count]),
    );

    return topics.map((t) => ({
      ...t,
      postCount: countMap.get(t._id.toString()) || 0,
    }));
  }

  async updateTopic(coachId: string, topicId: string, dto: UpdateTopicDto) {
    const topic = await this.assertTopicOwner(topicId, coachId);
    Object.assign(topic, dto);
    return topic.save();
  }

  async deleteTopic(coachId: string, topicId: string) {
    await this.assertTopicOwner(topicId, coachId);

    const posts = await this.infoPostModel.find({ topicId }).lean();
    const allFiles = posts.flatMap((p) =>
      p.attachments.map((a) => a.storedName),
    );
    this.deleteFiles(allFiles);

    await this.infoPostModel.deleteMany({ topicId });
    await this.topicModel.findByIdAndDelete(topicId);
    return { deleted: true };
  }

  // ── posts ──

  async createPost(
    coachId: string,
    dto: CreateInfoPostDto,
    files: Express.Multer.File[],
  ) {
    await this.assertTopicOwner(dto.topicId, coachId);

    const attachments = files.map((f) => ({
      originalName: f.originalname,
      storedName: f.filename,
      mimeType: f.mimetype,
      size: f.size,
    }));

    return this.infoPostModel.create({
      ...dto,
      coachId,
      attachments,
    });
  }

  async getPostsByTopic(
    userId: string,
    role: Role,
    topicId: string,
    pagination?: PaginationQueryDto,
  ): Promise<PaginatedResult<any>> {
    const coachId = await this.resolveCoachId(userId, role);
    const topic = await this.topicModel.findById(topicId).lean();
    if (!topic || topic.coachId.toString() !== coachId) {
      throw new NotFoundException('Tópico no encontrado');
    }
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.infoPostModel
        .find({ topicId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.infoPostModel.countDocuments({ topicId }),
    ]);

    return { data, total, page, limit };
  }

  async getPost(userId: string, role: Role, postId: string) {
    const coachId = await this.resolveCoachId(userId, role);
    const post = await this.infoPostModel.findById(postId).lean();
    if (!post || post.coachId.toString() !== coachId) {
      throw new NotFoundException('Publicación no encontrada');
    }
    return post;
  }

  async updatePost(
    coachId: string,
    postId: string,
    dto: UpdateInfoPostDto,
    files: Express.Multer.File[],
  ) {
    const post = await this.assertPostOwner(postId, coachId);

    if (dto.title !== undefined) post.title = dto.title;
    if (dto.content !== undefined) post.content = dto.content;

    if (dto.removeAttachments?.length) {
      const toRemove = post.attachments.filter((a) =>
        dto.removeAttachments!.includes(a.storedName),
      );
      this.deleteFiles(toRemove.map((a) => a.storedName));
      post.attachments = post.attachments.filter(
        (a) => !dto.removeAttachments!.includes(a.storedName),
      );
    }

    if (files.length) {
      const newAttachments = files.map((f) => ({
        originalName: f.originalname,
        storedName: f.filename,
        mimeType: f.mimetype,
        size: f.size,
      }));
      post.attachments.push(...newAttachments);
    }

    return post.save();
  }

  async deletePost(coachId: string, postId: string) {
    const post = await this.assertPostOwner(postId, coachId);
    this.deleteFiles(post.attachments.map((a) => a.storedName));
    await this.infoPostModel.findByIdAndDelete(postId);
    return { deleted: true };
  }

  // ── files ──

  getFilePath(storedName: string): string {
    const filePath = path.join(UPLOADS_DIR, storedName);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Archivo no encontrado');
    }
    return filePath;
  }
}
