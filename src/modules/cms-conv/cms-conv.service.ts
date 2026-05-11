import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DbConnectService } from '../db-connect/db-connect.service';

@Injectable()
export class CmsConvService {
  constructor(
    private readonly db: DbConnectService
  ) { }

  async createConversation(sessionId: string): Promise<string> {
    const rs = await this.db.conversations.create({
      data: {
        id: uuidv4(),
        session_id: sessionId,
        started_at: new Date(),
        last_message_at: new Date(),
        message_count: 0,
      },
      select: {
        id: true,
      }
    });

    return rs.id;
  }



}
