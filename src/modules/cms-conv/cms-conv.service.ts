import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DbConnectService } from '../db-connect/db-connect.service';
import { ResponseDto } from 'src/common/payload.data';

@Injectable()
export class CmsConvService {
  constructor(
    private readonly db: DbConnectService
  ) { }

  async fetchConv(): Promise<ResponseDto> {
    const response = new ResponseDto();
    let rs = null;

    try {
      const sessions = await this.db.hr_sessions.findMany();
      const conversations = await this.db.conversations.findMany();

      rs = sessions.map((s) => ({
        ...s,
        conversation: conversations.find(
          (c) => c.session_id === s.cookie_token
        ),
      }));
    } catch (err: any) {
      throw new Error('Fetch conv failed')
    }

    response.data = rs;

    return response;
  }

  async fetchConvContent(conversationId: string): Promise<ResponseDto> {
    const response = new ResponseDto();
    let rs = null;

    try {
      rs = await this.db.messages.findMany({
        where: {
          conversation_id: conversationId
        },
        orderBy: {
          created_at: 'asc'
        }
      })
    } catch (err: any) {
      throw new Error('Fetch content failed')
    }

    response.data = rs;
    return response;
  }

  async updateComment(id: string, comment: string, email: string): Promise<ResponseDto> {
    const res = new ResponseDto();
    let rs = null;
    try {
      rs = await this.db.conversations.update(
        {
          where: { id: id },
          data: { comment: comment },
          select: { id: true }
        }
      );

      res.data = rs.id
    } catch (err: any) {
      throw new Error('Fetch content failed')
    }

    return res;
  }

  async updateUserAgent(id: string, userAgent: string, email: string): Promise<ResponseDto> {
    const res = new ResponseDto();
    let rs = null;
    try {
      await this.db.hr_sessions.update(
        {
          where: { id: id },
          data: { user_agent: userAgent },
          select: { id: true }
        }
      );

      res.data = rs.id
    } catch (err: any) {
      throw new Error('Fetch content failed')
    }
    return res;
  }

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
