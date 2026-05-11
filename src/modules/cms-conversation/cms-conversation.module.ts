import { Module } from '@nestjs/common';
import { DbConnectService } from '../db-connect/db-connect.service';
import { CmsConversationController } from './cms-conversation.controller';
import { CmsConversationService } from './cms-conversation.service';

@Module({
  controllers: [CmsConversationController],
  providers: [
    CmsConversationService,
    DbConnectService
  ],
  exports: [CmsConversationService]
})
export class CmsConversationModule { }
