import { Module } from '@nestjs/common';
import { McpCvService } from './mcp-cv.service';
import { DbConnectService } from '../db-connect/db-connect.service';

@Module({
  providers: [
    McpCvService, 
    DbConnectService
  ],
  exports: [McpCvService],
})
export class McpCvModule {}
