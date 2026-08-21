import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { WorkerLifecycleService } from './worker-lifecycle.service.js';

@Module({
  controllers: [HealthController],
  providers: [WorkerLifecycleService],
})
export class AppModule {}
