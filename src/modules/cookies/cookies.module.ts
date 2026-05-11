import { Module } from '@nestjs/common';
import { CookiesController } from './cookies.controller';
import { CookiesService } from './cookies.service';
import { DbConnectModule } from '../db-connect/db-connect.module';
import { HrSessionService } from '../hr-session/hr-session.service';
import { CmsConvService } from '../cms-conv/cms-conv.service';

@Module({
  imports: [DbConnectModule],
  controllers: [CookiesController],
  providers: [
    CookiesService, 
    CmsConvService,
    HrSessionService
  ],
})
export class CookiesModule {}
