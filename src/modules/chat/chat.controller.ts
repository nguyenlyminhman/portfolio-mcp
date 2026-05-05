import { Controller, Post, Body, HttpException, HttpStatus, Sse, MessageEvent } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EApiPath, VERSION_1 } from 'src/objects/enum/EApiPath.enum';
import { Observable } from 'rxjs';


@ApiTags('Chat')
@Controller({ path: EApiPath.CHAT, version: VERSION_1 })
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Sse('/stream')
  chatStream(@Body() chatRequest: ChatRequestDto): Observable<MessageEvent> {
    return this.chatService.chatStream(
      chatRequest.sessionId,
      chatRequest.message,
    );
  }

  @Post('message')
  @ApiBearerAuth()
  async handleChat(@Body() chatRequest: ChatRequestDto) {
    try {
      const { sessionId, message } = chatRequest;

      // Gọi service xử lý với Gemini 2.0 Flash
      const reply = await this.chatService.chat(sessionId, message);

      return {
        success: true,
        data: {
          reply,
        },
      };
    } catch (error) {
      // Log lỗi để debug (nên sử dụng NestJS Logger thực tế)
      console.error('ChatController Error:', error);

      // Trả về lỗi thân thiện cho phía Client
      throw new HttpException(
        {
          success: false,
          message: 'Có lỗi xảy ra khi xử lý phản hồi từ trợ lý ảo.',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
