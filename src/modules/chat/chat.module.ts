import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { McpCvModule } from '../mcp-cv/mcp-cv.module';
import { McpGithubModule } from '../mcp-github/mcp-github.module';
import { McpChatHistoryModule } from '../mcp-chat-history/mcp-chat-history.module';

@Module({
  imports: [
    McpCvModule,
    McpGithubModule,
    McpChatHistoryModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}