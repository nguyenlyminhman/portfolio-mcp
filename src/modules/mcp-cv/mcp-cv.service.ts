import { Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { DbConnectService } from '../../modules/db-connect/db-connect.service';

@Injectable()
export class McpCvService {
  private server: McpServer;

  constructor(private readonly db: DbConnectService) {
    this.server = new McpServer({
      name: 'portfolio-cv-mcp',
      version: '1.0.0',
    });

    this.registerTools();
  }

  // ─── Boot ─────────────────────────────────────────────────────────────────

  async connect() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  // ─── Helper ───────────────────────────────────────────────────────────────

  async getCv() {
    return this.fetchCv();
  }

  private async fetchCv() {
    return this.db.my_cv.findFirst({
      where: { is_delete: false },
      orderBy: { updated_at: 'desc' },
      select: { name: true, cv_content: true },
    });
  }

  // ─── Register Tools ───────────────────────────────────────────────────────

  private registerTools() {
    this.registerGetCv();
    this.registerGetCvSection();
  }

  private registerGetCv() {
    this.server.tool(
      'get_cv',
      `Lấy toàn bộ thông tin CV. Gọi tool này khi HR hỏi:
       - Giới thiệu bản thân
       - Kinh nghiệm làm việc
       - Bất kỳ thông tin tổng quan nào về ứng viên`,
      {},
      async () => {
        const cv = await this.fetchCv();

        if (!cv) {
          return {
            content: [{ type: 'text', text: 'Không tìm thấy CV.' }],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(cv, null, 2),
            },
          ],
        };
      },
    );
  }

  private registerGetCvSection() {
    this.server.tool(
      'get_cv_section',
      `Lấy một section cụ thể trong CV. Gọi khi HR hỏi về:
       - "summary"                 → tóm tắt bản thân
       - "technical_skills"        → ngôn ngữ, framework, database, devops
       - "professional_experience" → lịch sử công ty, dự án, vai trò
       - "education"               → trường học, năm tốt nghiệp
       - "contact"                 → email, phone, github, linkedin
       - "languages"               → tiếng Anh, tiếng Nhật
       - "work_style"              → cách làm việc, remote, AI tools`,
      {
        section: z
          .enum([
            'summary',
            'technical_skills',
            'professional_experience',
            'education',
            'contact',
            'languages',
            'work_style',
          ])
          .describe('Tên section cần lấy'),
      },
      async ({ section }) => {
        const cv = await this.fetchCv();

        if (!cv) {
          return {
            content: [{ type: 'text', text: 'Không tìm thấy CV.' }],
          };
        }

        const content = cv.cv_content as Record<string, unknown>;
        const data = content[section];

        if (data === undefined) {
          return {
            content: [
              {
                type: 'text',
                text: `Section "${section}" không tồn tại trong CV.`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ section, data }, null, 2),
            },
          ],
        };
      },
    );
  }
}