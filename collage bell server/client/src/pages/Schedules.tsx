import { useEffect, useState } from 'preact/hooks';
import { createSchedule, fetchSchedules, fetchDevices } from '../api';

export default function Schedules() {
    const [schedules, setSchedules] = useState<any[]>([]);
    const [devices, setDevices] = useState<any[]>([]);

    const [deviceId, setDeviceId] = useState('');
    const [hour, setHour] = useState('9');
    const [minute, setMinute] = useState('0');
    const [patternStr, setPatternStr] = useState('[[2,1],[2,1]]');

    const load = () => {
        fetchSchedules().then(setSchedules);
        fetchDevices().then(setDevices);
    };

    useEffect(() => { load() }, []);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const pattern = JSON.parse(patternStr);
            await createSchedule(deviceId, parseInt(hour), parseInt(minute), pattern);
            alert('Schedule saved');
            setHour('9');
            setMinute('0');
            load();
        } catch (err) {
            alert('Error saving schedule: verify pattern is valid JSON array');
        }
    };

    return (
        <div className="flex-1 overflow-y-auto pb-24 md:pb-6 px-4 max-w-lg mx-auto lg:max-w-4xl w-full">
            <div className="py-6">
                <h2 className="text-2xl font-bold">Bell Schedules</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Configure automated ringing schedules for devices.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">add_circle</span> New Schedule
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Target Device</label>
                            <select className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" value={deviceId} onChange={e => setDeviceId((e.target as any).value)} required>
                                <option value="">Select a device</option>
                                {devices.map((d: any) => <option key={d.device_id} value={d.device_id}>{d.name || d.device_id}</option>)}
                            </select>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex flex-col gap-1 flex-1">
                                <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Hour (0-23)</label>
                                <input type="number" min="0" max="23" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" value={hour} onChange={e => setHour((e.target as any).value)} required />
                            </div>
                            <div className="flex flex-col gap-1 flex-1">
                                <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Minute (0-59)</label>
                                <input type="number" min="0" max="59" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" value={minute} onChange={e => setMinute((e.target as any).value)} required />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Ring Pattern <span className="text-xs font-normal text-slate-400">[[on_sec, off_sec]]</span></label>
                            <input type="text" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" value={patternStr} onChange={e => setPatternStr((e.target as any).value)} placeholder="[[2,1],[2,1]]" required />
                        </div>

                        <button type="submit" className="w-full bg-primary text-white font-bold py-2.5 rounded-lg shadow-md shadow-primary/20 hover:bg-primary/90 flex justify-center items-center gap-2 transition-all active:scale-[0.98]">
                            <span className="material-symbols-outlined text-sm">save</span>
                            Save Schedule
                        </button>
                    </form>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="font-bold">Active Schedules</h3>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[10px]">Device</th>
                                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[10px]">Time</th>
                                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[10px]">Pattern</th>
                                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[10px] text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {schedules.map((s: any) => (
                                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{s.device_id}</td>
                                        <td className="px-4 py-3 font-bold text-primary">{s.hour.toString().padStart(2, '0')}:{s.minute.toString().padStart(2, '0')}</td>
                                        <td className="px-4 py-3">
                                            <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-[10px] text-slate-500">{JSON.stringify(s.pattern)}</code>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${s.enabled ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                                {s.enabled ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {schedules.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                                            <span className="material-symbols-outlined text-3xl mb-1 opacity-50 block">event_busy</span>
                                            No schedules active
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
