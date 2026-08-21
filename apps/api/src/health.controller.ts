import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@career-os/contracts';

@Controller('health')
export class HealthController {
  @Get('live')
  live(): HealthResponse {
    return {
      service: 'api',
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION ?? 'development',
    };
  }
}
