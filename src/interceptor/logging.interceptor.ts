
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';


@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        console.log('LoggingInterceptor: Before handling request');
        const now = Date.now();
        return next
            .handle()
            .pipe(
                tap(() => console.log(`LoggingInterceptor: After... ${Date.now() - now}ms`)),
            );
    }
}
