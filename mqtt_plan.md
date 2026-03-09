Below is the **complete MQTT implementation plan** for your system, incorporating all decisions made:

* **EMQX Cloud as MQTT broker**
* **NodeJS + ESP32 as MQTT clients**
* **MQTT for messaging**
* **HTTP for large data (OTA firmware, configs)**
* **Event logs pushed by ESP**
* **Remote bell triggers**
* **Group or multi-device triggers**
* **OTA notifications via MQTT**

This is the **technical blueprint for MQTT integration**.

---

# 1. System Architecture

Final communication architecture:

```
ESP32 Devices
      │
      │ MQTT (publish/subscribe)
      ▼
EMQX Cloud Broker
      │
      │ MQTT
      ▼
NodeJS Server
      │
      ▼
Database + HTTP API + Admin UI
```

Broker role:

* route MQTT messages
* manage topics
* maintain client connections

---

# 2. MQTT Client Connections

Both **ESP32 and NodeJS connect independently** to EMQX.

Connection parameters:

```
Broker URL
Port
ClientID
Username
Password
TLS (recommended)
```

Example broker endpoint:

```
mqtts://xxxxx.emqx.cloud:8883
```

---

# 3. MQTT Topic Structure

Topics follow this hierarchy:

```
bell/{deviceId}/trigger
bell/{deviceId}/command
bell/{deviceId}/firmware
bell/{deviceId}/events
bell/{deviceId}/status
```

Examples:

```
bell/device001/trigger
bell/device002/events
bell/device003/status
```

---

# 4. ESP32 MQTT Responsibilities

Each ESP device:

### Subscribes to

```
bell/{deviceId}/trigger
bell/{deviceId}/command
bell/{deviceId}/firmware
```

### Publishes to

```
bell/{deviceId}/events
bell/{deviceId}/status
```

---

# 5. NodeJS MQTT Responsibilities

NodeJS acts as a **central control client**.

### Subscribes to

```
bell/+/events
bell/+/status
```

`+` wildcard receives messages from any device.

### Publishes to

```
bell/{deviceId}/trigger
bell/{deviceId}/command
bell/{deviceId}/firmware
```

---

# 6. NodeJS MQTT Implementation

Library:

```
mqtt.js
```

Install:

```
npm install mqtt
```

Connection example:

```javascript
const mqtt = require("mqtt")

const client = mqtt.connect("mqtts://broker.emqx.cloud:8883", {
  username: "mqtt_user",
  password: "mqtt_pass",
  clientId: "node-server"
})

client.on("connect", () => {
  console.log("MQTT connected")

  client.subscribe("bell/+/events")
  client.subscribe("bell/+/status")
})
```

---

# 7. Receiving Device Messages (NodeJS)

```javascript
client.on("message", (topic, message) => {
  const payload = message.toString()
  console.log(topic, payload)

  if(topic.includes("/events")) {
    saveDeviceEvent(payload)
  }

  if(topic.includes("/status")) {
    updateDeviceStatus(payload)
  }
})
```

NodeJS stores:

* device logs
* device health status

---

# 8. ESP32 MQTT Implementation

Libraries:

```
WiFi.h
PubSubClient.h
```

Connection example:

```cpp
client.setServer("broker.emqx.cloud", 1883);
client.setCallback(callback);
```

Subscription:

```cpp
client.subscribe("bell/device001/trigger");
client.subscribe("bell/device001/command");
client.subscribe("bell/device001/firmware");
```

---

# 9. ESP Message Handler

```cpp
void callback(char* topic, byte* payload, unsigned int length) {

  String message;

  for(int i=0;i<length;i++){
    message += (char)payload[i];
  }

  if(String(topic) == "bell/device001/trigger"){
      triggerBell(message);
  }

  if(String(topic) == "bell/device001/command"){
      executeCommand(message);
  }

  if(String(topic) == "bell/device001/firmware"){
      startFirmwareUpdate(message);
  }
}
```

---

# 10. Remote Bell Trigger Flow

Admin presses trigger in dashboard.

Flow:

```
Admin UI
   ↓
NodeJS API
   ↓
MQTT publish
   ↓
bell/device001/trigger
   ↓
ESP receives message
   ↓
execute bell pattern
```

NodeJS publish example:

```javascript
client.publish(
  "bell/device001/trigger",
  JSON.stringify({
    pattern:[[2,1],[2,1]]
  })
)
```

---

# 11. Multi-Device Bell Trigger

If admin selects multiple bells:

Example selection:

```
device001
device003
```

NodeJS publishes multiple messages:

```javascript
devices.forEach(device=>{
  client.publish(`bell/${device}/trigger`, payload)
})
```

MQTT broker delivers commands nearly simultaneously.

---

# 12. Device Event Logging

ESP publishes logs automatically.

Topic:

```
bell/{deviceId}/events
```

Example message:

```json
{
 "event":"bell_triggered",
 "timestamp":"09:00"
}
```

ESP code:

```cpp
client.publish(
 "bell/device001/events",
 "{\"event\":\"bell_triggered\"}"
);
```

NodeJS stores events in database.

---

# 13. Device Status Reporting

ESP periodically publishes status.

Interval example:

```
60 seconds
```

Topic:

```
bell/{deviceId}/status
```

Example payload:

```json
{
 "wifi": true,
 "rtc": true,
 "uptime": 12345,
 "firmware":"1.0.2"
}
```

NodeJS updates device health record.

---

# 14. Firmware Update Notification

MQTT only sends notification.

NodeJS publishes:

```
bell/device001/firmware
```

Payload:

```json
{
 "version":"1.2.0",
 "url":"https://server/firmware/bell-1.2.0.bin"
}
```

ESP receives message and downloads firmware using HTTP.

---

# 15. ESP Firmware Update Trigger

ESP handler:

```
receive MQTT message
extract firmware URL
start HTTP OTA download
```

OTA handled with:

```
HTTPUpdate
Update.h
```

---

# 16. Device Commands

Topic:

```
bell/{deviceId}/command
```

Examples:

```
restart
sync_time
disable_bell
enable_bell
```

NodeJS publish:

```javascript
client.publish(
  "bell/device001/command",
  JSON.stringify({action:"restart"})
)
```

---

# 17. Connection Reliability

ESP must handle reconnection.

Example:

```cpp
while (!client.connected()) {
  reconnectMQTT();
}
```

MQTT automatically resumes subscriptions.

---

# 18. Security

EMQX authentication:

```
username
password
TLS connection
```

Each ESP may have unique credentials.

Optional improvements:

```
device-specific ACL rules
certificate authentication
```

---

# 19. MQTT QoS Levels

Recommended settings:

```
QoS 1
```

Meaning:

```
message delivered at least once
```

Good for triggers and logs.

---

# 20. Device Startup Sequence

ESP boot flow:

```
connect WiFi
connect MQTT broker
subscribe to device topics
start scheduler
publish status
```

---

# 21. NodeJS Server Startup

Server boot sequence:

```
connect database
connect MQTT broker
subscribe to device topics
start HTTP API
```

---

# Final Communication Model

```
NodeJS → MQTT → ESP
   commands

ESP → MQTT → NodeJS
   logs & status

HTTP used only for
   firmware download
   large data transfer
```

---

# Result

This MQTT implementation provides:

* real-time device control
* remote bell triggering
* centralized logging
* device health monitoring
* scalable device management
* OTA update notifications

All while keeping ESP devices **autonomous and lightweight**.
