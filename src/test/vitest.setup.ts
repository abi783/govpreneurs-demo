// Shared vitest setup. `vitest.config.ts` loads it for every environment.
//
// jsdom has no ResizeObserver, and Radix measures an open tooltip or popover
// with one. Any component test that opens a Radix layer needs this stub, so it
// lives here instead of in each test file. The node suites get an unused global
// and are unaffected.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
