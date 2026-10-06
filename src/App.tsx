// ============================================================
// MAIN APPLICATION COMPONENT
// Industrial Conveyor Digital Control System – SCADA / 3D Digital Twin
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
  Menu,
  X,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

const MODULES = [
  {
    id: 'SIMULATOR',
    title: '3D Digital Twin & Controls',
    category: 'Physics & Actuators',
    desc: 'Real-time 3D physical conveyor twin with optical sensors, 3-phase induction motor, and package flow.',
    icon: Sliders,
    color: 'from-cyan-500 to-blue-600',
    badgeColor: 'text-cyan-400 bg-cyan-950/80 border-cyan-500/30',
  },
  {
    id: 'PRIORITY',
    title: '4-to-2 Priority Logic',
    category: 'Combinational Logic',
    desc: 'Deterministic collision arbitration (Emergency > Fault > Position > Product) with truth tables & Boolean equations.',
    icon: Cpu,
    color: 'from-blue-500 to-indigo-600',
    badgeColor: 'text-blue-400 bg-blue-950/80 border-blue-500/30',
  },
  {
    id: 'FSM',
    title: 'FSM State Controller',
    category: 'Sequential Circuit',
    desc: 'Moore/Mealy state machine managing system operational phases with transition matrix and fail-safe lockouts.',
    icon: Layers,
    color: 'from-emerald-500 to-teal-600',
    badgeColor: 'text-emerald-400 bg-emerald-950/80 border-emerald-500/30',
  },
  {
    id: 'COUNTER',
    title: 'Edge Detector & Counter',
    category: 'Synchronous Counting',
    desc: 'Positive rising-edge detector pulse generator driving an 8-bit synchronous binary counter with 7-segment display.',
    icon: Hash,
    color: 'from-amber-500 to-orange-600',
    badgeColor: 'text-amber-400 bg-amber-950/80 border-amber-500/30',
  },
  {
    id: 'PARITY',
    title: 'Parity Error Verification',
    category: 'Fault Detection',
    desc: 'Even parity generator tree and syndrome receiver for single-bit transmission corruption injection and detection.',
    icon: ShieldAlert,
    color: 'from-purple-500 to-violet-600',
    badgeColor: 'text-purple-400 bg-purple-950/80 border-purple-500/30',
  },
  {
    id: 'SIGNALS',
    title: 'Oscilloscope Timing',
    category: 'Bus Telemetry',
    desc: 'Multichannel digital logic analyzer capturing real-time waveforms across all control signals and clock cycles.',
    icon: Activity,
    color: 'from-sky-500 to-cyan-600',
    badgeColor: 'text-sky-400 bg-sky-950/80 border-sky-500/30',
  },
  {
    id: 'SCENARIOS',
    title: 'Verification Harness',
    category: 'Automated Testing',
    desc: 'Deterministic automated test suite asserting state machine transitions and safety protocols with PASS/FAIL metrics.',
    icon: CheckCircle,
    color: 'from-green-500 to-emerald-600',
    badgeColor: 'text-green-400 bg-green-950/80 border-green-500/30',
  },
  {
    id: 'VIVA',
    title: 'Viva Voce & CEP Docs',
    category: 'Engineering Report',
    desc: 'Complete project documentation, dynamic live circuit analysis, circuit schematics, and examination Q&A.',
    icon: BookOpen,
    color: 'from-rose-500 to-pink-600',
    badgeColor: 'text-rose-400 bg-rose-950/80 border-rose-500/30',
  },
];

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
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [logsExpanded, setLogsExpanded] = useState<boolean>(false);

  // Master Clock Ticker
  useEffect(() => {
    if (!running || paused || testRunning) return;

    const intervalTime = Math.max(20, Math.floor(100 / speed));
    const timer = setInterval(() => {
      tick();
    }, intervalTime);

    return () => clearInterval(timer);
  }, [running, paused, testRunning, speed, tick]);

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentModule = MODULES.find(m => m.id === activeTab) || MODULES[0];

  const fsmColor = {
    RESET: 'text-gray-400 border-gray-600 bg-gray-900/60',
    IDLE: 'text-blue-400 border-blue-500/60 bg-blue-950/50',
    READY: 'text-cyan-400 border-cyan-500/60 bg-cyan-950/50',
    RUNNING: 'text-emerald-400 border-emerald-500/60 bg-emerald-950/50',
    POSITION_CONTROL: 'text-amber-400 border-amber-500/60 bg-amber-950/50',
    FAULT_STOP: 'text-amber-500 border-amber-600/70 bg-amber-950/60',
    EMERGENCY_SAFE_STOP: 'text-rose-400 border-rose-600/70 bg-rose-950/60',
  }[fsmState] || 'text-gray-300 border-gray-600';

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#060911] text-[var(--text-primary)] font-sans">
      {/* ── PROFESSIONAL SCADA PRIMARY HEADER ── */}
      <header className="h-14 px-3 sm:px-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md z-30 select-none">
        {/* Brand & Systems Menu Trigger */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Menu Section Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex items-center gap-2 py-1.5 px-2.5 sm:px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10 transition-all group"
            title="Open Control System Modules Menu"
          >
            <Menu size={16} className="text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold tracking-wide flex items-center gap-1.5">
              <span>SYSTEMS MENU</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/30">
                8
              </span>
            </span>
          </button>

          {/* Project Title & Active Module Pill */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0">
              <Cpu size={18} className="text-white" />
            </div>
            <div className="hidden md:block">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase text-white">
                  INDUSTRIAL CONVEYOR DCS
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-semibold">
                  CEP 3D SIMULATOR
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Digital Electronics Complex Engineering Architecture
              </p>
            </div>

            {/* Current Active Module Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">VIEW:</span>
              <span className="font-semibold text-cyan-400 flex items-center gap-1">
                <currentModule.icon size={12} />
                {currentModule.title}
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Telemetry & Safety Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* FSM State Badge */}
          <div className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 text-xs font-mono shadow-sm ${fsmColor}`}>
            <span className={`w-2 h-2 rounded-full ${motorEnabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span className="text-[10px] text-slate-400 hidden sm:inline">FSM:</span>
            <span className="font-bold text-[11px] sm:text-xs">{fsmState}</span>
          </div>

          {/* Clock Ticks */}
          <div className="px-2 py-1 rounded-md border border-slate-800 bg-slate-900/80 text-xs font-mono hidden md:flex items-center gap-1">
            <span className="text-[10px] text-slate-500">CLK:</span>
            <span className="text-cyan-400 font-bold">{String(clock).padStart(5, '0')}</span>
          </div>

          {/* Count Badge */}
          <div className="px-2 py-1 rounded-md border border-slate-800 bg-slate-900/80 text-xs font-mono flex items-center gap-1">
            <span className="text-[10px] text-slate-500 hidden sm:inline">COUNT:</span>
            <span className="text-emerald-400 font-bold">{productCount}</span>
          </div>

          {/* Hardware Mushroom Emergency Stop Button */}
          <button
            onClick={emergency ? clearEmergency : triggerEmergency}
            className={`px-3 py-1.5 rounded-md font-bold text-xs flex items-center gap-1.5 transition-all shadow-md flex-shrink-0 ${
              emergency
                ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
            }`}
          >
            <AlertOctagon size={14} />
            <span className="hidden xs:inline">{emergency ? 'RESET E-STOP' : 'E-STOP'}</span>
            <span className="xs:hidden">STOP</span>
          </button>
        </div>
      </header>

      {/* ── OPERATOR CONTROL & SPEED DOCK (ALWAYS NEAT & TOUCH-FRIENDLY) ── */}
      <div className="h-10 px-3 sm:px-5 bg-slate-900/70 border-b border-slate-800/80 flex items-center justify-between gap-3 overflow-x-auto select-none z-20">
        {/* Quick Nav Chips for Desktop */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold mr-1 hidden lg:inline">
            QUICK SWITCH:
          </span>
          {MODULES.slice(0, 4).map((mod) => (
            <button
              key={mod.id}
              onClick={() => setActiveTab(mod.id)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                activeTab === mod.id
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {mod.title.split('&')[0]}
            </button>
          ))}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="text-[11px] text-cyan-400 hover:underline font-mono px-1 flex items-center gap-0.5"
          >
            More (8) <ChevronRight size={12} />
          </button>
        </div>

        {/* Global Control Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Speed Selector */}
          <div className="flex items-center rounded border border-slate-700/80 bg-slate-950 p-0.5 text-[10px] font-mono">
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
            <Sparkles size={12} />
            <span className="hidden sm:inline">{demoRunning ? 'STOP DEMO' : 'AUTO DEMO'}</span>
            <span className="sm:hidden">DEMO</span>
          </button>

          {/* Start / Stop */}
          {!running || fsmState === 'IDLE' ? (
            <button
              onClick={start}
              disabled={emergency || fault}
              className="btn btn-green text-xs py-1 px-3"
            >
              <Play size={12} /> START
            </button>
          ) : (
            <button
              onClick={stop}
              className="btn btn-amber text-xs py-1 px-3"
            >
              <Square size={12} /> STOP
            </button>
          )}

          <button
            onClick={addProduct}
            disabled={!conveyorRunning}
            className="btn btn-blue text-xs py-1 px-2.5"
            title="Feed Product onto Belt"
          >
            <PlusCircle size={12} /> +PRODUCT
          </button>

          <button
            onClick={reset}
            className="btn text-xs py-1 px-2.5"
            title="Master Reset"
          >
            <RotateCcw size={12} /> RESET
          </button>
        </div>
      </div>

      {/* ── INTERACTIVE SYSTEMS MENU SECTION (SLIDE-OVER MODAL / DRAWER) ── */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex select-none">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Slide-out Menu Panel */}
          <div className="relative w-full max-w-xl bg-slate-900 border-r border-slate-700/80 shadow-2xl z-10 flex flex-col h-full overflow-hidden animate-in slide-in-from-left duration-200">
            {/* Menu Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Cpu size={18} className="text-cyan-400" />
                  <h2 className="text-sm font-bold tracking-wide uppercase text-white">
                    SYSTEM CONTROL MODULES MENU
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select an architectural digital electronics subsystem to inspect & control
                </p>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close Menu (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Menu Modules List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
              {MODULES.map((mod, idx) => {
                const Icon = mod.icon;
                const isActive = activeTab === mod.id;

                return (
                  <button
                    key={mod.id}
                    onClick={() => {
                      setActiveTab(mod.id);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 group ${
                      isActive
                        ? 'border-cyan-500/50 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950/50 hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Module Icon in Gradient Badge */}
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${mod.color} flex items-center justify-center text-white shadow-md flex-shrink-0 group-hover:scale-105 transition-transform`}
                    >
                      <Icon size={20} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                          MODULE 0{idx + 1} • {mod.category}
                        </span>
                        {isActive ? (
                          <span className="text-[10px] font-mono font-bold text-cyan-400 flex items-center gap-1 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                            ACTIVE NOW
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 group-hover:text-slate-300 flex items-center gap-0.5">
                            Open <ChevronRight size={12} />
                          </span>
                        )}
                      </div>

                      <h3
                        className={`text-sm font-bold tracking-wide ${
                          isActive ? 'text-cyan-300' : 'text-slate-200 group-hover:text-white'
                        }`}
                      >
                        {mod.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {mod.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Menu Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px]">8 Industrial Modules Active</span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="btn btn-blue text-xs py-1.5 px-3"
              >
                Close Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN WORKSPACE VIEWPORT ── */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* TAB 1: 3D DIGITAL TWIN & CONTROL PANEL */}
        {activeTab === 'SIMULATOR' && (
          <div className="w-full h-full flex flex-col lg:flex-row relative">
            {/* 3D Scene Viewport */}
            <div className="flex-1 h-3/5 lg:h-full relative bg-[#0b1120] overflow-hidden">
              <Conveyor3DScene />

              {/* Overlay HUD indicators (Compact & Non-colliding) */}
              <div className="absolute top-3 left-3 pointer-events-none z-10 flex flex-col gap-1.5 font-mono text-[11px]">
                <div className="glass-panel px-3 py-1 text-xs flex items-center gap-2 border border-slate-700/60 shadow-lg bg-slate-950/80">
                  <span className={`led ${motorEnabled ? 'led-green' : 'led-off'}`} />
                  <span className="font-semibold text-slate-200">
                    MOTOR: {motorEnabled ? 'ACTIVE (3-PHASE DRIVE)' : 'STOPPED'}
                  </span>
                </div>
                <div className="glass-panel px-3 py-1 text-xs flex items-center gap-2 border border-slate-700/60 shadow-lg bg-slate-950/80">
                  <span className={`led ${emergency ? 'led-red' : fault ? 'led-amber' : 'led-green'}`} />
                  <span className="font-semibold text-slate-200">
                    INTERLOCK: {emergency ? 'EMERGENCY SHUTDOWN' : fault ? 'FAULT TRIP' : 'HEALTHY'}
                  </span>
                </div>
              </div>

              <div className="absolute bottom-3 left-3 pointer-events-none z-10 glass-panel px-2.5 py-1 text-[10px] text-slate-400 border border-slate-700/50 bg-slate-950/80 hidden sm:block">
                🖱️ Left Drag: Orbit | Right Drag: Pan | Scroll: Zoom
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
            <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
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
