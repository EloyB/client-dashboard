import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { applyFormActionErrors, createFormAction } from '@/lib/form-action';

const schema = z.object({
  title: z.string().min(1, 'Titel is verplicht'),
  priority: z.enum(['low', 'medium', 'high']),
});

describe('createFormAction', () => {
  it('returns fieldErrors for invalid input without calling the handler', async () => {
    const handler = vi.fn();
    const action = createFormAction(schema, handler);

    const result = await action({ title: '', priority: 'low' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.title).toEqual(['Titel is verplicht']);
    }
    expect(handler).not.toHaveBeenCalled();
  });

  it('calls the handler with parsed data and returns success', async () => {
    const handler = vi.fn().mockResolvedValue({ id: '1' });
    const action = createFormAction(schema, handler);

    const result = await action({ title: 'Cookiebanner instellen', priority: 'medium' });

    expect(result).toEqual({ success: true, data: { id: '1' } });
    expect(handler).toHaveBeenCalledWith({ title: 'Cookiebanner instellen', priority: 'medium' });
  });

  it('converts a thrown error into a formError instead of throwing', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('De server antwoordde niet.'));
    const action = createFormAction(schema, handler);

    const result = await action({ title: 'Iets', priority: 'high' });

    expect(result).toEqual({
      success: false,
      fieldErrors: {},
      formError: 'De server antwoordde niet.',
    });
  });

  it('falls back to a generic formError for a non-Error throw', async () => {
    const handler = vi.fn().mockRejectedValue('kapot');
    const action = createFormAction(schema, handler);

    const result = await action({ title: 'Iets', priority: 'high' });

    expect(result).toEqual({
      success: false,
      fieldErrors: {},
      formError: 'Er ging iets mis. Probeer opnieuw.',
    });
  });
});

describe('applyFormActionErrors', () => {
  it('calls setError for each field with its first message', () => {
    const setError = vi.fn();

    applyFormActionErrors(setError, {
      success: false,
      fieldErrors: { title: ['Titel is verplicht', 'Te lang'], priority: ['Ongeldige keuze'] },
    });

    expect(setError).toHaveBeenCalledWith('title', {
      type: 'server',
      message: 'Titel is verplicht',
    });
    expect(setError).toHaveBeenCalledWith('priority', {
      type: 'server',
      message: 'Ongeldige keuze',
    });
    expect(setError).toHaveBeenCalledTimes(2);
  });

  it('does nothing when fieldErrors is empty', () => {
    const setError = vi.fn();
    applyFormActionErrors(setError, { success: false, fieldErrors: {}, formError: 'Oeps' });
    expect(setError).not.toHaveBeenCalled();
  });
});
