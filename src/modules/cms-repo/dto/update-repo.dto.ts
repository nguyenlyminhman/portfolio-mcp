import { ApiProperty } from "@nestjs/swagger";
import { BlobOptions } from "buffer";
import { IsArray, IsBoolean, IsNumber, IsObject, IsString } from "class-validator";

export class UpdateRepoDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  repoName: string;

  @ApiProperty()
  @IsString()
  highlights: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  markdown: string;

  @ApiProperty()
  @IsString()
  githubUrl: string;

  @ApiProperty()
  @IsString()
  liveUrl: string;

  @ApiProperty({
    type: [String],
  })
  @IsArray()
  techStack: string[];

  @ApiProperty()
  @IsNumber()
  sortOrder: number;

  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}