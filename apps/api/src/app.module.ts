import { MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { DiscoveryModule } from './discovery/discovery.module.js';
import { RequestLoggingMiddleware } from './common/request-logging.middleware.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module.js';
import { TrackingModule } from './tracking/tracking.module.js';
import { correlationIdMiddleware } from './common/correlation-id.js';

@Module({
  imports: [DatabaseModule, AuthModule, DiscoveryModule, TrackingModule],
  controllers: [HealthController],
  providers: [RequestLoggingMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(correlationIdMiddleware, RequestLoggingMiddleware)
      .forRoutes('*');
  }
}
