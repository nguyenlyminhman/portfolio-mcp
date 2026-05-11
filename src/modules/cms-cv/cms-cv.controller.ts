import { Body, Controller, Get, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EApiPath, VERSION_1 } from 'src/objects/enum/EApiPath.enum';
import { CmsCvService } from './cms-cv.service';
import { Public } from 'src/decorator/public.decorator';
import { ResponseApi } from 'src/common/response.helper';
import { ResponseDto } from 'src/common/payload.data';
import { CurrentUser } from 'src/decorator/user.decorator';
import { CvUpdateDto } from './dto/cv-update.dto';
import { CvCreateDto } from './dto/cv-create.dto';

@ApiTags('Cms CV')
@Controller({ path: EApiPath.CMS_CV, version: VERSION_1 })
export class CmsCvController {

  constructor(
    private readonly cmsCvService: CmsCvService
  ) { }

  @ApiBearerAuth()
  @Get('/fetch')
  async fetchCv(): Promise<ResponseApi> {
    const rs: ResponseDto = await this.cmsCvService.fetchCv();
    return ResponseApi.success(rs, 'Success', HttpStatus.OK);
  }

  @ApiBearerAuth()
  @Post('/create')
  async createCv(@CurrentUser() user: any, @Body() cvCreateDto: CvCreateDto): Promise<ResponseApi> {
    const { name, content } = cvCreateDto;
    const { email } = user;
    const rs = await this.cmsCvService.createCv(name, content, email);
    return ResponseApi.success(rs, 'Success', HttpStatus.OK);
  }

  @ApiBearerAuth()
  @Post('/update')
  async updateCv(@CurrentUser() user: any, @Body() cvUpdateDto: CvUpdateDto): Promise<ResponseApi> {
    const { id, name, content, status } = cvUpdateDto;
    const { email } = user;

    const rs = await this.cmsCvService.updateCv(id, name, content, status, email);
    return ResponseApi.success(rs, 'Success', HttpStatus.OK);
  }
}
