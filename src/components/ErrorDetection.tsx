// ============================================================
// ERROR DETECTION PANEL (Even Parity)
// ============================================================

import { useSimStore } from '../simulation/simulationEngine';

export default function ErrorDetectionPanel() {
  const { parityData, errorDetected, injectError, generateNewParityData } = useSimStore();

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      {/* Error Status */}
      <div className="glass-panel p-4">
        <div className="panel-header">ERROR DETECTION — EVEN PARITY</div>
        <div className={`mt-3 p-4 rounded-lg text-center border ${
          errorDetected
            ? 'bg-[var(--red-dim)] border-[var(--red)]'
            : 'bg-[rgba(0,230,118,0.05)] border-[var(--green-dim)]'
        }`}>
          <div className="text-[10px] uppercase tracking-wider mb-1"
            style={{ color: errorDetected ? 'var(--red)' : 'var(--green)' }}>
            Status
          </div>
          <div className={`font-mono text-xl font-bold ${
            errorDetected ? 'text-[var(--red)]' : 'text-[var(--green)]'
          }`}>
            {errorDetected ? '⚠ ERROR DETECTED' : '✓ NO ERROR'}
          </div>
        </div>
      </div>

      {/* Data Bits */}
      <div className="glass-panel p-4">
        <div className="panel-header">DATA BITS</div>
        <div className="mt-3">
          <div className="text-[9px] text-[var(--text-muted)] uppercase mb-2">Original Data</div>
          <div className="flex gap-1 justify-center mb-3">
            {parityData.dataBits.map((bit, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-[8px] text-[var(--text-muted)] mb-1">D{7 - i}</span>
                <div className={`w-9 h-9 flex items-center justify-center rounded font-mono font-bold text-sm border ${
                  bit ? 'bg-[var(--blue-dim)] border-[var(--blue)] text-[var(--blue)]'
                    : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-muted)]'
                }`}>
                  {bit}
                </div>
              </div>
            ))}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-[var(--amber)] mb-1">P</span>
              <div className={`w-9 h-9 flex items-center justify-center rounded font-mono font-bold text-sm border
                bg-[var(--amber-dim)] border-[var(--amber)] text-[var(--amber)]`}>
                {parityData.parityBit}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transmitted vs Received */}
      <div className="glass-panel p-4">
        <div className="panel-header">TRANSMISSION</div>
        <div className="mt-3">
          <div className="text-[9px] text-[var(--text-muted)] uppercase mb-2">Transmitted</div>
          <div className="flex gap-1 justify-center mb-4 font-mono text-[12px]">
            {parityData.transmitted.map((bit, i) => (
              <span key={i} className="w-7 h-7 flex items-center justify-center rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                {bit}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 my-2">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-[9px] text-[var(--text-muted)]">CHANNEL</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <div className="text-[9px] text-[var(--text-muted)] uppercase mb-2 mt-3">Received</div>
          <div className="flex gap-1 justify-center font-mono text-[12px]">
            {parityData.received.map((bit, i) => {
              const isFlipped = parityData.transmitted[i] !== bit;
              return (
                <span key={i} className={`w-7 h-7 flex items-center justify-center rounded border ${
                  isFlipped
                    ? 'bg-[var(--red-dim)] border-[var(--red)] text-[var(--red)] font-bold'
                    : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]'
                }`}>
                  {bit}
                </span>
              );
            })}
          </div>

          {parityData.errorBitIndex !== null && (
            <div className="text-center mt-2 text-[10px] text-[var(--red)]">
              ↑ Bit {parityData.errorBitIndex} flipped
            </div>
          )}
        </div>
      </div>

      {/* Parity Check Result */}
      <div className="glass-panel p-4">
        <div className="panel-header">PARITY CHECK</div>
        <div className="mt-3 font-mono text-[11px]">
          <div className="flex justify-between p-2 rounded bg-[var(--bg-secondary)] mb-1">
            <span className="text-[var(--text-secondary)]">Received 1s count</span>
            <span>{parityData.received.slice(0, 8).reduce((s, b) => s + b, 0)}</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-[var(--bg-secondary)] mb-1">
            <span className="text-[var(--text-secondary)]">Parity Bit</span>
            <span>{parityData.received[8]}</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-[var(--bg-secondary)] mb-1">
            <span className="text-[var(--text-secondary)]">Total 1s (incl. parity)</span>
            <span>{parityData.received.reduce((s, b) => s + b, 0)}</span>
          </div>
          <div className={`flex justify-between p-2 rounded border ${
            errorDetected ? 'bg-[var(--red-dim)] border-[var(--red)]' : 'bg-[rgba(0,230,118,0.05)] border-[var(--green-dim)]'
          }`}>
            <span className="text-[var(--text-secondary)]">Even Parity?</span>
            <span className={errorDetected ? 'text-[var(--red)] font-bold' : 'text-[var(--green)] font-bold'}>
              {errorDetected ? 'FAIL' : 'PASS'}
            </span>
          </div>
        </div>
      </div>

      {/* Error Flow */}
      <div className="glass-panel p-4">
        <div className="panel-header">ERROR DETECTION FLOW</div>
        <div className="mt-3 flex flex-col items-center gap-2 text-[11px] font-mono">
          <div className="arch-block w-full">DATA (8 bits)</div>
          <div className="arch-connector" />
          <div className="arch-block w-full">PARITY GENERATION (Even)</div>
          <div className="arch-connector" />
          <div className="arch-block w-full">TRANSMISSION (9 bits)</div>
          <div className="arch-connector" />
          <div className="arch-block w-full">PARITY CHECK</div>
          <div className="arch-connector" />
          <div className={`arch-block w-full ${errorDetected ? 'active' : ''}`}
            style={{ borderColor: errorDetected ? 'var(--red)' : undefined }}>
            {errorDetected ? '⚠ ERROR DETECTED' : '✓ NO ERROR'}
          </div>
          {errorDetected && (
            <>
              <div className="arch-connector" />
              <div className="arch-block w-full" style={{ borderColor: 'var(--amber)' }}>
                FAULT CONTROL → SAFE STATE
              </div>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="glass-panel p-4">
        <div className="panel-header">CONTROLS</div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button className="btn btn-red" onClick={injectError}>
            ⚡ INJECT ERROR
          </button>
          <button className="btn btn-blue" onClick={generateNewParityData}>
            ↺ NEW DATA
          </button>
        </div>
        <p className="text-[9px] text-[var(--text-muted)] mt-3 italic leading-relaxed">
          Note: Even parity detects selected single-bit error conditions but does not correct the corrupted bit. 
          This is a fundamental concept in digital error detection.
        </p>
      </div>
    </div>
  );
}
