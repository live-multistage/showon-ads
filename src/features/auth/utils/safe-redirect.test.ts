import { describe, it, expect } from 'vitest';
import { safeRedirectTarget } from './safe-redirect';

describe('safeRedirectTarget', () => {
  it('preserves safe internal paths', () => {
    expect(safeRedirectTarget('/invite/abc')).toBe('/invite/abc');
    expect(safeRedirectTarget('/account')).toBe('/account');
  });

  it('falls back to / when the param is absent', () => {
    expect(safeRedirectTarget(null)).toBe('/');
  });

  it('falls back to / for protocol-relative open-redirect vectors', () => {
    expect(safeRedirectTarget('//evil.com')).toBe('/');
  });

  it('falls back to / for absolute URLs', () => {
    expect(safeRedirectTarget('https://evil.com')).toBe('/');
  });

  it('falls back to / for backslash open-redirect vectors', () => {
    expect(safeRedirectTarget('/\\evil')).toBe('/');
  });

  it('falls back to / for javascript: URLs', () => {
    expect(safeRedirectTarget('javascript:alert(1)')).toBe('/');
  });
});
