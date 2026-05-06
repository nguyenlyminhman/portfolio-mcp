import { Injectable } from '@nestjs/common';
import { DbConnectService } from '../db-connect/db-connect.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class HrSessionService {
  constructor(
    private readonly db: DbConnectService,
  ) { }

  async createHrSessionId(sessionId: string): Promise<string> {
    const rs = await this.db.hr_sessions.create({
      data: {
        id: uuidv4().toString(),
        cookie_token: sessionId,
        user_agent: sessionId,
        ip_address: '',
        first_seen_at: new Date(),
        last_seen_at: new Date(),
      },
      select: {
        id: true,
      }
    });

    return rs.id;
  }
}
