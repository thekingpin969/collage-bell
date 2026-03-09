const mqtt = require('mqtt');

require('dotenv').config();
const client = mqtt.connect(process.env.MQTT_BROKER_URL, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: `mock-esp32-${Math.random().toString(16).slice(2, 8)}`,
});

client.on('connect', () => {
    console.log('Mock ESP connected to MQTT broker');

    const deviceId = 'mock_esp32_001';

    // 1. Send registration first (simulating initial boot)
    client.publish('bell/register', JSON.stringify({
        device_id: deviceId,
        name: 'Main Block Bell'
    }));

    setTimeout(() => {
        // 2. Send status payload with telemetry
        const statusPayload = {
            firmware_version: '1.2.0',
            ip_address: '192.168.1.104',
            ssid: 'Industrial_Net_01',
            uptime: '14d 06h 22m',
            memory_usage: '245KB / 512KB',
            wifi_signal: '-65',
            rtc_status: 'Synced',
            mqtt_status: 'Connected'
        };
        console.log('Publishing status:', statusPayload);
        client.publish(`bell/${deviceId}/status`, JSON.stringify(statusPayload));

        // 3. Send an event log
        client.publish(`bell/${deviceId}/events`, JSON.stringify({
            event: 'bell_triggered',
            timestamp: Math.floor(Date.now() / 1000)
        }));

        console.log('Mock payloads sent. Exiting in 2s...');
        setTimeout(() => process.exit(0), 2000);

    }, 1000);
});

client.on('error', (err) => {
    console.error('MQTT error:', err);
});
