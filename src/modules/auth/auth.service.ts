import { Injectable } from '@nestjs/common';
import { UserLoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ResponseDto } from 'src/common/payload.data';
import { DbConnectService } from '../db-connect/db-connect.service';
import { AppUtil } from '../utils/app.util';

@Injectable()
export class AuthService {
  constructor(
    readonly db: DbConnectService,
    readonly jwtService: JwtService,
  ) { }


  async login(loginData: UserLoginDto): Promise<ResponseDto> {
    const responseDto = new ResponseDto();
    try {

      const user: any = await this.db.users.findUnique({where :{ email: loginData.username}});
      console.log('user', user);
      
      if (!user) {
        console.log('o o o o ', user);
        
        throw new Error('Invalid user');
      }

      const isPassword = AppUtil.comparePassword(loginData.password, user.password);
      if (!isPassword) {
        throw new Error('Invalid user');
      }

      const accessToken = await this.jwtService.signAsync(user);

      responseDto.data = {
        accessToken,
        user: user
      }

      return responseDto;
    } catch (error) {
      throw error;
    }
  };
}
