import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Layout } from '../components/Layout';
import { BottomNav } from '../components/BottomNav';
import { api } from '../api';
import './Settings.css';

export const Settings = () => {
    const [dateStr, setDateStr] = useState('Loading...');
    const [timeStr, setTimeStr] = useState('Loading...');

    useEffect(() => {
        api.getStatus()
            .then(data => {
                if (data.date) setDateStr(data.date);
                if (data.time) setTimeStr(data.time);
            })
            .catch(() => {});
    }, []);

    const syncTime = () => {
        const now = new Date();
        api.setTime({
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            day: now.getDate(),
            hour: now.getHours(),
            min: now.getMinutes(),
            sec: now.getSeconds()
        }).then(() => {
            alert('RTC time synced!');
            // Refresh display
            api.getStatus().then(data => {
                if (data.date) setDateStr(data.date);
                if (data.time) setTimeStr(data.time);
            });
        }).catch(() => alert('Sync failed'));
    };

    return (
        <Layout>
            <div class="settings-container">
                <header class="settings-header">
                    <div class="settings-header-left">
                        <span class="emoji-icon lg">⚙️</span>
                        <h1 class="settings-title">Settings</h1>
                    </div>
                    <button type="button" aria-label="More options" class="settings-header-right-btn">
                        <span class="emoji-icon">⋮</span>
                    </button>
                </header>

                <main class="settings-main">
                    <section class="settings-section">
                        <h2 class="settings-section-title">RTC Time Settings</h2>
                        <div class="settings-card">
                            <div class="settings-card-item clickable" onClick={syncTime}>
                                <div class="settings-item-info">
                                    <p class="settings-item-title">Sync with Browser</p>
                                    <p class="settings-item-subtitle">Update RTC with current device time</p>
                                </div>
                                <button type="button" aria-label="Sync Time" class="settings-sync-btn">
                                    <span class="emoji-icon">🔄</span>
                                </button>
                            </div>
                            <div class="settings-card-item clickable">
                                <div class="settings-item-info">
                                    <p class="settings-item-title">Date</p>
                                    <p class="settings-item-subtitle primary">{dateStr}</p>
                                </div>
                                <span class="settings-chevron">❯</span>
                            </div>
                            <div class="settings-card-item clickable">
                                <div class="settings-item-info">
                                    <p class="settings-item-title">Time</p>
                                    <p class="settings-item-subtitle primary">{timeStr}</p>
                                </div>
                                <span class="settings-chevron">❯</span>
                            </div>
                        </div>
                    </section>
                    
                    <section class="settings-section">
                        <h2 class="settings-section-title">System Options</h2>
                        <div class="settings-card">
                            <div class="settings-card-item">
                                <div class="settings-item-info">
                                    <p class="settings-item-title">Master Enable</p>
                                    <p class="settings-item-subtitle">Turn entire bell system on/off</p>
                                </div>
                                <label class="settings-toggle">
                                    <input type="checkbox" class="settings-toggle-input" checked />
                                    <div class="settings-toggle-bg">
                                        <div class="settings-toggle-handle"></div>
                                    </div>
                                </label>
                            </div>
                            <div class="settings-input-group">
                                <label for="device-name" class="settings-label">Device Name</label>
                                <input id="device-name" type="text" class="settings-input" placeholder="Enter device name" value="Main Building Bell" />
                            </div>
                            <div class="settings-card-item clickable">
                                <div class="settings-item-info">
                                    <p class="settings-item-title">Timezone</p>
                                    <p class="settings-item-subtitle">UTC +5:30 (IST)</p>
                                </div>
                                <span class="settings-chevron">❯</span>
                            </div>
                        </div>
                    </section>

                    <div class="settings-save-container">
                        <button type="button" class="settings-save-btn">
                            <span class="emoji-icon lg">💾</span>
                            <span>Save Settings</span>
                        </button>
                    </div>
                </main>

                <BottomNav />
            </div>
        </Layout>
    );
};
