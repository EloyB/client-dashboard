import { describe, expect, it } from 'vitest';

import { isSafeRedirectPath } from '@/lib/safe-redirect';

describe('isSafeRedirectPath', () => {
  it('accepts a plain internal path', () => {
    expect(isSafeRedirectPath('/app/clients')).toBe(true);
  });

  it('accepts an internal path with a query string', () => {
    expect(isSafeRedirectPath('/app/tickets?status=new')).toBe(true);
  });

  it('rejects a missing or empty value', () => {
    expect(isSafeRedirectPath(null)).toBe(false);
    expect(isSafeRedirectPath(undefined)).toBe(false);
    expect(isSafeRedirectPath('')).toBe(false);
  });

  it('rejects an absolute URL', () => {
    expect(isSafeRedirectPath('https://evil.example.com')).toBe(false);
    expect(isSafeRedirectPath('http://evil.example.com/app')).toBe(false);
  });

  it('rejects a protocol-relative URL', () => {
    expect(isSafeRedirectPath('//evil.example.com')).toBe(false);
  });

  it('rejects a path not starting with a slash', () => {
    expect(isSafeRedirectPath('app/clients')).toBe(false);
  });

  it('rejects a path containing an embedded protocol', () => {
    expect(isSafeRedirectPath('/redirect?to=https://evil.example.com')).toBe(false);
  });
});
