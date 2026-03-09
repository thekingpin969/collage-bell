Below is the **complete Node.js server implementation plan** for your bell system, updated for your **final architecture decisions**:

* **MQTT broker:** EMQX Cloud
* **Server runtime:** Cloudflare Workers
* **Messaging:** MQTT
* **Large data transfer:** HTTP
* **Devices:** ESP32
* **Broker communication:** NodeJS MQTT client
* **Serverless deployment:** Cloudflare Worker + Durable storage

This is a **technical blueprint of how everything works together**.

---

# 1. System Architecture

Final system layout:

```text
ESP32 Devices
     │
     │ MQTT
     ▼
EMQX Cloud Broker
     │
     │ MQTT
     ▼
NodeJS Server (Cloudflare Worker)
     │
     │ HTTP
     ▼
Admin Dashboard
     │
     ▼
Database + Firmware Storage
```

**Responsibilities**

ESP32

* executes bell schedules
* listens for commands
* publishes logs and status

MQTT Broker

* routes messages

Cloudflare Worker

* device registry
* schedule management
* OTA management
* log collection
* admin APIs

---

# 2. Core Server Modules

The server consists of these logical services.

```text
Device Registry
MQTT Gateway
Schedule Manager
Firmware Manager
Event Logger
Admin API
```

All implemented through **HTTP APIs and MQTT message handlers**.

---

# 3. Device Identity Model

Each ESP must have a unique ID.

Example:

```text
device001
device002
device003
```

Stored during provisioning.

Device identity fields:

```text
device_id
device_name
location
firmware_version
created_at
last_seen
status
```

---

# 4. Device Registration

Devices register themselves once after installation.

### HTTP Endpoint

```
POST /device/register
```

Payload:

```json
{
 "deviceId":"device001",
 "firmware":"1.0.0"
}
```

Server actions:

```
check device exists
if not create new device
store firmware version
store registration timestamp
```

Response:

```json
{
 "status":"registered"
}
```

---

# 5. Device Status Reporting

ESP publishes status through MQTT.

Topic:

```
bell/{deviceId}/status
```

Example message:

```json
{
 "wifi": true,
 "rtc": true,
 "uptime": 23000,
 "firmware":"1.0.0"
}
```

Server subscribes to:

```
bell/+/status
```

Worker processes message:

```
update device_status table
update last_seen timestamp
```

---

# 6. Device Event Logs

Devices push logs automatically.

Topic:

```
bell/{deviceId}/events
```

Examples:

```json
{
 "event":"bell_triggered",
 "timestamp":171210000
}
```

```json
{
 "event":"manual_trigger"
}
```

Server subscribes:

```
bell/+/events
```

Worker stores logs in database.

---

# 7. Schedule Management

Schedules are stored centrally and optionally synced to devices.

Schedule structure:

```text
schedule_id
device_id
hour
minute
pattern
enabled
```

Pattern example:

```json
[[2,1],[2,1]]
```

Meaning:

```
2 sec ring
1 sec pause
repeat
```

---

# 8. Save Schedule

### Endpoint

```
POST /schedule
```

Payload:

```json
{
 "deviceId":"device001",
 "hour":9,
 "minute":0,
 "pattern":[[2,1],[2,1]]
}
```

Server action:

```
store schedule
```

---

# 9. Fetch Device Schedule

ESP fetches schedules via HTTP.

Endpoint:

```
GET /device/{deviceId}/schedules
```

Response:

```json
{
 "schedules":[
  {
   "hour":9,
   "minute":0,
   "pattern":[[2,1],[2,1]]
  }
 ]
}
```

Device stores schedules locally.

---

# 10. Remote Bell Trigger

Admin UI sends trigger request.

```
POST /trigger
```

Payload:

```json
{
 "devices":["device001","device003"],
 "pattern":[[2,1],[2,1]]
}
```

Server action:

```
publish MQTT messages
```

Example publishes:

```
bell/device001/trigger
bell/device003/trigger
```

Payload:

```json
{
 "pattern":[[2,1],[2,1]]
}
```

Broker delivers instantly.

---

# 11. Device Commands

Commands sent through MQTT.

Topic:

```
bell/{deviceId}/command
```

Examples:

```json
{"action":"restart"}
```

```json
{"action":"sync_time"}
```

```json
{"action":"disable_bell"}
```

---

# 12. Firmware Management

Firmware binaries stored on server.

Example directory:

```
/firmware
  bell-1.0.0.bin
  bell-1.1.0.bin
```

Firmware metadata table:

```
version
file_path
checksum
release_date
```

---

# 13. Firmware Update Notification

When new firmware available:

Server publishes MQTT message:

```
bell/{deviceId}/firmware
```

Payload:

```json
{
 "version":"1.1.0",
 "url":"https://server.com/firmware/bell-1.1.0.bin"
}
```

ESP downloads firmware via HTTP OTA.

---

# 14. OTA Update Flow

```
server publishes MQTT notification
device receives message
device downloads firmware via HTTP
device performs OTA update
device restarts
device publishes ota_success event
```

---

# 15. MQTT Integration in Worker

NodeJS connects to EMQX using MQTT client.

Connection:

```javascript
import mqtt from "mqtt"

const client = mqtt.connect("mqtts://broker.emqx.cloud:8883",{
 username: "mqtt_user",
 password: "mqtt_pass",
 clientId: "bell-server"
})
```

Subscriptions:

```
bell/+/events
bell/+/status
```

---

# 16. Handling MQTT Messages

Example logic:

```
if topic ends with /events
 store event log

if topic ends with /status
 update device status
```

---

# 17. Multi Device Trigger

Admin selects multiple devices.

Server publishes command for each device.

Example devices:

```
device001
device003
```

Server publishes:

```
bell/device001/trigger
bell/device003/trigger
```

Messages arrive within milliseconds.

---

# 18. Device Connection Flow

ESP boot process:

```
connect wifi
connect mqtt broker
subscribe to topics
fetch schedules from server
start scheduler
publish status
```

---

# 19. Server Startup Flow

Worker initialization:

```
connect MQTT broker
subscribe to device topics
start HTTP API endpoints
listen for MQTT messages
```

---

# 20. Cloudflare Worker Storage

Recommended storage:

```
D1 database → device data
KV storage → firmware metadata
R2 storage → firmware files
```

Tables:

```
devices
device_events
device_status
schedules
firmware_versions
```

---

# 21. Security

Basic security model:

```
device authentication token
MQTT username/password
HTTPS for all HTTP endpoints
admin JWT authentication
```

---

# 22. Failure Handling

If server unavailable:

```
ESP continues local schedule
MQTT reconnect attempts continue
no system downtime
```

---

# 23. Monitoring

Admin dashboard can show:

```
online devices
offline devices
recent bell triggers
device logs
firmware versions
```

---

# Final System Communication

```
ESP → MQTT → Server
   logs / status

Server → MQTT → ESP
   commands / triggers

ESP → HTTP → Server
   schedule fetch
   firmware download
```

---

# Result

The system provides:

```
remote bell control
device monitoring
OTA firmware updates
central schedule management
real-time messaging
scalable device fleet
```

while keeping **ESP devices autonomous and lightweight**.
