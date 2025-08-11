import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, headers, body, params, query } = request;
    const userAgent = headers['user-agent'] || 'Unknown';
    const contentLength = headers['content-length'] || '0';
    const startTime = Date.now();

    // Log request details
    this.logger.log({
      message: 'Incoming Request',
      method,
      url,
      userAgent,
      contentLength,
      params: Object.keys(params).length ? params : undefined,
      query: Object.keys(query).length ? query : undefined,
      bodySize: body ? JSON.stringify(body).length : 0,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId(),
    });

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          this.logger.log({
            message: 'Response Sent',
            method,
            url,
            statusCode: response.statusCode,
            duration: `${duration}ms`,
            responseSize: responseBody ? JSON.stringify(responseBody).length : 0,
            timestamp: new Date().toISOString(),
          });
        },
        error: (error) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          this.logger.error({
            message: 'Request Failed',
            method,
            url,
            statusCode: response.statusCode,
            duration: `${duration}ms`,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
          });
        },
      }),
    );
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}