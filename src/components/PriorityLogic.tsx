// ============================================================
// PRIORITY LOGIC VISUALIZATION
// ============================================================

import { useSimStore } from '../simulation/simulationEngine';
import { evaluatePriority, generateTruthTable, BOOLEAN_EQUATIONS } from '../simulation/priorityLogic';

export default function PriorityLogicPanel() {
  const { emergency, fault, positionSensor, productSensor, selectedEvent, priorityInputs } = useSimStore();
  const truthTable = generateTruthTable();

  const currentRow = truthTable.find(r =>
    r.emergency === (emergency ? 1 : 0) &&
    r.fault === (fault ? 1 : 0) &&
    r.position === (positionSensor ? 1 : 0) &&
    r.product === (productSensor ? 1 : 0)
  );

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      {/* Priority Encoder */}
      <div className="glass-panel p-4">
        <div className="panel-header">4-TO-2 PRIORITY ENCODER</div>
        <div className="mt-3 flex flex-col gap-2">
          {[
            { label: 'I₃ = EMERGENCY', value: emergency, priority: 3 },
            { label: 'I₂ = FAULT', value: fault, priority: 2 },
            { label: 'I₁ = POSITION', value: positionSensor, priority: 1 },
            { label: 'I₀ = PRODUCT', value: productSensor, priority: 0 },
          ].map((input, i) => (
            <div key={i} className={`priority-row ${
              selectedEvent !== 'NONE' && 
              ((input.priority === 3 && selectedEvent === 'EMERGENCY') ||
               (input.priority === 2 && selectedEvent === 'FAULT') ||
               (input.priority === 1 && selectedEvent === 'POSITION') ||
               (input.priority === 0 && selectedEvent === 'PRODUCT'))
              ? 'selected' : ''
            }`}>
              <span className="text-[var(--text-secondary)] w-32">{input.label}</span>
              <div className="flex-1 flex items-center gap-2">
                <div className="h-[2px] flex-1 relative overflow-hidden rounded">
                  <div className={`absolute inset-0 ${input.value ? 'bg-[var(--cyan)]' : 'bg-[var(--border)]'}`}
                    style={{ transition: 'all 0.3s' }} />
                  {input.value && (
                    <div className="absolute inset-0 bg-[var(--cyan)] animate-pulse opacity-50" />
                  )}
                </div>
                <span className={`led ${input.value ? 'led-green' : 'led-off'}`} />
                <span className={`w-4 text-center font-bold ${input.value ? 'text-[var(--green)]' : 'text-[var(--text-muted)]'}`}>
                  {input.value ? '1' : '0'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-center">
          <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Selected Event</div>
          <div className={`font-mono text-xl font-bold ${
            selectedEvent === 'EMERGENCY' ? 'text-[var(--red)]' :
            selectedEvent === 'FAULT' ? 'text-[var(--amber)]' :
            selectedEvent === 'POSITION' ? 'text-[var(--green)]' :
            selectedEvent === 'PRODUCT' ? 'text-[var(--blue)]' :
            'text-[var(--text-muted)]'
          }`}>
            {selectedEvent}
          </div>
          {currentRow && (
            <div className="text-[10px] text-[var(--text-secondary)] mt-1 font-mono">
              Y₁Y₀ = {currentRow.y1}{currentRow.y0} | V = {currentRow.valid}
            </div>
          )}
        </div>
      </div>

      {/* Boolean Equations */}
      <div className="glass-panel p-4">
        <div className="panel-header">BOOLEAN EQUATIONS</div>
        <div className="mt-3 flex flex-col gap-2 font-mono text-[12px]">
          {Object.entries(BOOLEAN_EQUATIONS).map(([key, eq]) => (
            <div key={key} className="flex items-center gap-3 p-2 rounded bg-[var(--bg-secondary)]">
              <span className="text-[var(--cyan)] min-w-[80px]">{key}:</span>
              <span className="text-[var(--text-primary)]">{eq}</span>
            </div>
          ))}
        </div>
      </div>

      {/* K-Map for Motor Enable */}
      <div className="glass-panel p-4">
        <div className="panel-header">K-MAP: MOTOR ENABLE</div>
        <p className="text-[10px] text-[var(--text-muted)] mt-2 mb-3 italic">
          Conceptual K-Map / Logic Simplification View
        </p>
        <KMapView />
      </div>

      {/* Truth Table */}
      <div className="glass-panel p-4">
        <div className="panel-header">PRIORITY TRUTH TABLE</div>
        <div className="mt-3 overflow-x-auto">
          <table className="truth-table">
            <thead>
              <tr>
                <th>EMG</th>
                <th>FLT</th>
                <th>POS</th>
                <th>PRD</th>
                <th>Event</th>
                <th>Y₁</th>
                <th>Y₀</th>
                <th>Motor</th>
              </tr>
            </thead>
            <tbody>
              {truthTable.map((row, i) => {
                const isCurrentRow = currentRow &&
                  row.emergency === currentRow.emergency &&
                  row.fault === currentRow.fault &&
                  row.position === currentRow.position &&
                  row.product === currentRow.product;
                return (
                  <tr key={i} className={isCurrentRow ? 'highlight' : ''}>
                    <td className={row.emergency ? 'text-[var(--red)]' : ''}>{row.emergency}</td>
                    <td className={row.fault ? 'text-[var(--amber)]' : ''}>{row.fault}</td>
                    <td className={row.position ? 'text-[var(--green)]' : ''}>{row.position}</td>
                    <td className={row.product ? 'text-[var(--blue)]' : ''}>{row.product}</td>
                    <td className={`font-bold ${
                      row.selectedEvent === 'EMERGENCY' ? 'text-[var(--red)]' :
                      row.selectedEvent === 'FAULT' ? 'text-[var(--amber)]' :
                      'text-[var(--text-primary)]'
                    }`}>{row.selectedEvent}</td>
                    <td>{row.y1}</td>
                    <td>{row.y0}</td>
                    <td className="text-[10px]">{row.motorAction}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KMapView() {
  // K-map for Motor Enable: MOTOR_EN = RUN · ¬EMERGENCY · ¬FAULT
  // Variables: Emergency (A), Fault (B), with RUN assumed
  // 2-variable K-map
  const cells = [
    { ab: '00', val: 1 }, // no emergency, no fault → motor on
    { ab: '01', val: 0 }, // no emergency, fault → motor off
    { ab: '11', val: 0 }, // emergency, fault → motor off
    { ab: '10', val: 0 }, // emergency, no fault → motor off
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-[10px] text-[var(--text-secondary)] font-mono mb-1">
        MOTOR_EN (RUN state assumed)
      </div>
      <div className="flex gap-0">
        <div className="flex flex-col">
          <div className="w-16 h-8 flex items-center justify-center text-[10px] text-[var(--text-muted)]">
            E\F
          </div>
          <div className="w-16 h-8 flex items-center justify-center text-[10px] text-[var(--text-secondary)] font-mono">0</div>
          <div className="w-16 h-8 flex items-center justify-center text-[10px] text-[var(--text-secondary)] font-mono">1</div>
        </div>
        <div className="flex flex-col">
          <div className="w-10 h-8 flex items-center justify-center text-[10px] text-[var(--text-secondary)] font-mono">0</div>
          <div className={`kmap-cell ${cells[0].val ? 'one' : 'zero'}`}>{cells[0].val}</div>
          <div className={`kmap-cell ${cells[3].val ? 'one' : 'zero'}`}>{cells[3].val}</div>
        </div>
        <div className="flex flex-col">
          <div className="w-10 h-8 flex items-center justify-center text-[10px] text-[var(--text-secondary)] font-mono">1</div>
          <div className={`kmap-cell ${cells[1].val ? 'one' : 'zero'}`}>{cells[1].val}</div>
          <div className={`kmap-cell ${cells[2].val ? 'one' : 'zero'}`}>{cells[2].val}</div>
        </div>
      </div>
      <div className="text-[10px] text-[var(--text-muted)] mt-2">
        Simplified: MOTOR_EN = E̅ · F̅ · RUN
      </div>
    </div>
  );
}
