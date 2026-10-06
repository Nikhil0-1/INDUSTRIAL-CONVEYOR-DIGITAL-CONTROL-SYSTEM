// ============================================================
// FSM VISUALIZATION
// ============================================================

import { useSimStore } from '../simulation/simulationEngine';
import { ALL_STATES, FSM_TRANSITIONS, getTransitionsFrom } from '../simulation/stateMachine';
import type { FSMState } from '../simulation/types';
import { useState } from 'react';

export default function FSMPanel() {
  const { fsmState, previousFsmState } = useSimStore();
  const [selectedState, setSelectedState] = useState<FSMState | null>(null);

  const stateColors: Record<FSMState, string> = {
    'RESET': 'var(--text-muted)',
    'IDLE': 'var(--blue)',
    'READY': 'var(--cyan)',
    'RUNNING': 'var(--green)',
    'POSITION_CONTROL': 'var(--amber)',
    'FAULT_STOP': 'var(--amber)',
    'EMERGENCY_SAFE_STOP': 'var(--red)',
  };

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      {/* Current State Display */}
      <div className="glass-panel p-4">
        <div className="panel-header">CURRENT FSM STATE</div>
        <div className="mt-3 text-center">
          <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Previous</div>
          <div className="font-mono text-sm text-[var(--text-secondary)]">{previousFsmState}</div>
          <div className="text-[var(--text-muted)] my-1">↓</div>
          <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Current</div>
          <div className="font-mono text-2xl font-bold mt-1" style={{ color: stateColors[fsmState] }}>
            {fsmState}
          </div>
          <div className="text-[9px] text-[var(--text-muted)] mt-2 uppercase tracking-wider">Next Possible</div>
          <div className="flex flex-wrap justify-center gap-1 mt-1">
            {getTransitionsFrom(fsmState).map((t, i) => (
              <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                {t.to}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* State Diagram */}
      <div className="glass-panel p-4">
        <div className="panel-header">STATE DIAGRAM</div>
        <div className="mt-3">
          <FSMDiagram currentState={fsmState} previousState={previousFsmState} onSelectState={setSelectedState} />
        </div>
      </div>

      {/* Transition Table */}
      <div className="glass-panel p-4">
        <div className="panel-header">TRANSITION TABLE</div>
        <div className="mt-3 overflow-x-auto">
          <table className="truth-table">
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Condition</th>
              </tr>
            </thead>
            <tbody>
              {FSM_TRANSITIONS.map((t, i) => {
                const isActive = t.from === previousFsmState && t.to === fsmState;
                return (
                  <tr key={i} className={isActive ? 'highlight' : ''}>
                    <td className="text-[10px]" style={{ color: stateColors[t.from] }}>{t.from}</td>
                    <td className="text-[10px]" style={{ color: stateColors[t.to] }}>{t.to}</td>
                    <td className="text-[10px]">{t.condition}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* State Details */}
      {selectedState && (
        <div className="glass-panel p-4">
          <div className="panel-header">STATE: {selectedState}</div>
          <div className="mt-2 text-[11px] text-[var(--text-secondary)]">
            <div className="mb-2">
              <span className="text-[var(--text-muted)] text-[9px] uppercase">Transitions Out:</span>
              {getTransitionsFrom(selectedState).map((t, i) => (
                <div key={i} className="ml-2 mt-1 font-mono text-[10px]">
                  → {t.to} <span className="text-[var(--text-muted)]">({t.condition})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FSMDiagram({ currentState, previousState, onSelectState }: {
  currentState: FSMState;
  previousState: FSMState;
  onSelectState: (s: FSMState) => void;
}) {
  const statePositions: Record<FSMState, { x: number; y: number }> = {
    'RESET': { x: 50, y: 20 },
    'IDLE': { x: 50, y: 70 },
    'READY': { x: 50, y: 120 },
    'RUNNING': { x: 50, y: 170 },
    'POSITION_CONTROL': { x: 85, y: 220 },
    'FAULT_STOP': { x: 15, y: 220 },
    'EMERGENCY_SAFE_STOP': { x: 50, y: 280 },
  };

  const transitions: { from: FSMState; to: FSMState; label: string }[] = [
    { from: 'RESET', to: 'IDLE', label: 'init' },
    { from: 'IDLE', to: 'READY', label: 'START' },
    { from: 'READY', to: 'RUNNING', label: 'Motor OK' },
    { from: 'RUNNING', to: 'POSITION_CONTROL', label: 'POS=1' },
    { from: 'POSITION_CONTROL', to: 'RUNNING', label: 'done' },
    { from: 'RUNNING', to: 'FAULT_STOP', label: 'FAULT' },
    { from: 'FAULT_STOP', to: 'IDLE', label: 'CLEAR' },
    { from: 'EMERGENCY_SAFE_STOP', to: 'IDLE', label: 'RESET' },
  ];

  const stateColors: Record<FSMState, string> = {
    'RESET': '#555570',
    'IDLE': '#448aff',
    'READY': '#00e5ff',
    'RUNNING': '#00e676',
    'POSITION_CONTROL': '#ffab00',
    'FAULT_STOP': '#ffab00',
    'EMERGENCY_SAFE_STOP': '#ff1744',
  };

  return (
    <svg viewBox="0 0 100 310" className="w-full max-w-[400px] mx-auto" style={{ minHeight: 350 }}>
      {/* Arrows */}
      {transitions.map((t, i) => {
        const from = statePositions[t.from];
        const to = statePositions[t.to];
        const isActive = previousState === t.from && currentState === t.to;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const offset = t.from === 'POSITION_CONTROL' && t.to === 'RUNNING' ? 3 : 0;
        return (
          <g key={i}>
            <line
              x1={from.x + offset} y1={from.y + 12}
              x2={to.x + offset} y2={to.y - 12}
              stroke={isActive ? '#00e5ff' : '#2a2a3a'}
              strokeWidth={isActive ? 1.5 : 0.5}
              markerEnd="url(#arrowhead)"
            />
            <text
              x={(from.x + to.x) / 2 + (dx === 0 ? 3 : 0)}
              y={(from.y + to.y) / 2 + 3}
              fill={isActive ? '#00e5ff' : '#555570'}
              fontSize="3"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {t.label}
            </text>
          </g>
        );
      })}

      {/* Emergency arrow from RUNNING */}
      <line x1={50} y1={182} x2={50} y2={268} stroke={currentState === 'EMERGENCY_SAFE_STOP' ? '#ff1744' : '#2a2a3a'}
        strokeWidth={currentState === 'EMERGENCY_SAFE_STOP' ? 1.5 : 0.3} strokeDasharray="2,1" markerEnd="url(#arrowRed)" />
      <text x={44} y={230} fill="#ff1744" fontSize="2.5" fontFamily="monospace">EMG</text>

      {/* Arrow marker */}
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="#555570" />
        </marker>
        <marker id="arrowRed" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="#ff1744" />
        </marker>
      </defs>

      {/* State nodes */}
      {ALL_STATES.map(state => {
        const pos = statePositions[state];
        const isActive = currentState === state;
        const color = stateColors[state];
        return (
          <g key={state} onClick={() => onSelectState(state)} style={{ cursor: 'pointer' }}>
            <rect
              x={pos.x - 22} y={pos.y - 10}
              width={44} height={20}
              rx={4}
              fill={isActive ? `${color}22` : '#14141e'}
              stroke={isActive ? color : '#2a2a3a'}
              strokeWidth={isActive ? 1.5 : 0.5}
            />
            {isActive && (
              <rect
                x={pos.x - 22} y={pos.y - 10}
                width={44} height={20}
                rx={4}
                fill="none"
                stroke={color}
                strokeWidth={0.5}
                opacity={0.5}
              >
                <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
              </rect>
            )}
            <text
              x={pos.x} y={pos.y + 1}
              fill={isActive ? color : '#8888a0'}
              fontSize="3.2"
              textAnchor="middle"
              fontFamily="monospace"
              fontWeight={isActive ? 'bold' : 'normal'}
            >
              {state.length > 15 ? state.replace('_', '\n') : state}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
