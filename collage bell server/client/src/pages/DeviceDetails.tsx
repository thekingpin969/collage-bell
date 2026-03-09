import { useEffect, useState } from 'preact/hooks';
import { useRoute, useLocation } from 'wouter';
import { fetchDevices, fetchEvents, fetchSchedules, sendCommand, triggerBells } from '../api';
import { TriggerBottomSheet } from '../components/TriggerBottomSheet';
import { ManualTriggerBottomSheet } from '../components/ManualTriggerBottomSheet';
import { ConfirmationModal } from '../components/ConfirmationModal';

export default function DeviceDetails() {
    const [, params] = useRoute('/device/:id');
    const [, setLocation] = useLocation();
    const deviceId = params?.id || '';

    const [device, setDevice] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isTriggerSheetOpen, setIsTriggerSheetOpen] = useState(false);
    const [isManualSheetOpen, setIsManualSheetOpen] = useState(false);

    // Confirmation Modal States
    const [confirmModalData, setConfirmModalData] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmText: string;
        confirmColor: 'primary' | 'rose' | 'amber';
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        confirmColor: 'primary',
        onConfirm: () => { }
    });

    const openConfirmModal = (title: string, message: string, confirmText: string, confirmColor: 'primary' | 'rose' | 'amber', onConfirm: () => void) => {
        setConfirmModalData({
            isOpen: true,
            title,
            message,
            confirmText,
            confirmColor,
            onConfirm
        });
    };

    const loadData = async () => {
        if (!deviceId) return;
        setLoading(true);
        try {
            const [allDevices, allEvents, allSchedules] = await Promise.all([
                fetchDevices(),
                fetchEvents(),
                fetchSchedules()
            ]);
            const foundDevice = allDevices.find((d: any) => d.device_id === deviceId);
            setDevice(foundDevice);
            setEvents(allEvents.filter((e: any) => e.device_id === deviceId));
            setSchedules(allSchedules.filter((s: any) => s.device_id === deviceId));
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (deviceId) loadData();
        // Auto-refresh every 15 seconds to match ESP status interval
        const interval = setInterval(() => {
            if (deviceId) loadData();
        }, 15000);
        return () => clearInterval(interval);
    }, [deviceId]);

    // Helper: format uptime from seconds
    const formatUptime = (seconds: number | string | null) => {
        if (!seconds) return 'N/A';
        const s = typeof seconds === 'string' ? parseInt(seconds) : seconds;
        if (isNaN(s)) return 'N/A';
        const d = Math.floor(s / 86400);
        const h = Math.floor((s % 86400) / 3600);
        const m = Math.floor((s % 3600) / 60);
        if (d > 0) return `${d}d ${h}h ${m}m`;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    // Helper: WiFi signal label
    const wifiSignalLabel = (rssi: number | string | null) => {
        if (!rssi) return 'N/A';
        const r = typeof rssi === 'string' ? parseInt(rssi) : rssi;
        if (isNaN(r)) return 'N/A';
        return `${r} dBm`;
    };

    // Helper: format bytes to human-readable
    const formatBytes = (bytes: number | null) => {
        if (!bytes && bytes !== 0) return 'N/A';
        if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
        if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${bytes} B`;
    };

    const handleAction = async (action: string) => {
        setLoading(true);
        try {
            await sendCommand([deviceId], action);
        } catch {
            alert("Failed to send command.");
        }
        setLoading(false);
    };

    const handleCustomTrigger = async (pattern: number[][]) => {
        setLoading(true);
        try {
            await triggerBells([deviceId], pattern);
        } catch {
            alert("Failed to trigger bell.");
        }
        setLoading(false);
    };

    if (!device && !loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 h-[80vh] text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-4 text-slate-300">device_unknown</span>
                <h2 className="font-medium">Device not found or not registered</h2>
                <button className="mt-4 flex items-center gap-1 text-primary font-bold hover:underline" onClick={() => setLocation('/devices')}>
                    <span className="material-symbols-outlined">arrow_back</span> Back to Devices
                </button>
            </div>
        );
    }

    const isOnline = device?.status === 'online';
    const isUnregistered = !device?.is_registered;
    const isEnabled = device?.is_enabled !== false; // Only falsy if strictly false

    return (
        <div className="pb-24 max-w-md mx-auto xl:max-w-2xl">
            {/* Header Navigation */}
            <div className="sticky top-0 z-10 flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 justify-between border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined cursor-pointer" onClick={() => setLocation('/devices')}>arrow_back</span>
                    <h2 className="text-lg font-bold leading-tight tracking-tight">Device Details</h2>
                </div>
                <div className="flex items-center gap-4">
                    <span className={`material-symbols-outlined cursor-pointer ${loading ? 'animate-spin' : ''}`} onClick={loadData}>refresh</span>
                    <span className="material-symbols-outlined cursor-pointer">settings</span>
                </div>
            </div>

            <div className="px-4 pt-6 space-y-6">
                {/* Device Header */}
                <div className="flex items-start gap-4">
                    <div className="bg-primary/20 p-4 rounded-xl">
                        <span className="material-symbols-outlined text-primary text-4xl">
                            {isOnline ? 'notifications_active' : 'notifications_off'}
                        </span>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold truncate max-w-[200px]">{device?.name || device?.device_id || 'Unknown Device'}</h1>
                            {isUnregistered ? (
                                <>
                                    <span className="flex h-2 w-2 rounded-full bg-amber-500"></span>
                                    <span className="text-amber-500 text-xs font-semibold uppercase tracking-wider">Unregistered</span>
                                </>
                            ) : isOnline ? (
                                <>
                                    <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                                    <span className="text-emerald-500 text-xs font-semibold uppercase tracking-wider">Online</span>
                                </>
                            ) : (
                                <>
                                    <span className="flex h-2 w-2 rounded-full bg-red-500"></span>
                                    <span className="text-red-500 text-xs font-semibold uppercase tracking-wider">Offline</span>
                                </>
                            )}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            ID: {device?.device_id} • {(device?.name && device.name.includes("Main")) ? "Block A" : (device?.name && device.name.includes("Secondary") ? "Block B" : "Microcontroller")}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="bg-slate-200 dark:bg-slate-800 text-[10px] px-2 py-0.5 rounded font-mono">v{device?.firmware_version || '0.0.0'}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Grid */}
                <section>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            disabled={!isOnline || loading || !isEnabled}
                            onClick={() => setIsTriggerSheetOpen(true)}
                            className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-transform active:scale-95 ${isOnline && isEnabled ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
                        >
                            <span className="material-symbols-outlined">{isEnabled ? 'notification_important' : 'notifications_paused'}</span>
                            <span>Trigger Bell</span>
                        </button>
                        <button
                            disabled={!isOnline || loading || !isEnabled}
                            onClick={() => setIsManualSheetOpen(true)}
                            className={`flex items-center gap-3 p-4 rounded-xl font-bold border ${isOnline && isEnabled ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 active:bg-slate-100 dark:active:bg-slate-700' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 text-slate-400 cursor-not-allowed'}`}
                        >
                            <span className="material-symbols-outlined">touch_app</span>
                            <span>Manual</span>
                        </button>
                        <button
                            disabled={!isOnline || loading}
                            onClick={() => openConfirmModal(
                                'Restart Device',
                                `Are you sure you want to restart ${device?.name || 'this device'}? The device will take about 10 seconds to come back online.`,
                                'Restart',
                                'primary',
                                () => handleAction('restart')
                            )}
                            className={`flex items-center gap-3 p-4 rounded-xl font-bold border ${isOnline ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 active:bg-slate-100 dark:active:bg-slate-700' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 text-slate-400 cursor-not-allowed'}`}
                        >
                            <span className="material-symbols-outlined">restart_alt</span>
                            <span>Restart</span>
                        </button>
                        <button
                            disabled={!isOnline || loading}
                            onClick={() => openConfirmModal(
                                `${isEnabled ? 'Disable' : 'Enable'} Device`,
                                `Are you sure you want to ${isEnabled ? 'disable' : 'enable'} this device? ${isEnabled ? 'All physical triggers will be blocked until re-enabled.' : 'It will immediately begin processing normal schedules and bells again.'}`,
                                isEnabled ? 'Disable' : 'Enable',
                                isEnabled ? 'rose' : 'primary',
                                () => handleAction(isEnabled ? 'disable_device' : 'enable_device')
                            )}
                            className={`flex items-center gap-3 p-4 rounded-xl font-bold border ${isOnline ? (isEnabled ? 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-500/20' : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-500/20') : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 text-slate-400 cursor-not-allowed'}`}
                        >
                            <span className="material-symbols-outlined">{isEnabled ? 'power_settings_new' : 'power'}</span>
                            <span>{isEnabled ? 'Disable' : 'Enable'}</span>
                        </button>
                    </div>
                </section>

                {/* Device Health & Bell Ops */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">health_and_safety</span> HEALTH
                        </h4>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs">WiFi</span>
                                <span className={`text-xs font-mono font-medium ${device?.wifi_connected ? 'text-emerald-500' : 'text-slate-500'}`}>
                                    {device?.wifi_connected ? wifiSignalLabel(device?.wifi_signal) : 'Disconnected'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs">RTC</span>
                                <span className={`text-xs font-mono font-medium ${device?.rtc_status === 'ok' ? 'text-emerald-500' : device?.rtc_status === 'battery_low' ? 'text-amber-500' : 'text-slate-500'}`}>
                                    {device?.rtc_status === 'ok' ? 'OK' : device?.rtc_status === 'battery_low' ? 'Battery Low' : (device?.rtc_status || 'N/A')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs">MQTT</span>
                                <span className={`text-xs font-mono font-medium ${device?.mqtt_status === 'connected' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {device?.mqtt_status === 'connected' ? 'Connected' : (device?.mqtt_status || 'Offline')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs">Temp</span>
                                <span className="text-xs font-mono font-medium text-slate-500">
                                    {device?.temperature ? `${parseFloat(device.temperature).toFixed(2)}°C` : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">alarm</span> BELL OPS
                        </h4>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs">Rings Today</span>
                                <span className="text-primary text-xs font-bold">
                                    {device?.total_bell_rings ?? 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs">Schedules</span>
                                <span className="text-slate-400 text-xs font-mono">
                                    {device?.schedule_count ?? 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs">Last Seen</span>
                                <span className="text-slate-400 text-xs font-mono">
                                    {device?.last_seen ? new Date(device.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs">Uptime</span>
                                <span className="text-slate-400 text-xs font-mono">
                                    {formatUptime(device?.uptime)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Schedules List */}
                <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold">Active Schedules</h3>
                            <p className="text-[10px] text-slate-500">{schedules.filter(s => s.enabled).length} enabled / {schedules.length} total</p>
                        </div>
                        <button className="text-primary text-sm font-bold" onClick={() => setLocation('/schedules')}>Manage All</button>
                    </div>
                    {schedules.length > 0 ? (
                        <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-48 overflow-y-auto">
                            {schedules.map((s: any) => (
                                <div key={s.id} className="p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className={`font-mono font-bold ${s.enabled ? 'text-primary' : 'text-slate-400'}`}>
                                            {s.hour.toString().padStart(2, '0')}:{s.minute.toString().padStart(2, '0')}
                                        </span>
                                        <span className="text-xs text-slate-500 font-mono tracking-tighter truncate max-w-[120px]">
                                            {JSON.stringify(s.pattern)}
                                        </span>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-300 dark:text-slate-600">chevron_right</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-slate-500">
                            <span className="material-symbols-outlined text-3xl mb-2 opacity-50">event_busy</span>
                            <p className="text-sm">No schedules active</p>
                        </div>
                    )}
                </section>

                {/* Network & System */}
                <section className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">WiFi Station</h3>
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">IP Address</p>
                                <p className="text-sm font-mono">{device?.ip_address || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">SSID</p>
                                <p className="text-sm font-mono truncate">{device?.ssid || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Signal</p>
                                <p className="text-sm font-mono">{wifiSignalLabel(device?.wifi_signal)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Channel</p>
                                <p className="text-sm font-mono">{device?.wifi_channel ?? 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Access Point Info */}
                <section className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">Access Point</h3>
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">AP SSID</p>
                                <p className="text-sm font-mono">{device?.ap_ssid || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">AP Password</p>
                                <p className="text-sm font-mono">{device?.ap_password || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">AP IP</p>
                                <p className="text-sm font-mono">{device?.ap_ip || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Connections</p>
                                <p className="text-sm font-mono">{device?.ap_connections ?? 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* System Resources */}
                <section className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">System Resources</h3>
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Heap</p>
                                <p className="text-sm font-mono">{device?.free_heap ? `${formatBytes(device.free_heap)} / ${formatBytes(device.total_heap)}` : 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Flash</p>
                                <p className="text-sm font-mono">{device?.free_flash ? `${formatBytes(device.free_flash)} / ${formatBytes(device.flash_size)}` : 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">ESP Time</p>
                                <p className="text-sm font-mono">{device?.current_time ? new Date(device.current_time * 1000).toLocaleTimeString() : 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Uptime</p>
                                <p className="text-sm font-mono">{formatUptime(device?.uptime)}</p>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">system_update</span>
                                <div>
                                    <p className="text-xs font-bold">Firmware Update</p>
                                    <p className="text-[10px] text-slate-500">v{device?.firmware_version || '0.0.0'} installed</p>
                                </div>
                            </div>
                            <button className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-bold" onClick={() => setLocation('/firmware')}>Update</button>
                        </div>
                    </div>
                </section>

                {/* Event Logs Preview */}
                <section className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">Recent Events</h3>
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        {events.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                {events.slice(0, 5).map((ev: any) => {
                                    const isTrigger = ev.event.includes('trigger');
                                    const isUpdate = ev.event.includes('update');
                                    const isError = ev.event.includes('error') || ev.event.includes('fail');

                                    return (
                                        <div key={ev.id} className="p-3 flex items-center gap-3">
                                            <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                                                {new Date(ev.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                            <span className={`material-symbols-outlined text-base flex-shrink-0 ${isError ? 'text-rose-500' : isTrigger ? 'text-emerald-500' : isUpdate ? 'text-amber-500' : 'text-primary'}`}>
                                                {isError ? 'error' : isTrigger ? 'check_circle' : isUpdate ? 'system_update' : 'info'}
                                            </span>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                                                {ev.event}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-6 text-center text-slate-500">
                                <span className="material-symbols-outlined text-3xl mb-2 opacity-50">history</span>
                                <p className="text-sm">No recent events logged</p>
                            </div>
                        )}
                        {events.length > 5 && (
                            <div className="p-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-center">
                                <button className="text-xs font-bold text-primary" onClick={() => setLocation('/logs')}>View All Logs</button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Advanced Controls / Danger Zone */}
                <section className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-rose-500 px-1">Advanced Controls</h3>
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4">
                        <button
                            className="w-full flex items-center justify-between p-3 rounded-lg border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors"
                            onClick={() => openConfirmModal(
                                'Factory Reset',
                                'This will irreversibly erase all settings, schedules, and force the ESP32 to drop offline to recreate its setup Hotspot. Are you sure?',
                                'Factory Reset',
                                'rose',
                                () => handleAction('factory_reset')
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined">factory</span>
                                <span className="text-sm font-medium">Factory Reset</span>
                            </div>
                            <span className="material-symbols-outlined">warning</span>
                        </button>
                    </div>
                </section>
            </div>

            <TriggerBottomSheet
                isOpen={isTriggerSheetOpen}
                onClose={() => setIsTriggerSheetOpen(false)}
                onTrigger={handleCustomTrigger}
                deviceName={device?.name || device?.device_id || 'Unknown Device'}
            />

            <ManualTriggerBottomSheet
                isOpen={isManualSheetOpen}
                onClose={() => setIsManualSheetOpen(false)}
                deviceId={deviceId}
                deviceName={device?.name || device?.device_id || 'Unknown Device'}
            />

            <ConfirmationModal
                {...confirmModalData}
                onClose={() => setConfirmModalData(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
