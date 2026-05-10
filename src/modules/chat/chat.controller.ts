import { Controller, Post, Body, Sse, MessageEvent, Query, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EApiPath, VERSION_1 } from 'src/objects/enum/EApiPath.enum';
import { Observable } from 'rxjs';
import { Public } from 'src/decorator/public.decorator';
import { Request } from 'express';

@ApiTags('Chat')
@Controller({ path: EApiPath.CHAT, version: VERSION_1 })
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Public()
  @Sse('/stream')
  chatStream( @Query('message') message: string, @Req() req: Request ): Observable<MessageEvent> {
    const sessionId = req.cookies['chat_session_id'] || null;

    return this.chatService.chatStream(
      sessionId,
      message,
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
