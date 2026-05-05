import { IsOptional, IsString } from "class-validator";
import PaginationDto from "./pagination.dto";
import { ApiProperty } from "@nestjs/swagger";

export default class BaseDto extends PaginationDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  lang?: string = 'vi';
}
