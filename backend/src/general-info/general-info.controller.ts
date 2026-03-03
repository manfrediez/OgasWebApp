import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import 'multer';
const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums';

import { GeneralInfoService } from './general-info.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { CreateInfoPostDto } from './dto/create-info-post.dto';
import { UpdateInfoPostDto } from './dto/update-info-post.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx)$/i;
const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const UUID_FILENAME_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|gif|webp|pdf|doc|docx)$/i;

const storage = diskStorage({
  destination: './uploads/general-info',
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!ALLOWED_EXTENSIONS.test(file.originalname)) {
    return cb(new Error('Tipo de archivo no permitido'), false);
  }
  if (!ALLOWED_MIMES.has(file.mimetype)) {
    return cb(new Error('Tipo MIME no permitido'), false);
  }
  cb(null, true);
};

@Controller('general-info')
export class GeneralInfoController {
  constructor(private readonly service: GeneralInfoService) {}

  // ── topics ──

  @Post('topics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COACH)
  createTopic(
    @CurrentUser('sub') coachId: string,
    @Body() dto: CreateTopicDto,
  ) {
    return this.service.createTopic(coachId, dto);
  }

  @Get('topics')
  @UseGuards(JwtAuthGuard)
  getTopics(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.service.getTopics(userId, role);
  }

  @Patch('topics/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COACH)
  updateTopic(
    @CurrentUser('sub') coachId: string,
    @Param('id') topicId: string,
    @Body() dto: UpdateTopicDto,
  ) {
    return this.service.updateTopic(coachId, topicId, dto);
  }

  @Delete('topics/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COACH)
  deleteTopic(
    @CurrentUser('sub') coachId: string,
    @Param('id') topicId: string,
  ) {
    return this.service.deleteTopic(coachId, topicId);
  }

  // ── posts ──

  @Post('posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COACH)
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage,
      fileFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  createPost(
    @CurrentUser('sub') coachId: string,
    @Body() dto: CreateInfoPostDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.service.createPost(coachId, dto, files || []);
  }

  @Get('posts/topic/:topicId')
  @UseGuards(JwtAuthGuard)
  getPostsByTopic(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
    @Param('topicId') topicId: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.service.getPostsByTopic(userId, role, topicId, pagination);
  }

  @Get('posts/:id')
  @UseGuards(JwtAuthGuard)
  getPost(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
    @Param('id') postId: string,
  ) {
    return this.service.getPost(userId, role, postId);
  }

  @Patch('posts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COACH)
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage,
      fileFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  updatePost(
    @CurrentUser('sub') coachId: string,
    @Param('id') postId: string,
    @Body() dto: UpdateInfoPostDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.service.updatePost(coachId, postId, dto, files || []);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COACH)
  deletePost(
    @CurrentUser('sub') coachId: string,
    @Param('id') postId: string,
  ) {
    return this.service.deletePost(coachId, postId);
  }

  // ── files ──

  @Get('files/:storedName')
  serveFile(
    @Param('storedName') storedName: string,
    @Res() res: Response,
  ) {
    if (!UUID_FILENAME_REGEX.test(storedName)) {
      throw new BadRequestException('Nombre de archivo inválido');
    }
    const filePath = this.service.getFilePath(storedName);
    const ext = path.extname(storedName).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(filePath);
  }
}
