/**
 * Represents null or undefined values
 */
export type Nil = null | undefined;

/**
 * Tuple representing a minimum and maximum value range
 * Used for random timing strategies where time is selected randomly between min and max
 * @example [1000, 5000] // Random time between 1 and 5 seconds
 */
export type MinMax = [min: number, max: number];
