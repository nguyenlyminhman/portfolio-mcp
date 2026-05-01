import { Module } from '@nestjs/common';
import { McpGithubService } from './mcp-github.service';
import { DbConnectService } from '../db-connect/db-connect.service';

@Module({
  providers: [
    McpGithubService, 
    DbConnectService
  ],
  exports: [McpGithubService]
})
export class McpGithubModule {}
