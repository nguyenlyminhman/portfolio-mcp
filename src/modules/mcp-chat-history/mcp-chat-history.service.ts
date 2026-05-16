import { Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { message_role } from 'generated/prisma/enums';
import { z } from 'zod';
import { DbConnectService } from '../db-connect/db-connect.service';
import { v4 as uuidv4 } from 'uuid';

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

  // ─── Public methods (dùng bởi ChatService) ────────────────────────────────

  async getOrCreateConversation(sessionId: string) {
    let conversation = await this.db.conversations.findFirst({
      where: { session_id: sessionId },
      orderBy: { last_message_at: 'desc' },
      select: { id: true, message_count: true, started_at: true },
    });

    if (!conversation) {
      conversation = await this.db.conversations.create({
        data: { id: uuidv4(), session_id: sessionId, started_at: new Date(), last_message_at: new Date() },
        select: { id: true, message_count: true, started_at: true },
      });
    }

    return conversation;
  }

  async saveMessage(conversationId: string, role: 'hr' | 'bot', content: string) {
    return this.db.messages.create({
      data: {
        id: uuidv4(),
        conversation_id: conversationId,
        role: role as message_role,
        content,
        created_at: new Date(),
      },
      select: { id: true, role: true, created_at: true },
    });
  }

  async getHistory(conversationId: string, limit: number) {
    const messages = await this.db.messages.findMany({
      where: { conversation_id: conversationId },
      orderBy: { created_at: 'desc' },
      take: limit,
      select: { id: true, role: true, content: true },
    });
    return messages.reverse(); // cũ → mới
  }

  // ─── Register Tools ───────────────────────────────────────────────────────

  private registerTools() {
    this.registerGetOrCreateConversation();
    this.registerSaveMessage();
    this.registerGetHistory();
  }

  private registerGetOrCreateConversation() {
    this.server.tool(
      'get_or_create_conversation',
      'Lấy conversation hiện tại hoặc tạo mới. Gọi đầu tiên khi HR gửi tin nhắn.',
      { session_id: z.string().uuid() },
      async ({ session_id }) => {
        const conversation = await this.getOrCreateConversation(session_id);
        return { content: [{ type: 'text', text: JSON.stringify(conversation, null, 2) }] };
      },
    );
  }

  private registerSaveMessage() {
    this.server.tool(
      'save_message',
      'Lưu tin nhắn vào DB. Gọi 2 lần: sau khi nhận tin HR và sau khi bot trả lời.',
      {
        conversation_id: z.string().uuid(),
        role: z.enum(['hr', 'bot']),
        content: z.string().min(1),
      },
      async ({ conversation_id, role, content }) => {
        const message = await this.saveMessage(conversation_id, role, content);
        return { content: [{ type: 'text', text: JSON.stringify(message, null, 2) }] };
      },
    );
  }

  private registerGetHistory() {
    this.server.tool(
      'get_history',
      'Lấy lịch sử tin nhắn. Gọi trước khi gửi context lên Claude.',
      {
        conversation_id: z.string().uuid(),
        limit: z.number().int().min(1).max(50).default(20),
      },
      async ({ conversation_id, limit }) => {
        const messages = await this.getHistory(conversation_id, limit);
        return { content: [{ type: 'text', text: JSON.stringify(messages, null, 2) }] };
      },
    );
  }
}
