import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersCreateDto } from './dto/usersCreate.dto';
import { UsersService } from './users.service';
import { ResponseApi } from 'src/common/response.helper';
import { ResponseDto } from 'src/common/payload.data';
import { EApiPath, VERSION_1 } from 'src/objects/enum/EApiPath.enum';
import { Public } from 'src/decorator/public.decorator';
import { User } from 'src/decorator/user.decorator';

@ApiTags('User')
@Controller({ path: EApiPath.USER, version: VERSION_1 })
export class UsersController {

  constructor(readonly usersService: UsersService) { }

  @Public()
  @Post("/create")
  @HttpCode(HttpStatus.OK)
  async creatUser(@User() user: any, @Body() usersCreateDto: UsersCreateDto): Promise<ResponseApi> {
      const data: ResponseDto = await this.usersService.create(usersCreateDto);

      return ResponseApi.success(data, 'create success', HttpStatus.ACCEPTED);
  }

}
