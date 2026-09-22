import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement ResizeObserver; Radix primitives from the design
// system (e.g. Checkbox's hidden bubble input) need it to mount at all.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
