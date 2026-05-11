import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DbConnectService } from '../db-connect/db-connect.service';
import { HrSessionService } from '../hr-session/hr-session.service';
import { CmsConvService } from '../cms-conv/cms-conv.service';

@Injectable()
export class CookiesService {
  constructor(
    private readonly db: DbConnectService,
    private readonly hrSessionService: HrSessionService,
    private readonly cmsConvService: CmsConvService
  ) { }

  async createSessionId(): Promise<string> {
    const rs = uuidv4().toString();

    await this.hrSessionService.createHrSessionId(rs);
    await this.cmsConvService.createConversation(rs);

    return rs;
  }
}
