import { Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const GITHUB_USERNAME = 'nguyenlyminhman';
const GITHUB_API = 'https://api.github.com';

@Injectable()
export class McpGithubService {
  private server: McpServer;

  constructor() {
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

  async getReadme(repo: string) {
    return this.fetchReadme(repo);
  }

  // ─── Helper ───────────────────────────────────────────────────────────────

  private async githubFetch<T>(path: string): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const res = await fetch(`${GITHUB_API}${path}`, { headers });

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }

    return res.json() as Promise<T>;
  }

  private async fetchRepos() {
    const repos = await this.githubFetch<any[]>(
      `/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=20&type=public`,
    );
    return repos.map((r) => ({
      name: r.name,
      description: r.description,
      url: r.html_url,
      language: r.language,
      topics: r.topics,
      stars: r.stargazers_count,
      updated_at: r.updated_at,
    }));
  }

  private async fetchReadme(repo: string) {
    const data = await this.githubFetch<{ content: string }>(
      `/repos/${GITHUB_USERNAME}/${repo}/readme`,
    );
    return Buffer.from(data.content, 'base64').toString('utf-8');
  }

  // ─── Register Tools ───────────────────────────────────────────────────────

  private registerTools() {
    this.registerListRepos();
    this.registerGetReadme();
    this.registerGetRepoDetail();
  }

  private registerListRepos() {
    this.server.tool(
      'list_repos',
      `Liệt kê các public repo trên GitHub. Gọi khi HR/Tech hỏi:
       - "Bạn có project nào?"
       - "Cho tôi xem portfolio code của bạn"`,
      {},
      async () => {
        const repos = await this.fetchRepos();
        return { content: [{ type: 'text', text: JSON.stringify(repos, null, 2) }] };
      },
    );
  }

  private registerGetReadme() {
    this.server.tool(
      'get_readme',
      `Lấy nội dung README của một repo. Gọi khi Tech hỏi:
       - "Project X này làm gì?"
       - "Architecture của repo này thế nào?"`,
      { repo: z.string().describe('Tên repo cần xem README') },
      async ({ repo }) => {
        const readme = await this.fetchReadme(repo);
        return { content: [{ type: 'text', text: readme }] };
      },
    );
  }

  private registerGetRepoDetail() {
    this.server.tool(
      'get_repo_detail',
      `Lấy thông tin chi tiết của một repo. Gọi khi Tech hỏi:
       - "Repo này dùng công nghệ gì?"
       - "Bạn maintain repo này bao lâu rồi?"`,
      { repo: z.string().describe('Tên repo cần xem chi tiết') },
      async ({ repo }) => {
        const [detail, languages] = await Promise.all([
          this.githubFetch<any>(`/repos/${GITHUB_USERNAME}/${repo}`),
          this.githubFetch<Record<string, number>>(
            `/repos/${GITHUB_USERNAME}/${repo}/languages`,
          ),
        ]);
        const result = {
          name: detail.name,
          description: detail.description,
          url: detail.html_url,
          languages,
          topics: detail.topics,
          stars: detail.stargazers_count,
          created_at: detail.created_at,
          updated_at: detail.updated_at,
        };
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      },
    );
  }
}