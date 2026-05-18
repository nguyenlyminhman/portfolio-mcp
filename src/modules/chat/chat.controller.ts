import { Controller, Post, Body, Sse, MessageEvent, Query, Req, Get } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EApiPath, VERSION_1 } from 'src/objects/enum/EApiPath.enum';
import { Observable } from 'rxjs';
import { Public } from 'src/decorator/public.decorator';
import { Request } from 'express';
import { ResponseApi } from 'src/common/response.helper';
import { ResponseDto } from 'src/common/payload.data';

@ApiTags('Chat')
@Controller({ path: EApiPath.CHAT, version: VERSION_1 })
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @Public()
  @Sse('/stream')
  chatStream(@Query('message') message: string, @Req() req: Request): Observable<MessageEvent> {
    const sessionId = req.cookies['chat_session_id'] || null;

    return this.chatService.chatStream(
      sessionId,
      message,
    );
  }


  @Public()
  @Get('/history')
  async fetchChatHistory(@Req() req: Request): Promise<ResponseApi> {
    const sessionId = req.cookies['chat_session_id'] || null;
    const rs: ResponseDto = await this.chatService.fetchChatHistory(sessionId);
    return ResponseApi.success(rs, 'Fetched chat history successfully');
  }
}
