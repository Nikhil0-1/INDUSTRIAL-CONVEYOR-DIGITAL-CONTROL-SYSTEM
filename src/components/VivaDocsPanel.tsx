// ============================================================
// VIVA VOCE & ENGINEERING DOCUMENTATION PANEL
// ============================================================

import { useState } from 'react';
import { useSimStore } from '../simulation/simulationEngine';
import { BookOpen, Cpu, CheckCircle2, ChevronDown, ChevronRight, HelpCircle, Lightbulb } from 'lucide-react';

const VIVA_QUESTIONS = [
  {
    q: '1. What is the fundamental function of the 4-to-2 Priority Encoder in this system?',
    a: 'In industrial control, multiple asynchronous sensor signals can arrive simultaneously. The Priority Encoder resolves input collisions deterministically. Emergency Stop (I₃) has top priority, followed by Fault (I₂), Position Sensor (I₁), and Product Entry Sensor (I₀). Even if all 4 lines go high, the encoder outputs binary 11 (EMERGENCY), immediately overriding normal operations and forcing safety shutdowns.',
  },
  {
    q: '2. Why is Edge Detection mandatory before feeding the product sensor to the counter?',
    a: 'Physical conveyor products linger over optical or proximity sensors for multiple clock cycles depending on speed. If connected directly to a counter clock/enable pin, the counter would increment repeatedly for a single product. The rising-edge detector (AND gate combining current sensor pulse with inverted previous clock sample: Pulse = S · ¬S_prev) produces exactly a one-clock-period impulse upon product arrival.',
  },
  {
    q: '3. What type of Finite State Machine (FSM) is used, and how is safe shutdown guaranteed?',
    a: 'The controller uses a synchronous Moore/Mealy hybrid FSM. States include RESET, IDLE, READY, RUNNING, POSITION_CONTROL, FAULT_STOP, and EMERGENCY_SAFE_STOP. Emergency and Fault transitions are global overrides present in every active state. Whenever an EMERGENCY condition is triggered, the FSM transitions to EMERGENCY_SAFE_STOP on the next active clock edge, forcing Motor Enable to 0 and locking the belt.',
  },
  {
    q: '4. How does Even Parity error detection function in this digital transmission link?',
    a: 'An even parity generator computes the parity bit P = D₃ ⊕ D₂ ⊕ D₁ ⊕ D₀ using XOR gates. The 5-bit codeword (D + P) is transmitted across the industrial bus. At the receiver, a parity checker evaluates S = P_rec ⊕ D₃_rec ⊕ D₂_rec ⊕ D₁_rec ⊕ D₀_rec. If S = 1, an odd number of bit errors (single bit corruption) occurred, triggering an immediate FAULT signal.',
  },
  {
    q: '5. How does the system prevent race conditions and hazards?',
    a: 'All inputs are synchronized to the master system clock. Critical safety interlocks are implemented through combinational priority logic prior to sequential state registers, preventing contradictory motor drive commands. The emergency stop circuit features hardware override capability ensuring motor power cutoff regardless of software register states.',
  },
];

export default function VivaDocsPanel() {
  const getVivaExplanation = useSimStore(s => s.getVivaExplanation);
  const fsmState = useSimStore(s => s.fsmState);
  const emergency = useSimStore(s => s.emergency);
  const fault = useSimStore(s => s.fault);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-5 p-4 overflow-y-auto h-full max-w-5xl mx-auto">
      {/* Dynamic Live State Explainer */}
      <div className="glass-panel p-4 border-[var(--cyan)]/30 bg-[var(--blue-dim)]/20">
        <div className="flex items-center gap-2 text-[var(--cyan)] text-xs font-bold uppercase tracking-wider mb-2">
          <Lightbulb size={16} /> Live Circuit Operational Analysis
        </div>
        <p className="text-sm text-[var(--text-primary)] leading-relaxed font-mono">
          {getVivaExplanation()}
        </p>
      </div>

      {/* Engineering Project Overview */}
      <div className="glass-panel p-4">
        <div className="panel-header flex items-center gap-2">
          <BookOpen size={16} className="text-[var(--cyan)]" />
          PROJECT SPECIFICATION: COMPLEX ENGINEERING PROBLEM (CEP)
        </div>
        <div className="mt-3 text-xs text-[var(--text-secondary)] space-y-2 leading-relaxed">
          <p>
            <strong className="text-[var(--text-primary)]">Title:</strong> Design and Implementation of a High-Reliability Digital Control System for an Industrial Conveyor Assembly.
          </p>
          <p>
            <strong className="text-[var(--text-primary)]">Core Objective:</strong> Replace unreliable, uncoordinated manual and relay control with a deterministic, clock-synchronized digital electronics architecture implementing priority arbitration, sequential state machine management, hardware product counting, and communication parity verification.
          </p>
        </div>
      </div>

      {/* Block Diagram & Architecture */}
      <div className="glass-panel p-4">
        <div className="panel-header flex items-center gap-2">
          <Cpu size={16} className="text-[var(--cyan)]" />
          DIGITAL ARCHITECTURE MODULES
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <div className="p-3 rounded bg-[var(--bg-secondary)] border border-[var(--border)]">
            <div className="text-xs font-bold text-[var(--cyan)] mb-1">1. Priority Encoder</div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Resolves competing asynchronous signals (Emergency &gt; Fault &gt; Position &gt; Product) into prioritized 2-bit binary events with valid strobe.
            </p>
          </div>
          <div className="p-3 rounded bg-[var(--bg-secondary)] border border-[var(--border)]">
            <div className="text-xs font-bold text-[var(--green)] mb-1">2. Sequential FSM</div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Moore-style sequential controller managing system states: IDLE, READY, RUNNING, POSITION_CONTROL, FAULT_STOP, and EMERGENCY_SAFE_STOP.
            </p>
          </div>
          <div className="p-3 rounded bg-[var(--bg-secondary)] border border-[var(--border)]">
            <div className="text-xs font-bold text-[var(--amber)] mb-1">3. Counter & Detector</div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Positive edge detector generates single-clock pulse triggering 8-bit synchronous binary counter with 7-segment / hex display output.
            </p>
          </div>
          <div className="p-3 rounded bg-[var(--bg-secondary)] border border-[var(--border)]">
            <div className="text-xs font-bold text-[var(--purple)] mb-1">4. Parity Generator</div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              XOR-tree generates even parity bit across 4-bit data stream to identify single-bit transmission corruption.
            </p>
          </div>
          <div className="p-3 rounded bg-[var(--bg-secondary)] border border-[var(--border)]">
            <div className="text-xs font-bold text-[var(--red)] mb-1">5. Safe-State Interlock</div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Hardware-level override ensuring motor disable (Output = 0) and audible/visual alarm upon emergency or fault detection.
            </p>
          </div>
          <div className="p-3 rounded bg-[var(--bg-secondary)] border border-[var(--border)]">
            <div className="text-xs font-bold text-[var(--blue)] mb-1">6. Digital Timing Bus</div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Synchronous clock distribution coordinating input sampling, state register propagation, and output gating.
            </p>
          </div>
        </div>
      </div>

      {/* Viva Voce Questions & Answers */}
      <div className="glass-panel p-4">
        <div className="panel-header flex items-center gap-2">
          <HelpCircle size={16} className="text-[var(--cyan)]" />
          VIVA VOCE EXAMINATION QUESTIONS & ANSWERS
        </div>
        <div className="mt-3 space-y-2">
          {VIVA_QUESTIONS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="border border-[var(--border)] rounded-md overflow-hidden bg-[var(--bg-secondary)]"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left p-3 flex items-center justify-between text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <span>{item.q}</span>
                  {isOpen ? <ChevronDown size={16} className="text-[var(--cyan)]" /> : <ChevronRight size={16} />}
                </button>
                {isOpen && (
                  <div className="p-3 pt-0 text-[11px] text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border)] bg-[var(--bg-primary)]">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
