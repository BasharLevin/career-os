import { Module } from '@nestjs/common';
import { parseApiEnvironment } from '@career-os/config';
import { DiscoveryModule } from '../discovery/discovery.module.js';
import { ProfileModule } from '../profile/profile.module.js';
import { TrackingModule } from '../tracking/tracking.module.js';
import { AssistantController } from './assistant.controller.js';
import { ASSISTANT_PROVIDER } from './assistant-provider.js';
import { AssistantService } from './assistant.service.js';
import { ConversationRepository } from './conversation.repository.js';
import { FakeAssistantProvider } from './fake-assistant.provider.js';
import { OpenAiAssistantProvider } from './openai-assistant.provider.js';
import { ToolRegistry } from './tool-registry.js';

@Module({
  imports: [DiscoveryModule, TrackingModule, ProfileModule],
  controllers: [AssistantController],
  providers: [
    AssistantService,
    ConversationRepository,
    ToolRegistry,
    {
      provide: ASSISTANT_PROVIDER,
      useFactory: () =>
        parseApiEnvironment(process.env).AI_PROVIDER === 'openai'
          ? new OpenAiAssistantProvider()
          : new FakeAssistantProvider(),
    },
  ],
})
export class AssistantModule {}
