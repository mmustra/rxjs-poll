import { Observable } from 'rxjs';

/**
 * Factory that creates a polling Observable
 * @param getNextTime - Returns delay time based on last emitted value
 * @returns Observable that emits values of type T
 */
export type PollerFactory<T> = (getNextTime: (value: T) => number) => Observable<T>;
