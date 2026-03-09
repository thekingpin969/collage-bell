import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Layout } from '../components/Layout';
import { BottomNav } from '../components/BottomNav';
import { api } from '../api';
import { IconSettings, IconDotsVertical, IconSync, IconChevronRight, IconCheck, IconClock, IconClose, IconWifi, IconPackage, IconSave } from '../components/Icons';
import './Settings.css';

export const Settings = () => {
    const [dateStr, setDateStr] = useState('Loading...');
    const [timeStr, setTimeStr] = useState('Loading...');

    const [wifiStatus, setWifiStatus] = useState({ 
        connected: false, state: 'idle', ip: '', ssid: '', rssi: 0, bssid: '', channel: 0 
    });
    const [wifiSsid, setWifiSsid] = useState('');
    const [wifiPass, setWifiPass] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);

    const [deviceName, setDeviceName] = useState('Loading...');
    const [masterEnable, setMasterEnable] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [apSsid, setApSsid] = useState('');
    const [apPass, setApPass] = useState('');
    const [isApSaving, setIsApSaving] = useState(false);

    // Registration state
    const [deviceId, setDeviceId] = useState('Loading...');
    const [isRegistered, setIsRegistered] = useState(false);
    const [registerNameInput, setRegisterNameInput] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

    // OTA state
    const [fwFile, setFwFile] = useState(null);
    const [fwProgress, setFwProgress] = useState(0);
    const [fwStatus, setFwStatus] = useState('');  // '', 'uploading', 'success', 'error'
    const [fwMessage, setFwMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [fwVersion, setFwVersion] = useState('...');

    useEffect(() => {
        api.getStatus()
            .then(data => {
                if (data.date) setDateStr(data.date);
                if (data.time) setTimeStr(data.time);
            })
            .catch(() => {});
            
        api.getSettings()
            .then(data => {
                if (data.deviceName) setDeviceName(data.deviceName);
                if (data.masterEnable !== undefined) setMasterEnable(data.masterEnable);
            })
            .catch(() => {});

        api.getApConfig()
            .then(data => {
                if (data.ssid) setApSsid(data.ssid);
                if (data.password !== undefined) setApPass(data.password);
            })
            .catch(() => {});

        api.getSystemInfo()
            .then(data => {
                if (data.firmwareVersion) setFwVersion(data.firmwareVersion);
                if (data.deviceId) setDeviceId(data.deviceId);
            })
            .catch(() => {});

        api.getSettings()
            .then(data => {
                if (data.deviceName) setDeviceName(data.deviceName);
                if (data.masterEnable !== undefined) setMasterEnable(data.masterEnable);
                if (data.isRegistered !== undefined) setIsRegistered(data.isRegistered);
            })
            .catch(() => {});
            
        // Initial fetch and start polling WiFi status
        const fetchWifi = () => {
            api.getWifiStatus()
                .then(data => {
                    setWifiStatus(data);
                    if (data.state === 'idle' || data.state === 'connected' || data.state === 'failed') {
                        setIsConnecting(false);
                    }
                    if (data.ssid && !wifiSsid && data.state !== 'failed') {
                        setWifiSsid(data.ssid); // Pre-fill saved SSID if available
                    }
                }).catch(() => {});
        };
        fetchWifi();
        const interval = setInterval(fetchWifi, 3000);
        return () => clearInterval(interval);
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

    const handleWifiConnect = () => {
        if (!wifiSsid) {
            alert('Please enter an SSID');
            return;
        }
        setIsConnecting(true);
        api.setWifiConfig({ ssid: wifiSsid, password: wifiPass })
            .catch(() => {
                alert('Failed to send WiFi config');
                setIsConnecting(false);
            });
    };

    const handleWifiDisconnect = () => {
        setIsConnecting(true); // Reusing this for UI lockout
        api.setWifiDisconnect()
            .then(() => {
                setWifiSsid('');
                setWifiPass('');
            })
            .catch(() => {
                alert('Failed to disconnect');
                setIsConnecting(false);
            });
    };

    const handleSaveSettings = () => {
        setIsSaving(true);
        api.setSettings({ deviceName, masterEnable })
            .then(() => alert('Settings saved successfully!'))
            .catch(() => alert('Failed to save settings'))
            .finally(() => setIsSaving(false));
    };

    const handleSaveApSettings = () => {
        if (!apSsid) {
            alert('AP SSID cannot be empty');
            return;
        }
        if (apPass.length > 0 && apPass.length < 8) {
            alert('AP Password must be at least 8 characters (or empty for open)');
            return;
        }
        if (!confirm('Saving AP settings will restart the device. You will need to reconnect to the new WiFi network. Continue?')) {
            return;
        }
        setIsApSaving(true);
        api.setApConfig({ ssid: apSsid, password: apPass })
            .then(() => alert('AP Settings saved! Device is restarting...'))
            .catch(() => alert('Failed to save AP settings'))
            .finally(() => setIsApSaving(false));
    };

    const handleRegister = () => {
        if (!registerNameInput) {
            alert('Please enter a name for this device.');
            return;
        }
        setIsRegistering(true);
        api.registerDevice({ deviceName: registerNameInput })
            .then(() => {
                alert('Device successfully registered to cloud!');
                setIsRegistered(true);
                setDeviceName(registerNameInput);
            })
            .catch(() => alert('Registration failed. Are you connected to WiFi?'))
            .finally(() => setIsRegistering(false));
    };

    const handleFirmwareUpload = () => {
        if (!fwFile) {
            alert('Please select a firmware file first');
            return;
        }
        if (fwFile.size > 1572864) {
            alert('File too large. Maximum firmware size is 1.5 MB.');
            return;
        }
        if (!confirm('Are you sure you want to update the firmware?\n\nThe device will restart after the update.')) {
            return;
        }

        setIsUploading(true);
        setFwProgress(0);
        setFwStatus('uploading');
        setFwMessage('Uploading firmware...');

        api.uploadFirmware(fwFile, (pct) => {
            setFwProgress(pct);
            if (pct >= 100) setFwMessage('Writing firmware...');
        })
        .then(() => {
            setFwStatus('success');
            setFwMessage('Update complete! Device is restarting...');
            setFwProgress(100);
        })
        .catch((err) => {
            setFwStatus('error');
            setFwMessage(err.message || 'Firmware update failed');
        })
        .finally(() => {
            setIsUploading(false);
        });
    };

    return (
        <Layout>
            <div class="settings-container">
                <header class="settings-header">
                    <div class="settings-header-left">
                        <IconSettings class="lg" style={{ marginRight: '12px' }} />
                        <h1 class="settings-title">Settings</h1>
                    </div>
                    <button type="button" aria-label="More options" class="settings-header-right-btn">
                        <IconDotsVertical />
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
                                    <IconSync />
                                </button>
                            </div>
                            <div class="settings-card-item clickable">
                                <div class="settings-item-info">
                                    <p class="settings-item-title">Date</p>
                                    <p class="settings-item-subtitle primary">{dateStr}</p>
                                </div>
                                <IconChevronRight style={{ color: 'var(--cfg-text-muted-dark)' }} />
                            </div>
                            <div class="settings-card-item clickable">
                                <div class="settings-item-info">
                                    <p class="settings-item-title">Time</p>
                                    <p class="settings-item-subtitle primary">{timeStr}</p>
                                </div>
                                <IconChevronRight style={{ color: 'var(--cfg-text-muted-dark)' }} />
                            </div>
                        </div>
                    </section>

                    <section class="settings-section">
                        <h2 class="settings-section-title">Network Settings</h2>
                        <div class="settings-card">
                            <div class="settings-card-item">
                                <div class="settings-item-info">
                                    <p class="settings-item-title">Status</p>
                                    <p class={`settings-item-subtitle ${wifiStatus.connected ? 'primary' : ''}`}>
                                        {wifiStatus.state === 'connecting' ? 'Connecting to ' + wifiStatus.ssid + '...' :
                                         wifiStatus.connected ? 'Connected: ' + wifiStatus.ip :
                                         wifiStatus.state === 'failed' ? 'Connection Failed' : 'Not Connected'}
                                    </p>
                                </div>
                                <div style={{ color: wifiStatus.connected ? '#10b981' : wifiStatus.state === 'connecting' ? '#eab308' : '#ef4444' }}>
                                    {wifiStatus.connected ? <IconCheck /> : wifiStatus.state === 'connecting' ? <IconClock /> : <IconClose />}
                                </div>
                            </div>
                            
                            {wifiStatus.connected && (
                                <div class="settings-card-item bg-glass-light">
                                    <div class="settings-item-info">
                                        <p class="settings-item-subtitle" style={{ color: '#fff' }}>Connection Details</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                                            <div>
                                                <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Strength: </span>
                                                <span style={{ color: wifiStatus.rssi > -70 ? '#10b981' : wifiStatus.rssi > -85 ? '#eab308' : '#ef4444', fontSize: '0.875rem' }}>
                                                    {wifiStatus.rssi} dBm
                                                </span>
                                            </div>
                                            <div>
                                                <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Channel: </span>
                                                <span style={{ color: '#d1d5db', fontSize: '0.875rem' }}>{wifiStatus.channel}</span>
                                            </div>
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>BSSID: </span>
                                                <span style={{ color: '#d1d5db', fontSize: '0.875rem', fontFamily: 'monospace' }}>{wifiStatus.bssid}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ color: wifiStatus.rssi > -60 ? '#10b981' : wifiStatus.rssi > -80 ? '#eab308' : '#ef4444', display: 'flex', alignItems: 'center' }}>
                                        <IconWifi style={{ width: '28px', height: '28px' }} />
                                    </div>
                                </div>
                            )}

                            <div class="settings-input-group">
                                <label class="settings-label">WiFi Network (SSID)</label>
                                <input 
                                    type="text" 
                                    class="settings-input" 
                                    placeholder="e.g. Home_Network" 
                                    value={wifiSsid} 
                                    onInput={(e) => setWifiSsid(e.target.value)} 
                                />
                            </div>
                            <div class="settings-input-group">
                                <label class="settings-label">Password</label>
                                <input 
                                    type="password" 
                                    class="settings-input" 
                                    placeholder="Network Password" 
                                    value={wifiPass} 
                                    onInput={(e) => setWifiPass(e.target.value)} 
                                />
                            </div>
                            
                            {wifiStatus.connected ? (
                                <div class="settings-card-item clickable bg-glass-red" onClick={handleWifiDisconnect} style={{ justifyContent: 'center' }}>
                                    <p class="settings-item-title text-red" style={{ margin: 0 }}>
                                        {isConnecting ? 'Disconnecting...' : 'Disconnect'}
                                    </p>
                                </div>
                            ) : (
                                <div class="settings-card-item clickable bg-glass-green" onClick={handleWifiConnect} style={{ justifyContent: 'center' }}>
                                    <p class="settings-item-title text-green" style={{ margin: 0 }}>
                                        {isConnecting ? 'Connecting...' : 'Connect to WiFi'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>
                    
                    <section class="settings-section">
                        <h2 class="settings-section-title">Access Point Settings</h2>
                        <div class="settings-card">
                            <div class="settings-input-group">
                                <label class="settings-label">AP Name (SSID)</label>
                                <input 
                                    type="text" 
                                    class="settings-input" 
                                    placeholder="e.g. collage bell" 
                                    value={apSsid} 
                                    onInput={(e) => setApSsid(e.target.value)} 
                                />
                            </div>
                            <div class="settings-input-group">
                                <label class="settings-label">AP Password</label>
                                <input 
                                    type="text" 
                                    class="settings-input" 
                                    placeholder="Leave empty for Open network (min 8 chars)" 
                                    value={apPass} 
                                    onInput={(e) => setApPass(e.target.value)} 
                                />
                            </div>
                            <div class="settings-card-item clickable bg-glass-green" onClick={handleSaveApSettings} style={{ justifyContent: 'center' }}>
                                <p class="settings-item-title text-green" style={{ margin: 0 }}>
                                    {isApSaving ? 'Saving & Restarting...' : 'Save AP Settings'}
                                </p>
                            </div>
                        </div>
                    </section>

                    <section class="settings-section">
                        <h2 class="settings-section-title">Cloud Integration</h2>
                        <div class="settings-card">
                            <div class="settings-card-item">
                                <div class="settings-item-info">
                                    <p class="settings-item-title">Device ID</p>
                                    <p class="settings-item-subtitle" style={{ fontFamily: 'monospace' }}>{deviceId}</p>
                                </div>
                            </div>
                            
                            <div class="settings-card-item">
                                <div class="settings-item-info">
                                    <p class="settings-item-title">Registration Status</p>
                                    <p class={`settings-item-subtitle ${isRegistered ? 'primary' : ''}`} style={{ color: isRegistered ? '#10b981' : '#eab308' }}>
                                        {isRegistered ? 'Registered' : 'Unregistered'}
                                    </p>
                                </div>
                                <div style={{ color: isRegistered ? '#10b981' : '#eab308' }}>
                                    {isRegistered ? <IconCheck /> : <IconDotsVertical />}
                                </div>
                            </div>

                            {!isRegistered && (
                                <>
                                    <div class="settings-input-group">
                                        <label class="settings-label">Location / Device Name</label>
                                        <input 
                                            type="text" 
                                            class="settings-input" 
                                            placeholder="e.g. Main Hall" 
                                            value={registerNameInput} 
                                            onInput={(e) => setRegisterNameInput(e.target.value)} 
                                        />
                                    </div>
                                    <div class="settings-card-item clickable bg-glass-indigo" onClick={handleRegister} style={{ justifyContent: 'center' }}>
                                        <p class="settings-item-title text-indigo" style={{ margin: 0 }}>
                                            {isRegistering ? 'Registering...' : 'Register Device'}
                                        </p>
                                    </div>
                                </>
                            )}
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
                                    <input 
                                        type="checkbox" 
                                        class="settings-toggle-input" 
                                        checked={masterEnable}
                                        onChange={(e) => setMasterEnable(e.target.checked)}
                                    />
                                    <div class="settings-toggle-bg">
                                        <div class="settings-toggle-handle"></div>
                                    </div>
                                </label>
                            </div>
                            <div class="settings-input-group">
                                <label for="device-name" class="settings-label">Device Name</label>
                                <input 
                                    id="device-name" 
                                    type="text" 
                                    class="settings-input" 
                                    placeholder="Enter device name" 
                                    value={deviceName} 
                                    onInput={(e) => setDeviceName(e.target.value)}
                                />
                            </div>
                            <div class="settings-card-item clickable">
                                <div class="settings-item-info">
                                    <p class="settings-item-title">Timezone</p>
                                    <p class="settings-item-subtitle">UTC +5:30 (IST)</p>
                                </div>
                                <IconChevronRight style={{ color: 'var(--cfg-text-muted-dark)' }} />
                            </div>
                        </div>
                    </section>

                    <section class="settings-section">
                        <h2 class="settings-section-title">Firmware Update</h2>
                        <div class="settings-card">
                            <div class="settings-card-item">
                                <div class="settings-item-info">
                                    <p class="settings-item-title">Current Version</p>
                                    <p class="settings-item-subtitle primary">v{fwVersion}</p>
                                </div>
                                <IconPackage style={{ width: '28px', height: '28px', color: '#9ca3af' }} />
                            </div>

                            <div class="settings-input-group">
                                <label class="settings-label">Firmware File (.bin)</label>
                                <input
                                    type="file"
                                    accept=".bin"
                                    class="settings-input settings-file-input"
                                    disabled={isUploading}
                                    onChange={(e) => {
                                        setFwFile(e.target.files[0] || null);
                                        setFwStatus('');
                                        setFwMessage('');
                                        setFwProgress(0);
                                    }}
                                />
                            </div>

                            {fwFile && (
                                <div class="settings-card-item bg-glass-light">
                                    <div class="settings-item-info">
                                        <p class="settings-item-subtitle" style={{ color: '#d1d5db' }}>
                                            {fwFile.name} — {(fwFile.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                </div>
                            )}

                            {fwStatus && (
                                <div class="ota-progress-section">
                                    <div class="ota-progress-bar-bg">
                                        <div
                                            class={`ota-progress-bar-fill ${fwStatus === 'error' ? 'error' : fwStatus === 'success' ? 'success' : ''}`}
                                            style={{ width: `${fwProgress}%` }}
                                        />
                                    </div>
                                    <p class={`ota-status-text ${fwStatus}`}>
                                        {fwStatus === 'uploading' && `${fwProgress}% — `}
                                        {fwMessage}
                                    </p>
                                </div>
                            )}

                            <div
                                class={`settings-card-item clickable ${isUploading || !fwFile ? 'disabled' : ''} ${isUploading ? 'bg-glass-yellow' : 'bg-glass-indigo'}`}
                                onClick={!isUploading && fwFile ? handleFirmwareUpload : undefined}
                                style={{
                                    justifyContent: 'center',
                                    pointerEvents: isUploading || !fwFile ? 'none' : 'auto',
                                    opacity: isUploading || !fwFile ? 0.5 : 1
                                }}
                            >
                                <p class={`settings-item-title ${isUploading ? 'text-yellow' : 'text-indigo'}`} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <IconPackage style={{ width: '20px', height: '20px' }} /> {isUploading ? 'Updating...' : 'Upload Firmware'}
                                </p>
                            </div>
                        </div>
                    </section>

                    <div class="settings-save-container">
                        <button type="button" class="settings-save-btn" onClick={handleSaveSettings} disabled={isSaving}>
                            <IconSave style={{ width: '24px', height: '24px', marginRight: '8px' }} />
                            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
                        </button>
                    </div>
                </main>

                <BottomNav />
            </div>
        </Layout>
    );
};
