import { Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { DbConnectService } from '../db-connect/db-connect.service';

@Injectable()
export class McpGithubService {
  private server: McpServer;

  constructor(private readonly db: DbConnectService) {
    this.server = new McpServer({
      name: 'portfolio-github-mcp',
      version: '1.0.0',
    });

    this.registerTools();
  }

  getServer(): McpServer {
    return this.server;
  }

  // ─── Public methods (dùng bởi ChatService) ────────────────────────────────

  async listRepos() {
    return this.fetchRepos();
  }

  async getRepoDetail(repoName: string) {
    return this.fetchRepoDetail(repoName);
  }

  // ─── Helper ───────────────────────────────────────────────────────────────

  private async fetchRepos() {
    const projects = await this.db.projects.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'desc' },
      select: {
        repo_name: true,
        description: true,
        tech_stack: true,
        highlights: true,
        github_url: true,
        live_url: true,
        sort_order: true,
      },
    });

    return projects.map((p) => ({
      name: p.repo_name,
      description: p.description,
      tech_stack: p.tech_stack,
      highlights: p.highlights,
      github_url: p.github_url,
      live_url: p.live_url,
    }));
  }

  private async fetchRepoDetail(repoName: string) {
    const project = await this.db.projects.findFirst({
      where: { repo_name: repoName, is_active: true },
    });

    if (!project) {
      throw new Error(`Project "${repoName}" not found`);
    }

    return {
      name: project.repo_name,
      description: project.description,
      tech_stack: project.tech_stack,
      highlights: project.highlights,
      // markdown: project.markdown,
      github_url: project.github_url,
      live_url: project.live_url,
      // created_at: project.created_at,
      // updated_at: project.updated_at,
    };
  }

  // ─── Register Tools ───────────────────────────────────────────────────────

  private registerTools() {
    this.registerListRepos();
    this.registerGetRepoDetail();
    this.registerGetReadme();
  }

  private registerListRepos() {
    this.server.tool(
      'list_repos',
      `Liệt kê tất cả các project trong portfolio. Gọi khi HR/Tech hỏi:
       - "Bạn có project nào?"
       - "Cho tôi xem portfolio code của bạn"
       - "Những dự án tiêu biểu của bạn là gì?"`,
      {},
      async () => {
        const repos = await this.fetchRepos();
        return { content: [{ type: 'text', text: JSON.stringify(repos, null, 2) }] };
      },
    );
  }

  private registerGetRepoDetail() {
    this.server.tool(
      'get_repo_detail',
      `Lấy thông tin chi tiết của một project. Gọi khi Tech hỏi:
       - "Repo này dùng công nghệ gì?"
       - "Highlights của project X là gì?"
       - "Bạn maintain repo này bao lâu rồi?"`,
      { repo: z.string().describe('Tên repo cần xem chi tiết') },
      async ({ repo }) => {
        const detail = await this.fetchRepoDetail(repo);
        return { content: [{ type: 'text', text: JSON.stringify(detail, null, 2) }] };
      },
    );
  }

  private registerGetReadme() {
    this.server.tool(
      'get_readme',
      `Lấy nội dung markdown chi tiết của một project. Gọi khi Tech hỏi:
       - "Project X này làm gì?"
       - "Architecture của project này thế nào?"
       - "Cho tôi xem mô tả đầy đủ của project X"`,
      { repo: z.string().describe('Tên repo cần xem README') },
      async ({ repo }) => {
        const project = await this.db.projects.findFirst({
          where: { repo_name: repo, is_active: true },
          select: { markdown: true },
        });

        if (!project) {
          throw new Error(`Project "${repo}" not found`);
        }

        return { content: [{ type: 'text', text: project.markdown }] };
      },
    );
  }
}
