import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { z } from 'zod';

export type FormActionResult<TOutput> =
  | { success: true; data: TOutput }
  | { success: false; fieldErrors: Record<string, string[]>; formError?: string };

/**
 * Wraps a server action with Zod validation so every form gets the same
 * result shape back, regardless of feature: client-side react-hook-form
 * validation and this server-side re-validation surface errors identically
 * (see src/components/shared/FormFields.tsx and the "form-action-errors"
 * helper that maps fieldErrors onto react-hook-form's setError).
 */
export function createFormAction<Schema extends z.ZodType, Output>(
  schema: Schema,
  handler: (input: z.output<Schema>) => Promise<Output>,
) {
  return async (input: unknown): Promise<FormActionResult<Output>> => {
    const parsed = schema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    try {
      const data = await handler(parsed.data);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        fieldErrors: {},
        formError: error instanceof Error ? error.message : 'Er ging iets mis. Probeer opnieuw.',
      };
    }
  };
}

/**
 * Bridges a failed FormActionResult onto react-hook-form's own error state,
 * so a field shows a server error exactly like a client validation error.
 */
export function applyFormActionErrors<TFieldValues extends FieldValues>(
  setError: UseFormSetError<TFieldValues>,
  result: Extract<FormActionResult<unknown>, { success: false }>,
): void {
  for (const [field, messages] of Object.entries(result.fieldErrors)) {
    if (messages?.[0]) {
      setError(field as Path<TFieldValues>, { type: 'server', message: messages[0] });
    }
  }
}
