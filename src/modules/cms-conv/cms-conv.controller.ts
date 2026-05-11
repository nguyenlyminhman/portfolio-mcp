import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EApiPath, VERSION_1 } from 'src/objects/enum/EApiPath.enum';

@ApiTags('Cms Conv')
@Controller({ path: EApiPath.CMS_CONV, version: VERSION_1 })
export class CmsConvController {}
