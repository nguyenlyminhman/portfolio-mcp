import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DbConnectService } from '../db-connect/db-connect.service';
import { HrSessionService } from '../hr-session/hr-session.service';
import { CmsConversationService } from '../cms-conversation/cms-conversation.service';

@Injectable()
export class CookiesService {
    constructor(
        private readonly db: DbConnectService,
        private readonly hrSessionService: HrSessionService,
        private readonly cmsconversationService: CmsConversationService
    ) { }

    async createSessionId(): Promise<string> {
        const rs = uuidv4().toString();

        await this.hrSessionService.createHrSessionId(rs);
        await this.cmsconversationService.createConversation(rs);

        return rs;
    }
}
