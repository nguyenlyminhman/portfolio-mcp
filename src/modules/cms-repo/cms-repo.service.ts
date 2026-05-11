import { Injectable } from '@nestjs/common';
import { DbConnectService } from '../db-connect/db-connect.service';

@Injectable()
export class CmsRepoService {
  constructor(
    private readonly db: DbConnectService,
  ) { }

  async createGithubRepo(): Promise<string> {
    return 'rs';
  }

  async updateGithubRepo(): Promise<string> {
    return 'rs';
  }

  async fetchGithubRepo(): Promise<string> {
    return 'rs';
  }
}
