const mqtt = require('mqtt');
const db = require('./db');
require('dotenv').config();

const client = mqtt.connect(process.env.MQTT_BROKER_URL, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: `bell-admin-${Math.random().toString(16).slice(2, 8)}`,
    rejectUnauthorized: false
});

client.on('connect', () => {
    console.log('Connected to EMQX Broker');
    client.subscribe('bell/+/events');
    client.subscribe('bell/+/status');
    client.subscribe('bell/register');
});

client.on('message', async (topic, message) => {
    const payloadStr = message.toString();
    try {
        const payload = JSON.parse(payloadStr);
        console.log(`Received message on topic ${topic}:`, payload);

        if (topic === 'bell/register') {
            const { device_id, name } = payload;
            if (!device_id || !name) return;

            await db.query(`
                INSERT INTO devices (device_id, name, is_registered, status, last_seen)
                VALUES ($1, $2, true, 'online', CURRENT_TIMESTAMP)
                ON CONFLICT (device_id) DO UPDATE 
                SET name = EXCLUDED.name,
                    is_registered = true,
                    status = 'online',
                    last_seen = CURRENT_TIMESTAMP
            `, [device_id, name]);
            console.log(`Successfully registered ${device_id} as "${name}"`);
            return;
        }

        // Extract deviceId from topic: bell/{deviceId}/events
        const parts = topic.split('/');
        if (parts.length !== 3) return;

        const deviceId = parts[1];
        const type = parts[2];

        if (type === 'events') {
            await db.query(`
        INSERT INTO device_events (device_id, event, timestamp)
        VALUES ($1, $2, $3)
      `, [deviceId, payload.event, payload.timestamp || Math.floor(Date.now() / 1000)]);

            // Update last seen
            await db.query(`
        UPDATE devices SET last_seen = CURRENT_TIMESTAMP WHERE device_id = $1
      `, [deviceId]);
        } else if (type === 'status') {
            // Create logic: if device not exist, insert it? Best practice.
            const result = await db.query(`
        UPDATE devices 
        SET last_seen = CURRENT_TIMESTAMP, 
            status = 'online',
            firmware_version = $2,
            ip_address = $3,
            ssid = $4,
            uptime = $5,
            memory_usage = $6,
            wifi_signal = $7,
            rtc_status = $8,
            mqtt_status = $9,
            is_registered = COALESCE($10, is_registered),
            is_enabled = COALESCE($11, is_enabled)
        WHERE device_id = $1
      `, [
                deviceId,
                payload.firmware || payload.firmware_version || null,
                payload.ip_address || payload.ip || null,
                payload.ssid || null,
                payload.uptime ? String(payload.uptime) : null,
                payload.memory_usage || payload.memory || null,
                payload.wifi_signal || payload.rssi || null,
                payload.rtc_status !== undefined ? String(payload.rtc_status) : null,
                payload.mqtt_status !== undefined ? String(payload.mqtt_status) : 'online',
                payload.is_registered !== undefined ? payload.is_registered : null,
                payload.masterEnable !== undefined ? payload.masterEnable : null
            ]);

            if (result.rowCount === 0) {
                // implicit registration if device doesn't exist yet but sends status
                await db.query(`
              INSERT INTO devices (
                device_id, firmware_version, status, last_seen, is_registered,
                ip_address, ssid, uptime, memory_usage, wifi_signal, rtc_status, mqtt_status, is_enabled
              )
              VALUES ($1, $2, 'online', CURRENT_TIMESTAMP, $10, $3, $4, $5, $6, $7, $8, $9, $11)
              ON CONFLICT (device_id) DO NOTHING
          `, [
                    deviceId,
                    payload.firmware || payload.firmware_version || null,
                    payload.ip_address || payload.ip || null,
                    payload.ssid || null,
                    payload.uptime ? String(payload.uptime) : null,
                    payload.memory_usage || payload.memory || null,
                    payload.wifi_signal || payload.rssi || null,
                    payload.rtc_status !== undefined ? String(payload.rtc_status) : null,
                    payload.mqtt_status !== undefined ? String(payload.mqtt_status) : 'online',
                    payload.is_registered !== undefined ? payload.is_registered : false,
                    payload.masterEnable !== undefined ? payload.masterEnable : true
                ]);
            }
        }
    } catch (error) {
        console.error('Error handling MQTT message:', error);
    }
});

function publishTrigger(deviceId, pattern) {
    client.publish(`bell/${deviceId}/rx`, JSON.stringify({ type: 'trigger', pattern }));
}

function publishCommand(deviceId, action) {
    client.publish(`bell/${deviceId}/rx`, JSON.stringify({ type: 'command', action }));
}

function publishFirmwareOTA(deviceId, version, url) {
    client.publish(`bell/${deviceId}/rx`, JSON.stringify({ type: 'firmware', version, url }));
}

module.exports = {
    client,
    publishTrigger,
    publishCommand,
    publishFirmwareOTA
};
