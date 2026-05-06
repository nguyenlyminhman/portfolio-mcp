import { Module } from '@nestjs/common';
import { HrSessionController } from './hr-session.controller';
import { HrSessionService } from './hr-session.service';
import { DbConnectService } from '../db-connect/db-connect.service';

@Module({
  controllers: [HrSessionController],
  providers: [
    HrSessionService, 
    DbConnectService
  ],
  exports: [HrSessionService],
})
export class HrSessionModule {}
