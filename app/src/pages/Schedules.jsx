import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Layout } from '../components/Layout';
import { BottomNav } from '../components/BottomNav';
import { Link, RouterContext } from '../router';
import { api } from '../api';
import { useContext } from 'preact/hooks';
import './Schedules.css';

export const Schedules = () => {
    const { push } = useContext(RouterContext);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSchedules = () => {
        api.getSchedules()
            .then(data => setSchedules(data))
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchSchedules(); }, []);

    const handleDelete = (idx) => {
        if (confirm('Delete this schedule?')) {
            api.deleteSchedule(idx)
                .then(() => fetchSchedules())
                .catch(() => alert('Delete failed'));
        }
    };

    const toggleEnable = (idx) => {
        const sched = schedules[idx];
        const updated = { ...sched, enabled: sched.enabled === false ? true : false };
        
        // Optimistic UI update
        const newSchedules = [...schedules];
        newSchedules[idx] = updated;
        setSchedules(newSchedules);

        api.editSchedule(idx, updated).catch(() => {
            alert('Failed to update schedule');
            fetchSchedules(); // revert on fail
        });
    };

    const handleTest = (idx) => {
        const sched = schedules[idx];
        api.testPattern({
            stepCount: sched.stepCount,
            steps: sched.steps
        }).catch((err) => alert(err.message || 'Test pattern failed'));
    };

    const formatTime = (hour, minute) => {
        const h12 = hour % 12 || 12;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const pad = (n) => String(n).padStart(2, '0');
        return { time: `${pad(h12)}:${pad(minute)}`, period: ampm };
    };

    const formatDays = (days) => {
        if (days === undefined || days === 127) return 'Every day';
        if (days === 0) return 'Never';
        if (days === 62) return 'Weekdays';
        if (days === 65) return 'Weekends';
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return dayNames.filter((_, i) => days & (1 << i)).join(', ');
    };

    const formatPattern = (steps, stepCount) => {
        if (!steps || !steps.length) return { text: '—', count: 0 };
        const parts = steps.slice(0, stepCount).map(s => {
            let t = `${s.duration}s`;
            if (s.delay > 0) t += `, ${s.delay}s`;
            return t;
        });
        return { text: `[${parts.join(', ')}]`, count: stepCount };
    };

    return (
        <Layout>
            <div class="app-container">
                <header class="header">
                    <div class="header-title-container">
                        <h1 class="text-3xl font-bold tracking-tight">Schedules</h1>
                    </div>
                    <button aria-label="More options" class="icon-btn">
                        <span class="emoji-icon schedule-header-icon">⋮</span>
                    </button>
                </header>

                <main class="schedules-main">
                    <div class="schedules-header-row">
                        <h2 class="schedules-header-title">Active Schedules</h2>
                        <span class="schedules-header-count">{schedules.length} Total</span>
                    </div>

                    {loading && <p style={{textAlign:'center', color:'#9CA3AF', padding:'2rem'}}>Loading...</p>}

                    {!loading && schedules.length === 0 && (
                        <div style={{textAlign:'center', color:'#9CA3AF', padding:'3rem 1rem'}}>
                            <p style={{fontSize:'2rem', marginBottom:'0.5rem'}}>🕐</p>
                            <p>No schedules yet</p>
                            <Link to="/configure" style={{color:'#34D399', textDecoration:'underline', marginTop:'0.5rem', display:'inline-block'}}>Add First Schedule</Link>
                        </div>
                    )}

                    {schedules.map((sched, idx) => {
                        const { time, period } = formatTime(sched.hour, sched.minute);
                        const pattern = formatPattern(sched.steps, sched.stepCount);
                        const daysText = formatDays(sched.days);
                        const labelText = sched.label || `Schedule #${idx + 1}`;
                        return (
                            <div class={`schedule-card ${sched.enabled === false ? 'opacity-70 grayscale-50' : ''}`} key={idx}>
                                <div class="schedule-card-header">
                                    <div class="schedule-time-container">
                                        <h3 class="schedule-time">
                                            {time} <span class="schedule-period">{period}</span>
                                        </h3>
                                        <p class="schedule-name">{labelText} • {daysText}</p>
                                    </div>
                                    <label class="schedule-toggle">
                                        <input type="checkbox" class="schedule-toggle-input" checked={sched.enabled !== false} onChange={() => toggleEnable(idx)} />
                                        <div class="schedule-toggle-bg"></div>
                                    </label>
                                </div>
                                <div class="schedule-pattern-box">
                                    <div class="schedule-pattern-info">
                                        <div class="css-icon-eq schedule-pattern-icon"><span></span><span></span><span></span></div>
                                        <span class="schedule-pattern-text font-mono">{pattern.text}</span>
                                    </div>
                                    <span class="schedule-pattern-steps">{pattern.count} step(s)</span>
                                </div>
                                <div class="schedule-actions-row">
                                    <button aria-label="Test Bell" class="schedule-btn-test schedule-btn-test-primary" onClick={() => handleTest(idx)}>
                                        <span class="emoji-icon play-icon">▶</span>
                                        Test
                                    </button>
                                    <div class="schedule-action-buttons">
                                        <button aria-label="Edit Schedule" class="schedule-btn-icon" onClick={() => push(`/configure?edit=${idx}`)}>
                                            <span class="emoji-icon">✎</span>
                                        </button>
                                        <button aria-label="Delete Schedule" class="schedule-btn-icon-danger" onClick={() => handleDelete(idx)}>
                                            <span class="emoji-icon">🗑</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                </main>

                <Link to="/configure" aria-label="Add Schedule" class="schedule-fab">
                    <span class="emoji-icon plus-icon">+</span>
                </Link>

                <BottomNav />
            </div>
        </Layout>
    );
};
