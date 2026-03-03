import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  send(
    @Body() dto: SendMessageDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.messagesService.send(dto, userId);
  }

  @Get('conversations')
  @UseGuards(RolesGuard)
  @Roles(Role.COACH)
  getConversations(@CurrentUser('sub') coachId: string) {
    return this.messagesService.getConversationList(coachId);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser('sub') userId: string) {
    return this.messagesService.getUnreadCount(userId);
  }

  @Get('conversation/:userId')
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
  markAsRead(
    @Param('userId') senderUserId: string,
    @CurrentUser('sub') currentUserId: string,
  ) {
    return this.messagesService.markAsRead(currentUserId, senderUserId);
  }
}
