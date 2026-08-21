import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  applicationListQuerySchema,
  createApplicationRequestSchema,
  idempotencyKeySchema,
  jobIdSchema,
  noteRequestSchema,
  updateStatusRequestSchema,
  uuidSchema,
} from '@career-os/contracts';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentPrincipal } from '../auth/current-principal.js';
import type { Principal } from '../auth/principal.js';
import { TrackingService } from './tracking.service.js';

function parsed<T>(
  schema: {
    safeParse(v: unknown): { success: true; data: T } | { success: false };
  },
  value: unknown,
): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new BadRequestException('Invalid request');
  return r.data;
}
function correlation(response: Response): string {
  return String(response.locals.correlationId);
}

@Controller('api/v1')
@UseGuards(AuthGuard)
export class TrackingController {
  constructor(private readonly service: TrackingService) {}
  @Post('saved-jobs') save(
    @CurrentPrincipal() p: Principal,
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    const input = parsed(
      createApplicationRequestSchema.pick({ externalId: true }),
      body,
    );
    return this.service.save(p, input.externalId, correlation(res));
  }
  @Delete('saved-jobs/:externalId') @HttpCode(204) unsave(
    @CurrentPrincipal() p: Principal,
    @Param('externalId') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.service.unsave(p, parsed(jobIdSchema, id), correlation(res));
  }
  @Get('saved-jobs') async saved(@CurrentPrincipal() p: Principal) {
    return { items: await this.service.saved(p) };
  }
  @Post('applications') create(
    @CurrentPrincipal() p: Principal,
    @Body() body: unknown,
    @Headers('idempotency-key') key: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const input = parsed(createApplicationRequestSchema, body);
    return this.service.create(
      p,
      input.externalId,
      input.initialStatus,
      parsed(idempotencyKeySchema, key),
      correlation(res),
    );
  }
  @Get('applications') async list(
    @CurrentPrincipal() p: Principal,
    @Query() query: unknown,
  ) {
    const input = parsed(applicationListQuerySchema, query);
    return { items: await this.service.list(p, input.status) };
  }
  @Get('applications/:id') one(
    @CurrentPrincipal() p: Principal,
    @Param('id') id: string,
  ) {
    return this.service.one(p, parsed(uuidSchema, id));
  }
  @Patch('applications/:id/status') status(
    @CurrentPrincipal() p: Principal,
    @Param('id') id: string,
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    const input = parsed(updateStatusRequestSchema, body);
    return this.service.status(
      p,
      parsed(uuidSchema, id),
      input.status,
      input.expectedVersion,
      correlation(res),
    );
  }
  @Post('applications/:id/notes') note(
    @CurrentPrincipal() p: Principal,
    @Param('id') id: string,
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    const input = parsed(noteRequestSchema, body);
    return this.service.note(
      p,
      parsed(uuidSchema, id),
      input.body,
      correlation(res),
    );
  }
  @Patch('applications/:id/notes/:noteId') edit(
    @CurrentPrincipal() p: Principal,
    @Param('id') id: string,
    @Param('noteId') noteId: string,
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    const input = parsed(noteRequestSchema, body);
    if (!input.expectedVersion)
      throw new BadRequestException('expectedVersion required');
    return this.service.editNote(
      p,
      parsed(uuidSchema, id),
      parsed(uuidSchema, noteId),
      input.body,
      input.expectedVersion,
      correlation(res),
    );
  }
  @Delete('applications/:id/notes/:noteId') @HttpCode(204) remove(
    @CurrentPrincipal() p: Principal,
    @Param('id') id: string,
    @Param('noteId') noteId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.service.deleteNote(
      p,
      parsed(uuidSchema, id),
      parsed(uuidSchema, noteId),
      correlation(res),
    );
  }
  @Get('applications/:id/history') async history(
    @CurrentPrincipal() p: Principal,
    @Param('id') id: string,
  ) {
    return { items: await this.service.history(p, parsed(uuidSchema, id)) };
  }
  @Post('applications/:id/refresh') refresh(
    @CurrentPrincipal() p: Principal,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.service.refresh(p, parsed(uuidSchema, id), correlation(res));
  }
}
