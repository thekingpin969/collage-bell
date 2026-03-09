const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const mqttClient = require('./mqtt');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] ${req.method} ${req.originalUrl}`);
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

app.use('/firmware', express.static(path.join(__dirname, 'uploads', 'firmware')));

const firmwareDir = path.join(__dirname, 'uploads', 'firmware');
if (!fs.existsSync(firmwareDir)) {
    fs.mkdirSync(firmwareDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, firmwareDir),
    filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// --- ESP APIs ---

app.post('/device/register', async (req, res) => {
    const { deviceId, firmware } = req.body;
    if (!deviceId) return res.status(400).json({ error: 'deviceId required' });

    try {
        await db.query(`
      INSERT INTO devices (device_id, firmware_version, status, last_seen, is_registered)
      VALUES ($1, $2, 'online', CURRENT_TIMESTAMP, false)
      ON CONFLICT (device_id) DO UPDATE SET 
        firmware_version = EXCLUDED.firmware_version,
        status = 'online',
        last_seen = CURRENT_TIMESTAMP
    `, [deviceId, firmware]);

        res.json({ status: 'registered' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/device/:deviceId/register', async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Device name required' });

    try {
        await db.query(`
            UPDATE devices 
            SET name = $1, is_registered = true 
            WHERE device_id = $2
        `, [name, req.params.deviceId]);

        // Publish success message to the ESP32
        mqttClient.publishCommand(req.params.deviceId, 'registration_success');

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- ESP Status Endpoint (HTTP POST from device) ---
app.post('/device/:deviceId/status', async (req, res) => {
    const deviceId = req.params.deviceId;
    const p = req.body;

    try {
        const result = await db.query(`
            UPDATE devices 
            SET last_seen = CURRENT_TIMESTAMP,
                status = 'online',
                firmware_version = COALESCE($2, firmware_version),
                ip_address = COALESCE($3, ip_address),
                ssid = COALESCE($4, ssid),
                uptime = COALESCE($5, uptime),
                wifi_signal = COALESCE($6, wifi_signal),
                rtc_status = COALESCE($7, rtc_status),
                mqtt_status = COALESCE($8, mqtt_status),
                is_registered = COALESCE($9, is_registered),
                is_enabled = COALESCE($10, is_enabled),
                temperature = COALESCE($11, temperature),
                ap_ssid = COALESCE($12, ap_ssid),
                ap_password = COALESCE($13, ap_password),
                ap_connections = COALESCE($14, ap_connections),
                ap_ip = COALESCE($15, ap_ip),
                "current_time" = COALESCE($16, "current_time"),
                total_heap = COALESCE($17, total_heap),
                free_heap = COALESCE($18, free_heap),
                flash_size = COALESCE($19, flash_size),
                free_flash = COALESCE($20, free_flash),
                total_bell_rings = COALESCE($21, total_bell_rings),
                schedule_count = COALESCE($22, schedule_count),
                device_name = COALESCE($23, device_name),
                wifi_connected = COALESCE($24, wifi_connected),
                wifi_channel = COALESCE($25, wifi_channel),
                wifi_bssid = COALESCE($26, wifi_bssid)
            WHERE device_id = $1
        `, [
            deviceId,
            p.firmware_version || null,
            p.ip_address || null,
            p.ssid || null,
            p.uptime !== undefined ? String(p.uptime) : null,
            p.wifi_signal !== undefined ? String(p.wifi_signal) : null,
            p.rtc_status || null,
            p.mqtt_status || null,
            p.is_registered !== undefined ? p.is_registered : null,
            p.masterEnable !== undefined ? p.masterEnable : null,
            p.temperature !== undefined && p.temperature !== null ? String(p.temperature) : null,
            p.ap_ssid || null,
            p.ap_password || null,
            p.ap_connections !== undefined ? p.ap_connections : null,
            p.ap_ip || null,
            p.current_time !== undefined ? p.current_time : null,
            p.total_heap !== undefined ? p.total_heap : null,
            p.free_heap !== undefined ? p.free_heap : null,
            p.flash_size !== undefined ? p.flash_size : null,
            p.free_flash !== undefined ? p.free_flash : null,
            p.total_bell_rings !== undefined ? p.total_bell_rings : null,
            p.schedule_count !== undefined ? p.schedule_count : null,
            p.device_name || null,
            p.wifi_connected !== undefined ? p.wifi_connected : null,
            p.wifi_channel !== undefined ? p.wifi_channel : null,
            p.wifi_bssid || null
        ]);

        if (result.rowCount === 0) {
            // Device not found, auto-insert
            await db.query(`
                INSERT INTO devices (
                    device_id, status, last_seen, firmware_version, ip_address, ssid,
                    uptime, wifi_signal, rtc_status, mqtt_status, is_registered, is_enabled,
                    temperature, ap_ssid, ap_password, ap_connections, ap_ip, "current_time",
                    total_heap, free_heap, flash_size, free_flash, total_bell_rings,
                    schedule_count, device_name, wifi_connected, wifi_channel, wifi_bssid
                )
                VALUES (
                    $1, 'online', CURRENT_TIMESTAMP, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
                )
                ON CONFLICT (device_id) DO NOTHING
            `, [
                deviceId,
                p.firmware_version || null,
                p.ip_address || null,
                p.ssid || null,
                p.uptime !== undefined ? String(p.uptime) : null,
                p.wifi_signal !== undefined ? String(p.wifi_signal) : null,
                p.rtc_status || null,
                p.mqtt_status || null,
                p.is_registered !== undefined ? p.is_registered : false,
                p.masterEnable !== undefined ? p.masterEnable : true,
                p.temperature !== undefined && p.temperature !== null ? String(p.temperature) : null,
                p.ap_ssid || null,
                p.ap_password || null,
                p.ap_connections !== undefined ? p.ap_connections : 0,
                p.ap_ip || null,
                p.current_time !== undefined ? p.current_time : null,
                p.total_heap !== undefined ? p.total_heap : null,
                p.free_heap !== undefined ? p.free_heap : null,
                p.flash_size !== undefined ? p.flash_size : null,
                p.free_flash !== undefined ? p.free_flash : null,
                p.total_bell_rings !== undefined ? p.total_bell_rings : 0,
                p.schedule_count !== undefined ? p.schedule_count : 0,
                p.device_name || null,
                p.wifi_connected !== undefined ? p.wifi_connected : false,
                p.wifi_channel !== undefined ? p.wifi_channel : null,
                p.wifi_bssid || null
            ]);
        }

        res.json({ ok: true });
    } catch (error) {
        console.error('Error handling device status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/device/:deviceId/schedules', async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT hour, minute, pattern FROM schedules WHERE device_id = $1 AND enabled = true',
            [req.params.deviceId]
        );
        res.json({ schedules: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Admin APIs ---

app.post('/schedule', async (req, res) => {
    // Support payload: { deviceId: "...", hour: ..., minute: ..., pattern: [[...]] }
    const { deviceId, hour, minute, pattern } = req.body;
    try {
        await db.query(`
      INSERT INTO schedules (device_id, hour, minute, pattern)
      VALUES ($1, $2, $3, $4)
    `, [deviceId, hour, minute, JSON.stringify(pattern)]);

        // Notify the specific device to sync its schedules
        mqttClient.publishCommand(deviceId, 'sync_schedules');

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/schedules', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM schedules');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/trigger', (req, res) => {
    const { devices, pattern } = req.body;
    if (!Array.isArray(devices) || !pattern) {
        return res.status(400).json({ error: 'Invalid payload' });
    }

    devices.forEach(deviceId => {
        mqttClient.publishTrigger(deviceId, pattern);
    });

    res.json({ status: 'triggered' });
});

app.post('/command', (req, res) => {
    const { devices, action } = req.body;
    if (!Array.isArray(devices) || !action) {
        return res.status(400).json({ error: 'Invalid payload' });
    }

    devices.forEach(deviceId => {
        mqttClient.publishCommand(deviceId, action);
    });

    res.json({ status: 'command_sent' });
});

app.get('/api/devices', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM devices ORDER BY last_seen DESC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/events', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM device_events ORDER BY timestamp DESC LIMIT 100');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/firmware', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM firmware_versions ORDER BY release_date DESC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/firmware/upload', upload.single('firmware'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { version } = req.body;
    if (!version) return res.status(400).json({ error: 'Version required' });

    const filePath = `/firmware/${req.file.filename}`;

    try {
        await db.query(`
      INSERT INTO firmware_versions (version, file_path)
      VALUES ($1, $2)
      ON CONFLICT (version) DO UPDATE SET file_path = EXCLUDED.file_path
    `, [version, filePath]);
        res.json({ success: true, file_path: filePath, version });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/firmware/trigger', async (req, res) => {
    const { devices, version } = req.body;

    try {
        const { rows } = await db.query('SELECT file_path FROM firmware_versions WHERE version = $1', [version]);
        if (rows.length === 0) return res.status(404).json({ error: 'Firmware version not found' });

        // We need the full URL for the ESP32 to download. Assuming it runs on the server host.
        const baseUrl = req.protocol + '://' + req.get('host');
        const fullUrl = baseUrl + rows[0].file_path;

        devices.forEach(deviceId => {
            mqttClient.publishFirmwareOTA(deviceId, version, fullUrl);
        });

        res.json({ status: 'ota_triggered' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Node Server listening on port ${PORT}`);
    });
}

module.exports = app;
