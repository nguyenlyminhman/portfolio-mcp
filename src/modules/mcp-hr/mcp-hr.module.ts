import { Module } from '@nestjs/common';
import { McpHrService } from './mcp-hr.service';
import { DbConnectService } from '../db-connect/db-connect.service';

@Module({
  providers: [
    McpHrService, 
    DbConnectService
  ],
  exports: [McpHrService],
})
export class McpHrModule {}
