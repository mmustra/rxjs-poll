export function normalizeNumber(value: number | Nil, defaultValue?: number, isFinite?: boolean): number;
export function normalizeNumber(value: UnsafeMinMax | Nil, defaultValue?: number, isFinite?: boolean): MinMax;
export function normalizeNumber(
  value: number | UnsafeMinMax | Nil,
  defaultValue?: number,
  isFinite?: boolean
): number | MinMax;
export function normalizeNumber(
  value: number | UnsafeMinMax | Nil,
  defaultValue = 0,
  isFinite = true
): number | MinMax {
  if (Array.isArray(value)) {
    return value.map((n) => normalizeNumber(n, defaultValue, isFinite)) as MinMax;
  }

  let normalizedValue = value ?? defaultValue;

  if (Number.isNaN(normalizedValue) || (isFinite && !Number.isFinite(normalizedValue))) {
    normalizedValue = defaultValue;
  }

  return Math.abs(normalizedValue);
}

export function sampleNumber(value: number | MinMax): number {
  return Array.isArray(value) ? randomNumber(value[0], value[1]) : value;
}

export function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function isFunction(value: unknown): value is (...args: any[]) => any {
  return typeof value === 'function';
}

export function isBrowser(): boolean {
  return typeof globalThis.window !== 'undefined' && typeof globalThis.window.document !== 'undefined';
}

export function isDocumentVisible(): boolean {
  return !document.hidden;
}

export type Nil = null | undefined;
export type MinMax = [number, number];
export type UnsafeMinMax = [number | Nil, number | Nil];
