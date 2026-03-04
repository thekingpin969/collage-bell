import { h } from 'preact';
import { useState } from 'preact/hooks';
import { Link, RouterContext } from '../router';
import { useContext } from 'preact/hooks';

export const Configure = () => {
  const { push } = useContext(RouterContext);
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(30);
  const [stepCount, setStepCount] = useState(1);
  const [steps, setSteps] = useState([
      { on: 3, pause: 1 },
      { on: 0, pause: 0 },
      { on: 0, pause: 0 },
      { on: 0, pause: 0 },
      { on: 0, pause: 0 }
  ]);

  const stepNum = (setter, val, delta, min, max) => {
    let newVal = val + delta;
    if (newVal < min) newVal = min;
    if (newVal > max) newVal = max;
    setter(newVal);
  };

  const updateStep = (index, field, value) => {
      const newSteps = [...steps];
      let val = parseInt(value, 10);
      if (isNaN(val)) val = 0;
      newSteps[index][field] = val;
      setSteps(newSteps);
  };

  const handleSubmit = (e) => {
      e.preventDefault();
      // handle logic
      push('/schedules');
  };

  return (
    <div class="app-container" style={{ background: '#0B0B0B', paddingBottom: '140px' }}>
      <header class="header" style={{ position: 'sticky', top: 0, background: '#0B0B0B', zIndex: 10, padding: '48px 16px 16px' }}>
        <Link to="/schedules" class="icon-btn text-primary" aria-label="Close" style={{ fontSize: '22px' }}>&#x2715;</Link>
        <h1 style={{ fontSize: '20px', fontWeight: 600 }}>New Schedule</h1>
        <div style={{ width: '40px' }}></div>
      </header>

      <main class="w-full max-w-sm mx-auto px-4" style={{ overflowY: 'auto' }}>
        <form onSubmit={handleSubmit}>
            {/* Time Picker */}
            <div class="flex justify-center items-center py-8">
                <div class="flex flex-col items-center">
                    <button type="button" class="scroll-arrow" style={{ fontSize: '28px', color: '#9CA3AF', opacity: 0.5 }} onClick={() => stepNum(setHour, hour, 1, 0, 23)}>&#x25B2;</button>
                    <input class="time-input" type="number" min="0" max="23" value={hour} onInput={e => setHour(parseInt(e.target.value) || 0)} required />
                    <button type="button" class="scroll-arrow" style={{ fontSize: '28px', color: '#9CA3AF', opacity: 0.5 }} onClick={() => stepNum(setHour, hour, -1, 0, 23)}>&#x25BC;</button>
                </div>
                <span class="time-sep" style={{ fontSize: '52px', fontWeight: 300, padding: '0 6px 18px' }}>:</span>
                <div class="flex flex-col items-center">
                    <button type="button" class="scroll-arrow" style={{ fontSize: '28px', color: '#9CA3AF', opacity: 0.5 }} onClick={() => stepNum(setMinute, minute, 1, 0, 59)}>&#x25B2;</button>
                    <input class="time-input" type="number" min="0" max="59" value={minute} onInput={e => setMinute(parseInt(e.target.value) || 0)} required />
                    <button type="button" class="scroll-arrow" style={{ fontSize: '28px', color: '#9CA3AF', opacity: 0.5 }} onClick={() => stepNum(setMinute, minute, -1, 0, 59)}>&#x25BC;</button>
                </div>
            </div>

            {/* Details */}
            <div class="mb-6">
                <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Details</div>
                <div class="bg-surface rounded-2xl overflow-hidden border border-border">
                    <div class="flex justify-between items-center p-4">
                        <div>
                            <div class="text-base font-medium">Number of Steps</div>
                            <div class="text-sm text-gray-400 mt-1">Ring cycles (1–5)</div>
                        </div>
                        <input class="num-input bg-surface2 border border-border rounded-lg text-center font-bold text-base p-2 w-16 outline-none" type="number" min="1" max="5" value={stepCount} onInput={e => setStepCount(parseInt(e.target.value) || 1)} />
                    </div>
                </div>
            </div>

            {/* Pattern Builder */}
            <div class="mb-6">
                <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Pattern Builder</div>

                {steps.map((step, idx) => (
                    <div key={idx} class={`bg-surface rounded-xl p-3 flex items-center gap-3 border border-border mb-2 ${idx >= stepCount ? 'opacity-50' : ''}`} style={idx >= stepCount ? { opacity: 0.5 } : {}}>
                        <div class="w-8 h-8 rounded-full bg-primary-glow text-primary font-bold text-sm flex items-center justify-center shrink-0" style={{ background: 'rgba(52, 211, 153, 0.15)' }}>
                            {idx + 1}
                        </div>
                        <div class="flex-1 grid grid-cols-2 gap-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                                <label class="block text-xs uppercase text-gray-400 mb-1" style={{ fontSize: '10px' }}>ON (sec)</label>
                                <input class="w-full bg-transparent border border-border rounded text-center font-mono py-1 px-2 outline-none" style={{ background: 'rgba(255,255,255,0.06)' }} type="number" min="0" max="255" value={step.on} onInput={e => updateStep(idx, 'on', e.target.value)} />
                            </div>
                            <div>
                                <label class="block text-xs uppercase text-gray-400 mb-1" style={{ fontSize: '10px' }}>PAUSE (sec)</label>
                                <input class="w-full bg-transparent border border-border rounded text-center font-mono py-1 px-2 outline-none" style={{ background: 'rgba(255,255,255,0.06)' }} type="number" min="0" max="255" value={step.pause} onInput={e => updateStep(idx, 'pause', e.target.value)} />
                            </div>
                        </div>
                    </div>
                ))}

                <p class="text-xs text-gray-400 italic p-1">&#8505; Steps with 0 ON time are skipped by the scheduler.</p>
            </div>

            <div class="fixed bottom-0 left-0 right-0 p-4 z-50" style={{ background: 'rgba(11, 11, 11, 0.95)', backdropFilter: 'blur(12px)' }}>
                <div class="flex gap-3 max-w-sm mx-auto">
                    <Link to="/schedules" class="flex-1 text-center py-3 rounded-full font-bold border border-border bg-surface">Cancel</Link>
                    <button type="submit" class="flex-1 text-center py-3 rounded-full font-bold bg-primary text-black" style={{ boxShadow: '0 4px 16px rgba(52, 211, 153, 0.3)' }}>Save Schedule</button>
                </div>
            </div>
        </form>
      </main>
    </div>
  );
};
