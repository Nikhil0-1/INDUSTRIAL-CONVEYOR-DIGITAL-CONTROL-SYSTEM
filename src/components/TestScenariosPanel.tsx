// ============================================================
// AUTOMATED TEST SCENARIOS PANEL
// ============================================================

import { useSimStore } from '../simulation/simulationEngine';
import { TEST_SCENARIOS } from '../simulation/scenarios';
import { Play, CheckCircle2, XCircle, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function TestScenariosPanel() {
  const { testResults, testRunning, runTest, stopTest } = useSimStore();

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div>
            <div className="panel-header px-0 py-0 border-b-0">AUTOMATED TEST HARNESS</div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1">
              Deterministic verification suite executing state assertions against the live simulation engine
            </p>
          </div>
          {testRunning && (
            <button
              onClick={stopTest}
              className="btn btn-red text-xs px-3 py-1.5"
            >
              <AlertTriangle size={14} /> ABORT TEST
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {TEST_SCENARIOS.map((scenario) => {
            const result = testResults[scenario.id];
            const isPassed = result?.passed;
            const hasRun = !!result;

            return (
              <div
                key={scenario.id}
                className={`glass-panel p-4 flex flex-col justify-between transition-all ${
                  hasRun
                    ? isPassed
                      ? 'border-[var(--green)]/40 bg-[var(--green-dim)]/10'
                      : 'border-[var(--red)]/40 bg-[var(--red-dim)]/10'
                    : 'border-[var(--border)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--cyan)] font-bold">
                      TEST 0{scenario.id}
                    </span>
                    {hasRun ? (
                      isPassed ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--green)]">
                          <CheckCircle2 size={14} /> PASSED
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--red)]">
                          <XCircle size={14} /> FAILED
                        </span>
                      )
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                        <Clock size={14} /> PENDING
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                    {scenario.name}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">
                    {scenario.description}
                  </p>

                  <div className="p-2.5 rounded bg-[var(--bg-secondary)] border border-[var(--border)] text-[11px] font-mono mb-3 space-y-1">
                    <div className="text-[var(--text-muted)] text-[9px] uppercase tracking-wider">
                      Expected Output
                    </div>
                    <div className="text-[var(--text-primary)] break-words">
                      {scenario.expectedResult}
                    </div>
                    {hasRun && (
                      <>
                        <div className="text-[var(--text-muted)] text-[9px] uppercase tracking-wider pt-1 border-t border-[var(--border)]">
                          Actual Evaluation
                        </div>
                        <div className={isPassed ? 'text-[var(--green)]' : 'text-[var(--red)]'}>
                          {result.actualResult}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => runTest(scenario.id)}
                  disabled={testRunning}
                  className={`btn w-full justify-center ${
                    isPassed ? 'btn-green' : 'btn-blue'
                  }`}
                >
                  <Play size={13} /> {testRunning ? 'Test in Progress...' : 'Execute Test'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-panel p-4">
        <div className="panel-header">COMPREHENSIVE TEST COVERAGE METRICS</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
          <div className="p-3 rounded bg-[var(--bg-secondary)] border border-[var(--border)] text-center">
            <div className="text-[10px] text-[var(--text-muted)] uppercase">Total Scenarios</div>
            <div className="text-2xl font-bold font-mono text-[var(--cyan)] mt-1">{TEST_SCENARIOS.length}</div>
          </div>
          <div className="p-3 rounded bg-[var(--bg-secondary)] border border-[var(--border)] text-center">
            <div className="text-[10px] text-[var(--text-muted)] uppercase">Tests Executed</div>
            <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1">
              {Object.keys(testResults).length}
            </div>
          </div>
          <div className="p-3 rounded bg-[var(--bg-secondary)] border border-[var(--border)] text-center">
            <div className="text-[10px] text-[var(--text-muted)] uppercase">Tests Passed</div>
            <div className="text-2xl font-bold font-mono text-[var(--green)] mt-1">
              {Object.values(testResults).filter(r => r.passed).length}
            </div>
          </div>
          <div className="p-3 rounded bg-[var(--bg-secondary)] border border-[var(--border)] text-center">
            <div className="text-[10px] text-[var(--text-muted)] uppercase">Verification Status</div>
            <div className="text-base font-bold font-mono mt-1 flex items-center justify-center gap-1 text-[var(--cyan)]">
              <ShieldCheck size={18} />
              {Object.values(testResults).length === TEST_SCENARIOS.length &&
              Object.values(testResults).every(r => r.passed)
                ? '100% VALIDATED'
                : 'READY'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
