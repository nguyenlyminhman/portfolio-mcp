import { Module } from '@nestjs/common';
import { McpGithubService } from './mcp-github.service';

@Module({
  providers: [McpGithubService]
})
export class McpGithubModule {}
