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

  // ─── Helper ───────────────────────────────────────────────────────────────

  private async githubFetch<T>(path: string): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    // Nếu có token thì rate limit 5000 req/h thay vì 60 req/h
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const res = await fetch(`${GITHUB_API}${path}`, { headers });

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }

    return res.json() as Promise<T>;
  }

  // ─── Register Tools ───────────────────────────────────────────────────────

  private registerTools() {
    this.registerListRepos();
    this.registerGetReadme();
    this.registerGetRepoDetail();
  }

  // ─── Tool: list_repos ─────────────────────────────────────────────────────
  private registerListRepos() {
    this.server.tool(
      'list_repos',
      `Liệt kê các public repo trên GitHub. Gọi khi HR/Tech hỏi:
       - "Bạn có project nào?"
       - "Cho tôi xem portfolio code của bạn"
       - "Bạn hay dùng ngôn ngữ gì?"`,
      {},
      async () => {
        const repos = await this.githubFetch<any[]>(
          `/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=20&type=public`,
        );

        const simplified = repos.map((r) => ({
          name: r.name,
          description: r.description,
          url: r.html_url,
          language: r.language,
          topics: r.topics,
          stars: r.stargazers_count,
          updated_at: r.updated_at,
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(simplified, null, 2),
            },
          ],
        };
      },
    );
  }

  // ─── Tool: get_readme ─────────────────────────────────────────────────────
  private registerGetReadme() {
    this.server.tool(
      'get_readme',
      `Lấy nội dung README của một repo. Gọi khi HR/Tech hỏi:
       - "Project X này làm gì vậy?"
       - "Architecture của repo này như thế nào?"
       - "Bạn dùng tech stack gì trong project này?"`,
      {
        repo: z.string().describe('Tên repo cần xem README'),
      },
      async ({ repo }) => {
        const data = await this.githubFetch<{ content: string; encoding: string }>(
          `/repos/${GITHUB_USERNAME}/${repo}/readme`,
        );

        const readme = Buffer.from(data.content, 'base64').toString('utf-8');

        return {
          content: [
            {
              type: 'text',
              text: readme,
            },
          ],
        };
      },
    );
  }

  // ─── Tool: get_repo_detail ────────────────────────────────────────────────
  private registerGetRepoDetail() {
    this.server.tool(
      'get_repo_detail',
      `Lấy thông tin chi tiết của một repo: ngôn ngữ, số commit, contributors.
       Gọi khi Tech hỏi:
       - "Repo này bạn maintain bao lâu rồi?"
       - "Bạn có collaborate với ai không?"
       - "Repo này dùng những công nghệ gì?"`,
      {
        repo: z.string().describe('Tên repo cần xem chi tiết'),
      },
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
          language: detail.language,
          languages,
          topics: detail.topics,
          stars: detail.stargazers_count,
          forks: detail.forks_count,
          open_issues: detail.open_issues_count,
          created_at: detail.created_at,
          updated_at: detail.updated_at,
          default_branch: detail.default_branch,
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      },
    );
  }
}