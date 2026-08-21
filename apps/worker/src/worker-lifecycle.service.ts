import { Injectable, type OnModuleInit } from '@nestjs/common';
import { parseWorkerEnvironment } from '@career-os/config';
import { createServiceLogger } from '@career-os/observability';

@Injectable()
export class WorkerLifecycleService implements OnModuleInit {
  onModuleInit(): void {
    const environment = parseWorkerEnvironment(process.env);
    createServiceLogger({
      environment: environment.NODE_ENV,
      level: environment.LOG_LEVEL,
      service: 'worker',
      version: environment.APP_VERSION,
    }).info({ event: 'worker.ready', mode: 'operational-foundation' });
  }
}
