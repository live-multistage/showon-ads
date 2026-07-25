// Only same-origin relative paths are safe post-auth redirect targets.
// `//host` and `/\host` are protocol-relative open-redirect vectors browsers
// treat as absolute URLs; anything not starting with a single `/` (absolute
// URLs, `javascript:`, etc.) is rejected too. Falls back to '/'.
export function safeRedirectTarget(raw: string | null): string {
  if (!raw) return '/';
  if (!raw.startsWith('/')) return '/';
  if (raw.startsWith('//') || raw.startsWith('/\\')) return '/';
  return raw;
}
