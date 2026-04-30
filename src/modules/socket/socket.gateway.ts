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

  constructor(private readonly chatService: ChatService) { }

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
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {

    let payload = data;

    // 1. Kiểm tra và Parse nếu data là chuỗi JSON
    if (typeof data === 'string') {
      try {
        payload = JSON.parse(data);
      } catch (e) {
        client.emit('error', { message: 'sessionId và content không được để trống 0' });
        return;
      }
    }

    // 2. Trích xuất dữ liệu từ payload đã parse
    const { sessionId, content } = payload;

    if (sessionId === '' || content?.trim() === '') {
      client.emit('error', { message: 'sessionId và content không được để trống 1' });
      return;
    }

    try {
      // Báo HR biết bot đang gõ
      client.emit('typing', { status: true });

      console.log(`[SocketGateway] Received message from client :`, sessionId, content);
      const reply = await this.chatService.chat(sessionId, content);

      console.log('reply:', reply);

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