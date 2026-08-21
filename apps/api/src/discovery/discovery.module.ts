import { Module } from '@nestjs/common';
import { parseApiEnvironment } from '@career-os/config';
import { JobTechClient } from '@career-os/jobtech-client';
import { DiscoveryController } from './discovery.controller.js';
import { DiscoveryService } from './discovery.service.js';
import { ResponseCache } from './response-cache.js';

@Module({
  controllers: [DiscoveryController],
  providers: [
    DiscoveryService,
    {
      provide: JobTechClient,
      useFactory: () => {
        const environment = parseApiEnvironment(process.env);
        return new JobTechClient({
          baseUrl: environment.JOBTECH_SEARCH_BASE_URL,
          maxRetries: environment.JOBTECH_MAX_RETRIES,
          requestTimeoutMs: environment.JOBTECH_REQUEST_TIMEOUT_MS,
        });
      },
    },
    {
      provide: ResponseCache,
      useFactory: () => {
        const environment = parseApiEnvironment(process.env);
        return new ResponseCache(environment.JOBTECH_CACHE_TTL_SECONDS * 1_000);
      },
    },
  ],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
