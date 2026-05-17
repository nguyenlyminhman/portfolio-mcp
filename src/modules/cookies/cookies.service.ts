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

  async createSessionId(cookieId: string): Promise<string> {
    const rs = uuidv4().toString();

    try {

      const isExist = await this.hrSessionService.checkCookie(cookieId);


      console.log('isExist', isExist);
      console.info('isExist', isExist);
      console.error('isExist', isExist);

      if (isExist) {
        return cookieId;
      }

      await this.hrSessionService.createHrSessionId(rs);
      await this.cmsConvService.createConversation(rs);
    } catch (err: any) {
      console.log(err)
      console.error(err)
    }

    return rs;
  }

  async getSs(): Promise<any> {
    let ts = 10000;
    try {
      console.log('check +>>>>>>>>>>>>>>>>>,', process.env.JWT_SECRET);
      ts = await this.db.hr_sessions.count();
      console.log('count +db,', ts);
    } catch (err) {
      console.log(err)
    }
    return ts;
  }
}
