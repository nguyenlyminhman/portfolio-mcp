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
      where: { is_active: true },
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
      `Get the full CV data. Use this tool when HR asks about:
       - candidate introduction
       - work experience
       - general candidate profile information`,
      {},
      async () => {
        const cv = await this.fetchCv();

        if (!cv) {
          return {
            content: [{ type: 'text', text: 'CV not found.' }],
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
      `Get a specific CV section. Use this tool when HR asks about:
       - "summary"                 → candidate summary
       - "technical_skills"        → languages, frameworks, databases, devops
       - "professional_experience" → companies, projects, roles
       - "education"               → schools and graduation years
       - "contact"                 → email, phone, github, linkedin
       - "languages"               → English/Japanese ability
       - "work_style"              → remote work, collaboration, AI tools`,
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
          .describe('CV section name to retrieve'),
      },
      async ({ section }) => {
        const cv = await this.fetchCv();

        if (!cv) {
          return {
            content: [{ type: 'text', text: 'CV not found.' }],
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


  // ─── Lightweight Context / JD Matching Helpers ───────────────────────────

  async getCvSummary() {
    const cv = await this.fetchCv();
    if (!cv) return 'CV not found.';
    const content = cv.cv_content as Record<string, any>;
    const skills = content.technical_skills || {};
    return { name: cv.name, full_name: content.full_name, title: content.title, summary: content.summary, programming_languages: skills.programming_languages || [], architecture_backend: skills.architecture_backend || [], databases: skills.databases || [], devops_cloud: skills.devops_cloud || [], languages: content.languages || [], work_style: content.work_style || [], professional_experience: Array.isArray(content.professional_experience) ? content.professional_experience.map((exp: any) => ({ company: exp.company, duration: exp.duration, position: exp.position, projects: Array.isArray(exp.projects) ? exp.projects.map((p: any) => ({ name: p.name, tech_stack: p.tech_stack, description: p.description })) : [] })) : [] };
  }

  async evaluateJobDescription(jd: string) {
    const lower = (jd || '').toLowerCase();
    const skillMap: Record<string, string> = { java: 'trên 5 năm', 'spring boot': 'trên 5 năm', springboot: 'trên 5 năm', nestjs: 'gần 4 năm', nodejs: 'gần 4 năm', react: 'gần 4 năm', reactjs: 'gần 4 năm', oracle: 'trên 5 năm', postgresql: 'trên 3 năm', redis: 'trên 2 năm', activemq: 'trên 3 năm', rabbitmq: 'trên 3 năm', microservices: 'trên 3 năm' };
    const matchedSkills = Object.keys(skillMap).filter((skill) => lower.includes(skill)).map((skill) => ({ skill, estimate: skillMap[skill] }));
    const partialSkills = ['aws', 'docker', 'kubernetes', 'ci/cd', 'jenkins', 'github actions'].filter((skill) => lower.includes(skill));
    const notClearlyShown = ['kafka'].filter((skill) => lower.includes(skill));
    return { matchedSkills, partialSkills, notClearlyShown, summary: 'This is a compatibility summary based on CV/GitHub context, not a hiring decision.' };
  }

  async getOwnershipSummary() {
    return { canAnswer: true, guidance: 'Có thể trả lời high-level rằng Mẫn từng tham gia/phụ trách feature end-to-end: requirement clarification, backend API, business logic, database integration, frontend integration, deployment support, bug fixing và maintenance. Không claim sole architect hoặc built everything alone nếu CV không chứng minh rõ.', examples: ['MAFC financial systems/microservices', 'Terralogic CMS/ClickScan backend team lead', 'Personal projects spring.cqrs and portfolio-mcp'] };
  }

}