// ============================================================
// PRIORITY LOGIC MODULE
// ============================================================
// Implements a 4-input priority encoder.
// Priority Order (highest to lowest):
//   I3 = EMERGENCY
//   I2 = FAULT  
//   I1 = POSITION
//   I0 = PRODUCT
// ============================================================

import { SelectedEvent } from './types';

export interface PriorityInput {
  emergency: boolean;
  fault: boolean;
  position: boolean;
  product: boolean;
}

export interface PriorityResult {
  selectedEvent: SelectedEvent;
  encodedValue: number; // 2-bit encoded output
  valid: boolean; // any input active
  inputs: [number, number, number, number]; // I3, I2, I1, I0
}

/**
 * 4-to-2 Priority Encoder
 * Emergency (I3) has ALWAYS highest priority.
 * This is the core requirement from the project report.
 */
export function evaluatePriority(input: PriorityInput): PriorityResult {
  const inputs: [number, number, number, number] = [
    input.emergency ? 1 : 0,
    input.fault ? 1 : 0,
    input.position ? 1 : 0,
    input.product ? 1 : 0,
  ];

  // Priority encoder logic - highest active input wins
  if (input.emergency) {
    return { selectedEvent: 'EMERGENCY', encodedValue: 0b11, valid: true, inputs };
  }
  if (input.fault) {
    return { selectedEvent: 'FAULT', encodedValue: 0b10, valid: true, inputs };
  }
  if (input.position) {
    return { selectedEvent: 'POSITION', encodedValue: 0b01, valid: true, inputs };
  }
  if (input.product) {
    return { selectedEvent: 'PRODUCT', encodedValue: 0b00, valid: true, inputs };
  }

  return { selectedEvent: 'NONE', encodedValue: 0b00, valid: false, inputs };
}

/**
 * Boolean equations used by the priority encoder:
 * 
 * Y1 (MSB) = I3 + I2  (Emergency OR Fault)
 * Y0 (LSB) = I3 + I1·¬I2  (Emergency OR (Position AND NOT Fault))
 * V (Valid) = I3 + I2 + I1 + I0
 * 
 * Motor Enable Logic:
 * MOTOR_ENABLE = FSM_RUN · ¬EMERGENCY · ¬FAULT
 */
export const BOOLEAN_EQUATIONS = {
  Y1: 'Y₁ = I₃ + I₂',
  Y0: 'Y₀ = I₃ + I₁·I̅₂',
  VALID: 'V = I₃ + I₂ + I₁ + I₀',
  MOTOR_ENABLE: 'MOTOR_EN = RUN · E̅MERG · F̅AULT',
  ALARM: 'ALARM = EMERGENCY + FAULT + ERROR',
  SAFE_STOP: 'SAFE_STOP = EMERGENCY',
};

/**
 * Generate truth table for priority encoder
 */
export function generateTruthTable(): Array<{
  emergency: number;
  fault: number;
  position: number;
  product: number;
  selectedEvent: SelectedEvent;
  y1: number;
  y0: number;
  valid: number;
  motorAction: string;
}> {
  const rows: ReturnType<typeof generateTruthTable> = [];

  for (let i = 0; i < 16; i++) {
    const emergency = (i >> 3) & 1;
    const fault = (i >> 2) & 1;
    const position = (i >> 1) & 1;
    const product = i & 1;

    const result = evaluatePriority({
      emergency: !!emergency,
      fault: !!fault,
      position: !!position,
      product: !!product,
    });

    let motorAction = 'NO CHANGE';
    if (emergency) motorAction = 'IMMEDIATE STOP';
    else if (fault) motorAction = 'SAFE STOP';
    else if (!emergency && !fault) motorAction = 'NORMAL';

    rows.push({
      emergency,
      fault,
      position,
      product,
      selectedEvent: result.selectedEvent,
      y1: (result.encodedValue >> 1) & 1,
      y0: result.encodedValue & 1,
      valid: result.valid ? 1 : 0,
      motorAction,
    });
  }

  return rows;
}
