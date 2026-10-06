// ============================================================
// SYSTEM LOGS & TELEMETRY VIEWER
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { useSimStore } from '../simulation/simulationEngine';
import { Trash2, Terminal, Filter, ArrowDown } from 'lucide-react';
import type { LogEntry } from '../simulation/types';

export default function LogViewer() {
  const { logs, clearLogs } = useSimStore();
  const [filter, setFilter] = useState<string>('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredLogs = logs.filter(log => {
    if (filter === 'ALL') return true;
    return log.type === filter;
  });

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  const typeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'EMERGENCY': return 'text-[var(--red)] font-bold';
      case 'ERROR': return 'text-[var(--red)]';
      case 'WARNING': return 'text-[var(--amber)]';
      case 'STATE': return 'text-[var(--cyan)]';
      default: return 'text-[var(--green)]';
    }
  };

  return (
    <div className="flex flex-col h-full glass-panel overflow-hidden">
      <div className="flex items-center justify-between p-2.5 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-[var(--cyan)]" />
          <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--text-secondary)]">
            SYSTEM TELEMETRY & EVENT LOG ({logs.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px]">
            <Filter size={12} className="text-[var(--text-muted)]" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] rounded px-1.5 py-0.5 text-[10px] outline-none"
            >
              <option value="ALL">ALL EVENTS</option>
              <option value="INFO">INFO</option>
              <option value="STATE">STATE</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
              <option value="EMERGENCY">EMERGENCY</option>
            </select>
          </div>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
              autoScroll ? 'border-[var(--cyan)] text-[var(--cyan)]' : 'border-[var(--border)] text-[var(--text-muted)]'
            }`}
            title="Toggle Auto Scroll"
          >
            <ArrowDown size={11} className="inline mr-0.5" />
            AUTO
          </button>

          <button
            onClick={clearLogs}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--red)] transition-colors"
            title="Clear Event Log"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-1 bg-[#07070b]"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-center text-[var(--text-muted)] py-6 text-xs italic">
            No events recorded yet. Perform actions to stream simulation logs.
          </div>
        ) : (
          filteredLogs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2 hover:bg-[var(--bg-secondary)]/50 px-1 py-0.5 rounded">
              <span className="text-[var(--text-muted)] text-[9px] select-none">
                CLK:{String(log.clock).padStart(4, '0')}
              </span>
              <span className="text-[var(--text-muted)] text-[9px] select-none">
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>
              <span className={`text-[10px] uppercase font-bold w-16 select-none ${typeColor(log.type)}`}>
                {log.type}
              </span>
              <span className="text-[var(--text-primary)] flex-1 break-words">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
