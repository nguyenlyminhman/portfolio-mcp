import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EApiPath, VERSION_1 } from 'src/objects/enum/EApiPath.enum';

@ApiTags('Cms Repo')
@Controller({ path: EApiPath.CMS_REPO, version: VERSION_1 })
export class CmsRepoController {}
