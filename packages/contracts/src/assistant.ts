import { z } from 'zod';

export const toolNameSchema = z.enum([
  'search_jobs',
  'get_job_details',
  'compare_job_to_profile',
  'compare_jobs',
  'list_saved_jobs',
  'list_applications',
  'get_application',
  'get_application_history',
  'get_user_profile',
  'save_job',
  'create_application',
  'update_application_status',
  'add_application_note',
  'update_profile_preferences',
]);
export const conversationCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
  })
  .strict();
export const assistantMessageSchema = z
  .object({
    content: z.string().trim().min(1).max(12000),
    clientMessageId: z.string().uuid(),
  })
  .strict();
export const confirmationSchema = z
  .object({
    token: z.string().min(20).max(500),
    approved: z.literal(true),
  })
  .strict();

export type ToolName = z.infer<typeof toolNameSchema>;
export type AssistantStreamEvent =
  | { type: 'text_delta'; text: string }
  | { type: 'tool_started'; tool: ToolName; label: string }
  | { type: 'tool_completed'; tool: ToolName; focusJobId?: string }
  | {
      type: 'confirmation_required';
      operationId: string;
      token: string;
      tool: ToolName;
      summary: string;
    }
  | { type: 'completed'; messageId: string }
  | { type: 'error'; code: string; message: string };
