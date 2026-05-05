import { Injectable } from '@nestjs/common';
import { UsersCreateDto } from './dto/usersCreate.dto';

import { ResponseDto } from 'src/common/payload.data';
import { DbConnectService } from '../db-connect/db-connect.service';
import { AppUtil } from '../utils/app.util';
import { users } from 'generated/prisma/client';
import { v4 as uuidv4 } from 'uuid';



@Injectable()
export class UsersService {

	constructor(readonly db: DbConnectService) { }

	async create(userData: UsersCreateDto): Promise<ResponseDto> {
		try {
			const id = uuidv4();

			userData.password = AppUtil.generatePassword(userData.password);
			
			const createdUser = await this.db.users.create({ data: { id: id, ...userData } });
			
			return new ResponseDto(createdUser, null);
		} catch (error) {
			console.log('Error creating user:', error);

			throw error;
		}
	};

	async findByEmail(email: string): Promise<users | null> {
		try {
			return await this.db.users.findFirst({
				where: { email: email },
			});
		} catch (error) {
			throw error;
		}
	}

}
