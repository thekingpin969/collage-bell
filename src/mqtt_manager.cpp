#include "mqtt_manager.h"
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <HTTPUpdate.h>
#include "config.h"
#include "pattern_engine.h"
#include "rtc_service.h"
#include "storage_manager.h"
#include "wifi_manager.h"

#ifdef __cplusplus
extern "C" {
#endif
uint8_t temprature_sens_read();
#ifdef __cplusplus
}
#endif

// EMQX Cloud Broker Configuration
const char* mqtt_server = "z619777c.ala.asia-southeast1.emqxsl.com";
const int mqtt_port = 8883; 
const char* mqtt_user = "kingpin"; // Match server/.env
const char* mqtt_password = "5a215d8bfb990cfa"; // Match server/.env

WiFiClientSecure espClient;
PubSubClient client(espClient);

static unsigned long lastStatusTime = 0;
const unsigned long STATUS_INTERVAL = 15000; // 15 seconds

// Pass the global settings pointer during init
static SystemSettings* _systemSettings = nullptr;
static BellTime* _schedules = nullptr;
static uint8_t* _scheduleCount = nullptr;
static uint32_t _totalBellRings = 0;
static String _serverUrl;

// Helper to get today's date as YYYYMMDD integer
static uint32_t getTodayDate() {
    uint16_t y; uint8_t mo, d, h, m, s;
    rtcGetDateTime(y, mo, d, h, m, s);
    return (uint32_t)y * 10000 + (uint32_t)mo * 100 + d;
}

String getDeviceId() {
    uint8_t mac[6];
    WiFi.macAddress(mac);
    char macStr[18];
    snprintf(macStr, sizeof(macStr), "device-%02x%02x%02x", mac[3], mac[4], mac[5]);
    return String(macStr);
}

bool mqttIsConnected() {
    return client.connected();
}

void publishStatus(); // Forward declaration

void mqttReconnect() {
    // Non-blocking reconnect strategy called within loop
    if (!client.connected()) {
        DEBUG_PRINT("Attempting MQTT connection...");
        String clientId = getDeviceId();
        
        if (client.connect(clientId.c_str(), mqtt_user, mqtt_password)) {
            DEBUG_PRINTLN("connected to EMQX");
            Serial.println("");
            Serial.println("=====================================");
            Serial.println(" MQTT Broker Connected Successfully! ");
            Serial.println("=====================================");
            Serial.println("");
            
            // Subscribe to device-specific topics
            String rxTopic = "bell/" + clientId + "/rx";
            client.subscribe(rxTopic.c_str());
            
            // Announce we are online immediately
            mqttPublishEvent("device_online");
        } else {
            DEBUG_PRINT("failed, rc=");
            DEBUG_PRINT(client.state());
            DEBUG_PRINTLN(" try again in 5 seconds");
        }
    }
}

void handleTrigger(JsonObjectConst doc) {
    JsonArrayConst patternArray = doc["pattern"];
    
    // Convert to PatternStep struct
    uint8_t stepCount = 0;
    PatternStep tempSteps[MAX_STEPS];
    
    for (JsonVariantConst v : patternArray) {
        if (stepCount >= MAX_STEPS) break;
        JsonArrayConst stepParams = v.as<JsonArrayConst>();
        if (stepParams.size() == 2) {
            tempSteps[stepCount].duration = stepParams[0].as<int>();
            tempSteps[stepCount].delay = stepParams[1].as<int>();
            stepCount++;
        }
    }
    
    if (stepCount > 0) {
        DEBUG_PRINTLN("Executing remote trigger pattern...");
        patternExecuteManual(tempSteps, stepCount);
        mqttPublishEvent("remote_trigger_executed");
    }
}

void handleCommand(JsonObjectConst doc) {
    const char* action = doc["action"];
    if (strcmp(action, "restart") == 0) {
        mqttPublishEvent("restarting");
        delay(1000);
        ESP.restart();
    } else if (strcmp(action, "sync_time") == 0) {
        // Just acknowledging for now, would typically ping NTP or Admin API
        mqttPublishEvent("time_sync_requested");
    } else if (strcmp(action, "registration_success") == 0) {
        if (_systemSettings) {
            _systemSettings->isRegistered = true;
            storageSaveSettings(*_systemSettings);
            mqttPublishEvent("device_registered");
            DEBUG_PRINTLN("Device successfully registered to server.");
            // Immediately publish new status
            publishStatus();
        }
    } else if (strcmp(action, "ring_on") == 0) {
        // Start dynamic manual ring with 4 second watchdog
        patternStartDynamicManual(4);
    } else if (strcmp(action, "ring_off") == 0) {
        patternStop();
    } else if (strcmp(action, "enable_device") == 0) {
        if (_systemSettings) {
            _systemSettings->masterEnable = true;
            storageSaveSettings(*_systemSettings);
            mqttPublishEvent("device_enabled");
            publishStatus();
        }
    } else if (strcmp(action, "disable_device") == 0) {
        if (_systemSettings) {
            _systemSettings->masterEnable = false;
            storageSaveSettings(*_systemSettings);
            mqttPublishEvent("device_disabled");
            publishStatus();
        }
    } else if (strcmp(action, "sync_schedules") == 0) {
        extern void httpSyncSchedules(); // Forward declaration for local use
        httpSyncSchedules();
    }
}

void handleFirmware(JsonObjectConst doc) {
    const char* url = doc["url"];
    if (url) {
        DEBUG_PRINTF("Starting OTA from: %s\n", url);
        mqttPublishEvent("ota_starting");
        
        WiFiClient otaClient; // OTA typically comes from HTTP port 3000 locally, not HTTPS
        t_httpUpdate_return ret = httpUpdate.update(otaClient, url);

        switch (ret) {
            case HTTP_UPDATE_FAILED:
                DEBUG_PRINTF("HTTP_UPDATE_FAILED Error (%d): %s\n", httpUpdate.getLastError(), httpUpdate.getLastErrorString().c_str());
                mqttPublishEvent("ota_failed");
                break;
            case HTTP_UPDATE_NO_UPDATES:
                DEBUG_PRINTLN("HTTP_UPDATE_NO_UPDATES");
                break;
            case HTTP_UPDATE_OK:
                DEBUG_PRINTLN("HTTP_UPDATE_OK"); // Will restart automatically
                break;
        }
    }
}

enum MessageType { MSG_TRIGGER, MSG_COMMAND, MSG_FIRMWARE, MSG_UNKNOWN };

MessageType getMessageType(const char* typeStr) {
    if (strcmp(typeStr, "trigger") == 0) return MSG_TRIGGER;
    if (strcmp(typeStr, "command") == 0) return MSG_COMMAND;
    if (strcmp(typeStr, "firmware") == 0) return MSG_FIRMWARE;
    return MSG_UNKNOWN;
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
    // Convert payload to null-terminated string
    char message[256];
    unsigned int len = length < 255 ? length : 255;
    memcpy(message, payload, len);
    message[len] = '\0';
    
    DEBUG_PRINTF("Message arrived [%s]: %s\n", topic, message);
    
    String topicStr(topic);
    if (topicStr.endsWith("/rx")) {
        StaticJsonDocument<256> doc;
        DeserializationError err = deserializeJson(doc, message);
        if (err) {
            DEBUG_PRINTF("JSON parse failed for rx message: %s\n", err.c_str());
            return;
        }

        const char* typeStr = doc["type"];
        if (!typeStr) {
            DEBUG_PRINTLN("Missing 'type' in rx message");
            return;
        }

        switch (getMessageType(typeStr)) {
            case MSG_TRIGGER:
                handleTrigger(doc.as<JsonObjectConst>());
                break;
            case MSG_COMMAND:
                handleCommand(doc.as<JsonObjectConst>());
                break;
            case MSG_FIRMWARE:
                handleFirmware(doc.as<JsonObjectConst>());
                break;
            case MSG_UNKNOWN:
            default:
                DEBUG_PRINTF("Unknown rx message type: %s\n", typeStr);
                break;
        }
    }
}

void mqttManagerInit(SystemSettings* settings) {
    _systemSettings = settings;
    espClient.setInsecure(); // Required for connecting to EMQX secure port without cert bundle on tight memory
    client.setServer(mqtt_server, mqtt_port);
    client.setCallback(mqttCallback);
    
    // Load bell ring counter from NVS (resets on new day)
    _totalBellRings = storageLoadBellRings(getTodayDate());
    
    // Load server URL from NVS
    storageLoadServerUrl(_serverUrl);
}

void mqttPublishEvent(const char* eventName) {
    if (!client.connected()) return;
    
    String topic = "bell/" + getDeviceId() + "/events";
    
    StaticJsonDocument<128> doc;
    doc["event"] = eventName;
    doc["timestamp"] = rtcGetUnixTime();
    
    char buffer[128];
    serializeJson(doc, buffer);
    client.publish(topic.c_str(), buffer);
}

void mqttRegisterDevice(const char* name) {
    if (!_systemSettings) return;

    // Save to local NVS flash immediately
    _systemSettings->isRegistered = true;
    strncpy(_systemSettings->deviceName, name, 31);
    _systemSettings->deviceName[31] = '\0';
    storageSaveSettings(*_systemSettings);
    
    DEBUG_PRINTF("Device registered locally as: %s\n", name);
    
    // Publish to cloud if connected
    if (client.connected()) {
        String topic = "bell/register";
        StaticJsonDocument<128> doc;
        doc["device_id"] = getDeviceId();
        doc["name"] = name;
        
        char buffer[128];
        serializeJson(doc, buffer);
        
        if (client.publish(topic.c_str(), buffer)) {
            DEBUG_PRINTLN("Registration payload published to Cloud.");
        } else {
            DEBUG_PRINTLN("Failed to publish registration payload to Cloud.");
        }
        
        // Push a status update immediately to reflect registration true
        publishStatus();
    }
}

void publishStatus() {
    if (!_systemSettings) return;
    if (WiFi.status() != WL_CONNECTED) return;
    if (_serverUrl.isEmpty()) {
        DEBUG_PRINTLN("[STATUS] No server URL configured, skipping HTTP status");
        return;
    }
    
    // Check if bell rings date needs reset
    uint32_t today = getTodayDate();
    _totalBellRings = storageLoadBellRings(today);
    
    // Build comprehensive status JSON
    StaticJsonDocument<1024> doc;
    
    // Core identity
    doc["device_id"] = getDeviceId();
    doc["status"] = "online";
    doc["firmware_version"] = FIRMWARE_VERSION;
    doc["device_name"] = _systemSettings->deviceName;
    doc["is_registered"] = _systemSettings->isRegistered;
    doc["masterEnable"] = _systemSettings->masterEnable;
    
    // WiFi STA info
    bool wifiConn = (WiFi.status() == WL_CONNECTED);
    doc["wifi_connected"] = wifiConn;
    doc["wifi_signal"] = wifiConn ? WiFi.RSSI() : 0;
    doc["ip_address"] = wifiConn ? WiFi.localIP().toString() : "";
    doc["ssid"] = wifiConn ? WiFi.SSID() : "";
    doc["wifi_channel"] = wifiConn ? WiFi.channel() : 0;
    doc["wifi_bssid"] = wifiConn ? WiFi.BSSIDstr() : "";
    
    // AP info
    String apSsid, apPass;
    storageLoadApConfig(apSsid, apPass);
    doc["ap_ssid"] = apSsid;
    doc["ap_password"] = apPass;
    doc["ap_connections"] = WiFi.softAPgetStationNum();
    doc["ap_ip"] = WiFi.softAPIP().toString();
    
    // Time
    doc["current_time"] = rtcGetUnixTime();
    
    // Uptime
    doc["uptime"] = millis() / 1000;
    
    // Memory
    doc["total_heap"] = ESP.getHeapSize();
    doc["free_heap"] = ESP.getFreeHeap();
    doc["flash_size"] = ESP.getFlashChipSize();
    doc["free_flash"] = ESP.getFreeSketchSpace();
    
    // Temperature
    uint8_t rawTemp = temprature_sens_read();
    if (rawTemp != 128 && rawTemp != 0) {
        doc["temperature"] = (float)(rawTemp - 32) / 1.8;
    } else {
        doc["temperature"] = (char*)nullptr; // null
    }
    
    // RTC battery state
    doc["rtc_status"] = rtcLostPower() ? "battery_low" : "ok";
    
    // Bell rings today
    doc["total_bell_rings"] = _totalBellRings;
    
    // Schedule count
    doc["schedule_count"] = _scheduleCount ? *_scheduleCount : 0;
    
    // MQTT status
    doc["mqtt_status"] = client.connected() ? "connected" : "disconnected";
    
    // Serialize
    char buffer[1024];
    size_t len = serializeJson(doc, buffer, sizeof(buffer));
    
    // POST to server (handle HTTP and HTTPS)
    HTTPClient http;
    String url = _serverUrl + "/device/" + getDeviceId() + "/status";
    bool success = false;
    
    WiFiClientSecure secureClient;
    WiFiClient normalClient;
    
    if (_serverUrl.startsWith("https://")) {
        secureClient.setInsecure(); // Skip certificate validation
        success = http.begin(secureClient, url);
    } else {
        success = http.begin(normalClient, url);
    }
    
    if (success) {
        http.addHeader("Content-Type", "application/json");
        DEBUG_PRINTLN("[STATUS] Sending HTTP POST to: " + url);
        DEBUG_PRINTLN("[STATUS] Payload:");
        DEBUG_PRINTLN(buffer);
        
        int httpCode = http.POST((uint8_t*)buffer, len);
        if (httpCode > 0) {
            String responseStr = http.getString();
            DEBUG_PRINTF("[STATUS] HTTP POST Code: %d\n", httpCode);
            DEBUG_PRINTLN("[STATUS] Response Body:");
            DEBUG_PRINTLN(responseStr.c_str());
        } else {
            DEBUG_PRINTF("[STATUS] HTTP POST failed, error: %s\n", http.errorToString(httpCode).c_str());
        }
        http.end();
    } else {
        DEBUG_PRINTLN("[STATUS] HTTPClient begin failed (check URL format or TLS connection)");
    }
}

void mqttIncrementBellRings() {
    _totalBellRings++;
    storageSaveBellRings(_totalBellRings, getTodayDate());
    DEBUG_PRINTF("[BELL] Ring count today: %lu\n", _totalBellRings);
}

void mqttSetScheduleInfo(BellTime* schedules, uint8_t* scheduleCount) {
    _schedules = schedules;
    _scheduleCount = scheduleCount;
}

void mqttReloadServerUrl() {
    storageLoadServerUrl(_serverUrl);
    DEBUG_PRINTF("[MQTT] Server URL reloaded: %s\n", _serverUrl.c_str());
}

void httpSyncSchedules() {
    if (WiFi.status() != WL_CONNECTED) return;
    if (_serverUrl.isEmpty()) {
        DEBUG_PRINTLN("[SYNC] No server URL configured, skipping schedule sync");
        return;
    }
    if (!_schedules || !_scheduleCount) return;

    HTTPClient http;
    String url = _serverUrl + "/device/" + getDeviceId() + "/schedules";
    bool success = false;
    
    WiFiClientSecure secureClient;
    WiFiClient normalClient;
    
    if (_serverUrl.startsWith("https://")) {
        secureClient.setInsecure(); // Skip certificate validation
        success = http.begin(secureClient, url);
    } else {
        success = http.begin(normalClient, url);
    }
    
    if (success) {
        DEBUG_PRINTLN("[SYNC] Sending HTTP GET to: " + url);
        int httpCode = http.GET();
        if (httpCode > 0) {
            if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_MOVED_PERMANENTLY) {
                String payload = http.getString();
                
                // Parse JSON
                DynamicJsonDocument doc(4096);
                DeserializationError error = deserializeJson(doc, payload);
                if (error) {
                    DEBUG_PRINTF("[SYNC] JSON parse failed: %s\n", error.c_str());
                    http.end();
                    return;
                }
                
                JsonArray schedulesObj = doc["schedules"].as<JsonArray>();
                uint8_t count = 0;
                
                for (JsonObject s : schedulesObj) {
                    if (count >= MAX_SCHEDULES) break;
                    
                    BellTime newEntry;
                    newEntry.hour = s["hour"].as<uint8_t>();
                    newEntry.minute = s["minute"].as<uint8_t>();
                    newEntry.days = 127; // Default all days
                    newEntry.enabled = true;
                    strncpy(newEntry.label, "Synced Schedule", 15);
                    newEntry.label[15] = '\0';
                    
                    // Parse pattern steps
                    uint8_t stepCount = 0;
                    JsonArray patternStrArray = s["pattern"].as<JsonArray>();
                    
                    for (JsonArray stepParam : patternStrArray) {
                        if (stepCount >= MAX_STEPS) break;
                        if (stepParam.size() == 2) {
                            newEntry.steps[stepCount].duration = stepParam[0].as<uint8_t>();
                            newEntry.steps[stepCount].delay = stepParam[1].as<uint8_t>();
                            stepCount++;
                        }
                    }
                    
                    if (stepCount == 0) continue; // Skip invalid schedules
                    newEntry.stepCount = stepCount;
                    
                    // Copy to array
                    _schedules[count] = newEntry;
                    count++;
                }
                
                *_scheduleCount = count;
                storageSaveSchedules(_schedules, *_scheduleCount);
                DEBUG_PRINTF("[SYNC] Synced %d schedules from server.\n", count);
                mqttPublishEvent("schedules_synced");
                publishStatus();
            }
        } else {
            DEBUG_PRINTF("[SYNC] HTTP GET failed, error: %s\n", http.errorToString(httpCode).c_str());
        }
        http.end();
    } else {
        DEBUG_PRINTLN("[SYNC] HTTPClient begin failed");
    }
}

void mqttManagerLoop() {
    if (WiFi.status() != WL_CONNECTED) return;
    
    if (!client.connected()) {
        static unsigned long lastReconnectAttempt = 0;
        unsigned long now = millis();
        if (now - lastReconnectAttempt > 5000) {
            lastReconnectAttempt = now;
            mqttReconnect();
        }
    } else {
        client.loop();
    }
        
    // Report status every STATUS_INTERVAL (independent of MQTT connection)
    unsigned long now = millis();
    if (now - lastStatusTime > STATUS_INTERVAL) {
        lastStatusTime = now;
        publishStatus();
    }
    
    // Periodic schedule sync (every 1 hour = 3600000ms)
    static unsigned long lastSyncTime = 0;
    if (now - lastSyncTime > 3600000) {
        lastSyncTime = now;
        httpSyncSchedules();
    }
}
