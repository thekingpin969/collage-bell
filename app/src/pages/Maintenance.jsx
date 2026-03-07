import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Layout } from '../components/Layout';
import { BottomNav } from '../components/BottomNav';
import { api } from '../api';
import './Maintenance.css';

export const Maintenance = () => {
    const [sysInfo, setSysInfo] = useState({ uptime: '...', freeHeap: '...' });
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = () => {
        Promise.all([api.getSystemInfo(), api.getLogs()])
            .then(([sys, logData]) => {
                setSysInfo(sys);
                setLogs(logData);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, []);

    const iconMap = {
        bell: '🔔', manual: '👆', wifi: '📶', system: '⚙️', error: '❌', info: 'ℹ️'
    };
    const colorMap = {
        bell: 'primary', manual: 'blue', wifi: 'yellow', system: 'gray', error: 'primary', info: 'blue'
    };

    return (
        <Layout>
            <div class="mnt-wrapper">
                <header class="mnt-header">
                    <h1>Maintenance</h1>
                    <button class="mnt-header-btn" aria-label="More options">
                        ⋮
                    </button>
                </header>

                <main class="mnt-main">
                    <section class="mnt-section">
                        <h2 class="mnt-section-title">System Info</h2>
                        <div class="mnt-card">
                            <div style={{display:'flex', justifyContent:'space-between', padding:'0.75rem 0', borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                                <span style={{color:'#9CA3AF'}}>Uptime</span>
                                <span style={{color:'#34D399', fontWeight:600}}>{sysInfo.uptime}</span>
                            </div>
                            <div style={{display:'flex', justifyContent:'space-between', padding:'0.75rem 0'}}>
                                <span style={{color:'#9CA3AF'}}>Free Heap</span>
                                <span style={{color:'#34D399', fontWeight:600}}>{sysInfo.freeHeap} KB</span>
                            </div>
                        </div>
                    </section>

                    <section class="mnt-section">
                        <h2 class="mnt-section-title">Firmware Update</h2>
                        <div class="mnt-card">
                            <div class="mnt-upload-box">
                                <span class="mnt-upload-icon">☁️</span>
                                <div>
                                    <p class="mnt-upload-text">Select firmware file</p>
                                    <p class="mnt-upload-subtext">.bin files only</p>
                                </div>
                                <div class="mnt-upload-btn">
                                    Browse Files
                                </div>
                                <input type="file" accept=".bin" class="mnt-file-input" aria-label="Upload Firmware" />
                            </div>
                            
                            <button type="button" class="mnt-update-btn">
                                <span style={{ fontSize: '18px' }}>⬇️</span>
                                Start Update
                            </button>
                        </div>
                    </section>

                    <section class="mnt-section">
                        <div class="mnt-section-header">
                            <h2 class="mnt-section-title">Recent Logs</h2>
                            <div class="mnt-header-actions">
                                <button class="mnt-action-btn refresh" onClick={fetchData}>
                                    <span style={{ fontSize: '16px' }}>🔄</span>
                                    Refresh
                                </button>
                                <button class="mnt-action-btn clear">
                                    <span style={{ fontSize: '16px' }}>🗑️</span>
                                    Clear
                                </button>
                            </div>
                        </div>

                        <div class="mnt-logs-card">
                            <div class="mnt-logs-list">
                                {loading && <p style={{textAlign:'center', color:'#9CA3AF', padding:'1rem'}}>Loading...</p>}
                                {!loading && logs.length === 0 && (
                                    <p style={{textAlign:'center', color:'#9CA3AF', padding:'1rem'}}>No logs available</p>
                                )}
                                {logs.map((log, idx) => (
                                    <div class="mnt-log-item" key={idx}>
                                        <div class={`mnt-log-icon-wrapper ${colorMap[log.type] || 'gray'}`}>
                                            {iconMap[log.type] || '📋'}
                                        </div>
                                        <div class="mnt-log-content">
                                            <p class="mnt-log-title">{log.title}</p>
                                            <p class="mnt-log-time">{log.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </main>

                <BottomNav />
            </div>
        </Layout>
    );
};
