import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { McpCvService } from '../mcp-cv/mcp-cv.service';
import { McpChatHistoryService } from '../mcp-chat-history/mcp-chat-history.service';
import { McpGithubService } from '../mcp-github/mcp-github.service';
import { DbConnectService } from '../db-connect/db-connect.service';

@Module({
  imports: [ ],
  controllers: [ChatController],
  providers: [
    DbConnectService,
    ChatService,
    McpCvService,
    McpGithubService,
    McpChatHistoryService
  ],
  exports: [ChatService],
})
export class ChatModule {}