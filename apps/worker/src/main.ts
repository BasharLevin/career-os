import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { parseWorkerEnvironment } from '@career-os/config';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const environment = parseWorkerEnvironment(process.env);
  const app = await NestFactory.create(AppModule, { logger: false });
  app.enableShutdownHooks();
  await app.listen(environment.WORKER_HEALTH_PORT, '0.0.0.0');
}

void bootstrap();
