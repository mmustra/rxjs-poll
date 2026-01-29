/**
 * Options for calculating pause delays in document visibility scenarios
 */
export type PauseDelayOptions = {
  /** Target delay time in milliseconds */
  time: number;
  /** Timestamp when the source operation started */
  sourceStartTime?: number;
  /** Timestamp when the source operation ended */
  sourceEndTime?: number;
};
