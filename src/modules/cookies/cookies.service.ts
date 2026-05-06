import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DbConnectService } from '../db-connect/db-connect.service';
import { ConversationService } from '../conversation/conversation.service';

@Injectable()
export class CookiesService {
    constructor(
        private readonly db: DbConnectService,
        private readonly conversationService: ConversationService
    ) { }

    async createSessionId(): Promise<string> {
        const rs = uuidv4().toString();

        await this.db.hr_sessions.create({
            data: {
                id: uuidv4(),
                cookie_token: rs,
                user_agent: rs,
                ip_address: '',
                first_seen_at: new Date(),
                last_seen_at: new Date(),
            }
        });

        await this.conversationService.createConversation(rs);

        return rs;
    }
}
