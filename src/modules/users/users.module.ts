import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DbConnectService } from '../db-connect/db-connect.service';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService, 
    DbConnectService
  ]
})
export class UsersModule {}
