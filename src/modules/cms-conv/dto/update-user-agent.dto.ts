import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsString } from "class-validator";

export class UpdateUserAgentDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  userAgent: string;

  @ApiProperty()
  @IsBoolean()
  isInteresting: boolean;
}