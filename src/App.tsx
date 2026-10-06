// ============================================================
// MAIN APPLICATION COMPONENT
// Industrial Conveyor Digital Control System – 3D Digital Simulator
// ============================================================

import { useEffect, useState } from 'react';
import { useSimStore } from './simulation/simulationEngine';
import Conveyor3DScene from './components/Conveyor3D';
import ControlPanel from './components/ControlPanel';
import PriorityLogicPanel from './components/PriorityLogic';
import FSMPanel from './components/FSMPanel';
import CounterPanel from './components/CounterPanel';
import ErrorDetection from './components/ErrorDetection';
import SignalMonitor from './components/SignalMonitor';
import TestScenariosPanel from './components/TestScenariosPanel';
import VivaDocsPanel from './components/VivaDocsPanel';
import LogViewer from './components/LogViewer';
import type { SimSpeed } from './simulation/types';

import {
  Play,
  Square,
  RotateCcw,
  AlertOctagon,
  PlusCircle,
  Activity,
  Cpu,
  Layers,
  Hash,
  ShieldAlert,
  Sliders,
  CheckCircle,
  BookOpen,
  Terminal,
  ChevronUp,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const {
    running,
    paused,
    testRunning,
    demoRunning,
    speed,
    fsmState,
    motorEnabled,
    conveyorRunning,
    emergency,
    fault,
    errorDetected,
    productCount,
    selectedEvent,
    clock,
    tick,
    start,
    stop,
    reset,
    addProduct,
    triggerEmergency,
    clearEmergency,
    setSpeed,
    startDemo,
    stopDemo,
  } = useSimStore();

  const [activeTab, setActiveTab] = useState<string>('SIMULATOR');
  const [logsExpanded, setLogsExpanded] = useState<boolean>(false);

  // Master Clock Ticker: Runs simulation tick when running and not paused/in automated test
  useEffect(() => {
    if (!running || paused || testRunning) return;

    const intervalTime = Math.max(20, Math.floor(100 / speed));
    const timer = setInterval(() => {
      tick();
    }, intervalTime);

    return () => clearInterval(timer);
  }, [running, paused, testRunning, speed, tick]);

  const fsmColor = {
    RESET: 'text-gray-400 border-gray-600',
    IDLE: 'text-blue-400 border-blue-500',
    READY: 'text-cyan-400 border-cyan-500',
    RUNNING: 'text-green-400 border-green-500',
    POSITION_CONTROL: 'text-amber-400 border-amber-500',
    FAULT_STOP: 'text-amber-500 border-amber-600',
    EMERGENCY_SAFE_STOP: 'text-red-500 border-red-600',
  }[fsmState] || 'text-gray-300 border-gray-600';

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* ── TOP HEADER / OPERATOR STATUS BAR ── */}
      <header className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-panel)] z-20 gap-2 select-none">
        {/* Title & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Cpu size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide uppercase text-[var(--text-primary)] flex items-center gap-2">
              INDUSTRIAL CONVEYOR DIGITAL CONTROL SYSTEM
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--blue-dim)] text-[var(--cyan)] border border-[var(--cyan)]/30">
                CEP 3D SIMULATOR
              </span>
            </h1>
            <p className="text-[10px] text-[var(--text-secondary)] font-mono">
              Synchronous FSM • Priority Logic • Edge Counter • Parity Verification
            </p>
          </div>
        </div>

        {/* Live Telemetry Badges */}
        <div className="flex items-center gap-2 font-mono text-xs">
          {/* FSM State Badge */}
          <div className={`px-2.5 py-1 rounded border bg-[var(--bg-tertiary)] flex items-center gap-1.5 ${fsmColor}`}>
            <span className={`w-2 h-2 rounded-full ${motorEnabled ? 'bg-green-400 animate-ping' : 'bg-gray-500'}`} />
            <span className="text-[10px] text-[var(--text-muted)]">FSM:</span>
            <span className="font-bold">{fsmState}</span>
          </div>

          {/* Clock Ticks */}
          <div className="px-2.5 py-1 rounded border border-[var(--border)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
            <span className="text-[10px] text-[var(--text-muted)]">CLK:</span>{' '}
            <span className="text-[var(--cyan)] font-bold">{String(clock).padStart(5, '0')}</span>
          </div>

          {/* Priority Event */}
          <div className="px-2.5 py-1 rounded border border-[var(--border)] bg-[var(--bg-tertiary)]">
            <span className="text-[10px] text-[var(--text-muted)]">EVENT:</span>{' '}
            <span className={`font-bold ${
              selectedEvent === 'EMERGENCY' ? 'text-[var(--red)]' :
              selectedEvent === 'FAULT' ? 'text-[var(--amber)]' :
              selectedEvent === 'NONE' ? 'text-[var(--text-muted)]' :
              'text-[var(--cyan)]'
            }`}>
              {selectedEvent}
            </span>
          </div>

          {/* Product Count */}
          <div className="px-2.5 py-1 rounded border border-[var(--border)] bg-[var(--bg-tertiary)]">
            <span className="text-[10px] text-[var(--text-muted)]">COUNT:</span>{' '}
            <span className="text-[var(--green)] font-bold">{productCount}</span>
          </div>
        </div>

        {/* Controls & Mode Buttons */}
        <div className="flex items-center gap-2">
          {/* Sim Speed Select */}
          <div className="flex items-center rounded border border-[var(--border)] bg-[var(--bg-tertiary)] p-0.5 text-[10px] font-mono">
            {([0.5, 1, 2, 5] as SimSpeed[]).map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-1.5 py-0.5 rounded transition-all ${
                  speed === s ? 'bg-[var(--cyan)] text-black font-bold' : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Auto Demo */}
          <button
            onClick={demoRunning ? stopDemo : startDemo}
            className={`btn text-xs py-1 px-2.5 ${demoRunning ? 'btn-amber' : 'btn-blue'}`}
            title="Auto Guided Demonstration"
          >
            <Sparkles size={13} />
            {demoRunning ? 'STOP DEMO' : 'AUTO DEMO'}
          </button>

          {/* Quick Start / Stop / Reset */}
          {!running || fsmState === 'IDLE' ? (
            <button
              onClick={start}
              disabled={emergency || fault}
              className="btn btn-green text-xs py-1 px-3"
            >
              <Play size={13} /> START
            </button>
          ) : (
            <button
              onClick={stop}
              className="btn btn-amber text-xs py-1 px-3"
            >
              <Square size={13} /> STOP
            </button>
          )}

          <button
            onClick={addProduct}
            disabled={!conveyorRunning}
            className="btn btn-blue text-xs py-1 px-2.5"
            title="Feed Product onto Belt"
          >
            <PlusCircle size={13} /> +PRODUCT
          </button>

          <button
            onClick={reset}
            className="btn text-xs py-1 px-2.5"
            title="Master Reset"
          >
            <RotateCcw size={13} /> RESET
          </button>

          {/* HARDWARE EMERGENCY STOP BUTTON */}
          <button
            onClick={emergency ? clearEmergency : triggerEmergency}
            className={`px-3 py-1 rounded font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
              emergency
                ? 'bg-amber-600 text-white animate-pulse'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30'
            }`}
          >
            <AlertOctagon size={14} />
            {emergency ? 'RESET E-STOP' : 'E-STOP'}
          </button>
        </div>
      </header>

      {/* ── NAVIGATION TABS BAR ── */}
      <nav className="flex items-center px-4 bg-[var(--bg-secondary)] border-b border-[var(--border)] overflow-x-auto select-none z-10">
        {[
          { id: 'SIMULATOR', label: '3D Digital Twin & Controls', icon: Sliders },
          { id: 'PRIORITY', label: '4-to-2 Priority Logic', icon: Cpu },
          { id: 'FSM', label: 'FSM State Controller', icon: Layers },
          { id: 'COUNTER', label: 'Edge Detector & Counter', icon: Hash },
          { id: 'PARITY', label: 'Parity Error Verification', icon: ShieldAlert },
          { id: 'SIGNALS', label: 'Oscilloscope Timing', icon: Activity },
          { id: 'SCENARIOS', label: 'Verification Harness', icon: CheckCircle },
          { id: 'VIVA', label: 'Viva Voce & CEP Docs', icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn flex items-center gap-2 py-2.5 px-3.5 border-b-2 text-xs font-semibold tracking-wide transition-all ${
                isActive
                  ? 'border-[var(--cyan)] text-[var(--cyan)] bg-[var(--bg-tertiary)]/50'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* TAB 1: 3D SIMULATOR & CONTROL PANEL */}
        {activeTab === 'SIMULATOR' && (
          <div className="w-full h-full flex flex-col lg:flex-row relative">
            {/* 3D Canvas Area */}
            <div className="flex-1 h-3/5 lg:h-full relative bg-[#07070c]">
              <Conveyor3DScene />
              
              {/* Overlay HUD indicators */}
              <div className="absolute top-4 left-4 pointer-events-none z-10 flex flex-col gap-1.5 font-mono text-[11px]">
                <div className="glass-panel px-3 py-1.5 text-xs flex items-center gap-2">
                  <span className={`led ${motorEnabled ? 'led-green' : 'led-off'}`} />
                  <span>MOTOR: {motorEnabled ? 'ACTIVE (DRIVING)' : 'INACTIVE'}</span>
                </div>
                <div className="glass-panel px-3 py-1.5 text-xs flex items-center gap-2">
                  <span className={`led ${emergency ? 'led-red' : fault ? 'led-amber' : 'led-green'}`} />
                  <span>SAFETY: {emergency ? 'EMERGENCY SHUTDOWN' : fault ? 'FAULT LOCKOUT' : 'NORMAL'}</span>
                </div>
              </div>

              <div className="absolute bottom-4 left-4 pointer-events-none z-10 glass-panel px-3 py-1 text-[10px] text-[var(--text-secondary)]">
                🖱️ Left Drag: Orbit | Right Drag: Pan | Scroll: Zoom
              </div>
            </div>

            {/* Operator Control Side Panel */}
            <div className="w-full lg:w-96 h-2/5 lg:h-full border-t lg:border-t-0 lg:border-l border-[var(--border)] bg-[var(--bg-secondary)] overflow-y-auto">
              <ControlPanel />
            </div>
          </div>
        )}

        {/* TAB 2: PRIORITY LOGIC */}
        {activeTab === 'PRIORITY' && <PriorityLogicPanel />}

        {/* TAB 3: FSM */}
        {activeTab === 'FSM' && <FSMPanel />}

        {/* TAB 4: COUNTER */}
        {activeTab === 'COUNTER' && <CounterPanel />}

        {/* TAB 5: PARITY */}
        {activeTab === 'PARITY' && <ErrorDetection />}

        {/* TAB 6: SIGNALS */}
        {activeTab === 'SIGNALS' && <SignalMonitor />}

        {/* TAB 7: TEST SCENARIOS */}
        {activeTab === 'SCENARIOS' && <TestScenariosPanel />}

        {/* TAB 8: VIVA & DOCUMENTATION */}
        {activeTab === 'VIVA' && <VivaDocsPanel />}
      </main>

      {/* ── BOTTOM DOCK: TELEMETRY & EVENT LOG DRAWER ── */}
      <div
        className={`border-t border-[var(--border)] bg-[var(--bg-panel)] transition-all duration-300 flex flex-col z-20 ${
          logsExpanded ? 'h-64' : 'h-8'
        }`}
      >
        <button
          onClick={() => setLogsExpanded(!logsExpanded)}
          className="w-full h-8 px-4 flex items-center justify-between text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors select-none"
        >
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-[var(--cyan)]" />
            <span className="font-bold text-[10px] uppercase tracking-wider">
              Diagnostic Terminal & Event Telemetry
            </span>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              (Live Bus Activity)
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            <span>{logsExpanded ? 'Minimize Terminal' : 'Open Live Terminal'}</span>
            {logsExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </div>
        </button>

        {logsExpanded && (
          <div className="flex-1 overflow-hidden">
            <LogViewer />
          </div>
        )}
      </div>
    </div>
  );
}
