import { Body, Controller, Get, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResponseDto } from 'src/common/payload.data';
import { ResponseApi } from 'src/common/response.helper';
import { EApiPath, VERSION_1 } from 'src/objects/enum/EApiPath.enum';
import { CmsConvService } from './cms-conv.service';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { UpdateUserAgentDto } from './dto/update-user-agent.dto';
import { CurrentUser } from 'src/decorator/user.decorator';

@ApiTags('Cms Conv')
@Controller({ path: EApiPath.CMS_CONV, version: VERSION_1 })
export class CmsConvController {

  constructor(
    private readonly cmsConv: CmsConvService
  ) { }

  @ApiBearerAuth()
  @Get('/fetch')
  async fetchConv(): Promise<ResponseApi> {
    const rs: ResponseDto = await this.cmsConv.fetchConv();
    return ResponseApi.success(rs, 'Success', HttpStatus.OK);
  }

  @ApiBearerAuth()
  @Get('/content')
  async fetchConvContent(@Query('id') id: string): Promise<ResponseApi> {
    const rs: ResponseDto = await this.cmsConv.fetchConvContent(id);
    return ResponseApi.success(rs, 'Success', HttpStatus.OK);
  }

  @ApiBearerAuth()
  @Post('/comment')
  async addConvComment(@CurrentUser() user: any, @Body() updateCommentDto: UpdateCommentDto): Promise<ResponseApi> {
    const { id, comment } = updateCommentDto;
    const { email } = user;

    const rs: ResponseDto = await this.cmsConv.updateComment(id, comment, email);
    return ResponseApi.success(rs, 'Success', HttpStatus.OK);
  }

  @ApiBearerAuth()
  @Post('/user-agent')
  async updateUserAgent(@CurrentUser() user: any, @Body() updateUserAgentDto: UpdateUserAgentDto): Promise<ResponseApi> {
    const { id, userAgent, isInteresting } = updateUserAgentDto;
    console.log(id, userAgent, isInteresting);
    
    const { email } = user;

    const rs: ResponseDto = await this.cmsConv.updateUserAgent(id, userAgent, isInteresting, email);
    return ResponseApi.success(rs, 'Success', HttpStatus.OK);
  }
}
