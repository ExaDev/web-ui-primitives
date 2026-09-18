// jsdom doesn't implement matchMedia, which MantineProvider reads to detect the OS colour-scheme preference on every render.

import { vi } from "vitest";

export function matchMediaStub(query: string): MediaQueryList {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn<() => void>(),
    removeListener: vi.fn<() => void>(),
    addEventListener: vi.fn<() => void>(),
    removeEventListener: vi.fn<() => void>(),
    dispatchEvent: vi.fn<() => boolean>(() => true),
  };
}

export function stubMantineJsdomGlobals(): void {
  vi.stubGlobal("matchMedia", matchMediaStub);
}
