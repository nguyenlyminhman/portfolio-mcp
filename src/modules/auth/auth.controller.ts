import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UserLoginDto } from './dto/login.dto';
import { ResponseApi } from 'src/common/response.helper';
import { ResponseDto } from 'src/common/payload.data';
import { Public } from 'src/decorator/public.decorator';
import { EApiPath, VERSION_1 } from 'src/objects/enum/EApiPath.enum';

@ApiTags('Authentication')
@Controller({ path: EApiPath.AUTH, version: VERSION_1 })
export class AuthController {
  constructor(
    readonly authService: AuthService,
  ) { }

  @Public()
  @Post("/login")
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({ description: 'login success' })
  async creatUser(@Body() userLoginDto: UserLoginDto): Promise<ResponseApi> {
    const rs: ResponseDto = await this.authService.login(userLoginDto);
    return ResponseApi.success(rs, 'root.login_success', HttpStatus.ACCEPTED);
  }
}
