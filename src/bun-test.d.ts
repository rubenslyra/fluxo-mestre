declare module "bun:test" {
  export function describe(name: string, fn: () => void | Promise<void>): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
  export const it: typeof test;

  export interface Expect<T = unknown> {
    toBe(expected: unknown): void;
    toContain(expected: string): void;
    toEqual(expected: unknown): void;
    toMatch(expected: string | RegExp): void;
    toBeGreaterThan(expected: number): void;
    not: Expect<T>;
  }

  export function expect<T = unknown>(value: T): Expect<T>;
}
