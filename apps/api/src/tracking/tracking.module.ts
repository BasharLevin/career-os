import { Module } from '@nestjs/common';
import { JobTechClient } from '@career-os/jobtech-client';
import { parseApiEnvironment } from '@career-os/config';
import { TrackingController } from './tracking.controller.js';
import { TrackingRepository } from './tracking.repository.js';
import { TrackingService } from './tracking.service.js';

@Module({
  controllers: [TrackingController],
  providers: [
    TrackingRepository,
    TrackingService,
    {
      provide: JobTechClient,
      useFactory: () => {
        const e = parseApiEnvironment(process.env);
        return new JobTechClient({
          baseUrl: e.JOBTECH_SEARCH_BASE_URL,
          maxRetries: e.JOBTECH_MAX_RETRIES,
          requestTimeoutMs: e.JOBTECH_REQUEST_TIMEOUT_MS,
        });
      },
    },
  ],
  exports: [TrackingService],
})
export class TrackingModule {}
