import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DbConnectService } from '../db-connect/db-connect.service';
import { ConversationService } from '../conversation/conversation.service';
import { HrSessionService } from '../hr-session/hr-session.service';

@Injectable()
export class CookiesService {
    constructor(
        private readonly db: DbConnectService,
        private readonly hrSessionService: HrSessionService,
        private readonly conversationService: ConversationService
    ) { }

    async createSessionId(): Promise<string> {
        const rs = uuidv4().toString();

        await this.hrSessionService.createHrSessionId(rs);
        await this.conversationService.createConversation(rs);

        return rs;
    }
}
