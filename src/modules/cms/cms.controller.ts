import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { EApiPath, VERSION_1 } from "src/objects/enum/EApiPath.enum";
import { CmsService } from "./cms.service";

@ApiTags('Cms')
@Controller({ path: EApiPath.CMS, version: VERSION_1 })
export class CmsController {
  constructor(
    private readonly cmsService: CmsService
  ) { }
}