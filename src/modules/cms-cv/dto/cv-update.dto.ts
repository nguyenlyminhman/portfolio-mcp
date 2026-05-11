import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsObject, IsString } from "class-validator";

export class CvUpdateDto {

  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({
    type: Object,
  })
  @IsObject()
  content: any;

  @ApiProperty()
  @IsBoolean()
  status: boolean;
}