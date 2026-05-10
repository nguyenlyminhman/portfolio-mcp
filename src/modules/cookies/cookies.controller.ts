import { Controller, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EApiPath, VERSION_1 } from 'src/objects/enum/EApiPath.enum';
import { Response } from 'express';
import { CookiesService } from './cookies.service';
import { Public } from 'src/decorator/public.decorator';
import { Request } from 'express';


@ApiTags('Cookies')
@Controller({ path: EApiPath.COOKIES, version: VERSION_1 })
export class CookiesController {
  constructor(
    private readonly cookiesService: CookiesService,
  ) { }

  @Public()
  @Post('/init')
  async initSession(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const existingSessionId = request.cookies?.['chat_session_id'];
    if (existingSessionId) {
      return { message: 'Session already exists' };
    }

    const sessionId = await this.cookiesService.createSessionId();

    response.cookie('chat_session_id', sessionId, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 90 * 24 * 60 * 60 * 1000, // lưu cookies trong 90 ngày
    });

    return { message: 'Session initialized' };
  }
}
