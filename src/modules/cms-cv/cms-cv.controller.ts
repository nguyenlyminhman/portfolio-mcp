import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EApiPath, VERSION_1 } from 'src/objects/enum/EApiPath.enum';

@ApiTags('Cms CV')
@Controller({ path: EApiPath.CMS_CV, version: VERSION_1 })
export class CmsCvController {}
