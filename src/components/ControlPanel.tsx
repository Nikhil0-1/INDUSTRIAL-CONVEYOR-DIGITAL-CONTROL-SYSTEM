// ============================================================
// CONTROL PANEL - Main operator controls
// ============================================================

import { useSimStore } from '../simulation/simulationEngine';
import { formatCount, formatProductId } from '../simulation/counterLogic';

export default function ControlPanel() {
  const {
    fsmState, motorEnabled, conveyorRunning, emergency, fault,
    alarmActive, errorDetected, productCount, productSensor,
    positionSensor, selectedEvent, clock, running, paused, speed,
    demoRunning, products,
    start, stop, reset, addProduct, triggerEmergency, clearEmergency,
    injectFault, clearFault, setSpeed, togglePause, stepClock,
    startDemo, stopDemo,
  } = useSimStore();

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto p-3">
      {/* Status Panel */}
      <div className="glass-panel p-3">
        <div className="panel-header">SYSTEM STATUS</div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <StatusItem label="SYSTEM" value={running ? 'ONLINE' : 'STANDBY'} color={running ? 'green' : 'muted'} />
          <StatusItem label="CONVEYOR" value={conveyorRunning ? 'RUNNING' : 'STOPPED'} color={conveyorRunning ? 'green' : 'muted'} />
          <StatusItem label="MOTOR" value={motorEnabled ? 'ENABLED' : 'DISABLED'} color={motorEnabled ? 'green' : 'muted'} />
          <StatusItem label="EMERGENCY" value={emergency ? 'ACTIVE' : 'SAFE'} color={emergency ? 'red' : 'green'} />
          <StatusItem label="FAULT" value={fault ? 'DETECTED' : 'CLEAR'} color={fault ? 'amber' : 'green'} />
          <StatusItem label="ERROR" value={errorDetected ? 'DETECTED' : 'NONE'} color={errorDetected ? 'red' : 'green'} />
          <StatusItem label="FSM" value={fsmState} color="blue" />
          <StatusItem label="COUNT" value={formatCount(productCount)} color="blue" />
        </div>
      </div>

      {/* Digital Inputs */}
      <div className="glass-panel p-3">
        <div className="panel-header">DIGITAL INPUTS</div>
        <div className="flex flex-col gap-1.5 mt-2">
          <InputRow label="PRODUCT" value={productSensor} />
          <InputRow label="POSITION" value={positionSensor} />
          <InputRow label="FAULT" value={fault} />
          <InputRow label="EMERGENCY" value={emergency} />
        </div>
      </div>

      {/* Priority Result */}
      <div className="glass-panel p-3">
        <div className="panel-header">PRIORITY RESULT</div>
        <div className="mt-2 text-center">
          <div className="text-[10px] text-[var(--text-secondary)] uppercase">Selected Event</div>
          <div className={`font-mono text-lg font-bold mt-1 ${
            selectedEvent === 'EMERGENCY' ? 'text-[var(--red)]' :
            selectedEvent === 'FAULT' ? 'text-[var(--amber)]' :
            selectedEvent === 'NONE' ? 'text-[var(--text-muted)]' :
            'text-[var(--cyan)]'
          }`}>
            {selectedEvent}
          </div>
        </div>
      </div>

      {/* Main Controls */}
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
      </div>

      {/* Fault / Emergency */}
      <div className="glass-panel p-3">
        <div className="panel-header">FAULT / EMERGENCY</div>
        <div className="flex flex-col gap-2 mt-2">
          <div className="grid grid-cols-2 gap-2">
            <button className="btn btn-amber" onClick={injectFault} disabled={fault}>
              ⚡ FAULT
            </button>
            <button className="btn btn-green" onClick={clearFault} disabled={!fault}>
              ✓ CLR FAULT
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

      {/* Simulation Control */}
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

      {/* Motor/Conveyor Detail */}
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
            <span className="text-[var(--text-secondary)]">ALARM</span>
            <span className={alarmActive ? 'text-[var(--red)]' : 'text-[var(--text-muted)]'}>
              {alarmActive ? 'ACTIVE' : 'OFF'}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[var(--text-secondary)]">PRODUCTS</span>
            <span className="text-[var(--blue)]">{products.length} on belt</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusItem({ label, value, color }: { label: string; value: string; color: string }) {
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
    <div className="flex items-center gap-2 py-0.5">
      <span className={`led ${ledClass}`} />
      <div className="flex-1">
        <div className="text-[8px] text-[var(--text-muted)] uppercase tracking-wider">{label}</div>
        <div className={`font-mono text-[11px] font-semibold ${colorClass}`}>{value}</div>
      </div>
    </div>
  );
}

function InputRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between font-mono text-[12px]">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`led ${value ? 'led-green' : 'led-off'}`} />
        <span className={value ? 'text-[var(--green)]' : 'text-[var(--text-muted)]'}>
          {value ? '1' : '0'}
        </span>
      </div>
    </div>
  );
}
