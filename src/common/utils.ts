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
    return value.map((n) => normalizeNumber(n, defaultValue)) as MinMax;
  }

  let singleValue = value ?? defaultValue;

  if (Number.isNaN(singleValue)) {
    singleValue = defaultValue;
  }

  if (isFinite && !Number.isFinite(singleValue)) {
    singleValue = defaultValue;
  }

  return Math.abs(singleValue);
}

export function sampleNumber(value: number | MinMax): number {
  return Array.isArray(value) ? randomNumber(...value) : value;
}

export function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function isFunction(value: any): value is (...args: any[]) => any {
  return typeof value === 'function';
}

export function isNil(value: any): value is Nil {
  /* eslint-disable no-eq-null, eqeqeq */
  return value == null;
}

export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

export function isDocumentVisible(): boolean {
  return !document.hidden;
}

export type Nil = null | undefined;
export type MinMax = [number, number];
export type UnsafeMinMax = [number | Nil, number | Nil];
