import { Module } from '@nestjs/common';
import { DbConnectService } from './db-connect.service';

@Module({
  providers: [DbConnectService],
  exports: [DbConnectService],
})
export class DbConnectModule {}
