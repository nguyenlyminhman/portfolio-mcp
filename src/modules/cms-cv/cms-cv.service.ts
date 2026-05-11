import { Injectable } from '@nestjs/common';
import { DbConnectService } from '../db-connect/db-connect.service';

@Injectable()
export class CmsCvService {
  constructor(
    private readonly db: DbConnectService,
  ) { }

  async createCv(): Promise<string> {
    return 'rs';
  }

  async updateCv(): Promise<string> {
    return 'rs';
  }

  async fetchCv(): Promise<string> {
    return 'rs';
  }
}
