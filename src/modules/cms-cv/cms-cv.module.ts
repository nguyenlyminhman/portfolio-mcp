import { Module } from '@nestjs/common';
import { CmsCvController } from './cms-cv.controller';
import { CmsCvService } from './cms-cv.service';
import { DbConnectModule } from '../db-connect/db-connect.module';

@Module({
  imports: [DbConnectModule],
  controllers: [CmsCvController],
  providers: [CmsCvService]
})
export class CmsCvModule {}
