import { Module } from '@nestjs/common';
import { CmsRepoController } from './cms-repo.controller';
import { CmsRepoService } from './cms-repo.service';
import { DbConnectModule } from '../db-connect/db-connect.module';

@Module({
  imports: [DbConnectModule],
  controllers: [CmsRepoController],
  providers: [CmsRepoService]
})
export class CmsRepoModule {}
