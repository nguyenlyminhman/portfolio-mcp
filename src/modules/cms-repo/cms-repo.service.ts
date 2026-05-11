import { Injectable } from '@nestjs/common';
import { DbConnectService } from '../db-connect/db-connect.service';
import { ResponseDto } from 'src/common/payload.data';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CmsRepoService {
  constructor(
    private readonly db: DbConnectService,
  ) { }

  async createRepo(
    repoName: string,
    highlights: string,
    description: string,
    markdown: string,
    githubUrl: string,
    liveUrl: string,
    techStack: any,
    sortOrder: number,
    email: string
  ): Promise<ResponseDto> {
  
    const id = uuidv4();
    const res = new ResponseDto();
    let rs = null;
    try {
      rs = await this.db.projects.create({
        data: {
          id: id,
          repo_name: repoName,
          highlights: highlights,
          description: description,
          markdown: markdown,
          github_url: githubUrl,
          live_url: liveUrl,
          tech_stack: techStack,
          sort_order: sortOrder,
          is_active: true,
          created_at: new Date(),
          created_by: email,
        },
        select: { id: true }
      })
    } catch (err: any) {
      throw new Error('Create project failed');
    }

    res.data = rs.id;
    return res;
  }

  async updateRepo(
    id: string,
    repoName: string,
    highlights: string,
    description: string,
    markdown: string,
    githubUrl: string,
    liveUrl: string,
    techStack: any,
    sortOrder: number,
    isActive: boolean,
    email: string
  ): Promise<ResponseDto> {
    const res = new ResponseDto();
    let rs = null;
    try {
      rs = await this.db.projects.update({
        where: { id: id },
        data: {
          repo_name: repoName,
          highlights: highlights,
          description: description,
          markdown: markdown,
          github_url: githubUrl,
          live_url: liveUrl,
          tech_stack: techStack,
          sort_order: sortOrder,
          is_active: isActive,
          updated_at: new Date(),
          updated_by: email
        },
        select: { id: true }
      })
    } catch (err: any) {
      throw new Error('Update project failed');
    }

    res.data = rs.id;
    return res;
  }

  async fetchRepo(): Promise<ResponseDto> {
    const response = new ResponseDto();
    let rs = null;
    try {
      rs = await this.db.projects.findMany();
    } catch (err: any) {
      throw new Error('Fetch projects failed');
    }
    response.data = rs;

    return response;
  }
}
