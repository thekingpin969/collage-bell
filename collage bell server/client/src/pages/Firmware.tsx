import { useEffect, useState } from 'preact/hooks';
import { fetchFirmware, uploadFirmware, triggerOTA, fetchDevices } from '../api';

export default function Firmware() {
    const [firmwares, setFirmwares] = useState<any[]>([]);
    const [devices, setDevices] = useState<any[]>([]);

    const [file, setFile] = useState<File | null>(null);
    const [version, setVersion] = useState('');
    const [loading, setLoading] = useState(false);

    const [otaDevice, setOtaDevice] = useState('');
    const [otaVersion, setOtaVersion] = useState('');

    const load = () => {
        fetchFirmware().then((data) => setFirmwares(Array.isArray(data) ? data : []));
        fetchDevices().then((data) => setDevices(Array.isArray(data) ? data : []));
    };

    useEffect(() => { load() }, []);

    const handleUpload = async (e: any) => {
        e.preventDefault();
        if (!file || !version) return alert('File and version required');

        const formData = new FormData();
        formData.append('firmware', file);
        formData.append('version', version);

        setLoading(true);
        try {
            await uploadFirmware(formData);
            alert('Firmware uploaded successfully!');
            setFile(null);
            setVersion('');
            load();
        } catch (err) {
            alert('Upload failed');
        }
        setLoading(false);
    };

    const handleOTA = async (e: any) => {
        e.preventDefault();
        if (!otaDevice || !otaVersion) return alert('Device and version required');

        setLoading(true);
        try {
            await triggerOTA(otaDevice === 'all' ? devices.map((d: any) => d.device_id) : [otaDevice], otaVersion);
            alert('OTA Trigger command published successfully');
        } catch (err) {
            alert('Failed to trigger OTA');
        }
        setLoading(false);
    };

    return (
        <div className="flex-1 overflow-y-auto pb-24 md:pb-6 px-4 max-w-lg mx-auto lg:max-w-4xl w-full">
            <div className="py-6">
                <h2 className="text-2xl font-bold">Firmware & OTA</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Manage firmware binaries and trigger Over-The-Air updates.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">upload_file</span> Upload Firmware
                    </h3>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Version Number (e.g. 1.0.0)</label>
                            <input type="text" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" value={version} onChange={e => setVersion((e.target as any).value)} required />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Binary File (.bin)</label>
                            <input type="file" accept=".bin" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all" onChange={e => setFile((e.target as any).files?.[0] || null)} required />
                        </div>

                        <button type="submit" className="w-full bg-primary text-white font-bold py-2.5 rounded-lg shadow-md shadow-primary/20 hover:bg-primary/90 flex justify-center items-center gap-2 transition-all active:scale-[0.98]" disabled={loading}>
                            {loading ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : null}
                            Upload to Server
                        </button>
                    </form>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500">offline_bolt</span> Trigger OTA Update
                    </h3>
                    <form onSubmit={handleOTA} className="space-y-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Target Device</label>
                            <select className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all" value={otaDevice} onChange={e => setOtaDevice((e.target as any).value)} required>
                                <option value="">Select a device</option>
                                <option value="all" className="font-bold">*** ALL DEVICES ***</option>
                                {devices.map((d: any) => <option key={d.device_id} value={d.device_id}>{d.device_id} ({d.firmware_version || 'unknown'})</option>)}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Firmware Version</label>
                            <select className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all" value={otaVersion} onChange={e => setOtaVersion((e.target as any).value)} required>
                                <option value="">Select a version</option>
                                {firmwares.map((f: any) => <option key={f.version} value={f.version}>{f.version} ({new Date(f.release_date).toLocaleDateString()})</option>)}
                            </select>
                        </div>

                        <button type="submit" className="w-full bg-amber-500 text-white font-bold py-2.5 rounded-lg shadow-md shadow-amber-500/20 hover:bg-amber-600 flex justify-center items-center gap-2 transition-all active:scale-[0.98]" disabled={loading}>
                            {loading ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : null}
                            Broadcast Update Command
                        </button>
                    </form>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold">Available Firmware Binaries</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="px-5 py-3 font-semibold uppercase tracking-wider text-[10px]">Version</th>
                                <th className="px-5 py-3 font-semibold uppercase tracking-wider text-[10px]">File Path</th>
                                <th className="px-5 py-3 font-semibold uppercase tracking-wider text-[10px] text-right">Release Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {firmwares.map((f: any) => (
                                <tr key={f.version} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="px-5 py-3 font-bold">{f.version}</td>
                                    <td className="px-5 py-3"><code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono text-xs text-primary">{f.file_path}</code></td>
                                    <td className="px-5 py-3 text-right text-slate-500">{new Date(f.release_date).toLocaleString()}</td>
                                </tr>
                            ))}
                            {firmwares.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-5 py-8 text-center text-slate-500 shadow-inner">
                                        <span className="material-symbols-outlined text-3xl mb-1 opacity-50 block">inventory_2</span>
                                        No firmware uploaded yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
