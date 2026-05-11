import { ApiProperty } from "@nestjs/swagger";
import { IsObject, IsString } from "class-validator";

export class CvCreateDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({
    type: Object,
  })
  @IsObject()
  content: any;
}