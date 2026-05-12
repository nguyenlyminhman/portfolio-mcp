import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResponseDto } from 'src/common/payload.data';
import { ResponseApi } from 'src/common/response.helper';
import { EApiPath, VERSION_1 } from 'src/objects/enum/EApiPath.enum';
import { CmsConvService } from './cms-conv.service';

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


}
