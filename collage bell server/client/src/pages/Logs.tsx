import { useEffect, useState } from 'preact/hooks';
import { fetchEvents } from '../api';

export default function Logs() {
    const [events, setEvents] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchEvents();
            setEvents(data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredEvents = events.filter(e =>
        e.device_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.event.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => b.timestamp - a.timestamp); // Newest first by default

    const getEventStyling = (eventStr: string) => {
        const isTrigger = eventStr.includes('trigger');
        const isUpdate = eventStr.includes('update');
        const isError = eventStr.includes('error') || eventStr.includes('fail');
        const isManual = eventStr.includes('manual');

        if (isError) {
            return {
                bg: 'bg-rose-50 dark:bg-rose-900/20',
                text: 'text-rose-600',
                icon: 'error',
                title: 'System Error',
                border: 'border-l-4 border-l-rose-500'
            };
        }
        if (isUpdate) {
            return {
                bg: 'bg-amber-50 dark:bg-amber-900/20',
                text: 'text-amber-600',
                icon: 'system_update',
                title: 'System Update',
                border: ''
            };
        }
        if (isManual) {
            return {
                bg: 'bg-blue-50 dark:bg-blue-900/20',
                text: 'text-blue-600',
                icon: 'touch_app',
                title: 'Manual Action',
                border: 'border-l-4 border-l-blue-500'
            };
        }
        if (isTrigger) {
            return {
                bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                text: 'text-emerald-600',
                icon: 'notifications_active',
                title: 'Bell Triggered',
                border: ''
            };
        }
        return {
            bg: 'bg-primary/10',
            text: 'text-primary',
            icon: 'info',
            title: 'System Info',
            border: ''
        };
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark max-w-lg mx-auto lg:max-w-4xl w-full pb-24 md:pb-6">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight">Logs</h1>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={loadData} disabled={loading} className="flex items-center justify-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <span className={`material-symbols-outlined text-slate-700 dark:text-slate-200 ${loading ? 'animate-spin' : ''}`}>refresh</span>
                    </button>
                </div>
            </header>

            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-slate-900 px-4 py-4 space-y-4 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-[65px] z-10">
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl group-focus-within:text-primary transition-colors">search</span>
                    <input
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400"
                        placeholder="Search logs by device or event type..."
                        type="text"
                        value={searchQuery}
                        onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <button className="flex items-center gap-1 shrink-0 px-3 py-1.5 bg-primary text-white rounded-full text-xs font-medium shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors">
                        All Devices <span className="material-symbols-outlined text-xs">expand_more</span>
                    </button>
                    <button className="flex items-center gap-1 shrink-0 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        Event Type <span className="material-symbols-outlined text-xs">filter_list</span>
                    </button>
                    <button className="flex items-center gap-1 shrink-0 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        Last 24h <span className="material-symbols-outlined text-xs">calendar_today</span>
                    </button>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Activity</span>
                    <button className="flex items-center gap-1 text-primary text-xs font-bold hover:underline">
                        <span className="material-symbols-outlined text-sm">swap_vert</span>
                        Newest First
                    </button>
                </div>
            </div>

            {/* Logs List */}
            <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
                {filteredEvents.map((ev: any) => {
                    const style = getEventStyling(ev.event);
                    return (
                        <div key={ev.id} className={`bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex gap-4 ${style.border} hover:shadow-md transition-shadow`}>
                            <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full ${style.bg} ${style.text}`}>
                                <span className="material-symbols-outlined">{style.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-xs font-bold ${style.text} uppercase tracking-tight truncate pr-2`}>{style.title}</span>
                                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                        {new Date(ev.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 capitalize break-words pr-2">{ev.event.replace(/_/g, ' ')}</p>
                                <div className="mt-2 flex items-center gap-2 flex-wrap">
                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded font-mono truncate max-w-full">
                                        {ev.device_id}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredEvents.length === 0 && !loading && (
                    <div className="text-center py-16 px-4">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-slate-300 text-3xl">history</span>
                        </div>
                        <h3 className="text-slate-500 font-bold mb-1">No logs found</h3>
                        <p className="text-slate-400 text-sm">System events and triggers will appear here.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
