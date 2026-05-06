import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class UserAgentDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  userAgent: string;
}
