import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './decorator/public.decorator';
import { EApiPath, VERSION_1 } from './objects/enum/EApiPath.enum';

@Public()
@Controller({ path: EApiPath.HEALTH, version: VERSION_1 })
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHealthCheck();
  }
}
