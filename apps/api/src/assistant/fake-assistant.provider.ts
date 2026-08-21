import { Injectable } from '@nestjs/common';
import type {
  AssistantProvider,
  ProviderInput,
  ProviderResult,
} from './assistant-provider.js';

@Injectable()
export class FakeAssistantProvider implements AssistantProvider {
  readonly mode = 'demo' as const;
  respond(input: ProviderInput): Promise<ProviderResult> {
    const text = input.messages.at(-1)?.content ?? '';
    const lower = text.toLocaleLowerCase('sv');
    const id = /\b\d{5,}\b/.exec(text)?.[0];
    const ordinal = /(?:second|andra|nummer\s*2)/i.test(text)
      ? 2
      : /(?:third|tredje|nummer\s*3)/i.test(text)
        ? 3
        : /(?:first|första|nummer\s*1)/i.test(text)
          ? 1
          : undefined;
    if (/^(?:show me|visa(?: mig)?)(?:\s|$)/i.test(text))
      return Promise.resolve({
        responseId: 'fake-response',
        text: '',
        calls: [],
        followUp: ordinal
          ? { type: 'focus_result', ordinal }
          : { type: 'reveal_results' },
      });
    if (/(?:tell me about|berätta om).*(?:second|andra)/i.test(text))
      return Promise.resolve({
        responseId: 'fake-response',
        text: '',
        calls: [],
        followUp: { type: 'focus_result', ordinal: 2 },
      });
    if (/(?:which is best|vilken är bäst|best for me|bäst för mig)/i.test(text))
      return Promise.resolve({
        responseId: 'fake-response',
        text: '',
        calls: [],
        followUp: { type: 'focus_result', ordinal: 1 },
      });
    const placeFollowUp =
      /\b(stockholm|västerås|göteborg|malmö|uppsala)\b/i.exec(text);
    if (
      placeFollowUp &&
      /(?:only|instead|bara|istället|what about|vad sägs om)/i.test(text)
    )
      return Promise.resolve({
        responseId: 'fake-response',
        text: '',
        calls: [
          {
            callId: 'fake-call',
            name: 'search_jobs',
            arguments: JSON.stringify({
              municipality: placeFollowUp[1],
              limit: 10,
            }),
          },
        ],
      });
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
    const requestedPlace =
      /\b(stockholm|västerås|göteborg|malmö|uppsala)\b/i.exec(text)?.[1];
    const cleanSearch = text
      .replace(
        /\b(?:search|find|show me|sök|hitta|visa mig|jobs?|jobb)\b/gi,
        ' ',
      )
      .replace(/\s+/g, ' ')
      .replace(new RegExp(`\\b${requestedPlace ?? '(?!)'}\\b`, 'i'), ' ')
      .replace(/\b(?:in|i|within|near|runt)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const refersToResult = /\b(?:that one|den|det jobbet)\b/i.test(text);
    const args =
      tool === 'search_jobs'
        ? {
            ...(cleanSearch ? { q: cleanSearch.slice(0, 200) } : {}),
            ...(requestedPlace ? { municipality: requestedPlace } : {}),
            limit: 10,
          }
        : tool === 'save_job' ||
            tool === 'create_application' ||
            tool === 'compare_job_to_profile'
          ? { externalId: id ?? (refersToResult ? '__recent__' : '') }
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
