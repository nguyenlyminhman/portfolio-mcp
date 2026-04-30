import { Module } from '@nestjs/common';
import { McpGithubService } from './mcp-github.service';

@Module({
  providers: [McpGithubService],
  exports: [McpGithubService]
})
export class McpGithubModule {}
