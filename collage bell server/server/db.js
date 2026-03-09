const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS devices (
        device_id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        location VARCHAR(255),
        firmware_version VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP,
        status VARCHAR(50),
        is_registered BOOLEAN DEFAULT FALSE
      );
      
      CREATE TABLE IF NOT EXISTS device_events (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(255) REFERENCES devices(device_id),
        event VARCHAR(255),
        timestamp BIGINT
      );

      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(255) REFERENCES devices(device_id),
        hour INTEGER,
        minute INTEGER,
        pattern JSONB,
        enabled BOOLEAN DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS firmware_versions (
        version VARCHAR(50) PRIMARY KEY,
        file_path text,
        checksum VARCHAR(255),
        release_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Run migrations
    await client.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS name VARCHAR(255);');
    await client.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS is_registered BOOLEAN DEFAULT FALSE;');

    // Telemetry columns
    await client.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS ip_address VARCHAR(50);');
    await client.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS ssid VARCHAR(255);');
    await client.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS uptime VARCHAR(255);');
    await client.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS memory_usage VARCHAR(255);');
    await client.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS wifi_signal VARCHAR(50);');
    await client.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS rtc_status VARCHAR(50);');
    await client.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS mqtt_status VARCHAR(50);');
    await client.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT TRUE;');

    // Extended telemetry columns
    await client.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS temperature VARCHAR(50);');
    await client.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS ap_ssid VARCHAR(255);');
    await client.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS ap_password VARCHAR(255);');
    await client.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS ap_connections INTEGER DEFAULT 0;');
    await client.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS ap_ip VARCHAR(50);');
    await client.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS "current_time" BIGINT;');
    await client.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS total_heap BIGINT;');
    await client.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS free_heap BIGINT;');
    await client.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS flash_size BIGINT;');
    await client.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS free_flash BIGINT;');
    await client.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS total_bell_rings INTEGER DEFAULT 0;');
    await client.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS schedule_count INTEGER DEFAULT 0;');
    await client.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_name VARCHAR(255);');
    await client.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS wifi_connected BOOLEAN DEFAULT FALSE;');
    await client.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS wifi_channel INTEGER;');
    await client.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS wifi_bssid VARCHAR(50);');

    console.log("PostgreSQL database tables initialized/migrated");
  } catch (err) {
    console.error("Error initializing PostgreSQL database tables:", err);
  } finally {
    client.release();
  }
}

initDB();

module.exports = {
  query: (text, params) => pool.query(text, params),
};
