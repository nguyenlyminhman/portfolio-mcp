import { Controller, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EApiPath, VERSION_1 } from 'src/objects/enum/EApiPath.enum';
import { Response } from 'express';
import { CookiesService } from './cookies.service';
import { Public } from 'src/decorator/public.decorator';


@ApiTags('Cookies')
@Controller({ path: EApiPath.COOKIES, version: VERSION_1 })
export class CookiesController {
    constructor(
        private readonly cookiesService: CookiesService,
    ) { }

    @Public()
    @Post('/init')
    async initSession(@Res({ passthrough: true }) response: Response) {
        const sessionId = await this.cookiesService.createSessionId();

        response.cookie('chat_session_id', sessionId, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 90 * 24 * 60 * 60 * 1000, // lưu cookies trong 90 ngày
        });

        return { message: 'Session initialized' };
    }
}
