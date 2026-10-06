// ============================================================
// FINITE STATE MACHINE MODULE
// ============================================================
// Implements the conveyor control FSM with states:
//   RESET → IDLE → READY → RUNNING → POSITION_CONTROL
//                                   → FAULT_STOP
//   ANY STATE + EMERGENCY → EMERGENCY_SAFE_STOP
// ============================================================

import { FSMState, SelectedEvent } from './types';

export interface FSMTransition {
  from: FSMState;
  to: FSMState;
  condition: string;
  description: string;
}

export interface FSMResult {
  nextState: FSMState;
  transition: FSMTransition | null;
  motorEnabled: boolean;
  alarmActive: boolean;
}

/**
 * All defined FSM transitions
 */
export const FSM_TRANSITIONS: FSMTransition[] = [
  { from: 'RESET', to: 'IDLE', condition: 'Reset Complete', description: 'System initialization complete' },
  { from: 'IDLE', to: 'READY', condition: 'START', description: 'Start command received' },
  { from: 'READY', to: 'RUNNING', condition: 'Motor OK', description: 'Motor enabled, conveyor starts' },
  { from: 'RUNNING', to: 'POSITION_CONTROL', condition: 'POSITION=1', description: 'Product reached target position' },
  { from: 'POSITION_CONTROL', to: 'RUNNING', condition: 'Position Handled', description: 'Position event processed, resume' },
  { from: 'RUNNING', to: 'FAULT_STOP', condition: 'FAULT=1', description: 'Fault detected, safe stop' },
  { from: 'POSITION_CONTROL', to: 'FAULT_STOP', condition: 'FAULT=1', description: 'Fault during position control' },
  { from: 'FAULT_STOP', to: 'IDLE', condition: 'FAULT_CLEARED + RESET', description: 'Fault cleared and system reset' },
  // Emergency transitions from ANY state
  { from: 'IDLE', to: 'EMERGENCY_SAFE_STOP', condition: 'EMERGENCY=1', description: 'Emergency from IDLE' },
  { from: 'READY', to: 'EMERGENCY_SAFE_STOP', condition: 'EMERGENCY=1', description: 'Emergency from READY' },
  { from: 'RUNNING', to: 'EMERGENCY_SAFE_STOP', condition: 'EMERGENCY=1', description: 'Emergency from RUNNING' },
  { from: 'POSITION_CONTROL', to: 'EMERGENCY_SAFE_STOP', condition: 'EMERGENCY=1', description: 'Emergency from POSITION_CONTROL' },
  { from: 'FAULT_STOP', to: 'EMERGENCY_SAFE_STOP', condition: 'EMERGENCY=1', description: 'Emergency from FAULT_STOP' },
  { from: 'EMERGENCY_SAFE_STOP', to: 'IDLE', condition: 'RESET + EMERG_CLEAR', description: 'Emergency cleared and system reset' },
];

/**
 * Evaluate FSM state transition based on current state and selected event.
 * Emergency ALWAYS has highest priority and transitions to EMERGENCY_SAFE_STOP.
 */
export function evaluateFSM(
  currentState: FSMState,
  selectedEvent: SelectedEvent,
  startRequested: boolean,
  stopRequested: boolean,
  faultCleared: boolean,
  emergencyCleared: boolean,
  positionHandled: boolean,
): FSMResult {
  let nextState: FSMState = currentState;
  let transition: FSMTransition | null = null;
  let motorEnabled = false;
  let alarmActive = false;

  // RULE 1: Emergency ALWAYS overrides - highest priority
  if (selectedEvent === 'EMERGENCY') {
    if (currentState !== 'EMERGENCY_SAFE_STOP') {
      nextState = 'EMERGENCY_SAFE_STOP';
      transition = FSM_TRANSITIONS.find(
        t => t.from === currentState && t.to === 'EMERGENCY_SAFE_STOP'
      ) || {
        from: currentState,
        to: 'EMERGENCY_SAFE_STOP',
        condition: 'EMERGENCY=1',
        description: `Emergency from ${currentState}`,
      };
    }
    return { nextState, transition, motorEnabled: false, alarmActive: true };
  }

  // State-specific logic
  switch (currentState) {
    case 'RESET':
      nextState = 'IDLE';
      transition = FSM_TRANSITIONS.find(t => t.from === 'RESET' && t.to === 'IDLE')!;
      break;

    case 'IDLE':
      if (startRequested) {
        nextState = 'READY';
        transition = FSM_TRANSITIONS.find(t => t.from === 'IDLE' && t.to === 'READY')!;
      }
      break;

    case 'READY':
      if (selectedEvent === 'FAULT') {
        nextState = 'FAULT_STOP';
        transition = { from: 'READY', to: 'FAULT_STOP', condition: 'FAULT=1', description: 'Fault during READY' };
        alarmActive = true;
      } else {
        // Auto-transition to RUNNING after a tick
        nextState = 'RUNNING';
        motorEnabled = true;
        transition = FSM_TRANSITIONS.find(t => t.from === 'READY' && t.to === 'RUNNING')!;
      }
      break;

    case 'RUNNING':
      motorEnabled = true;
      if (selectedEvent === 'FAULT') {
        nextState = 'FAULT_STOP';
        motorEnabled = false;
        alarmActive = true;
        transition = FSM_TRANSITIONS.find(t => t.from === 'RUNNING' && t.to === 'FAULT_STOP')!;
      } else if (selectedEvent === 'POSITION') {
        nextState = 'POSITION_CONTROL';
        transition = FSM_TRANSITIONS.find(t => t.from === 'RUNNING' && t.to === 'POSITION_CONTROL')!;
      } else if (stopRequested) {
        nextState = 'IDLE';
        motorEnabled = false;
        transition = { from: 'RUNNING', to: 'IDLE', condition: 'STOP', description: 'Stop command received' };
      }
      break;

    case 'POSITION_CONTROL':
      motorEnabled = true;
      if (selectedEvent === 'FAULT') {
        nextState = 'FAULT_STOP';
        motorEnabled = false;
        alarmActive = true;
        transition = FSM_TRANSITIONS.find(t => t.from === 'POSITION_CONTROL' && t.to === 'FAULT_STOP')!;
      } else if (positionHandled) {
        nextState = 'RUNNING';
        transition = FSM_TRANSITIONS.find(t => t.from === 'POSITION_CONTROL' && t.to === 'RUNNING')!;
      }
      break;

    case 'FAULT_STOP':
      alarmActive = true;
      if (faultCleared) {
        nextState = 'IDLE';
        alarmActive = false;
        transition = FSM_TRANSITIONS.find(t => t.from === 'FAULT_STOP' && t.to === 'IDLE')!;
      }
      break;

    case 'EMERGENCY_SAFE_STOP':
      alarmActive = true;
      if (emergencyCleared) {
        nextState = 'IDLE';
        alarmActive = false;
        transition = FSM_TRANSITIONS.find(t => t.from === 'EMERGENCY_SAFE_STOP' && t.to === 'IDLE')!;
      }
      break;
  }

  return { nextState, transition, motorEnabled, alarmActive };
}

/**
 * Get all valid transitions from a given state
 */
export function getTransitionsFrom(state: FSMState): FSMTransition[] {
  return FSM_TRANSITIONS.filter(t => t.from === state);
}

/**
 * Get all states
 */
export const ALL_STATES: FSMState[] = [
  'RESET',
  'IDLE',
  'READY',
  'RUNNING',
  'POSITION_CONTROL',
  'FAULT_STOP',
  'EMERGENCY_SAFE_STOP',
];
