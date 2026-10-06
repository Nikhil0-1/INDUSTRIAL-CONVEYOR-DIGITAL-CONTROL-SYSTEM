// ============================================================
// COUNTER LOGIC MODULE
// ============================================================
// Implements edge-detection based product counting.
// Only counts on rising edge of valid product detection.
// Prevents double-counting via product ID tracking.
// ============================================================

export interface CounterState {
  count: number;
  lastProductId: string | null;
  pulse: boolean; // true for one tick when counter increments
  previousSensorState: boolean;
}

/**
 * Edge-detect product sensor and increment counter.
 * Uses rising-edge detection: only counts when sensor transitions 0→1.
 * Uses product ID to prevent double-counting same product.
 */
export function updateCounter(
  currentCount: number,
  lastProductId: string | null,
  previousSensorState: boolean,
  currentSensorState: boolean,
  productId: string | null,
): CounterState {
  // Rising edge detection: was 0, now 1
  const risingEdge = !previousSensorState && currentSensorState;
  
  // Only count if:
  // 1. Rising edge detected
  // 2. Product ID is different from last counted
  const shouldCount = risingEdge && productId !== null && productId !== lastProductId;

  if (shouldCount) {
    return {
      count: currentCount + 1,
      lastProductId: productId!,
      pulse: true,
      previousSensorState: currentSensorState,
    };
  }

  return {
    count: currentCount,
    lastProductId,
    pulse: false,
    previousSensorState: currentSensorState,
  };
}

/**
 * Format counter display value with leading zeros
 */
export function formatCount(count: number): string {
  return count.toString().padStart(3, '0');
}

/**
 * Format product ID
 */
export function formatProductId(num: number): string {
  return `P${num.toString().padStart(3, '0')}`;
}
