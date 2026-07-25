// Only same-origin relative paths are safe post-auth redirect targets.
// `//host` and `/\host` are protocol-relative open-redirect vectors browsers
// treat as absolute URLs; anything not starting with a single `/` (absolute
// URLs, `javascript:`, etc.) is rejected too. Falls back to '/'.
// Control characters (TAB, LF, CR) are stripped first, mirroring URL parser behavior
// that can collapse `/\t/evil.com` to `//evil.com` (protocol-relative).
export function safeRedirectTarget(raw: string | null): string {
  if (!raw) return '/';
  const cleaned = raw.replace(/[\t\n\r]/g, '');
  if (!cleaned.startsWith('/')) return '/';
  if (cleaned.startsWith('//') || cleaned.startsWith('/\\')) return '/';
  return cleaned;
}
