// src/mcp/sqlite-mcp.client.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Injectable, OnModuleInit } from "@nestjs/common";

@Injectable()
export class SqliteMcpClient implements OnModuleInit {
  private client: Client;

  async onModuleInit() {
    const transport = new StdioClientTransport({
      command: "node",
      args: ["/path/to/sqlite-mcp/dist/index.js"],
      env: { DB_PATH: process.env.CHAT_DB_PATH ?? "./chat.db" },
    });

    this.client = new Client({ name: "nestjs-host", version: "1.0.0" });
    await this.client.connect(transport);
  }

  async saveMessage(params: {
    session_id: string;
    role: "hr" | "bot";
    content: string;
    hr_metadata?: { ip?: string; user_agent?: string; company?: string };
  }) {
    return this.client.callTool({ name: "save_message", arguments: params });
  }

  async getHistory(session_id: string, limit = 20) {
    const result = await this.client.callTool({
      name: "get_history",
      arguments: { session_id, limit },
    });
    return (result.content[0] as { text: string }).text;
  }

  async listSessions(params: { date?: string; page?: number; page_size?: number }) {
    const result = await this.client.callTool({
      name: "list_sessions",
      arguments: { page: 1, page_size: 20, ...params },
    });
    return JSON.parse((result.content[0] as { text: string }).text);
  }

  async getSessionDetail(session_id: string) {
    const result = await this.client.callTool({
      name: "get_session_detail",
      arguments: { session_id },
    });
    return JSON.parse((result.content[0] as { text: string }).text);
  }

  async markInteresting(session_id: string, note?: string) {
    return this.client.callTool({
      name: "mark_interesting",
      arguments: { session_id, note },
    });
  }
}