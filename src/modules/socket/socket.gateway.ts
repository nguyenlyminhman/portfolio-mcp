import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../chat/chat.service';

@WebSocketGateway({
  cors: { origin: '*' }, // đổi lại domain frontend khi production
  namespace: '/chat',
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly clients = new Map<string, Socket>();

  constructor(private readonly chatService: ChatService) {}

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  handleConnection(client: Socket) {
    console.info(`[SocketGateway] connected: ${client.id}`);
    this.clients.set(client.id, client);
  }

  handleDisconnect(client: Socket) {
    console.info(`[SocketGateway] disconnected: ${client.id}`);
    this.clients.delete(client.id);
  }

  // ─── Events ───────────────────────────────────────────────────────────────

  // HR gửi tin nhắn
  // Payload: { sessionId: string, content: string }
  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() data: { sessionId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { sessionId, content } = data;

    if (!sessionId || !content?.trim()) {
      client.emit('error', { message: 'sessionId và content không được để trống' });
      return;
    }

    try {
      // Báo HR biết bot đang gõ
      client.emit('typing', { status: true });

      const reply = await this.chatService.chat(sessionId, content);

      // Gửi reply về đúng client đó
      client.emit('reply', { content: reply });
    } catch (err) {
      console.error('[SocketGateway] chat error:', err);
      client.emit('error', { message: 'Có lỗi xảy ra, vui lòng thử lại.' });
    } finally {
      client.emit('typing', { status: false });
    }
  }
}