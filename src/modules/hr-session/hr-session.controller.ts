import { Body, Controller, Get, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EApiPath, VERSION_1 } from 'src/objects/enum/EApiPath.enum';
import { DbConnectService } from '../db-connect/db-connect.service';
import { HrSessionService } from './hr-session.service';
import { ResponseApi } from 'src/common/response.helper';
import { Public } from 'src/decorator/public.decorator';
import { UserAgentDto } from './dto/user-agent.dto';

@ApiTags('Hr Session')
@Controller({ path: EApiPath.HR_SESSION, version: VERSION_1 })
export class HrSessionController {

  constructor(
    private readonly hrSessionService: HrSessionService
  ) {}

  @Public()
  @Get('/list')
  async getAllHrSessions(): Promise<ResponseApi> {
    const rs = await this.hrSessionService.getAllHrSessions();
    return ResponseApi.success(rs, 'Success', HttpStatus.OK);
  }

  @Public()
  @Get('/:id')
  async getHrSession(@Param('id') id: string): Promise<ResponseApi> {
    const rs = await this.hrSessionService.getHrSessionById(id);
    return ResponseApi.success(rs, 'Success', HttpStatus.OK);
  }

  @Public()
  @Post('/user-agent')
  async handleChat(@Body () userAgentDto: UserAgentDto): Promise<ResponseApi> {
    const { id, userAgent } = userAgentDto;
    const rs = await this.hrSessionService.updateUserAgent(id, userAgent);
    return ResponseApi.success(rs, 'Success', HttpStatus.OK);
  }

}
