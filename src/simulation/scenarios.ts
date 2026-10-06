// ============================================================
// TEST SCENARIOS MODULE
// ============================================================
// Predefined test scenarios for demonstration and validation.
// Each scenario uses the actual simulation engine.
// ============================================================

import { TestScenario } from './types';

export const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 1,
    name: 'Normal Product Detection',
    description: 'Product enters conveyor, gets detected, and counter increments.',
    steps: [
      { action: 'RESET', delay: 0 },
      { action: 'START', delay: 2 },
      { action: 'ADD_PRODUCT', delay: 4 },
      { action: 'WAIT', delay: 15 },
    ],
    expectedResult: 'Product detected, counter = 1, FSM = RUNNING',
  },
  {
    id: 2,
    name: 'Position Detection',
    description: 'Product reaches position sensor and triggers position control.',
    steps: [
      { action: 'RESET', delay: 0 },
      { action: 'START', delay: 2 },
      { action: 'ADD_PRODUCT', delay: 4 },
      { action: 'WAIT', delay: 30 },
    ],
    expectedResult: 'Position detected, FSM transitions through POSITION_CONTROL',
  },
  {
    id: 3,
    name: 'Fault Detection',
    description: 'Fault signal is injected, conveyor stops safely.',
    steps: [
      { action: 'RESET', delay: 0 },
      { action: 'START', delay: 2 },
      { action: 'INJECT_FAULT', delay: 6 },
      { action: 'WAIT', delay: 5 },
    ],
    expectedResult: 'FSM = FAULT_STOP, Motor = OFF, Alarm = ON',
  },
  {
    id: 4,
    name: 'Emergency Stop',
    description: 'Emergency activated, immediate safe stop.',
    steps: [
      { action: 'RESET', delay: 0 },
      { action: 'START', delay: 2 },
      { action: 'EMERGENCY', delay: 6 },
      { action: 'WAIT', delay: 3 },
    ],
    expectedResult: 'FSM = EMERGENCY_SAFE_STOP, Motor = OFF, Alarm = ON',
  },
  {
    id: 5,
    name: 'Multiple Inputs - Priority Test',
    description: 'All inputs active simultaneously. Emergency must be selected.',
    steps: [
      { action: 'RESET', delay: 0 },
      { action: 'START', delay: 2 },
      { action: 'ADD_PRODUCT', delay: 4 },
      { action: 'ACTIVATE_ALL', delay: 6 },
      { action: 'WAIT', delay: 3 },
    ],
    expectedResult: 'Selected Event = EMERGENCY, FSM = EMERGENCY_SAFE_STOP',
  },
  {
    id: 6,
    name: 'Error Injection (Parity)',
    description: 'Parity error is injected, error detected, fault response triggered.',
    steps: [
      { action: 'RESET', delay: 0 },
      { action: 'START', delay: 2 },
      { action: 'INJECT_ERROR', delay: 5 },
      { action: 'WAIT', delay: 5 },
    ],
    expectedResult: 'Error detected, fault triggered, FSM = FAULT_STOP',
  },
];
