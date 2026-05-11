import { Module } from '@nestjs/common';
import { CookiesController } from './cookies.controller';
import { CookiesService } from './cookies.service';
import { DbConnectModule } from '../db-connect/db-connect.module';
import { HrSessionService } from '../hr-session/hr-session.service';
import { CmsConversationService } from '../cms-conversation/cms-conversation.service';

@Module({
  imports: [DbConnectModule],
  controllers: [CookiesController],
  providers: [
    CookiesService, 
    CmsConversationService,
    HrSessionService
  ],
})
export class CookiesModule {}
