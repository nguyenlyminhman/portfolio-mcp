import { Injectable } from '@nestjs/common';
import { DbConnectService } from './modules/db-connect/db-connect.service';

@Injectable()
export class AppService {

  constructor(private readonly db: DbConnectService) {

  }
  async getHealthCheck(): Promise<string> {
    try {
      console.log('check +>>>>>>>>>>>>>>>>>,', process.env.JWT_SECRET);
      const ts = await this.db.hr_sessions.count();
      console.log('count +db,', ts);
    } catch (err) {
      console.log(err)
    }
    return 'Health check...';
  }
}
