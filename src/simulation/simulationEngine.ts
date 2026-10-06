// ============================================================
// CENTRAL SIMULATION ENGINE (Zustand Store)
// ============================================================
// Single authoritative source of all simulation state.
// All UI, 3D, digital logic, and logs read from this store.
// No conflicting duplicate states.
// ============================================================

import { create } from 'zustand';
import {
  FSMState, SelectedEvent, SimSpeed, PerformanceMode,
  Product, LogEntry, SignalSample, ParityData, TestResult,
} from './types';
import { evaluatePriority } from './priorityLogic';
import { evaluateFSM } from './stateMachine';
import { updateCounter, formatProductId } from './counterLogic';
import { generateParityData, injectError as injectParityError, generateNewData } from './errorLogic';
import { TEST_SCENARIOS } from './scenarios';

// ── Constants ──────────────────────────────────────────────
const PRODUCT_SENSOR_POSITION = 0.1;
const POSITION_SENSOR_POSITION = 0.75;
const CONVEYOR_SPEED_BASE = 0.008;
const MAX_SIGNAL_HISTORY = 200;
const MAX_LOGS = 500;
const POSITION_CONTROL_TICKS = 5;

// ── Store Interface ────────────────────────────────────────
interface SimulationStore {
  // ── Digital Inputs ──
  productSensor: boolean;
  positionSensor: boolean;
  fault: boolean;
  emergency: boolean;
  startRequested: boolean;
  stopRequested: boolean;

  // ── Conveyor/Motor ──
  conveyorRunning: boolean;
  motorEnabled: boolean;

  // ── Priority ──
  selectedEvent: SelectedEvent;
  priorityInputs: [number, number, number, number];

  // ── FSM ──
  fsmState: FSMState;
  previousFsmState: FSMState;
  positionControlTimer: number;

  // ── Counter ──
  productCount: number;
  lastCountedProductId: string | null;
  counterPulse: boolean;
  previousProductSensor: boolean;

  // ── Error Detection ──
  errorDetected: boolean;
  parityData: ParityData;

  // ── Alarm ──
  alarmActive: boolean;

  // ── Clock ──
  clock: number;
  running: boolean;
  paused: boolean;
  speed: SimSpeed;

  // ── Products ──
  products: Product[];
  nextProductId: number;

  // ── Logs ──
  logs: LogEntry[];

  // ── Signal History ──
  signalHistory: SignalSample[];

  // ── Demo ──
  demoRunning: boolean;
  demoStep: number;
  demoTimer: ReturnType<typeof setTimeout> | null;
  demoTimers: ReturnType<typeof setTimeout>[];
  demoPhaseTitle: string;
  demoPhaseDesc: string;
  autoFeed: boolean;

  // ── Viva Mode ──
  vivaMode: boolean;

  // ── Performance ──
  performanceMode: PerformanceMode;

  // ── Test Results ──
  testResults: Record<number, TestResult>;
  testRunning: boolean;
  testTimer: ReturnType<typeof setTimeout> | null;

  // ── Active Tab ──
  activeTab: string;

  // ── Actions ──
  tick: () => void;
  start: () => void;
  stop: () => void;
  reset: () => void;
  addProduct: () => void;
  triggerEmergency: () => void;
  clearEmergency: () => void;
  injectFault: () => void;
  clearFault: () => void;
  injectError: () => void;
  generateNewParityData: () => void;
  setSpeed: (speed: SimSpeed) => void;
  togglePause: () => void;
  stepClock: () => void;
  toggleVivaMode: () => void;
  toggleAutoFeed: () => void;
  triggerCollision: () => void;
  setPerformanceMode: (mode: PerformanceMode) => void;
  setActiveTab: (tab: string) => void;
  clearLogs: () => void;
  resetCounter: () => void;
  runTest: (scenarioId: number) => void;
  stopTest: () => void;
  startDemo: () => void;
  stopDemo: () => void;
  addLog: (message: string, type: LogEntry['type']) => void;
  getVivaExplanation: () => string;
}

export const useSimStore = create<SimulationStore>((set, get) => ({
  // ── Initial State ──────────────────────────────────────
  productSensor: false,
  positionSensor: false,
  fault: false,
  emergency: false,
  startRequested: false,
  stopRequested: false,

  conveyorRunning: false,
  motorEnabled: false,

  selectedEvent: 'NONE',
  priorityInputs: [0, 0, 0, 0],

  fsmState: 'IDLE',
  previousFsmState: 'IDLE',
  positionControlTimer: 0,

  productCount: 0,
  lastCountedProductId: null,
  counterPulse: false,
  previousProductSensor: false,

  errorDetected: false,
  parityData: generateParityData(),

  alarmActive: false,

  clock: 0,
  running: false,
  paused: false,
  speed: 1,

  products: [],
  nextProductId: 1,

  logs: [],
  signalHistory: [],

  demoRunning: false,
  demoStep: 0,
  demoTimer: null,
  demoTimers: [],
  demoPhaseTitle: '',
  demoPhaseDesc: '',
  autoFeed: false,

  vivaMode: false,
  performanceMode: 'BALANCED',

  testResults: {},
  testRunning: false,
  testTimer: null,

  activeTab: 'SIMULATOR',

  // ── Core Simulation Tick ───────────────────────────────
  tick: () => {
    const state = get();
    if (state.paused && !state.running) return;

    const newClock = state.clock + 1;

    // ── 1. Update product positions ──
    let products = [...state.products];
    let productSensor = false;
    let positionSensor = false;
    let currentProductAtSensor: Product | null = null;

    if (state.motorEnabled && state.conveyorRunning) {
      products = products.map(p => ({
        ...p,
        position: p.position + CONVEYOR_SPEED_BASE * state.speed,
      })).filter(p => p.position <= 1.1); // Remove products that passed end

      // Auto-feed product if continuous feed mode is active
      if (state.autoFeed && newClock % 36 === 0) {
        setTimeout(() => get().addProduct(), 0);
      }
    }

    // ── 2. Check sensors ──
    for (const p of products) {
      if (Math.abs(p.position - PRODUCT_SENSOR_POSITION) < 0.03 && !p.detected) {
        productSensor = true;
        currentProductAtSensor = p;
      }
      if (Math.abs(p.position - POSITION_SENSOR_POSITION) < 0.03 && !p.positionReached) {
        positionSensor = true;
      }
    }

    // Mark products as detected/position-reached
    products = products.map(p => {
      let updated = { ...p };
      if (Math.abs(p.position - PRODUCT_SENSOR_POSITION) < 0.03 && !p.detected) {
        updated.detected = true;
      }
      if (Math.abs(p.position - POSITION_SENSOR_POSITION) < 0.03 && !p.positionReached) {
        updated.positionReached = true;
      }
      return updated;
    });

    // ── 3. Priority Logic ──
    const priorityResult = evaluatePriority({
      emergency: state.emergency,
      fault: state.fault,
      position: positionSensor,
      product: productSensor,
    });

    // ── 4. Counter Logic (edge detection) ──
    const counterResult = updateCounter(
      state.productCount,
      state.lastCountedProductId,
      state.previousProductSensor,
      productSensor,
      currentProductAtSensor ? formatProductId(parseInt(currentProductAtSensor.id.replace('P', ''))) : null,
    );

    // ── 5. Position control timer ──
    let positionControlTimer = state.positionControlTimer;
    let positionHandled = false;
    if (state.fsmState === 'POSITION_CONTROL') {
      positionControlTimer++;
      if (positionControlTimer >= POSITION_CONTROL_TICKS) {
        positionHandled = true;
        positionControlTimer = 0;
      }
    } else {
      positionControlTimer = 0;
    }

    // ── 6. FSM ──
    const fsmResult = evaluateFSM(
      state.fsmState,
      priorityResult.selectedEvent,
      state.startRequested,
      state.stopRequested,
      false, // faultCleared is handled via clearFault action
      false, // emergencyCleared is handled via clearEmergency/reset
      positionHandled,
    );

    const motorEnabled = fsmResult.motorEnabled;
    const conveyorRunning = motorEnabled;
    const alarmActive = fsmResult.alarmActive || state.errorDetected;

    // ── 7. Logging ──
    const newLogs: LogEntry[] = [];

    if (fsmResult.transition && fsmResult.nextState !== state.fsmState) {
      newLogs.push({
        timestamp: Date.now(),
        clock: newClock,
        message: `FSM: ${state.fsmState} → ${fsmResult.nextState} [${fsmResult.transition.condition}]`,
        type: 'STATE',
      });
    }

    if (productSensor && !state.productSensor) {
      const pId = currentProductAtSensor ? currentProductAtSensor.id : '?';
      newLogs.push({
        timestamp: Date.now(), clock: newClock,
        message: `PRODUCT SENSOR ACTIVE — ${pId} detected`, type: 'INFO',
      });
    }

    if (positionSensor && !state.positionSensor) {
      newLogs.push({
        timestamp: Date.now(), clock: newClock,
        message: 'POSITION SENSOR ACTIVE', type: 'INFO',
      });
    }

    if (counterResult.pulse) {
      newLogs.push({
        timestamp: Date.now(), clock: newClock,
        message: `COUNTER = ${counterResult.count} (${counterResult.lastProductId})`, type: 'INFO',
      });
    }

    if (motorEnabled !== state.motorEnabled) {
      newLogs.push({
        timestamp: Date.now(), clock: newClock,
        message: `MOTOR → ${motorEnabled ? 'ENABLED' : 'DISABLED'}`, type: motorEnabled ? 'INFO' : 'WARNING',
      });
    }

    // ── 8. Signal sample ──
    const signalSample: SignalSample = {
      clock: newClock,
      timestamp: Date.now(),
      CLOCK: newClock % 2,
      PRODUCT: productSensor ? 1 : 0,
      POSITION: positionSensor ? 1 : 0,
      FAULT: state.fault ? 1 : 0,
      EMERGENCY: state.emergency ? 1 : 0,
      MOTOR_ENABLE: motorEnabled ? 1 : 0,
      COUNTER_PULSE: counterResult.pulse ? 1 : 0,
      ERROR: state.errorDetected ? 1 : 0,
      ALARM: alarmActive ? 1 : 0,
    };

    const signalHistory = [...state.signalHistory, signalSample].slice(-MAX_SIGNAL_HISTORY);
    const logs = [...state.logs, ...newLogs].slice(-MAX_LOGS);

    // ── 9. Apply state ──
    set({
      clock: newClock,
      products,
      productSensor,
      positionSensor,
      selectedEvent: priorityResult.selectedEvent,
      priorityInputs: priorityResult.inputs,
      previousFsmState: state.fsmState,
      fsmState: fsmResult.nextState,
      motorEnabled,
      conveyorRunning,
      alarmActive,
      productCount: counterResult.count,
      lastCountedProductId: counterResult.lastProductId,
      counterPulse: counterResult.pulse,
      previousProductSensor: productSensor,
      positionControlTimer,
      signalHistory,
      logs,
      startRequested: false,
      stopRequested: false,
    });
  },

  // ── Control Actions ────────────────────────────────────
  start: () => {
    const state = get();
    if (state.emergency || state.fault) return;
    if (state.fsmState === 'IDLE' || state.fsmState === 'RESET') {
      set({ startRequested: true, running: true, paused: false });
      get().addLog('START COMMAND', 'INFO');
    }
  },

  stop: () => {
    const state = get();
    if (state.fsmState === 'RUNNING' || state.fsmState === 'POSITION_CONTROL' || state.fsmState === 'READY') {
      set({ stopRequested: true });
      get().addLog('STOP COMMAND', 'INFO');
    }
  },

  reset: () => {
    const state = get();
    // Stop demo/test if running
    if (state.demoTimer) clearTimeout(state.demoTimer);
    state.demoTimers.forEach(t => clearTimeout(t));
    if (state.testTimer) clearTimeout(state.testTimer);

    set({
      productSensor: false,
      positionSensor: false,
      fault: false,
      emergency: false,
      startRequested: false,
      stopRequested: false,
      conveyorRunning: false,
      motorEnabled: false,
      selectedEvent: 'NONE',
      priorityInputs: [0, 0, 0, 0],
      fsmState: 'IDLE',
      previousFsmState: 'IDLE',
      positionControlTimer: 0,
      productCount: 0,
      lastCountedProductId: null,
      counterPulse: false,
      previousProductSensor: false,
      errorDetected: false,
      parityData: generateParityData(),
      alarmActive: false,
      clock: 0,
      running: false,
      paused: false,
      products: [],
      nextProductId: 1,
      logs: [],
      signalHistory: [],
      demoRunning: false,
      demoStep: 0,
      demoTimer: null,
      demoTimers: [],
      demoPhaseTitle: '',
      demoPhaseDesc: '',
      autoFeed: false,
      testRunning: false,
      testTimer: null,
    });
    // Add a log after reset
    setTimeout(() => get().addLog('SYSTEM RESET COMPLETE', 'INFO'), 10);
  },

  addProduct: () => {
    const state = get();
    if (!state.conveyorRunning && state.fsmState !== 'RUNNING' && state.fsmState !== 'READY') return;
    const id = formatProductId(state.nextProductId);
    const newProduct: Product = {
      id,
      position: 0,
      detected: false,
      positionReached: false,
      counted: false,
    };
    set({
      products: [...state.products, newProduct],
      nextProductId: state.nextProductId + 1,
    });
    get().addLog(`PRODUCT ${id} PLACED ON CONVEYOR`, 'INFO');
  },

  triggerEmergency: () => {
    set({ emergency: true });
    get().addLog('⚠ EMERGENCY ACTIVATED', 'EMERGENCY');
  },

  clearEmergency: () => {
    set({ emergency: false, alarmActive: false, fsmState: 'IDLE' });
    get().addLog('EMERGENCY CLEARED', 'INFO');
  },

  injectFault: () => {
    set({ fault: true });
    get().addLog('FAULT INJECTED', 'ERROR');
  },

  clearFault: () => {
    const state = get();
    set({ fault: false });
    if (state.fsmState === 'FAULT_STOP') {
      set({ fsmState: 'IDLE', alarmActive: false, motorEnabled: false, conveyorRunning: false });
    }
    get().addLog('FAULT CLEARED', 'INFO');
  },

  injectError: () => {
    const state = get();
    const newParity = injectParityError(state.parityData);
    set({
      parityData: newParity,
      errorDetected: newParity.errorDetected,
      fault: true,
    });
    get().addLog(`PARITY ERROR INJECTED at bit ${newParity.errorBitIndex}`, 'ERROR');
    if (newParity.errorDetected) {
      get().addLog('ERROR DETECTED — Parity check failed', 'ERROR');
    }
  },

  generateNewParityData: () => {
    set({
      parityData: generateNewData(),
      errorDetected: false,
    });
    get().addLog('New data generated for parity check', 'INFO');
  },

  setSpeed: (speed: SimSpeed) => set({ speed }),

  togglePause: () => {
    const state = get();
    set({ paused: !state.paused });
    get().addLog(state.paused ? 'SIMULATION RESUMED' : 'SIMULATION PAUSED', 'INFO');
  },

  stepClock: () => {
    set({ paused: false });
    get().tick();
    set({ paused: true });
  },

  toggleVivaMode: () => set(s => ({ vivaMode: !s.vivaMode })),

  toggleAutoFeed: () => {
    const newVal = !get().autoFeed;
    set({ autoFeed: newVal });
    get().addLog(newVal ? 'CONTINUOUS AUTO-FEED ACTIVATED' : 'AUTO-FEED DISABLED', 'INFO');
  },

  triggerCollision: () => {
    set({
      fault: true,
      emergency: true,
      positionSensor: true,
      productSensor: true,
    });
    get().addLog('PRIORITY TEST: ALL 4 INPUTS SIMULTANEOUSLY ACTIVE (I3, I2, I1, I0)', 'WARNING');
  },

  setPerformanceMode: (mode: PerformanceMode) => set({ performanceMode: mode }),

  setActiveTab: (tab: string) => set({ activeTab: tab }),

  clearLogs: () => set({ logs: [] }),

  resetCounter: () => {
    set({ productCount: 0, lastCountedProductId: null });
    get().addLog('COUNTER RESET', 'INFO');
  },

  addLog: (message: string, type: LogEntry['type']) => {
    set(s => ({
      logs: [...s.logs, {
        timestamp: Date.now(),
        clock: s.clock,
        message,
        type,
      }].slice(-MAX_LOGS),
    }));
  },

  // ── Test Runner ────────────────────────────────────────
  runTest: (scenarioId: number) => {
    const scenario = TEST_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return;

    get().reset();
    setTimeout(() => {
      set({ testRunning: true, running: true });
      get().addLog(`TEST ${scenarioId}: ${scenario.name} — STARTED`, 'INFO');

      let tickCount = 0;
      const totalTicks = scenario.steps.reduce((max, s) => Math.max(max, s.delay), 0) + 20;

      const runStep = () => {
        const state = get();
        if (!state.testRunning) return;

        // Execute actions at their scheduled ticks
        for (const step of scenario.steps) {
          if (step.delay === tickCount) {
            switch (step.action) {
              case 'RESET': get().reset(); set({ testRunning: true, running: true }); break;
              case 'START': get().start(); break;
              case 'STOP': get().stop(); break;
              case 'ADD_PRODUCT': get().addProduct(); break;
              case 'INJECT_FAULT': get().injectFault(); break;
              case 'EMERGENCY': get().triggerEmergency(); break;
              case 'INJECT_ERROR': get().injectError(); break;
              case 'ACTIVATE_ALL':
                set({ fault: true, emergency: true });
                get().addProduct();
                get().addLog('ALL INPUTS ACTIVATED', 'WARNING');
                break;
            }
          }
        }

        get().tick();
        tickCount++;

        if (tickCount >= totalTicks) {
          // Evaluate test results
          const s = get();
          let passed = false;
          let actualResult = '';
          const details: string[] = [];

          switch (scenarioId) {
            case 1: // Normal product
              passed = s.productCount >= 1 && (s.fsmState === 'RUNNING' || s.fsmState === 'POSITION_CONTROL');
              actualResult = `Counter=${s.productCount}, FSM=${s.fsmState}`;
              details.push(`Product count: ${s.productCount}`, `FSM state: ${s.fsmState}`);
              break;
            case 2: // Position
              passed = s.productCount >= 1;
              actualResult = `Counter=${s.productCount}, FSM=${s.fsmState}`;
              details.push(`Products passed position sensor`);
              break;
            case 3: // Fault
              passed = s.fsmState === 'FAULT_STOP' && !s.motorEnabled && s.alarmActive;
              actualResult = `FSM=${s.fsmState}, Motor=${s.motorEnabled ? 'ON' : 'OFF'}, Alarm=${s.alarmActive}`;
              details.push(`FSM: ${s.fsmState}`, `Motor: ${s.motorEnabled}`, `Alarm: ${s.alarmActive}`);
              break;
            case 4: // Emergency
              passed = s.fsmState === 'EMERGENCY_SAFE_STOP' && !s.motorEnabled;
              actualResult = `FSM=${s.fsmState}, Motor=${s.motorEnabled ? 'ON' : 'OFF'}`;
              details.push(`FSM: ${s.fsmState}`, `Motor enabled: ${s.motorEnabled}`);
              break;
            case 5: // Priority
              passed = s.fsmState === 'EMERGENCY_SAFE_STOP' && s.selectedEvent === 'EMERGENCY';
              actualResult = `Selected=${s.selectedEvent}, FSM=${s.fsmState}`;
              details.push(`Selected event: ${s.selectedEvent}`, `FSM: ${s.fsmState}`);
              break;
            case 6: // Error
              passed = s.errorDetected && s.fault;
              actualResult = `Error=${s.errorDetected}, Fault=${s.fault}`;
              details.push(`Error detected: ${s.errorDetected}`, `Fault: ${s.fault}`);
              break;
          }

          set(st => ({
            testResults: {
              ...st.testResults,
              [scenarioId]: { scenarioId, passed, actualResult, details },
            },
            testRunning: false,
          }));

          get().addLog(`TEST ${scenarioId}: ${passed ? 'PASSED ✓' : 'FAILED ✗'} — ${actualResult}`, passed ? 'INFO' : 'ERROR');
          return;
        }

        const timer = setTimeout(runStep, 50 / get().speed);
        set({ testTimer: timer });
      };

      runStep();
    }, 100);
  },

  stopTest: () => {
    const state = get();
    if (state.testTimer) clearTimeout(state.testTimer);
    set({ testRunning: false, testTimer: null });
  },

  // ── Auto Guided Demonstration ─────────────────────────
  startDemo: () => {
    get().reset();
    setTimeout(() => {
      set({
        demoRunning: true,
        demoStep: 1,
        running: true,
        paused: false,
        demoPhaseTitle: 'PHASE 1: SYSTEM INITIALIZATION & CONVEYOR START',
        demoPhaseDesc: 'Resetting state registers, arming safety interlocks, and starting drive motor.',
      });
      get().addLog('AUTO DEMO STARTED — Comprehensive Industrial Simulation Demonstration', 'INFO');

      let timers: ReturnType<typeof setTimeout>[] = [];

      const schedule = (delay: number, fn: () => void) => {
        const t = setTimeout(() => {
          if (get().demoRunning) fn();
        }, delay);
        timers.push(t);
      };

      // Phase 1: Start conveyor
      schedule(1000, () => {
        get().start();
      });

      // Phase 2: Product 1 Entrance & Edge Count
      schedule(2500, () => {
        set({
          demoStep: 2,
          demoPhaseTitle: 'PHASE 2: PRODUCT INTAKE & OPTICAL EDGE DETECTION',
          demoPhaseDesc: 'Package enters conveyor. Optical sensor detects rising edge, debounces pulse, counter increments.',
        });
        get().addProduct();
      });

      // Phase 3: Continuous Flow (Product 2)
      schedule(6000, () => {
        set({
          demoStep: 3,
          demoPhaseTitle: 'PHASE 3: CONTINUOUS PACKAGE FLOW',
          demoPhaseDesc: 'Second package enters. Tracking physical product positions along the moving belt.',
        });
        get().addProduct();
      });

      // Phase 4: Position Station Arrival
      schedule(10000, () => {
        set({
          demoStep: 4,
          demoPhaseTitle: 'PHASE 4: POSITION SENSOR & SEQUENTIAL FSM',
          demoPhaseDesc: 'Package reaches position inspection station (75% mark). FSM transitions into POSITION_CONTROL.',
        });
      });

      // Phase 5: Motor Overload / Fault Trip
      schedule(13500, () => {
        set({
          demoStep: 5,
          demoPhaseTitle: 'PHASE 5: MOTOR OVERLOAD TRIP & SAFETY LOCKOUT',
          demoPhaseDesc: 'Thermal overload fault injected. Priority encoder routes I2, FSM transitions to FAULT_STOP, motor shuts down.',
        });
        get().injectFault();
      });

      // Phase 6: Fault Clearance & Motor Re-engagement
      schedule(17500, () => {
        set({
          demoStep: 6,
          demoPhaseTitle: 'PHASE 6: FAULT CLEARANCE & SYSTEM RECOVERY',
          demoPhaseDesc: 'Overload condition cleared by operator. Re-starting conveyor drive motor.',
        });
        get().clearFault();
        setTimeout(() => get().start(), 600);
      });

      // Phase 7: Hardware Emergency Stop (Top Priority Override)
      schedule(21500, () => {
        set({
          demoStep: 7,
          demoPhaseTitle: 'PHASE 7: HARDWARE EMERGENCY E-STOP OVERRIDE',
          demoPhaseDesc: 'E-STOP mushroom switch tripped! I3 takes absolute priority, forcing EMERGENCY_SAFE_STOP immediately.',
        });
        get().addProduct();
        setTimeout(() => get().triggerEmergency(), 1200);
      });

      // Phase 8: Emergency Reset & Parity Error Check
      schedule(26000, () => {
        set({
          demoStep: 8,
          demoPhaseTitle: 'PHASE 8: PARITY ERROR INJECTION ON BUS',
          demoPhaseDesc: 'E-STOP released. Single-bit corruption injected into transmitted digital word; syndrome checker trips.',
        });
        get().clearEmergency();
        setTimeout(() => {
          get().start();
          get().injectError();
        }, 800);
      });

      // Phase 9: Restoration to Nominal State
      schedule(30500, () => {
        set({
          demoStep: 9,
          demoPhaseTitle: 'PHASE 9: SYSTEM NOMINAL & VERIFIED',
          demoPhaseDesc: 'Parity error cleared, new data syndrome verified, conveyor returned to healthy running mode.',
        });
        get().clearFault();
        get().generateNewParityData();
        get().start();
      });

      // Completion
      schedule(34500, () => {
        set({
          demoRunning: false,
          demoStep: 0,
          demoPhaseTitle: '',
          demoPhaseDesc: '',
        });
        get().addLog('AUTO DEMO COMPLETE — All 9 industrial control phases demonstrated successfully', 'INFO');
      });

      set({ demoTimers: timers });
    }, 100);
  },

  stopDemo: () => {
    const { demoTimers } = get();
    demoTimers.forEach(t => clearTimeout(t));
    set({
      demoRunning: false,
      demoStep: 0,
      demoTimers: [],
      demoPhaseTitle: '',
      demoPhaseDesc: '',
    });
    get().addLog('AUTO DEMO STOPPED', 'INFO');
  },

  // ── Viva Explanation ───────────────────────────────────
  getVivaExplanation: () => {
    const s = get();
    const parts: string[] = [];

    if (s.emergency) {
      parts.push('Emergency input is ACTIVE. Because Emergency has the highest priority (I₃), the priority encoder selects Emergency.');
      parts.push('The FSM immediately transitions to EMERGENCY_SAFE_STOP state.');
      parts.push('Motor enable signal is forced to 0, stopping the conveyor immediately.');
      parts.push('The alarm is activated. System remains stopped until RESET.');
    } else if (s.fault) {
      parts.push('A Fault condition is detected. The priority encoder selects Fault (I₂) as the active event.');
      parts.push('The FSM transitions to FAULT_STOP state. The motor is disabled and alarm is activated.');
      parts.push('The system requires fault clearance and restart to resume operation.');
    } else if (s.fsmState === 'RUNNING') {
      parts.push('The system is in RUNNING state. The motor is enabled and conveyor belt is moving.');
      if (s.productSensor) {
        parts.push('The product sensor is ACTIVE — a product is being detected at the entry point.');
        parts.push('The counter uses rising-edge detection to count this product exactly once.');
      }
      if (s.positionSensor) {
        parts.push('The position sensor is ACTIVE — a product has reached the target position.');
        parts.push('The FSM will transition to POSITION_CONTROL to handle this event.');
      }
      if (!s.productSensor && !s.positionSensor) {
        parts.push('No sensor events active. Conveyor continues normal operation.');
        parts.push(`Products on conveyor: ${s.products.length}. Total counted: ${s.productCount}.`);
      }
    } else if (s.fsmState === 'POSITION_CONTROL') {
      parts.push('Position sensor has detected a product at the target location.');
      parts.push('The FSM is in POSITION_CONTROL state, processing the position event.');
      parts.push('After processing, the FSM will return to RUNNING state.');
    } else if (s.fsmState === 'IDLE') {
      parts.push('System is in IDLE state. Press START to begin conveyor operation.');
      parts.push('The FSM will transition: IDLE → READY → RUNNING.');
    } else if (s.fsmState === 'READY') {
      parts.push('System is in READY state. Motor is being initialized.');
      parts.push('The FSM will automatically transition to RUNNING on the next clock cycle.');
    }

    if (s.errorDetected) {
      parts.push('');
      parts.push('PARITY ERROR: An error has been detected in the data transmission.');
      parts.push('The even parity check has failed, indicating a single-bit error.');
      parts.push('Note: Parity can detect errors but cannot correct them.');
    }

    if (parts.length === 0) {
      parts.push(`System is in ${s.fsmState} state. Use the controls to interact with the simulation.`);
    }

    return parts.join(' ');
  },
}));
