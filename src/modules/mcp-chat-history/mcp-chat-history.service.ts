import { Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { DbConnectService } from '../db-connect/db-connect.service';

@Injectable()
export class McpChatHistoryService {
  private server: McpServer;

  constructor(private readonly db: DbConnectService) {
    this.server = new McpServer({
      name: 'portfolio-chat-history-mcp',
      version: '1.0.0',
    });

    this.registerTools();
  }

  getServer(): McpServer {
    return this.server;
  }

  // ─── Register Tools ───────────────────────────────────────────────────────

  private registerTools() {
    this.registerGetOrCreateConversation();
    this.registerSaveMessage();
    this.registerGetHistory();
  }

  // ─── Tool: get_or_create_conversation ────────────────────────────────────
  // Gọi đầu tiên khi HR bắt đầu chat — tìm conversation mới nhất hoặc tạo mới
  private registerGetOrCreateConversation() {
    this.server.tool(
      'get_or_create_conversation',
      `Lấy conversation hiện tại của HR hoặc tạo mới nếu chưa có.
       Gọi tool này ĐẦU TIÊN khi HR gửi tin nhắn, trước khi làm bất cứ điều gì.`,
      {
        session_id: z.string().uuid().describe('ID của hr_session'),
      },
      async ({ session_id }) => {
        // Tìm conversation mới nhất của session này
        let conversation = await this.db.conversations.findFirst({
          where: { session_id },
          orderBy: { last_message_at: 'desc' },
          select: { id: true, message_count: true, started_at: true },
        });

        // Chưa có → tạo mới
        if (!conversation) {
          conversation = await this.db.conversations.create({
            data: { session_id },
            select: { id: true, message_count: true, started_at: true },
          });
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(conversation, null, 2),
            },
          ],
        };
      },
    );
  }

  // ─── Tool: save_message ───────────────────────────────────────────────────
  // Gọi 2 lần mỗi lượt chat: 1 lần lưu tin HR, 1 lần lưu reply của bot
  private registerSaveMessage() {
    this.server.tool(
      'save_message',
      `Lưu tin nhắn vào database. Gọi tool này 2 lần mỗi lượt:
       1. Sau khi nhận tin nhắn từ HR (role: "hr")
       2. Sau khi bot trả lời xong (role: "bot")`,
      {
        conversation_id: z.string().uuid().describe('ID của conversation'),
        role: z.enum(['hr', 'bot']).describe('Người gửi'),
        content: z.string().min(1).describe('Nội dung tin nhắn'),
      },
      async ({ conversation_id, role, content }) => {
        const message = await this.db.messages.create({
          data: { conversation_id, role, content },
          select: { id: true, role: true, created_at: true },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(message, null, 2),
            },
          ],
        };
      },
    );
  }

  // ─── Tool: get_history ────────────────────────────────────────────────────
  // Gọi để lấy context trước khi gửi lên Claude
  private registerGetHistory() {
    this.server.tool(
      'get_history',
      `Lấy lịch sử tin nhắn của conversation để Claude nhớ context.
       Gọi tool này SAU get_or_create_conversation, TRƯỚC khi gọi Claude API.`,
      {
        conversation_id: z.string().uuid().describe('ID của conversation'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .default(20)
          .describe('Số tin nhắn gần nhất cần lấy, mặc định 20'),
      },
      async ({ conversation_id, limit }) => {
        const messages = await this.db.messages.findMany({
          where: {
            conversation_id,
            is_deleted: false,
          },
          orderBy: { created_at: 'desc' },
          take: limit,
          select: { role: true, content: true, created_at: true },
        });

        // Đảo lại để đúng thứ tự thời gian (cũ → mới)
        const ordered = messages.reverse();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(ordered, null, 2),
            },
          ],
        };
      },
    );
  }
}