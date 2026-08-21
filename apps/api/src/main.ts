import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { parseApiEnvironment } from '@career-os/config';
import { createServiceLogger } from '@career-os/observability';
import { AppModule } from './app.module.js';
import helmet from 'helmet';
import { ApiExceptionFilter } from './common/api-exception.filter.js';

async function bootstrap(): Promise<void> {
  const environment = parseApiEnvironment(process.env);
  const logger = createServiceLogger({
    environment: environment.NODE_ENV,
    level: environment.LOG_LEVEL,
    service: 'api',
    version: environment.APP_VERSION,
  });
  const app = await NestFactory.create(AppModule, { logger: false });
  app.use(helmet());
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableCors({
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: [
      'authorization',
      'content-type',
      'idempotency-key',
      'x-correlation-id',
    ],
    origin: environment.WEB_ORIGIN,
  });
  app.enableShutdownHooks();
  await app.listen(environment.API_PORT, '0.0.0.0');
  logger.info({ event: 'service.started', port: environment.API_PORT });
}

void bootstrap();
