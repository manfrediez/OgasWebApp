import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  private async validateRelation(
    userId1: string,
    userId2: string,
  ): Promise<void> {
    const user1 = await this.userModel.findById(userId1).lean();
    const user2 = await this.userModel.findById(userId2).lean();
    if (!user1 || !user2) {
      throw new ForbiddenException('Usuario no encontrado');
    }

    const isCoachAthlete =
      (user1.role === 'COACH' &&
        user2.coachId?.toString() === userId1) ||
      (user2.role === 'COACH' &&
        user1.coachId?.toString() === userId2);

    if (!isCoachAthlete) {
      throw new ForbiddenException(
        'Solo podés enviar mensajes a tu coach o atleta',
      );
    }
  }

  async send(
    dto: SendMessageDto,
    senderId: string,
  ): Promise<MessageDocument> {
    await this.validateRelation(senderId, dto.receiverId);
    return this.messageModel.create({
      senderId: new Types.ObjectId(senderId),
      receiverId: new Types.ObjectId(dto.receiverId),
      content: dto.content,
    });
  }

  async getConversation(
    currentUserId: string,
    otherUserId: string,
    limit = 30,
    skip = 0,
  ): Promise<MessageDocument[]> {
    await this.validateRelation(currentUserId, otherUserId);
    const uid1 = new Types.ObjectId(currentUserId);
    const uid2 = new Types.ObjectId(otherUserId);
    return this.messageModel
      .find({
        $or: [
          { senderId: uid1, receiverId: uid2 },
          { senderId: uid2, receiverId: uid1 },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async getConversationList(coachId: string) {
    const athletes = await this.userModel
      .find({ coachId: new Types.ObjectId(coachId) })
      .select('firstName lastName email isActive')
      .lean();

    if (athletes.length === 0) return [];

    const athleteIds = athletes.map((a) => a._id);
    const cid = new Types.ObjectId(coachId);

    const lastMessages = await this.messageModel.aggregate([
      {
        $match: {
          $or: [
            { senderId: cid, receiverId: { $in: athleteIds } },
            { senderId: { $in: athleteIds }, receiverId: cid },
          ],
        },
      },
      {
        $addFields: {
          athleteId: {
            $cond: [{ $eq: ['$senderId', cid] }, '$receiverId', '$senderId'],
          },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$athleteId',
          lastMessage: { $first: '$content' },
          lastMessageAt: { $first: '$createdAt' },
          lastSenderId: { $first: '$senderId' },
        },
      },
    ]);

    const unreadCounts = await this.messageModel.aggregate([
      {
        $match: {
          receiverId: cid,
          senderId: { $in: athleteIds },
          read: false,
        },
      },
      { $group: { _id: '$senderId', count: { $sum: 1 } } },
    ]);

    const lastMsgMap = new Map(
      lastMessages.map((m) => [m._id.toString(), m]),
    );
    const unreadMap = new Map(
      unreadCounts.map((u) => [u._id.toString(), u.count]),
    );

    const result = athletes.map((athlete) => {
      const aid = athlete._id.toString();
      const lm = lastMsgMap.get(aid);
      return {
        athleteId: aid,
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        email: athlete.email,
        isActive: athlete.isActive,
        lastMessage: lm?.lastMessage || null,
        lastMessageAt: lm?.lastMessageAt || null,
        lastSenderId: lm?.lastSenderId?.toString() || null,
        unreadCount: unreadMap.get(aid) || 0,
      };
    });

    result.sort((a, b) => {
      if (!a.lastMessageAt && !b.lastMessageAt) return 0;
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return (
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime()
      );
    });

    return result;
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.messageModel.countDocuments({
      receiverId: new Types.ObjectId(userId),
      read: false,
    });
    return { count };
  }

  async markAsRead(
    currentUserId: string,
    senderUserId: string,
  ): Promise<void> {
    await this.messageModel.updateMany(
      {
        senderId: new Types.ObjectId(senderUserId),
        receiverId: new Types.ObjectId(currentUserId),
        read: false,
      },
      { $set: { read: true } },
    );
  }
}
