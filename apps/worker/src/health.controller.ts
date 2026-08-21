import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@career-os/contracts';

@Controller('health')
export class HealthController {
  @Get('live')
  live(): HealthResponse {
    return {
      service: 'worker',
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION ?? 'development',
    };
  }
}
