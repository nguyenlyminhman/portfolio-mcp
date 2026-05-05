// response.helper.ts
import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import MetadataDto from 'src/dto/metadata.dto';


export class ResponseApi<T = any> {
  @ApiProperty({ example: 200, description: 'HTTP status code' })
  statusCode: HttpStatus;

  @ApiProperty({ example: 'OK', description: 'Human readable message' })
  message: string;

  @ApiProperty({ description: 'Returned data (if any)' })
  payload?: T;


  constructor(statusCode: HttpStatus, message: string, payload?: T) {
    this.statusCode = statusCode;
    this.message = message;
    this.payload = payload;
  }

  static success<T>(
    payload: T,
    message = 'OK',
    statusCode: HttpStatus = HttpStatus.OK,    
  ) {
    return new ResponseApi(statusCode, message, payload);
  }

  static error(
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    return new ResponseApi(statusCode, message);
  }
}
