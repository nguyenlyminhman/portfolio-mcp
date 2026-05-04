import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DbConnectService } from '../db-connect/db-connect.service';

@Injectable()
export class CookiesService {
    constructor(
        private readonly db: DbConnectService
    ) {}

    async createSessionId(): Promise<string> {
        const rs = uuidv4().toString();

        await this.db.hr_sessions.create({ data: { id: uuidv4(), cookie_token: rs , ip_address: '' } });
        return rs;
    }
}
