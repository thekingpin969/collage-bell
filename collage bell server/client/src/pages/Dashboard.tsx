import { useEffect, useState } from 'preact/hooks';
import { fetchDevices, fetchEvents } from '../api';

export default function Dashboard() {
    const [devices, setDevices] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);

    useEffect(() => {
        fetchDevices().then(setDevices).catch(console.error);
        fetchEvents().then(setEvents).catch(console.error);
    }, []);

    const onlineCount = devices.filter((d: any) => d.status === 'online').length;
    const offlineCount = devices.length - onlineCount;

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-lg mx-auto lg:max-w-4xl">
            {/* Quick Actions (Grid) */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="md:col-span-2 flex items-center justify-center gap-3 bg-primary text-white py-4 px-6 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
                    <span className="material-symbols-outlined">notifications_active</span>
                    Trigger Emergency Bell
                </button>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                    <button className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl font-semibold text-sm hover:border-primary transition-colors">
                        <span className="material-symbols-outlined text-primary text-xl">add_circle</span>
                        Add Device
                    </button>
                    <button className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl font-semibold text-sm hover:border-primary transition-colors">
                        <span className="material-symbols-outlined text-primary text-xl">upload_file</span>
                        Firmware
                    </button>
                </div>
            </section>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Device Status Widget */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Device Status</h3>
                        <span className="material-symbols-outlined text-slate-400">devices</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-3xl font-bold">{devices.length}</p>
                            <p className="text-sm text-slate-500">Total Registered</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                <span className="text-xs font-bold text-green-700 dark:text-green-400">{onlineCount} Online</span>
                            </div>
                            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                <span className="text-xs font-bold text-red-700 dark:text-red-400">{offlineCount} Offline</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Health Widget */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">System Health</h3>
                        <span className="material-symbols-outlined text-slate-400">health_and_safety</span>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">MQTT Broker</span>
                            <span className="flex items-center gap-1.5 text-xs font-bold text-green-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span>
                                Connected
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Cloud Server</span>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Online</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Firmware Version</span>
                            <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">v1.2.0</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Events List */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">Recent Events</h3>
                    <a className="text-xs font-bold text-primary hover:underline" href="/logs">View All</a>
                </div>
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                    {events.slice(0, 5).map((ev: any) => (
                        <div key={ev.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <span className="material-symbols-outlined text-primary text-xl">
                                        {ev.event.includes('trigger') ? 'notifications' : ev.event.includes('update') ? 'system_update' : 'info'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold">{ev.device_id} <span className="text-primary">{ev.event}</span></p>
                                    <p className="text-xs text-slate-500">System Log</p>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-slate-400">
                                {new Date(ev.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}
                    {events.length === 0 && (
                        <div className="px-5 py-8 text-center text-slate-500 text-sm font-medium">
                            No recent events
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
