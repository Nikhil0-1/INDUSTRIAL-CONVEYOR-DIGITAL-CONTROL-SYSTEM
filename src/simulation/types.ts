// ============================================================
// INDUSTRIAL CONVEYOR DIGITAL CONTROL SYSTEM - Type Definitions
// ============================================================

export type FSMState =
  | 'RESET'
  | 'IDLE'
  | 'READY'
  | 'RUNNING'
  | 'POSITION_CONTROL'
  | 'FAULT_STOP'
  | 'EMERGENCY_SAFE_STOP';

export type SelectedEvent =
  | 'EMERGENCY'
  | 'FAULT'
  | 'POSITION'
  | 'PRODUCT'
  | 'NONE';

export type SimSpeed = 0.5 | 1 | 2 | 5;

export type PerformanceMode = 'QUALITY' | 'BALANCED' | 'PERFORMANCE';

export type CameraView = 'ORBIT' | 'FRONT' | 'SIDE' | 'TOP' | 'ISOMETRIC';

export interface Product {
  id: string;
  position: number; // 0 to 1 along the conveyor
  detected: boolean;
  positionReached: boolean;
  counted: boolean;
}

export interface LogEntry {
  timestamp: number;
  clock: number;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'EMERGENCY' | 'STATE';
}

export interface SignalSample {
  clock: number;
  timestamp: number;
  CLOCK: number;
  PRODUCT: number;
  POSITION: number;
  FAULT: number;
  EMERGENCY: number;
  MOTOR_ENABLE: number;
  COUNTER_PULSE: number;
  ERROR: number;
  ALARM: number;
}

export interface ParityData {
  dataBits: number[];
  parityBit: number;
  transmitted: number[];
  received: number[];
  receivedParity: number;
  errorDetected: boolean;
  errorBitIndex: number | null;
}

export interface TestScenario {
  id: number;
  name: string;
  description: string;
  steps: TestStep[];
  expectedResult: string;
}

export interface TestStep {
  action: string;
  delay: number; // in ticks
}

export interface TestResult {
  scenarioId: number;
  passed: boolean;
  actualResult: string;
  details: string[];
}

export interface TruthTableRow {
  emergency: number;
  fault: number;
  position: number;
  product: number;
  selectedEvent: SelectedEvent;
  motorAction: string;
  fsmState: string;
}

export interface SimulationState {
  // Digital Inputs
  productSensor: boolean;
  positionSensor: boolean;
  fault: boolean;
  emergency: boolean;

  // Control
  startRequested: boolean;
  stopRequested: boolean;

  // Conveyor/Motor
  conveyorRunning: boolean;
  motorEnabled: boolean;

  // Priority
  selectedEvent: SelectedEvent;

  // FSM
  fsmState: FSMState;
  previousFsmState: FSMState;

  // Counter
  productCount: number;
  lastCountedProductId: string | null;
  counterPulse: boolean;

  // Error Detection
  errorDetected: boolean;
  parityData: ParityData;

  // Alarm
  alarmActive: boolean;

  // Clock
  clock: number;
  running: boolean; // simulation running (not paused)
  speed: SimSpeed;

  // Products
  products: Product[];
  nextProductId: number;

  // Logs
  logs: LogEntry[];

  // Signals
  signalHistory: SignalSample[];

  // Demo
  demoRunning: boolean;
  demoStep: number;

  // Viva Mode
  vivaMode: boolean;

  // Performance
  performanceMode: PerformanceMode;

  // Test Results
  testResults: Map<number, TestResult>;
}
