import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ResponseApi } from 'src/common/response.helper';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.BAD_REQUEST;
    let message = 'Internal server error';
    
    /* HTTP EXCEPTION (NestJS) */
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();

      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && (res as any).message) {
        message = Array.isArray((res as any).message)
          ? (res as any).message.join(', ')
          : (res as any).message;
      }
    }

    /* =========================
       DOMAIN / UNKNOWN ERROR
       ========================= */
    else if (exception instanceof Error) {
      message = exception.message;
    }

    response
      .status(statusCode)
      .json(ResponseApi.error(message, statusCode));
  }
}
