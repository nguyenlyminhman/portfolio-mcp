import { Controller, Post, Body, Sse, MessageEvent } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EApiPath, VERSION_1 } from 'src/objects/enum/EApiPath.enum';
import { Observable } from 'rxjs';
import { Public } from 'src/decorator/public.decorator';

@ApiTags('Chat')
@Controller({ path: EApiPath.CHAT, version: VERSION_1 })
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Public()
  @Sse('/stream')
  chatStream(@Body() chatRequest: ChatRequestDto): Observable<MessageEvent> {
    return this.chatService.chatStream(
      chatRequest.sessionId,
      chatRequest.message,
    );
  }

  @ApiBearerAuth()
  @Post('/message')
  async handleChat(@Body() chatRequest: ChatRequestDto) {
      const { sessionId, message } = chatRequest;
      const reply = await this.chatService.chat(sessionId, message);
      return { success: true, data: { reply }
      };
  }
}
