import { h } from 'preact';
import { useEffect, useState, useRef } from 'preact/hooks';
import { Layout } from '../components/Layout';
import { BottomNav } from '../components/BottomNav';
import { Link } from '../router';
import { api } from '../api';
import { IconSync, IconPower, IconBell, IconSpeaker, IconClose, IconChevronRight } from '../components/Icons';
import './Dashboard.css';

export const Dashboard = () => {
    const handH = useRef(null);
    const handM = useRef(null);
    const handS = useRef(null);

    const [dateStr, setDateStr] = useState('Wed, 4 Mar');
    const [timeStr, setTimeStr] = useState('11:17');
    const [nextBell, setNextBell] = useState('--:--');
    const [scheduleCount, setScheduleCount] = useState(0);
    const [ringing, setRinging] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const timeOffsetRef = useRef(0);

    useEffect(() => {
        let timerId;
        const tick = () => {
            const now = new Date(Date.now() + timeOffsetRef.current);
            const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
            const h12 = h % 12;
            const hDeg = h12 * 30 + m * 0.5 + s * (0.5 / 60);
            const mDeg = m * 6 + s * 0.1;
            const sDeg = s * 6;

            if (handH.current) handH.current.style.transform = `translateX(-50%) rotate(${hDeg}deg)`;
            if (handM.current) handM.current.style.transform = `translateX(-50%) rotate(${mDeg}deg)`;
            if (handS.current) handS.current.style.transform = `translateX(-50%) rotate(${sDeg}deg)`;

            const pad = (n) => String(n).padStart(2, '0');
            setTimeStr(`${pad(h)}:${pad(m)}`);

            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            setDateStr(`${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`);

            timerId = setTimeout(tick, 1000);
        };

        tick();
        return () => clearTimeout(timerId);
    }, []);

    // Fetch live status from ESP32
    useEffect(() => {
        const fetchStatus = () => {
            api.getStatus()
                .then(data => {
                    if (data.nextBell) setNextBell(data.nextBell);
                    if (data.scheduleCount !== undefined) setScheduleCount(data.scheduleCount);
                    if (data.year !== undefined) {
                        const espDate = new Date(data.year, data.month - 1, data.day, data.hour, data.minute, data.second);
                        timeOffsetRef.current = espDate.getTime() - Date.now();
                    }
                })
                .catch(() => {});
        };
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const ringIntervalRef = useRef(null);
    const isRingingRef = useRef(false);

    const startManualRing = () => {
        if (isRingingRef.current) return;
        isRingingRef.current = true;
        setRinging(true);

        api.ring({ state: 'on' }).catch(() => {});
        ringIntervalRef.current = setInterval(() => {
            api.ring({ state: 'on' }).catch(() => {});
        }, 1500);
    };

    const stopManualRing = () => {
        if (!isRingingRef.current) return;
        isRingingRef.current = false;
        setRinging(false);

        if (ringIntervalRef.current) {
            clearInterval(ringIntervalRef.current);
            ringIntervalRef.current = null;
        }
        api.ring({ state: 'off' }).catch(() => {});
    };

    // Handle tab switching and unmount cleanup
    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden) stopManualRing();
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
        };
    }, []);

    // Ensure the ring stops if the bottom sheet is closed while ringing
    useEffect(() => {
        if (!isSheetOpen) {
            stopManualRing();
        }
    }, [isSheetOpen]);

    const handleSyncTime = () => {
        const now = new Date();
        api.setTime({
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            day: now.getDate(),
            hour: now.getHours(),
            min: now.getMinutes(),
            sec: now.getSeconds()
        }).then(() => alert('Time synced!')).catch(() => alert('Sync failed'));
    };

    const handleRestart = () => {
        if (confirm('Are you sure you want to restart the device?')) {
            api.restart()
                .then(() => alert('Device restarting...'))
                .catch(() => alert('Restart failed'));
        }
    };

    return (
        <Layout>
            <div class="db-wrapper">
                <main class="db-main">
                    <div class="db-clock-container">
                        <div class="db-clock-ring">
                            <div class="db-clock-inner">
                                <span class="db-clock-num db-clock-num-12">12</span>
                                <span class="db-clock-num db-clock-num-3">3</span>
                                <span class="db-clock-num db-clock-num-6">6</span>
                                <span class="db-clock-num db-clock-num-9">9</span>
                                
                                <div class="db-clock-dot db-clock-dot-1"></div>
                                <div class="db-clock-dot db-clock-dot-2"></div>
                                <div class="db-clock-dot db-clock-dot-3"></div>
                                <div class="db-clock-dot db-clock-dot-4"></div>
                                
                                <div ref={handH} class="db-clock-hand db-clock-hand-hour"></div>
                                <div ref={handM} class="db-clock-hand db-clock-hand-minute"></div>
                                <div ref={handS} class="db-clock-hand db-clock-hand-second"></div>
                                <div class="db-clock-center"></div>
                            </div>
                        </div>
                    </div>
                    <div class="db-digital-time">
                        {timeStr}
                    </div>
                    <div class="db-time-text">
                        <p>India Standard Time | {dateStr}</p>
                    </div>

                    <div class="db-card">
                        <div class="db-card-header">
                            <h2>System Status</h2>
                            <span class="db-badge">Online &amp; Idle</span>
                        </div>
                        
                        <div class="db-card-grid">
                            <div class="db-stat-item">
                                <p class="db-stat-label">Next Bell</p>
                                <p class="db-stat-value">{nextBell}</p>
                                <p class="db-stat-sub">Upcoming</p>
                            </div>
                            <div class="db-stat-item">
                                <p class="db-stat-label">Schedules</p>
                                <p class="db-stat-value">{scheduleCount}</p>
                                <p class="db-stat-sub">Loaded</p>
                            </div>
                        </div>
                    </div>

                    <div class="db-actions">
                        <h3>Quick Actions</h3>
                        
                        <button class="db-action-btn" onClick={handleSyncTime}>
                            <div class="db-action-content">
                                <div class="db-action-icon blue">
                                    <IconSync />
                                </div>
                                <div class="db-action-text">
                                    <p>Sync Time</p>
                                    <p>Sync RTC with browser time</p>
                                </div>
                            </div>
                            <span class="db-action-chevron">
                                <IconChevronRight style={{ width: '20px', height: '20px' }} />
                            </span>
                        </button>

                        <button class="db-action-btn" onClick={handleRestart}>
                            <div class="db-action-content">
                                <div class="db-action-icon red">
                                    <IconPower />
                                </div>
                                <div class="db-action-text">
                                    <p>Restart Device</p>
                                    <p>Reboot ESP32 controller</p>
                                </div>
                            </div>
                            <span class="db-action-chevron">
                                <IconChevronRight style={{ width: '20px', height: '20px' }} />
                            </span>
                        </button>
                    </div>
                </main>

                <div class="db-fab-container">
                    <button 
                        onClick={() => setIsSheetOpen(true)}
                        aria-label="Open Manual Ring" 
                        class="db-fab-btn" 
                    >
                        <IconBell style={{ width: '28px', height: '28px' }} />
                    </button>
                </div>

                {/* Bottom Sheet Overlay */}
                <div 
                    class={`db-sheet-overlay ${isSheetOpen ? 'active' : ''}`}
                    onClick={() => setIsSheetOpen(false)}
                ></div>

                {/* Bottom Sheet Content */}
                <div class={`db-sheet ${isSheetOpen ? 'active' : ''}`}>
                    <div class="db-sheet-header">
                        <h2 class="db-sheet-title">Manual Ring</h2>
                        <button aria-label="Close" class="db-sheet-close" onClick={() => setIsSheetOpen(false)}>
                            <IconClose />
                        </button>
                    </div>
                    <div class="db-sheet-body">
                        <p class="db-sheet-desc">
                            Press and hold the button below to ring the bell continuously.
                            The bell will stop automatically when you release the button.
                        </p>
                        <button
                            class={`db-sheet-ring-btn ${ringing ? 'active' : ''}`}
                            onPointerDown={startManualRing}
                            onPointerUp={stopManualRing}
                            onPointerLeave={stopManualRing}
                            onPointerCancel={stopManualRing}
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            {ringing ? <IconSpeaker style={{ width: '28px', height: '28px' }} /> : <IconBell style={{ width: '28px', height: '28px' }} />}
                            <span>{ringing ? 'Ringing...' : 'Press & Hold to Ring'}</span>
                        </button>
                    </div>
                </div>

                <BottomNav />
            </div>
        </Layout>
    );
};
