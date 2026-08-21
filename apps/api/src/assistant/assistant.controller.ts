import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  assistantMessageSchema,
  confirmationSchema,
  conversationCreateSchema,
} from '@career-os/contracts';
import { CurrentPrincipal } from '../auth/current-principal.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { Principal } from '../auth/principal.js';
import { parsed } from '../common/request-validation.js';
import { AssistantService } from './assistant.service.js';

@Controller('api/v1/conversations')
@UseGuards(AuthGuard)
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}
  @Post() create(@CurrentPrincipal() p: Principal, @Body() body: unknown) {
    const input = parsed(conversationCreateSchema, body);
    return this.assistant.create(p, input.title);
  }
  @Get() list(@CurrentPrincipal() p: Principal) {
    return this.assistant.list(p).then((items) => ({ items }));
  }
  @Get(':id') get(@CurrentPrincipal() p: Principal, @Param('id') id: string) {
    return this.assistant.get(p, id);
  }
  @Post(':id/messages') async message(
    @CurrentPrincipal() p: Principal,
    @Param('id') id: string,
    @Body() body: unknown,
    @Res() response: Response,
  ) {
    const input = parsed(assistantMessageSchema, body);
    const abort = new AbortController();
    response.once('close', () => abort.abort());
    response.status(200).setHeader('content-type', 'text/event-stream');
    response.setHeader('cache-control', 'no-cache');
    try {
      const events = await this.assistant.message(
        p,
        id,
        input.content,
        input.clientMessageId,
        String(response.getHeader('x-correlation-id') ?? ''),
        abort.signal,
      );
      for (const event of events)
        response.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch (error) {
      response.write(
        `data: ${JSON.stringify({ type: 'error', code: 'assistant_failed', message: error instanceof Error ? error.message : 'Assistant failed' })}\n\n`,
      );
    }
    response.end();
  }
  @Post(':id/confirm') async confirm(
    @CurrentPrincipal() p: Principal,
    @Param('id') _id: string,
    @Body() body: unknown,
    @Res() response: Response,
  ) {
    const input = parsed(confirmationSchema, body);
    response.status(200).setHeader('content-type', 'text/event-stream');
    const events = await this.assistant.confirm(
      p,
      input.token,
      String(response.getHeader('x-correlation-id') ?? ''),
    );
    for (const event of events)
      response.write(`data: ${JSON.stringify(event)}\n\n`);
    response.end();
  }
}
