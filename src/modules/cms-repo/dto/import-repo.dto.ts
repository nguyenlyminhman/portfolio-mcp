import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNumber, IsOptional, IsString } from "class-validator";

export class ImportRepoDto {
  @IsString()
  repo_name: string;

  @IsOptional()
  @IsString()
  github_url: string;

  @ApiProperty({
    type: [String],
  })
  @IsArray()
  tech_stack: string[];

  @IsOptional()
  @IsString()
  highlights: string;

  @IsOptional()
  @IsString()
  markdown?: string;

  @IsNumber()
  sort_order: number;
}