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
    ring: () => request('/api/ring', { method: 'POST' }),

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
};
