import { Injectable } from '@nestjs/common';
import type {
  AssistantProvider,
  ProviderInput,
  ProviderResult,
} from './assistant-provider.js';

@Injectable()
export class FakeAssistantProvider implements AssistantProvider {
  respond(input: ProviderInput): Promise<ProviderResult> {
    const text = input.messages.at(-1)?.content ?? '';
    const lower = text.toLocaleLowerCase('sv');
    const id = /\b\d{5,}\b/.exec(text)?.[0];
    const tool =
      lower.includes('spar') || lower.includes('save')
        ? 'save_job'
        : lower.includes('ansök') || lower.includes('apply')
          ? 'create_application'
          : lower.includes('profil') || lower.includes('profile')
            ? 'get_user_profile'
            : id && (lower.includes('match') || lower.includes('jämför'))
              ? 'compare_job_to_profile'
              : lower.includes('ansökningar') || lower.includes('applications')
                ? 'list_applications'
                : lower.includes('sparade') || lower.includes('saved')
                  ? 'list_saved_jobs'
                  : lower.includes('sök') ||
                      lower.includes('search') ||
                      lower.includes('jobb') ||
                      lower.includes('jobs')
                    ? 'search_jobs'
                    : null;
    if (!tool)
      return Promise.resolve({
        responseId: 'fake-response',
        text: 'I can search, compare, save, and help track jobs. What would you like to do?',
        calls: [],
      });
    const args =
      tool === 'search_jobs'
        ? { q: text.slice(0, 200), limit: 10 }
        : tool === 'save_job' ||
            tool === 'create_application' ||
            tool === 'compare_job_to_profile'
          ? { externalId: id ?? '' }
          : {};
    return Promise.resolve({
      responseId: 'fake-response',
      text: '',
      calls: [
        { callId: 'fake-call', name: tool, arguments: JSON.stringify(args) },
      ],
    });
  }
}
