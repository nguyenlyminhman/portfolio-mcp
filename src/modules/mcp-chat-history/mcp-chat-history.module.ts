import { Module } from '@nestjs/common';
import { McpChatHistoryService } from './mcp-chat-history.service';
import { DbConnectModule } from '../db-connect/db-connect.module';

@Module({
  imports: [DbConnectModule],
  providers: [McpChatHistoryService]
})
export class McpChatHistoryModule {}
