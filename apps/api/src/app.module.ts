import { MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { DiscoveryModule } from './discovery/discovery.module.js';
import { RequestLoggingMiddleware } from './common/request-logging.middleware.js';

@Module({
  imports: [DiscoveryModule],
  controllers: [HealthController],
  providers: [RequestLoggingMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
