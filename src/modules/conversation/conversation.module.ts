import { Module } from '@nestjs/common';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { DbConnectService } from '../db-connect/db-connect.service';

@Module({
  controllers: [ConversationController],
  providers: [ConversationService, DbConnectService],
  exports: [ConversationService]
})
export class ConversationModule {}
