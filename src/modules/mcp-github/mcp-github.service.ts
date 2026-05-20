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
        // highlights: true,
        github_url: true,
        live_url: true,
        sort_order: true,
      },
    });

    return projects.map((p) => ({
      name: p.repo_name,
      description: p.description,
      tech_stack: p.tech_stack,
      // highlights: p.highlights,
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
      // highlights: project.highlights,
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
      `List all portfolio projects. Use this tool when HR/Tech asks:
       - "What projects do you have?"
       - "Show me your portfolio code"
       - "What are your representative projects?"`,
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
      `Get detailed information about a project. Use this tool when Tech asks:
       - "What technologies does this repo use?"
       - "What are the highlights of project X?"
       - "How long have you maintained this repo?"`,
      { repo: z.string().describe('Repository name to inspect') },
      async ({ repo }) => {
        const detail = await this.fetchRepoDetail(repo);
        return { content: [{ type: 'text', text: JSON.stringify(detail, null, 2) }] };
      },
    );
  }

  private registerGetReadme() {
    this.server.tool(
      'get_readme',
      `Get detailed markdown/highlight content for a project. Use this tool when Tech asks:
       - "What does project X do?"
       - "What is the architecture of this project?"
       - "Show me the full description of project X"`,
      { repo: z.string().describe('Repository name to read') },
      async ({ repo }) => {
        const project = await this.db.projects.findFirst({
          where: { repo_name: repo, is_active: true },
          select: { highlights: true },
        });

        if (!project) {
          throw new Error(`Project "${repo}" not found`);
        }

        return { content: [{ type: 'text', text: project.highlights }] };
      },
    );
  }


  async getRepoSummary() {
    const repos = await this.fetchRepos();
    return repos.slice(0, 8).map((repo) => ({ name: repo.name, description: repo.description, tech_stack: repo.tech_stack, github_url: repo.github_url, live_url: repo.live_url }));
  }

  async findRelatedProjects(skills: string[]) {
    const repos = await this.fetchRepos();
    const normalized = skills.map((s) => s.toLowerCase());
    return repos.filter((repo) => { const text = `${repo.name} ${repo.description} ${JSON.stringify(repo.tech_stack || [])}`.toLowerCase(); return normalized.some((skill) => text.includes(skill)); });
  }

  async getOwnershipRelatedProjects() {
    const repos = await this.fetchRepos();
    return repos.filter((repo) => ['spring.cqrs', 'portfolio-mcp', 'spring-batchop'].includes(repo.name));
  }

}