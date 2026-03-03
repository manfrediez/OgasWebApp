import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import 'multer';

import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums';

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

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
  destination: './uploads/messages',
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

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      storage,
      fileFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  send(
    @Body() dto: SendMessageDto,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser('sub') userId: string,
  ) {
    return this.messagesService.send(dto, userId, files || []);
  }

  @Get('files/:storedName')
  serveFile(
    @Param('storedName') storedName: string,
    @Res() res: Response,
  ) {
    if (!UUID_FILENAME_REGEX.test(storedName)) {
      throw new BadRequestException('Nombre de archivo inválido');
    }
    const filePath = this.messagesService.getFilePath(storedName);
    const ext = path.extname(storedName).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(filePath);
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COACH)
  getConversations(@CurrentUser('sub') coachId: string) {
    return this.messagesService.getConversationList(coachId);
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  getUnreadCount(@CurrentUser('sub') userId: string) {
    return this.messagesService.getUnreadCount(userId);
  }

  @Get('conversation/:userId')
  @UseGuards(JwtAuthGuard)
  getConversation(
    @Param('userId') otherUserId: string,
    @Query() query: GetMessagesQueryDto,
    @CurrentUser('sub') currentUserId: string,
  ) {
    return this.messagesService.getConversation(
      currentUserId,
      otherUserId,
      query.limit ? +query.limit : 30,
      query.skip ? +query.skip : 0,
    );
  }

  @Patch('read/:userId')
  @UseGuards(JwtAuthGuard)
  markAsRead(
    @Param('userId') senderUserId: string,
    @CurrentUser('sub') currentUserId: string,
  ) {
    return this.messagesService.markAsRead(currentUserId, senderUserId);
  }
}
