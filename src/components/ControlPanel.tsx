// ============================================================
// CONTROL PANEL - Main operator controls with LIVE System Health
// ============================================================

import { useSimStore } from '../simulation/simulationEngine';
import { formatCount, formatProductId } from '../simulation/counterLogic';

export default function ControlPanel() {
  const {
    fsmState, motorEnabled, conveyorRunning, emergency, fault,
    alarmActive, errorDetected, productCount, productSensor,
    positionSensor, selectedEvent, clock, running, paused, speed,
    demoRunning, products, autoFeed,
    motorHeat, motorOverheat, overloadDetected, beltJamDetected,
    systemHealth, lastFaultReason,
    start, stop, reset, addProduct, triggerEmergency, clearEmergency,
    injectFault, clearFault, injectError, setSpeed, togglePause, stepClock,
    startDemo, stopDemo, toggleAutoFeed, triggerCollision,
  } = useSimStore();

  const healthColor = {
    NOMINAL: 'text-emerald-400',
    WARNING: 'text-amber-400',
    CRITICAL: 'text-orange-500',
    FAULT: 'text-rose-500',
  }[systemHealth];

  const healthBg = {
    NOMINAL: 'bg-emerald-500/10 border-emerald-500/30',
    WARNING: 'bg-amber-500/10 border-amber-500/30',
    CRITICAL: 'bg-orange-500/10 border-orange-500/30',
    FAULT: 'bg-rose-500/10 border-rose-500/30',
  }[systemHealth];

  const healthPulse = systemHealth === 'FAULT' || systemHealth === 'CRITICAL' ? 'animate-pulse' : '';

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto p-3">
      {/* ══ SYSTEM HEALTH OVERVIEW ══ */}
      <div className={`glass-panel p-3 border ${healthBg} ${healthPulse}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="panel-header !mb-0">SYSTEM HEALTH</div>
          <span className={`text-xs font-black font-mono px-2.5 py-0.5 rounded-full border ${healthBg} ${healthColor}`}>
            {systemHealth}
          </span>
        </div>

        {/* Health Status Grid */}
        <div className="grid grid-cols-2 gap-2">
          <StatusItem
            label="SYSTEM"
            value={running ? (systemHealth === 'FAULT' ? 'FAULT' : 'ONLINE') : 'STANDBY'}
            color={running ? (systemHealth === 'FAULT' ? 'red' : systemHealth === 'WARNING' ? 'amber' : 'green') : 'muted'}
            blink={systemHealth === 'FAULT'}
          />
          <StatusItem
            label="CONVEYOR"
            value={conveyorRunning ? 'RUNNING' : (fault ? 'TRIPPED' : 'STOPPED')}
            color={conveyorRunning ? 'green' : (fault ? 'red' : 'muted')}
            blink={fault && conveyorRunning}
          />
          <StatusItem
            label="MOTOR"
            value={motorEnabled ? (motorOverheat ? 'OVERHEAT!' : 'ENABLED') : 'DISABLED'}
            color={motorEnabled ? (motorOverheat ? 'amber' : 'green') : 'muted'}
            blink={motorOverheat}
          />
          <StatusItem
            label="EMERGENCY"
            value={emergency ? 'E-STOP!' : 'SAFE'}
            color={emergency ? 'red' : 'green'}
            blink={emergency}
          />
          <StatusItem
            label="FAULT"
            value={fault ? 'DETECTED' : 'CLEAR'}
            color={fault ? 'amber' : 'green'}
            blink={fault}
          />
          <StatusItem
            label="ERROR"
            value={errorDetected ? 'PARITY!' : 'NONE'}
            color={errorDetected ? 'red' : 'green'}
            blink={errorDetected}
          />
          <StatusItem
            label="FSM"
            value={fsmState}
            color={fsmState === 'RUNNING' ? 'green' : fsmState === 'FAULT_STOP' ? 'red' : fsmState === 'EMERGENCY_SAFE_STOP' ? 'red' : 'blue'}
            blink={fsmState === 'EMERGENCY_SAFE_STOP'}
          />
          <StatusItem
            label="COUNT"
            value={formatCount(productCount)}
            color="blue"
          />
        </div>

        {/* Active Fault Banner */}
        {lastFaultReason && fault && (
          <div className="mt-2 p-2 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-[10px] font-mono leading-snug animate-pulse">
            ⚠ {lastFaultReason}
          </div>
        )}
      </div>

      {/* ══ MOTOR TEMPERATURE GAUGE ══ */}
      <div className="glass-panel p-3">
        <div className="panel-header">MOTOR TEMPERATURE</div>
        <div className="mt-2">
          {/* Temperature bar */}
          <div className="relative h-5 rounded-full bg-slate-800 overflow-hidden border border-slate-700/60">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                motorHeat > 80 ? 'bg-gradient-to-r from-orange-500 to-rose-600' :
                motorHeat > 60 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                motorHeat > 30 ? 'bg-gradient-to-r from-emerald-500 to-amber-500' :
                'bg-gradient-to-r from-cyan-500 to-emerald-500'
              }`}
              style={{ width: `${Math.max(2, motorHeat)}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-white drop-shadow-sm">
              {motorHeat.toFixed(1)}% {motorOverheat ? '🔥 OVERHEAT' : motorHeat > 60 ? '⚡ ELEVATED' : '✓ NORMAL'}
            </div>
          </div>
          {/* Temperature scale markers */}
          <div className="flex justify-between mt-1 text-[8px] font-mono text-slate-500">
            <span>0°</span>
            <span className="text-emerald-500/60">SAFE</span>
            <span className="text-amber-500/60">WARN</span>
            <span className="text-rose-500/60">CRIT</span>
            <span>100°</span>
          </div>
        </div>
      </div>

      {/* ══ BELT LOAD MONITOR ══ */}
      <div className="glass-panel p-3">
        <div className="panel-header">BELT LOAD MONITOR</div>
        <div className="mt-2">
          {/* Product load bar */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 w-16">LOAD:</span>
            <div className="flex-1 relative h-4 rounded bg-slate-800 overflow-hidden border border-slate-700/60">
              <div
                className={`h-full transition-all duration-300 ${
                  products.length > 8 ? 'bg-rose-600 animate-pulse' :
                  products.length > 6 ? 'bg-amber-500' :
                  'bg-cyan-500'
                }`}
                style={{ width: `${Math.min(100, (products.length / 10) * 100)}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-white drop-shadow-sm">
                {products.length} / 8 MAX
              </div>
            </div>
          </div>
          {/* Status indicators */}
          <div className="flex items-center gap-3 mt-2 text-[10px] font-mono">
            <span className={`flex items-center gap-1 ${overloadDetected ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`}>
              <span className={`w-2 h-2 rounded-full ${overloadDetected ? 'bg-rose-500 shadow-lg shadow-rose-500/40' : 'bg-slate-700'}`}/>
              OVERLOAD
            </span>
            <span className={`flex items-center gap-1 ${beltJamDetected ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`}>
              <span className={`w-2 h-2 rounded-full ${beltJamDetected ? 'bg-amber-500 shadow-lg shadow-amber-500/40' : 'bg-slate-700'}`}/>
              JAM
            </span>
            <span className={`flex items-center gap-1 ${alarmActive ? 'text-red-400 animate-pulse' : 'text-slate-500'}`}>
              <span className={`w-2 h-2 rounded-full ${alarmActive ? 'bg-red-500 shadow-lg shadow-red-500/40' : 'bg-slate-700'}`}/>
              ALARM
            </span>
          </div>
        </div>
      </div>

      {/* ══ DIGITAL INPUTS ══ */}
      <div className="glass-panel p-3">
        <div className="panel-header">DIGITAL INPUTS</div>
        <div className="flex flex-col gap-1.5 mt-2">
          <InputRow label="I₀ PRODUCT" value={productSensor} />
          <InputRow label="I₁ POSITION" value={positionSensor} />
          <InputRow label="I₂ FAULT" value={fault} isError />
          <InputRow label="I₃ EMERGENCY" value={emergency} isEmergency />
        </div>
      </div>

      {/* ══ PRIORITY RESULT ══ */}
      <div className="glass-panel p-3">
        <div className="panel-header">PRIORITY RESULT</div>
        <div className="mt-2 text-center">
          <div className="text-[10px] text-[var(--text-secondary)] uppercase">Selected Event</div>
          <div className={`font-mono text-lg font-bold mt-1 ${
            selectedEvent === 'EMERGENCY' ? 'text-[var(--red)] animate-pulse' :
            selectedEvent === 'FAULT' ? 'text-[var(--amber)] animate-pulse' :
            selectedEvent === 'NONE' ? 'text-[var(--text-muted)]' :
            'text-[var(--cyan)]'
          }`}>
            {selectedEvent}
          </div>
          {selectedEvent !== 'NONE' && (
            <div className="text-[9px] text-slate-400 font-mono mt-1">
              PRIORITY: {selectedEvent === 'EMERGENCY' ? 'HIGHEST (I₃)' : selectedEvent === 'FAULT' ? 'HIGH (I₂)' : selectedEvent === 'POSITION' ? 'MEDIUM (I₁)' : 'LOW (I₀)'}
            </div>
          )}
        </div>
      </div>

      {/* ══ CONVEYOR CONTROL ══ */}
      <div className="glass-panel p-3">
        <div className="panel-header">CONVEYOR CONTROL</div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button className="btn btn-green" onClick={start}
            disabled={fsmState !== 'IDLE' || emergency || fault}>
            ▶ START
          </button>
          <button className="btn btn-amber" onClick={stop}
            disabled={fsmState !== 'RUNNING' && fsmState !== 'POSITION_CONTROL'}>
            ■ STOP
          </button>
          <button className="btn btn-blue" onClick={reset}>
            ↺ RESET
          </button>
          <button className="btn btn-green" onClick={addProduct}
            disabled={!conveyorRunning}>
            + PRODUCT
          </button>
        </div>
        <div className="mt-2">
          <button
            onClick={toggleAutoFeed}
            className={`btn w-full justify-center text-[11px] py-1.5 ${
              autoFeed ? 'btn-blue border-cyan-500 text-cyan-300' : ''
            }`}
          >
            📦 CONTINUOUS FEED: {autoFeed ? 'ACTIVE [ON]' : 'OFF'}
          </button>
        </div>
      </div>

      {/* ══ FAULT / OVERLOAD & SAFETY TESTING ══ */}
      <div className="glass-panel p-3">
        <div className="panel-header">FAULT / OVERLOAD & SAFETY TESTING</div>
        <div className="flex flex-col gap-2 mt-2">
          <div className="grid grid-cols-2 gap-2">
            <button className="btn btn-amber" onClick={injectFault} disabled={fault}>
              ⚡ OVERLOAD
            </button>
            <button className="btn btn-green" onClick={clearFault} disabled={!fault}>
              ✓ CLR FAULT
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn btn-red" onClick={injectError} disabled={errorDetected}>
              🛡 PARITY ERROR
            </button>
            <button className="btn btn-blue" onClick={triggerCollision}>
              💥 TEST PRIORITY
            </button>
          </div>
          <div className="flex items-center justify-center gap-4 mt-1">
            <button
              className={`btn-emergency ${emergency ? 'active' : ''}`}
              onClick={emergency ? clearEmergency : triggerEmergency}
            >
              {emergency ? 'RESET' : 'E-STOP'}
            </button>
          </div>
        </div>
      </div>

      {/* ══ SIMULATION ══ */}
      <div className="glass-panel p-3">
        <div className="panel-header">SIMULATION</div>
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-secondary)] font-mono">
              CLOCK: {clock.toString().padStart(6, '0')}
            </span>
            <span className="text-[10px] text-[var(--text-secondary)] font-mono">
              SPEED: {speed}×
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {([0.5, 1, 2, 5] as const).map(s => (
              <button key={s} className={`btn text-[10px] ${speed === s ? 'btn-blue' : ''}`}
                onClick={() => setSpeed(s)}>
                {s}×
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button className="btn" onClick={togglePause}>
              {paused ? '▶ RESUME' : '⏸ PAUSE'}
            </button>
            <button className="btn" onClick={stepClock}>
              ⏭ STEP
            </button>
            <button className={`btn ${demoRunning ? 'btn-red' : 'btn-green'}`}
              onClick={demoRunning ? stopDemo : startDemo}>
              {demoRunning ? '■ STOP' : '⟳ DEMO'}
            </button>
          </div>
        </div>
      </div>

      {/* ══ MOTOR CONTROL DETAIL ══ */}
      <div className="glass-panel p-3">
        <div className="panel-header">MOTOR CONTROL</div>
        <div className="mt-2 font-mono text-[11px]">
          <div className="flex justify-between py-1 border-b border-[var(--border)]">
            <span className="text-[var(--text-secondary)]">MOTOR_ENABLE</span>
            <span className={motorEnabled ? 'text-[var(--green)]' : 'text-[var(--text-muted)]'}>
              {motorEnabled ? '1' : '0'}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-[var(--border)]">
            <span className="text-[var(--text-secondary)]">CONVEYOR</span>
            <span className={conveyorRunning ? 'text-[var(--green)]' : 'text-[var(--text-muted)]'}>
              {conveyorRunning ? 'RUNNING' : 'STOPPED'}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-[var(--border)]">
            <span className="text-[var(--text-secondary)]">TEMPERATURE</span>
            <span className={
              motorHeat > 80 ? 'text-rose-400' :
              motorHeat > 60 ? 'text-amber-400' :
              'text-emerald-400'
            }>
              {motorHeat.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-[var(--border)]">
            <span className="text-[var(--text-secondary)]">ALARM</span>
            <span className={alarmActive ? 'text-[var(--red)]' : 'text-[var(--text-muted)]'}>
              {alarmActive ? 'ACTIVE' : 'OFF'}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[var(--text-secondary)]">PRODUCTS</span>
            <span className={products.length > 6 ? 'text-amber-400' : 'text-[var(--blue)]'}>
              {products.length} on belt
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusItem({ label, value, color, blink = false }: { label: string; value: string; color: string; blink?: boolean }) {
  const colorClass =
    color === 'green' ? 'text-[var(--green)]' :
    color === 'red' ? 'text-[var(--red)]' :
    color === 'amber' ? 'text-[var(--amber)]' :
    color === 'blue' ? 'text-[var(--cyan)]' :
    'text-[var(--text-muted)]';

  const ledClass =
    color === 'green' ? 'led-green' :
    color === 'red' ? 'led-red' :
    color === 'amber' ? 'led-amber' :
    color === 'blue' ? 'led-blue' : 'led-off';

  return (
    <div className={`flex items-center gap-2 py-0.5 ${blink ? 'animate-pulse' : ''}`}>
      <span className={`led ${ledClass}`} />
      <div className="flex-1">
        <div className="text-[8px] text-[var(--text-muted)] uppercase tracking-wider">{label}</div>
        <div className={`font-mono text-[11px] font-semibold ${colorClass}`}>{value}</div>
      </div>
    </div>
  );
}

function InputRow({ label, value, isError = false, isEmergency = false }: { label: string; value: boolean; isError?: boolean; isEmergency?: boolean }) {
  const activeColor = isEmergency ? 'text-rose-400' : isError ? 'text-amber-400' : 'text-[var(--green)]';
  const activeLed = isEmergency ? 'led-red' : isError ? 'led-amber' : 'led-green';

  return (
    <div className={`flex items-center justify-between font-mono text-[12px] ${value && (isError || isEmergency) ? 'animate-pulse' : ''}`}>
      <span className="text-[var(--text-secondary)]">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`led ${value ? activeLed : 'led-off'}`} />
        <span className={value ? activeColor : 'text-[var(--text-muted)]'}>
          {value ? '1' : '0'}
        </span>
      </div>
    </div>
  );
}
