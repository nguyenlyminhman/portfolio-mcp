import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ChatRequestDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  message: string;
}