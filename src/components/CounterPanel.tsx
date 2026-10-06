// ============================================================
// PRODUCT COUNTER PANEL
// ============================================================

import { useSimStore } from '../simulation/simulationEngine';
import { formatCount, formatProductId } from '../simulation/counterLogic';

export default function CounterPanel() {
  const {
    productCount, lastCountedProductId, counterPulse, productSensor,
    previousProductSensor, resetCounter, products,
  } = useSimStore();

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      {/* Main Counter Display */}
      <div className="glass-panel p-4">
        <div className="panel-header">PRODUCT COUNTER</div>
        <div className="mt-4 text-center">
          <div className="font-mono text-5xl font-bold text-[var(--cyan)] tracking-wider"
            style={{
              textShadow: '0 0 20px rgba(0, 229, 255, 0.3)',
            }}>
            {formatCount(productCount)}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-2">
            Total Products Counted
          </div>
        </div>
        <button className="btn btn-blue w-full mt-4" onClick={resetCounter}>
          ↺ RESET COUNTER
        </button>
      </div>

      {/* Counter Details */}
      <div className="glass-panel p-4">
        <div className="panel-header">COUNTER DETAILS</div>
        <div className="mt-3 font-mono text-[11px] flex flex-col gap-2">
          <div className="flex justify-between p-2 rounded bg-[var(--bg-secondary)]">
            <span className="text-[var(--text-secondary)]">PRODUCT COUNT</span>
            <span className="text-[var(--cyan)] font-bold">{formatCount(productCount)}</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-[var(--bg-secondary)]">
            <span className="text-[var(--text-secondary)]">LAST DETECTED</span>
            <span className="text-[var(--text-primary)]">{lastCountedProductId || '—'}</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-[var(--bg-secondary)]">
            <span className="text-[var(--text-secondary)]">VALID PULSE</span>
            <span className={counterPulse ? 'text-[var(--green)]' : 'text-[var(--text-muted)]'}>
              {counterPulse ? '1' : '0'}
            </span>
          </div>
          <div className="flex justify-between p-2 rounded bg-[var(--bg-secondary)]">
            <span className="text-[var(--text-secondary)]">ON BELT</span>
            <span className="text-[var(--blue)]">{products.length}</span>
          </div>
        </div>
      </div>

      {/* Edge Detection */}
      <div className="glass-panel p-4">
        <div className="panel-header">EDGE DETECTION LOGIC</div>
        <div className="mt-3">
          <div className="flex flex-col items-center gap-2 text-[11px] font-mono">
            <div className="arch-block w-full">
              SENSOR PULSE
              <div className={`text-[10px] mt-1 ${productSensor ? 'text-[var(--green)]' : 'text-[var(--text-muted)]'}`}>
                Current: {productSensor ? '1' : '0'}
              </div>
            </div>
            <div className="arch-connector" />
            <div className="arch-block w-full">
              RISING EDGE DETECT
              <div className="text-[10px] mt-1 text-[var(--text-muted)]">
                Prev: {previousProductSensor ? '1' : '0'} → Curr: {productSensor ? '1' : '0'}
              </div>
            </div>
            <div className="arch-connector" />
            <div className="arch-block w-full">
              VALID DETECTION
              <div className={`text-[10px] mt-1 ${counterPulse ? 'text-[var(--green)]' : 'text-[var(--text-muted)]'}`}>
                {counterPulse ? 'COUNTING' : 'WAITING'}
              </div>
            </div>
            <div className="arch-connector" />
            <div className={`arch-block w-full ${counterPulse ? 'active' : ''}`}>
              COUNTER + 1
              <div className="text-[var(--cyan)] text-lg font-bold mt-1">{formatCount(productCount)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="glass-panel p-4">
        <div className="panel-header">PRODUCTS ON CONVEYOR</div>
        <div className="mt-3 max-h-48 overflow-y-auto">
          {products.length === 0 ? (
            <div className="text-[11px] text-[var(--text-muted)] text-center py-4">
              No products on conveyor
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {products.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded bg-[var(--bg-secondary)] text-[10px] font-mono">
                  <span className="text-[var(--cyan)] font-bold">{p.id}</span>
                  <span className="text-[var(--text-secondary)]">
                    Pos: {(p.position * 100).toFixed(0)}%
                  </span>
                  <span className={`flex items-center gap-1 ${p.detected ? 'text-[var(--green)]' : 'text-[var(--text-muted)]'}`}>
                    <span className={`led ${p.detected ? 'led-green' : 'led-off'}`} style={{ width: 6, height: 6 }} />
                    {p.detected ? 'DET' : '—'}
                  </span>
                  <span className={p.positionReached ? 'text-[var(--amber)]' : 'text-[var(--text-muted)]'}>
                    {p.positionReached ? 'POS' : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
