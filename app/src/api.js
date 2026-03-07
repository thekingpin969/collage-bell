/**
 * API Helper – communicates with ESP32 JSON endpoints.
 *
 * In production (on the ESP32), the SPA is served from the same origin,
 * so API_BASE is empty. During local development, set it to the ESP32 IP.
 */

// Change this to 'http://192.168.4.1' when developing locally against a live ESP32
const API_BASE = '';

async function request(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });
    if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
    return res.json();
}

export const api = {
    /** GET /api/status */
    getStatus: () => request('/api/status'),

    /** GET /api/schedules */
    getSchedules: () => request('/api/schedules'),

    /** POST /api/schedules */
    addSchedule: (data) =>
        request('/api/schedules', { method: 'POST', body: JSON.stringify(data) }),

    /** PUT /api/schedules?idx=N */
    editSchedule: (idx, data) =>
        request(`/api/schedules?idx=${idx}`, { method: 'PUT', body: JSON.stringify(data) }),

    /** DELETE /api/schedules?idx=N */
    deleteSchedule: (idx) =>
        request(`/api/schedules?idx=${idx}`, { method: 'DELETE' }),

    /** POST /api/ring */
    ring: (data) => request('/api/ring', { method: 'POST', body: JSON.stringify(data || { state: 'on' }) }),

    /** POST /api/set-time */
    setTime: (data) =>
        request('/api/set-time', { method: 'POST', body: JSON.stringify(data) }),

    /** POST /api/test-pattern */
    testPattern: (data) =>
        request('/api/test-pattern', { method: 'POST', body: JSON.stringify(data) }),

    /** POST /api/restart */
    restart: () => request('/api/restart', { method: 'POST' }),

    /** GET /api/system */
    getSystemInfo: () => request('/api/system'),

    /** GET /api/logs */
    getLogs: () => request('/api/logs'),

    /** GET /api/leds */
    getLedStatus: () => request('/api/leds'),

    /** GET /api/settings */
    getSettings: () => request('/api/settings'),

    /** POST /api/settings */
    setSettings: (data) => request('/api/settings', { method: 'POST', body: JSON.stringify(data) }),

    /** GET /api/wifi-status */
    getWifiStatus: () => request('/api/wifi-status'),

    /** POST /api/wifi-config */
    setWifiConfig: (data) =>
        request('/api/wifi-config', { method: 'POST', body: JSON.stringify(data) }),

    /** POST /api/wifi-disconnect */
    setWifiDisconnect: () => request('/api/wifi-disconnect', { method: 'POST' }),

    /** POST /api/update – OTA firmware upload with progress */
    uploadFirmware: (file, onProgress) => new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('firmware', file);
        let uploadComplete = false;

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                const pct = Math.round((e.loaded / e.total) * 100);
                onProgress(pct);
                if (pct >= 100) uploadComplete = true;
            }
        });

        xhr.addEventListener('load', () => {
            try {
                const data = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(data);
                } else {
                    reject(new Error(data.error || 'Update failed'));
                }
            } catch {
                // ESP32 may restart before sending a parseable response
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve({ ok: true });
                } else if (uploadComplete) {
                    // Upload finished, ESP likely restarted
                    resolve({ ok: true });
                } else {
                    reject(new Error('Update failed'));
                }
            }
        });

        // ESP32 restarts after successful OTA, which kills the connection.
        // If the upload was 100% complete, treat connection drop as success.
        xhr.addEventListener('error', () => {
            if (uploadComplete) {
                resolve({ ok: true });
            } else {
                reject(new Error('Network error during upload'));
            }
        });
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

        xhr.open('POST', `${API_BASE}/api/update`);
        xhr.send(formData);
    }),
};
