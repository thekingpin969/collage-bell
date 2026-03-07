import { h } from 'preact';
import { useState, useContext, useEffect, useRef } from 'preact/hooks';
import { Link, RouterContext } from '../router';
import { api } from '../api';
import { IconClose, IconDotsVertical, IconEdit, IconPlus, IconRemove, IconPlay } from '../components/Icons';
import './Configure.css';

export const Configure = () => {
    const { push } = useContext(RouterContext);
    const [hour, setHour] = useState(11);
    const [minute, setMinute] = useState(30);
    const [isAm, setIsAm] = useState(true);
    const [stepCount, setStepCount] = useState(1);
    const [steps, setSteps] = useState([
        { on: 5, pause: 2 },
        { on: 3, pause: 0 },
        { on: 0, pause: 0 },
        { on: 0, pause: 0 },
        { on: 0, pause: 0 }
    ]);
    const [label, setLabel] = useState('Bell Schedule');
    const [days, setDays] = useState([false, true, true, true, true, true, false]);
    const [enabled, setEnabled] = useState(true);
    const [editIdx, setEditIdx] = useState(null);

    const hourScrollRef = useRef(null);
    const minScrollRef = useRef(null);
    const scrollTimeout = useRef(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const editIdxParam = params.get('edit');

        if (editIdxParam !== null) {
            setEditIdx(parseInt(editIdxParam, 10));
            api.getSchedules().then(data => {
                const sched = data[parseInt(editIdxParam, 10)];
                if (sched) {
                    let h12 = sched.hour % 12 || 12;
                    setHour(h12);
                    setMinute(sched.minute);
                    setIsAm(sched.hour < 12);
                    setStepCount(sched.stepCount);
                    if (sched.steps && sched.steps.length > 0) {
                        const newSteps = [...steps];
                        sched.steps.forEach((s, i) => {
                            if (i < 5) newSteps[i] = { on: s.duration, pause: s.delay };
                        });
                        setSteps(newSteps);
                    }
                    if (sched.label !== undefined) setLabel(sched.label);
                    if (sched.days !== undefined) {
                        const newDays = [...days];
                        for(let i=0; i<7; i++) {
                            newDays[i] = (sched.days & (1 << i)) !== 0;
                        }
                        setDays(newDays);
                    }
                    if (sched.enabled !== undefined) setEnabled(sched.enabled);
                    
                    setTimeout(() => {
                        if (hourScrollRef.current) hourScrollRef.current.scrollTop = (h12 - 1) * 48;
                        if (minScrollRef.current) minScrollRef.current.scrollTop = sched.minute * 48;
                    }, 50);
                }
            }).catch(console.error);
        } else {
            setTimeout(() => {
                if (hourScrollRef.current) hourScrollRef.current.scrollTop = (hour - 1) * 48;
                if (minScrollRef.current) minScrollRef.current.scrollTop = minute * 48;
            }, 50);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const handleScroll = (e, setter, maxVal, isHour) => {
        if (!e.target) return;
        const idx = Math.round(e.target.scrollTop / 48);
        let val = isHour ? idx + 1 : idx;
        if (val > maxVal) val = maxVal;
        
        setter((prev) => {
            if (prev !== val) {
                if (navigator.vibrate) navigator.vibrate(5);
                return val;
            }
            return prev;
        });
    };

    const updateStep = (index, field, value) => {
        const newSteps = [...steps];
        let val = parseInt(value, 10);
        if (isNaN(val)) val = 0;
        newSteps[index][field] = val;
        setSteps(newSteps);
    };

    const [saving, setSaving] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSaving(true);
        // Convert 12h AM/PM to 24h for ESP32
        let h24 = hour;
        if (isAm && h24 === 12) h24 = 0;
        if (!isAm && h24 !== 12) h24 += 12;

        const daysMask = days.reduce((mask, isTrue, i) => mask | (isTrue ? (1 << i) : 0), 0);
        const data = {
            hour: h24,
            minute: minute,
            stepCount: stepCount,
            label: label,
            days: daysMask,
            enabled: enabled,
            steps: steps.slice(0, stepCount).map(s => ({ duration: s.on, delay: s.pause }))
        };

        const apiCall = editIdx !== null 
            ? api.editSchedule(editIdx, data) 
            : api.addSchedule(data);

        apiCall
            .then(() => push('/schedules'))
            .catch(() => alert('Failed to save schedule'))
            .finally(() => setSaving(false));
    };

    const formatTime = (time) => time < 10 ? `0${time}` : time;

    const totalTimePattern = steps.slice(0, stepCount).reduce((acc, step) => acc + step.on + step.pause, 0);

    return (
        <div class="cfg-container">
            <header class="cfg-header">
                <Link to="/schedules" aria-label="Close" class="cfg-icon-btn left">
                    <span class="cfg-icon-primary"><IconClose /></span>
                </Link>
                <h1>{editIdx !== null ? 'Edit Schedule' : 'New Schedule'}</h1>
                <button type="button" aria-label="More options" class="cfg-icon-btn right">
                    <span class="cfg-icon-primary"><IconDotsVertical /></span>
                </button>
            </header>

            <main class="cfg-main">
                <form onSubmit={handleSubmit}>
                    <div class="cfg-time-section">
                        <div class="cfg-time-row">
                            <div class="cfg-scroll-picker" ref={hourScrollRef} onScroll={(e) => handleScroll(e, setHour, 12, true)}>
                                <div style={{height: '48px'}}></div>
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} class={`cfg-scroll-item ${hour === i + 1 ? 'active' : ''}`} onClick={() => { setHour(i + 1); if (hourScrollRef.current) hourScrollRef.current.scrollTop = i * 48; }}>
                                        {formatTime(i + 1)}
                                    </div>
                                ))}
                                <div style={{height: '48px'}}></div>
                            </div>
                            
                            <span class="cfg-time-colon">:</span>
                            
                            <div class="cfg-scroll-picker" ref={minScrollRef} onScroll={(e) => handleScroll(e, setMinute, 59, false)}>
                                <div style={{height: '48px'}}></div>
                                {[...Array(60)].map((_, i) => (
                                    <div key={i} class={`cfg-scroll-item ${minute === i ? 'active' : ''}`} onClick={() => { setMinute(i); if (minScrollRef.current) minScrollRef.current.scrollTop = i * 48; }}>
                                        {formatTime(i)}
                                    </div>
                                ))}
                                <div style={{height: '48px'}}></div>
                            </div>

                            <div class="cfg-ampm-col">
                                <button type="button" class={`cfg-ampm-btn ${isAm ? 'active' : ''}`} onClick={() => setIsAm(true)}>AM</button>
                                <button type="button" class={`cfg-ampm-btn ${!isAm ? 'active' : ''}`} onClick={() => setIsAm(false)}>PM</button>
                            </div>
                        </div>
                    </div>

                    <div class="cfg-section">
                        <h2 class="cfg-section-title">Details</h2>
                        <div class="cfg-card" onClick={(e) => {
                            if (e.target.tagName !== 'INPUT') {
                                const input = e.currentTarget.querySelector('input');
                                if (input) input.focus();
                            }
                        }}>
                            <div class="cfg-card-content" style={{width: '100%'}}>
                                <span class="cfg-card-title">Label</span>
                                <input 
                                    type="text" 
                                    class="cfg-card-subtitle" 
                                    value={label} 
                                    onInput={e => setLabel(e.target.value)}
                                    style={{background: 'transparent', border: 'none', color: 'var(--cfg-text-muted-dark)', width: '100%', outline: 'none', padding: 0, fontSize: '0.875rem'}}
                                    placeholder="Bell Schedule"
                                />
                            </div>
                            <span class="cfg-card-icon" style={{marginLeft: '0.5rem', width: '20px', height: '20px'}}><IconEdit /></span>
                        </div>
                        <div class="cfg-card" style={{flexDirection: 'column', alignItems: 'flex-start', gap: '1rem', cursor: 'default'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                                <span class="cfg-card-title">Repeat Days</span>
                            </div>
                            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', gap: '0.25rem'}}>
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        class={`cfg-day-btn ${days[i] ? 'active' : ''}`}
                                        onClick={() => {
                                            const newDays = [...days];
                                            newDays[i] = !newDays[i];
                                            setDays(newDays);
                                        }}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div class="cfg-card" style={{cursor: 'default'}}>
                            <span class="cfg-card-title">Enable Schedule</span>
                            <label class="cfg-toggle-label">
                                <input type="checkbox" class="cfg-toggle-input" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
                                <div class="cfg-toggle-bg"></div>
                            </label>
                        </div>
                    </div>

                    <div class="cfg-section">
                        <div class="cfg-pattern-header">
                            <h2 class="cfg-section-title" style={{marginLeft: 0}}>Pattern Builder</h2>
                            <button type="button" class="cfg-add-btn" onClick={() => setStepCount(Math.min(5, stepCount + 1))}>
                                <span class="cfg-add-icon" style={{ display: 'flex' }}><IconPlus style={{ width: '18px', height: '18px' }} /></span> Add Step
                            </button>
                        </div>
                        
                        <div class="cfg-step-list">
                            {steps.slice(0, stepCount).map((step, idx) => (
                                <div key={idx} class="cfg-step-card">
                                    <div class="cfg-step-index">{idx + 1}</div>
                                    <div class="cfg-step-grid">
                                        <div class="cfg-step-input-group">
                                            <span class="cfg-step-label">ON</span>
                                            <div class="cfg-step-val">
                                                <input class="cfg-step-num-input" type="number" min="0" max="255" value={step.on} onInput={(e) => updateStep(idx, 'on', e.target.value)} />s
                                            </div>
                                        </div>
                                        <div class="cfg-step-input-group">
                                            <span class="cfg-step-label">PAUSE</span>
                                            <div class="cfg-step-val">
                                                <input class="cfg-step-num-input" type="number" min="0" max="255" value={step.pause} onInput={(e) => updateStep(idx, 'pause', e.target.value)} />s
                                            </div>
                                        </div>
                                    </div>
                                    <button type="button" class="cfg-step-remove-btn" aria-label="Remove step" onClick={() => setStepCount(Math.max(1, stepCount - 1))}>
                                        <span class="cfg-step-remove-icon" style={{ display: 'flex' }}><IconRemove /></span>
                                    </button>
                                </div>
                            ))}
                            
                            <div class="cfg-preview-container">
                                <p class="cfg-preview-text">Pattern Preview (Total: {totalTimePattern}s)</p>
                                <div class="cfg-preview-bar">
                                    {totalTimePattern > 0 ? steps.slice(0, stepCount).map((step, idx) => (
                                        <>
                                            {step.on > 0 && <div class="cfg-preview-fill on" style={{width: `${(step.on / totalTimePattern) * 100}%`}}></div>}
                                            {step.pause > 0 && <div class="cfg-preview-fill pause" style={{width: `${(step.pause / totalTimePattern) * 100}%`}}></div>}
                                        </>
                                    )) : <div class="cfg-preview-fill pause" style={{width: '100%'}}></div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </main>

            <div class="cfg-footer">
                <div class="cfg-footer-btns">
                    <button type="button" class="cfg-btn cfg-btn-secondary" onClick={() => {
                        api.testPattern({
                            stepCount: stepCount,
                            steps: steps.slice(0, stepCount).map(s => ({ duration: s.on, delay: s.pause }))
                        }).catch(() => alert('Test pattern failed'));
                    }}>
                        <span class="cfg-play-icon" style={{ display: 'flex' }}><IconPlay /></span> Test
                    </button>
                    <button onClick={handleSubmit} type="button" class="cfg-btn cfg-btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

