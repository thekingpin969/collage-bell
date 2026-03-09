import { useEffect, useState } from 'preact/hooks';
import { fetchDevices } from '../api';
import { useLocation } from 'wouter';

function timeAgo(dateString: string) {
    if (!dateString) return 'Never';

    // Parse the date and ADD 5.5 hours (IST offset) to correct backend TZ sync issue
    const dbDate = new Date(dateString);
    const date = new Date(dbDate.getTime() + (5.5 * 60 * 60 * 1000));
    const now = new Date();

    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'Just now'; // fallback for slight future syncs

    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return `${diffSecs} sec${diffSecs !== 1 ? 's' : ''} ago`;
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

export default function Devices() {
    const [devices, setDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [, setLocation] = useLocation();

    const load = () => fetchDevices().then(setDevices);
    useEffect(() => { load() }, []);

    const filteredDevices = devices.filter(d =>
        (d.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.device_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 overflow-y-auto pb-24">
            {/* Header Section */}
            <div className="px-4 py-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Devices</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your automation hardware</p>
                </div>
                <button
                    onClick={load}
                    disabled={loading}
                    className="bg-primary text-white p-3 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95"
                >
                    <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>
                        {loading ? 'refresh' : 'add'}
                    </span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="px-4 mb-6">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                        <span className="material-symbols-outlined text-xl">search</span>
                    </div>
                    <input
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400"
                        placeholder="Search devices by name or ID..."
                        type="text"
                        value={searchQuery}
                        onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                    />
                </div>
            </div>

            {/* Device Cards List */}
            <div className="px-4 space-y-4">
                {filteredDevices.map((d: any) => {
                    const isOnline = d.status === 'online';
                    const isUnregistered = !d.is_registered;
                    const isEnabled = d.is_enabled ?? true;

                    return (
                        <div
                            key={d.device_id}
                            onClick={() => setLocation(`/device/${d.device_id}`)}
                            className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden cursor-pointer hover:border-primary/30 hover:shadow-md transition-all ${!isOnline || !isEnabled ? 'opacity-80' : ''}`}
                        >
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                                            <span className={`material-symbols-outlined ${isOnline ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400'}`}>
                                                {isOnline ? 'notifications_active' : 'notifications_off'}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-slate-100">
                                                {d.name ? `${d.name} (${d.device_id})` : d.device_id}
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">location_on</span> {(d.name && d.name.includes("Main")) ? "Block A" : (d.name && d.name.includes("Secondary") ? "Block B" : "Microcontroller")}
                                            </p>
                                        </div>
                                    </div>

                                    {isUnregistered ? (
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider">
                                            Unregistered
                                        </div>
                                    ) : !isOnline ? (
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-semibold">
                                            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                                            Offline
                                        </div>
                                    ) : !isEnabled ? (
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-xs font-semibold uppercase tracking-wider">
                                            DISABLED
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                                            ENABLED
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Firmware</p>
                                        <p className="text-sm font-medium">{d.firmware_version || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Last Seen</p>
                                        <p className="text-sm font-medium">{timeAgo(d.last_seen)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {devices.length === 0 && !loading && (
                    <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">devices_off</span>
                        <h3 className="text-slate-500 font-medium">No devices found</h3>
                        <p className="text-slate-400 text-xs mt-1">Connect an ESP32 to the MQTT broker to see it here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
