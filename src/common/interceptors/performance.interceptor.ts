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
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);
  private readonly slowRequestThreshold = 1000; // 1 second
  private readonly requestMetrics = new Map<string, number[]>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();
    const routeKey = `${method} ${url.split('?')[0]}`;

    return next.handle().pipe(
      tap({
        next: () => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          // Track metrics
          this.trackMetrics(routeKey, duration);

          // Log slow requests
          if (duration > this.slowRequestThreshold) {
            this.logger.warn({
              message: 'Slow Request Detected',
              route: routeKey,
              duration: `${duration}ms`,
              threshold: `${this.slowRequestThreshold}ms`,
              timestamp: new Date().toISOString(),
            });
          }

          // Log performance metrics every 100 requests
          if (Math.random() < 0.01) {
            this.logPerformanceMetrics();
          }
        },
        error: () => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          this.trackMetrics(routeKey, duration);
        },
      }),
    );
  }

  private trackMetrics(routeKey: string, duration: number) {
    if (!this.requestMetrics.has(routeKey)) {
      this.requestMetrics.set(routeKey, []);
    }

    const metrics = this.requestMetrics.get(routeKey)!;
    metrics.push(duration);

    // Keep only last 100 measurements per route
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  private logPerformanceMetrics() {
    const summary = Array.from(this.requestMetrics.entries()).map(([route, durations]) => {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      const p95 = this.percentile(durations, 95);

      return {
        route,
        requests: durations.length,
        avgDuration: `${Math.round(avg)}ms`,
        minDuration: `${min}ms`,
        maxDuration: `${max}ms`,
        p95Duration: `${Math.round(p95)}ms`,
      };
    });

    this.logger.log({
      message: 'Performance Metrics Summary',
      routes: summary,
      timestamp: new Date().toISOString(),
    });
  }

  private percentile(arr: number[], p: number): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }
}