import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class UsersCreateDto {
  
  @ApiProperty()
  @IsString()
  nickname: string;

  @ApiProperty()
  @IsString()
  fullname: string;


  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;
}