// ============================================================
// ERROR DETECTION MODULE (EVEN PARITY)
// ============================================================
// Implements even parity bit generation and checking.
// Parity detects single-bit errors but cannot correct them.
// ============================================================

import { ParityData } from './types';

/**
 * Calculate even parity bit for given data bits
 */
export function calculateParityBit(dataBits: number[]): number {
  const onesCount = dataBits.reduce((sum, bit) => sum + bit, 0);
  return onesCount % 2; // Even parity: parity bit makes total number of 1s even
}

/**
 * Check if received data has parity error
 */
export function checkParity(receivedBits: number[], receivedParity: number): boolean {
  const expectedParity = calculateParityBit(receivedBits);
  return expectedParity !== receivedParity; // true = error detected
}

/**
 * Generate initial parity data with random 8-bit data
 */
export function generateParityData(): ParityData {
  const dataBits = Array.from({ length: 8 }, () => Math.round(Math.random()));
  const parityBit = calculateParityBit(dataBits);
  const transmitted = [...dataBits, parityBit];

  return {
    dataBits,
    parityBit,
    transmitted,
    received: [...transmitted],
    receivedParity: parityBit,
    errorDetected: false,
    errorBitIndex: null,
  };
}

/**
 * Inject a single-bit error into received data
 */
export function injectError(data: ParityData, bitIndex?: number): ParityData {
  const received = [...data.transmitted];
  const idx = bitIndex ?? Math.floor(Math.random() * 8); // Flip a data bit (not parity)
  received[idx] = received[idx] === 0 ? 1 : 0;

  const receivedDataBits = received.slice(0, 8);
  const receivedParity = received[8];
  const errorDetected = checkParity(receivedDataBits, receivedParity);

  return {
    ...data,
    received,
    receivedParity,
    errorDetected,
    errorBitIndex: idx,
  };
}

/**
 * Generate new valid data (no error)
 */
export function generateNewData(): ParityData {
  return generateParityData();
}

/**
 * Verify received data integrity
 */
export function verifyData(data: ParityData): ParityData {
  const receivedDataBits = data.received.slice(0, 8);
  const receivedParity = data.received[8];
  const errorDetected = checkParity(receivedDataBits, receivedParity);

  return {
    ...data,
    errorDetected,
  };
}
