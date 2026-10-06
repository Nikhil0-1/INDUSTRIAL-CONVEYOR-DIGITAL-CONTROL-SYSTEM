// ============================================================
// DIGITAL SIGNAL MONITOR (Oscilloscope-style)
// ============================================================

import { useSimStore } from '../simulation/simulationEngine';
import { useMemo } from 'react';

const SIGNAL_NAMES = [
  'CLOCK', 'PRODUCT', 'POSITION', 'FAULT', 'EMERGENCY',
  'MOTOR_ENABLE', 'COUNTER_PULSE', 'ERROR', 'ALARM',
] as const;

const SIGNAL_COLORS: Record<string, string> = {
  CLOCK: '#78909c',
  PRODUCT: '#448aff',
  POSITION: '#00e5ff',
  FAULT: '#ffab00',
  EMERGENCY: '#ff1744',
  MOTOR_ENABLE: '#00e676',
  COUNTER_PULSE: '#7c4dff',
  ERROR: '#ff5252',
  ALARM: '#ff6e40',
};

export default function SignalMonitor() {
  const signalHistory = useSimStore(s => s.signalHistory);

  const visibleSignals = signalHistory.slice(-80);
  const width = 600;
  const signalHeight = 28;
  const totalHeight = SIGNAL_NAMES.length * signalHeight + 20;

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      <div className="glass-panel p-4">
        <div className="panel-header">DIGITAL SIGNAL MONITOR</div>
        <p className="text-[10px] text-[var(--text-muted)] mt-1 italic">
          Real-time oscilloscope view — signals driven by actual simulation state
        </p>
        <div className="mt-3 overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${totalHeight}`}
            className="w-full min-w-[500px]"
            style={{ minHeight: totalHeight * 0.8 }}
          >
            {/* Grid lines */}
            {Array.from({ length: 80 }, (_, i) => (
              <line
                key={i}
                x1={100 + i * 6.25} y1={0}
                x2={100 + i * 6.25} y2={totalHeight}
                stroke="#1a1a24"
                strokeWidth={i % 10 === 0 ? 0.5 : 0.2}
              />
            ))}

            {SIGNAL_NAMES.map((name, idx) => {
              const y = idx * signalHeight + 14;
              const color = SIGNAL_COLORS[name];

              return (
                <g key={name}>
                  {/* Label */}
                  <text x={2} y={y + 4} fill={color} fontSize="8" fontFamily="monospace" fontWeight="600">
                    {name}
                  </text>

                  {/* Horizontal baseline */}
                  <line x1={100} y1={y + signalHeight - 6} x2={width} y2={y + signalHeight - 6}
                    stroke="#1a1a24" strokeWidth={0.3} />

                  {/* Signal waveform */}
                  {visibleSignals.length > 1 && (
                    <polyline
                      points={visibleSignals.map((sample, i) => {
                        const x = 100 + i * 6.25;
                        const val = sample[name as keyof typeof sample] as number;
                        const sY = val ? y + 2 : y + signalHeight - 6;
                        // Create step waveform
                        if (i === 0) return `${x},${sY}`;
                        const prevVal = visibleSignals[i - 1][name as keyof typeof visibleSignals[0]] as number;
                        const prevY = prevVal ? y + 2 : y + signalHeight - 6;
                        return `${x},${prevY} ${x},${sY}`;
                      }).join(' ')}
                      fill="none"
                      stroke={color}
                      strokeWidth={1.5}
                      strokeLinejoin="miter"
                    />
                  )}

                  {/* Current value */}
                  {visibleSignals.length > 0 && (
                    <text
                      x={width - 5}
                      y={y + 10}
                      fill={color}
                      fontSize="7"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="end"
                    >
                      {(visibleSignals[visibleSignals.length - 1][name as keyof typeof visibleSignals[0]] as number)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Time marker */}
            {visibleSignals.length > 0 && (
              <text x={width / 2} y={totalHeight - 2} fill="#555570" fontSize="6" textAnchor="middle" fontFamily="monospace">
                Clock: {visibleSignals[visibleSignals.length - 1].clock}
              </text>
            )}
          </svg>
        </div>
      </div>

      {/* Signal Legend */}
      <div className="glass-panel p-4">
        <div className="panel-header">SIGNAL REFERENCE</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
          {SIGNAL_NAMES.map(name => (
            <div key={name} className="flex items-center gap-2 text-[10px] font-mono">
              <div className="w-4 h-1 rounded" style={{ background: SIGNAL_COLORS[name] }} />
              <span className="text-[var(--text-secondary)]">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
