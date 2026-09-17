/**
 * Only accepts a same-origin, internal path for post-login redirects, so a
 * `?next=` query param can never be turned into an open redirect.
 */
export function isSafeRedirectPath(path: string | null | undefined): path is string {
  if (!path) return false;
  if (!path.startsWith('/')) return false;
  if (path.startsWith('//')) return false;
  if (path.includes('://')) return false;
  return true;
}
