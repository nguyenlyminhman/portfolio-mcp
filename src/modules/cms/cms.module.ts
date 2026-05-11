import { Module } from '@nestjs/common';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { DbConnectModule } from '../db-connect/db-connect.module';

@Module({
  imports: [DbConnectModule],
  controllers: [CmsController],
  providers: [CmsService],
})
export class CmsModule { }
