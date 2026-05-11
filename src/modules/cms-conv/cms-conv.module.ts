import { Module } from '@nestjs/common';
import { DbConnectService } from '../db-connect/db-connect.service';
import { CmsConvService } from './cms-conv.service';
import { CmsConvController } from './cms-conv.controller';

@Module({
  controllers: [CmsConvController],
  providers: [
    CmsConvService,
    DbConnectService
  ],
  exports: [CmsConvService]
})
export class CmsConvModule { }
