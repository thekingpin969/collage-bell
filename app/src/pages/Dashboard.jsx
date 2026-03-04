import { h } from 'preact';
import { useEffect, useState, useRef } from 'preact/hooks';
import { Layout } from '../components/Layout';
import { BottomNav } from '../components/BottomNav';
import { Link } from '../router';

export const Dashboard = () => {
  const handH = useRef(null);
  const handM = useRef(null);
  const handS = useRef(null);
  const clockDigital = useRef(null);
  
  const [dateStr, setDateStr] = useState('{{DATE_STR}}');
  const [timeStr, setTimeStr] = useState('{{TIME_STR}}');

  useEffect(() => {
    let timerId;
    const tick = () => {
      const now = new Date();
      const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
      const h12 = h % 12;
      const hDeg = h12 * 30 + m * 0.5 + s * (0.5 / 60);
      const mDeg = m * 6 + s * 0.1;
      const sDeg = s * 6;

      if (handH.current) handH.current.style.transform = `translateX(-50%) rotate(${hDeg}deg)`;
      if (handM.current) handM.current.style.transform = `translateX(-50%) rotate(${mDeg}deg)`;
      if (handS.current) handS.current.style.transform = `translateX(-50%) rotate(${sDeg}deg)`;

      if (clockDigital.current && clockDigital.current.textContent.includes('{{')) {
        const pad = (n) => String(n).padStart(2, '0');
        clockDigital.current.textContent = `${pad(h)}:${pad(m)}`;
      }

      timerId = setTimeout(tick, 1000);
    };
    
    tick();
    return () => clearTimeout(timerId);
  }, []);

  return (
    <Layout>
      <header class="header">
        <h1>Dashboard</h1>
        <Link to="/settings" class="icon-btn" aria-label="Settings">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
        </Link>
      </header>
      
      <main class="main-content dashboard-main">
        <div class="clock-container">
            <div class="clock-glow"></div>
            <div class="clock-ring">
                <div class="clock-inner">
                    <span class="clock-num clock-num-12">12</span>
                    <span class="clock-num clock-num-3">3</span>
                    <span class="clock-num clock-num-6">6</span>
                    <span class="clock-num clock-num-9">9</span>

                    <div class="clock-dot clock-dot-1"></div>
                    <div class="clock-dot clock-dot-2"></div>
                    <div class="clock-dot clock-dot-3"></div>
                    <div class="clock-dot clock-dot-4"></div>
                    <div class="clock-dot clock-dot-5"></div>
                    <div class="clock-dot clock-dot-6"></div>
                    <div class="clock-dot clock-dot-7"></div>
                    <div class="clock-dot clock-dot-8"></div>

                    <div class="hand hand-hour" ref={handH} style="transform: translateX(-50%) rotate(0deg)"></div>
                    <div class="hand hand-minute" ref={handM} style="transform: translateX(-50%) rotate(0deg)"></div>
                    <div class="hand hand-second" ref={handS} style="transform: translateX(-50%) rotate(0deg)"></div>

                    <div class="center-dot"></div>
                </div>
            </div>
        </div>

        <div class="subtitle">
            <span id="clock-digital" ref={clockDigital}>{timeStr}</span> | <span id="clock-date">{dateStr}</span>
        </div>

        <div class="card">
            <div class="card-header">
                <h2 class="card-title">System Status</h2>
                <span class="badge">Online &amp; Idle</span>
            </div>
            <div class="grid-2">
                <div class="space-y-1 stat-box">
                    <p class="stat-label">Next Bell</p>
                    <p class="stat-value">{"{{NEXT_BELL}}"}</p>
                    <p class="stat-sub">Short Ring (15s)</p>
                </div>
                <div class="space-y-1 stat-box">
                    <p class="stat-label">Schedules</p>
                    <p class="stat-value">20</p>
                    <p class="stat-sub">Loaded today</p>
                </div>
            </div>
        </div>

        <div class="actions-section w-full">
            <span class="section-title">Quick Actions</span>

            <Link to="/maintenance" class="action-btn">
                <div class="flex items-center space-x-4">
                    <div class="action-icon-container action-icon-blue">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                        </svg>
                    </div>
                    <div class="action-text">
                        <p class="action-title">Sync Time (NTP)</p>
                        <p class="action-subtitle">Last synced 2 mins ago</p>
                    </div>
                </div>
                <div class="chevron">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                    </svg>
                </div>
            </Link>

            <Link to="/maintenance" class="action-btn">
                <div class="flex items-center space-x-4">
                    <div class="action-icon-container action-icon-red">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                            <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z" />
                        </svg>
                    </div>
                    <div class="action-text">
                        <p class="action-title">Restart Device</p>
                        <p class="action-subtitle">Reboot ESP32 controller</p>
                    </div>
                </div>
                <div class="chevron">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                    </svg>
                </div>
            </Link>
        </div>
      </main>

      <div class="fab-container">
          <form action="/ring" method="POST" onSubmit={e => e.preventDefault()}>
              <button type="submit" class="fab" aria-label="Ring Bell Now">
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
                  </svg>
              </button>
          </form>
      </div>

      <BottomNav />
    </Layout>
  );
};
