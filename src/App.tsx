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
    RESET: 'text-gray-400 border-gray-600 bg-gray-900/50',
    IDLE: 'text-blue-400 border-blue-500 bg-blue-950/40',
    READY: 'text-cyan-400 border-cyan-500 bg-cyan-950/40',
    RUNNING: 'text-emerald-400 border-emerald-500 bg-emerald-950/40',
    POSITION_CONTROL: 'text-amber-400 border-amber-500 bg-amber-950/40',
    FAULT_STOP: 'text-amber-500 border-amber-600 bg-amber-950/50',
    EMERGENCY_SAFE_STOP: 'text-rose-400 border-rose-600 bg-rose-950/50',
  }[fsmState] || 'text-gray-300 border-gray-600';

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#070b14] text-[var(--text-primary)]">
      {/* ── TOP HEADER (TITLE & REAL-TIME TELEMETRY) ── */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/95 z-20 gap-3 select-none">
        {/* Title & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Cpu size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold tracking-wide uppercase text-white flex items-center gap-2">
              INDUSTRIAL CONVEYOR DIGITAL CONTROL SYSTEM
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                CEP 3D SIMULATOR
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">
              Synchronous FSM • Priority Logic • Edge Counter • Parity Verification
            </p>
          </div>
        </div>

        {/* Live Telemetry Badges (Always Visible on Top Right) */}
        <div className="flex items-center gap-2 font-mono text-xs flex-shrink-0">
          {/* FSM State Badge */}
          <div className={`px-2.5 py-1 rounded border flex items-center gap-1.5 shadow-sm ${fsmColor}`}>
            <span className={`w-2 h-2 rounded-full ${motorEnabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span className="text-[10px] text-slate-400">FSM:</span>
            <span className="font-bold">{fsmState}</span>
          </div>

          {/* Clock Ticks */}
          <div className="px-2.5 py-1 rounded border border-slate-800 bg-slate-950/60 text-slate-300">
            <span className="text-[10px] text-slate-500">CLK:</span>{' '}
            <span className="text-cyan-400 font-bold">{String(clock).padStart(5, '0')}</span>
          </div>

          {/* Priority Event */}
          <div className="px-2.5 py-1 rounded border border-slate-800 bg-slate-950/60">
            <span className="text-[10px] text-slate-500">EVENT:</span>{' '}
            <span className={`font-bold ${
              selectedEvent === 'EMERGENCY' ? 'text-rose-400' :
              selectedEvent === 'FAULT' ? 'text-amber-400' :
              selectedEvent === 'NONE' ? 'text-slate-500' :
              'text-cyan-400'
            }`}>
              {selectedEvent}
            </span>
          </div>

          {/* Product Count */}
          <div className="px-2.5 py-1 rounded border border-slate-800 bg-slate-950/60">
            <span className="text-[10px] text-slate-500">COUNT:</span>{' '}
            <span className="text-emerald-400 font-bold">{productCount}</span>
          </div>
        </div>
      </header>

      {/* ── TOOLBAR & NAVIGATION ROW (TABS + OPERATOR QUICK CONTROLS) ── */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-950 border-b border-slate-800/80 gap-3 z-10 flex-wrap sm:flex-nowrap">
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto select-none py-0.5">
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
                className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon size={13} className={isActive ? 'text-cyan-400' : 'text-slate-500'} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Global Operator Quick Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Speed Selector */}
          <div className="flex items-center rounded border border-slate-700 bg-slate-900 p-0.5 text-[10px] font-mono">
            {([0.5, 1, 2, 5] as SimSpeed[]).map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-1.5 py-0.5 rounded transition-all ${
                  speed === s ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
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

          {/* Start / Stop */}
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
                ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
            }`}
          >
            <AlertOctagon size={14} />
            {emergency ? 'RESET E-STOP' : 'E-STOP'}
          </button>
        </div>
      </div>

      {/* ── MAIN VIEWPORT ── */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* TAB 1: 3D DIGITAL TWIN & CONTROL PANEL */}
        {activeTab === 'SIMULATOR' && (
          <div className="w-full h-full flex flex-col lg:flex-row relative">
            {/* 3D Scene Viewport */}
            <div className="flex-1 h-3/5 lg:h-full relative bg-[#0b1120] overflow-hidden">
              <Conveyor3DScene />
              
              {/* Overlay HUD indicators */}
              <div className="absolute top-3 left-3 pointer-events-none z-10 flex flex-col gap-1.5 font-mono text-[11px]">
                <div className="glass-panel px-3 py-1.5 text-xs flex items-center gap-2 border border-slate-700/60 shadow-lg">
                  <span className={`led ${motorEnabled ? 'led-green' : 'led-off'}`} />
                  <span className="font-semibold text-slate-200">
                    MOTOR: {motorEnabled ? 'ACTIVE (3-PHASE DRIVE)' : 'STOPPED'}
                  </span>
                </div>
                <div className="glass-panel px-3 py-1.5 text-xs flex items-center gap-2 border border-slate-700/60 shadow-lg">
                  <span className={`led ${emergency ? 'led-red' : fault ? 'led-amber' : 'led-green'}`} />
                  <span className="font-semibold text-slate-200">
                    SAFETY INTERLOCK: {emergency ? 'EMERGENCY SHUTDOWN' : fault ? 'FAULT TRIP' : 'HEALTHY'}
                  </span>
                </div>
              </div>

              <div className="absolute bottom-3 left-3 pointer-events-none z-10 glass-panel px-3 py-1 text-[10px] text-slate-400 border border-slate-700/50">
                🖱️ Left Drag: Orbit | Right Drag: Pan | Scroll: Zoom | Presets: Top-Right
              </div>
            </div>

            {/* Operator Control Side Panel */}
            <div className="w-full lg:w-96 h-2/5 lg:h-full border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/95 overflow-y-auto">
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
        className={`border-t border-slate-800 bg-slate-950 transition-all duration-300 flex flex-col z-20 ${
          logsExpanded ? 'h-64' : 'h-8'
        }`}
      >
        <button
          onClick={() => setLogsExpanded(!logsExpanded)}
          className="w-full h-8 px-4 flex items-center justify-between text-xs text-slate-400 hover:bg-slate-900 transition-colors select-none"
        >
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-cyan-400" />
            <span className="font-bold text-[10px] uppercase tracking-wider text-slate-300">
              Diagnostic Terminal & Event Telemetry
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              (Live Bus Activity Stream)
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
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
