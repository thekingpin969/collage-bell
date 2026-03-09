const BASE_URL = 'http://localhost:3000/api';
const TRIGGER_URL = 'http://localhost:3000';

export const fetchDevices = () => fetch(`${BASE_URL}/devices`).then(r => r.json());
export const fetchEvents = () => fetch(`${BASE_URL}/events`).then(r => r.json());
export const fetchSchedules = () => fetch(`${BASE_URL}/schedules`).then(r => r.json());
export const fetchFirmware = () => fetch(`${BASE_URL}/firmware`).then(r => r.json());

export const triggerBells = (devices: string[], pattern: any) =>
    fetch(`${TRIGGER_URL}/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devices, pattern })
    }).then(r => r.json());

export const sendCommand = (devices: string[], action: string) =>
    fetch(`${TRIGGER_URL}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devices, action })
    }).then(r => r.json());

export const createSchedule = (deviceId: string, hour: number, minute: number, pattern: any) =>
    fetch(`${TRIGGER_URL}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, hour, minute, pattern })
    }).then(r => r.json());

export const uploadFirmware = (formData: FormData) =>
    fetch(`${BASE_URL}/firmware/upload`, {
        method: 'POST',
        body: formData
    }).then(r => r.json());

export const triggerOTA = (devices: string[], version: string) =>
    fetch(`${BASE_URL}/firmware/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devices, version })
    }).then(r => r.json());
