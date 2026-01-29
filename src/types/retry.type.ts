/**
 * Keys for retry counting in PollState
 * - "retryCount": Total number of retry attempts
 * - "consecutiveRetryCount": Current number of consecutive retry attempts
 */
export type RetryKey = 'retryCount' | 'consecutiveRetryCount';
