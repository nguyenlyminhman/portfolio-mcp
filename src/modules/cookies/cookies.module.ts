import { Module } from '@nestjs/common';
import { CookiesController } from './cookies.controller';
import { CookiesService } from './cookies.service';
import { DbConnectModule } from '../db-connect/db-connect.module';
import { ConversationService } from '../conversation/conversation.service';
import { HrSessionService } from '../hr-session/hr-session.service';

@Module({
  imports: [DbConnectModule],
  controllers: [CookiesController],
  providers: [
    CookiesService, 
    ConversationService,
    HrSessionService
  ],
})
export class CookiesModule {}
