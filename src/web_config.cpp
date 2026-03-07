/**
 * @file web_config.cpp
 * @brief Web Config Service – SPA from static_files.h + JSON API
 *
 * Serves the compiled Preact SPA from static_files.h (gzip-compressed)
 * and exposes JSON API endpoints for the SPA to communicate with.
 *
 * Static SPA routes (from vite-plugin-preact-esp32):
 *   All files in static_files::files[] are served with Content-Encoding: gzip
 *   GET / → index.html (SPA entry point)
 *   Any unknown route → index.html (SPA client-side routing fallback)
 *
 * JSON API endpoints:
 *   GET  /api/status     → System status (time, date, next bell, schedule count)
 *   GET  /api/schedules  → All schedules as JSON array
 *   POST /api/schedules  → Add a new schedule (JSON body)
 *   DELETE /api/schedules→ Delete schedule by ?idx=N
 *   POST /api/ring       → Trigger manual ring
 *   POST /api/set-time   → Set RTC time (JSON body)
 *   GET  /api/system     → System info (uptime, heap)
 *   GET  /api/logs       → Recent log entries
 */

#include "web_config.h"
#include "rtc_service.h"
#include "storage_manager.h"
#include "pattern_engine.h"
#include <WiFi.h>
#include <WebServer.h>
#include <pgmspace.h>
#include <Update.h>
#include "static_files.h"
#include "led_feedback.h"
#include "wifi_manager.h"

// ---- Module-private state ----
static WebServer       _server(WEB_SERVER_PORT);
static BellTime*       _schedules     = nullptr;
static uint8_t*        _scheduleCount = nullptr;
static SystemSettings* _settings      = nullptr;
static bool            _otaInProgress = false;
static bool            _otaSuccess    = false;

// ============================================================
// HELPER – Send CORS headers on all API responses
// ============================================================
static void sendCorsHeaders() {
    _server.sendHeader("Access-Control-Allow-Origin", "*");
    _server.sendHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    _server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ============================================================
// HELPER – Simple JSON string escaping (for safety)
// ============================================================
static String jsonStr(const String& s) {
    String out = "\"";
    out += s;
    out += "\"";
    return out;
}

// ============================================================
// HELPER – Parse a simple JSON value by key from body string
// Supports integer values only. Returns defaultVal if not found.
// ============================================================
static int jsonParseInt(const String& body, const char* key, int defaultVal = 0) {
    String search = String("\"") + key + "\"";
    int idx = body.indexOf(search);
    if (idx < 0) return defaultVal;
    idx = body.indexOf(':', idx);
    if (idx < 0) return defaultVal;
    idx++;
    // Skip whitespace
    while (idx < (int)body.length() && (body[idx] == ' ' || body[idx] == '\t')) idx++;
    return body.substring(idx).toInt();
}

static String jsonParseString(const String& body, const char* key, const String& defaultVal = "") {
    String search = String("\"") + key + "\":\"";
    int start = body.indexOf(search);
    if (start < 0) return defaultVal;
    start += search.length();
    int end = body.indexOf('\"', start);
    if (end < 0) return defaultVal;
    return body.substring(start, end);
}

static bool jsonParseBool(const String& body, const char* key, bool defaultVal = false) {
    String search = String("\"") + key + "\":";
    int idx = body.indexOf(search);
    if (idx < 0) return defaultVal;
    idx += search.length();
    while (idx < (int)body.length() && (body[idx] == ' ' || body[idx] == '\t')) idx++;
    if (body.substring(idx).startsWith("true")) return true;
    if (body.substring(idx).startsWith("false")) return false;
    return defaultVal;
}

// ============================================================
// HELPER – Parse steps array from JSON body
// Format: "steps":[{"duration":3,"delay":1},...]
// ============================================================
static uint8_t jsonParseSteps(const String& body, PatternStep* steps, uint8_t maxSteps) {
    int stepsIdx = body.indexOf("\"steps\"");
    if (stepsIdx < 0) return 0;
    int arrStart = body.indexOf('[', stepsIdx);
    if (arrStart < 0) return 0;
    int arrEnd = body.indexOf(']', arrStart);
    if (arrEnd < 0) return 0;

    String arr = body.substring(arrStart, arrEnd + 1);
    uint8_t count = 0;
    int pos = 0;
    while (count < maxSteps) {
        int objStart = arr.indexOf('{', pos);
        if (objStart < 0) break;
        int objEnd = arr.indexOf('}', objStart);
        if (objEnd < 0) break;
        String obj = arr.substring(objStart, objEnd + 1);

        steps[count].duration = (uint8_t)jsonParseInt(obj, "duration", 1);
        steps[count].delay    = (uint8_t)jsonParseInt(obj, "delay", 0);
        count++;
        pos = objEnd + 1;
    }
    return count;
}

// ============================================================
// API HANDLERS
// ============================================================

// GET /api/status
static void handleApiStatus() {
    sendCorsHeaders();

    uint16_t y;
    uint8_t mo, d, h, m, s;
    rtcGetDateTime(y, mo, d, h, m, s);

    char timeBuf[12];
    snprintf(timeBuf, sizeof(timeBuf), "%02d:%02d:%02d", h, m, s);

    // Find next bell
    String nextBell = "--:--";
    uint16_t nowMins = (uint16_t)h * 60 + m;
    uint16_t bestMins = 0xFFFF;
    for (uint8_t i = 0; i < *_scheduleCount; i++) {
        uint16_t schedMins = (uint16_t)_schedules[i].hour * 60 + _schedules[i].minute;
        if (schedMins > nowMins && schedMins < bestMins) {
            bestMins = schedMins;
            int hr12 = _schedules[i].hour % 12;
            if (hr12 == 0) hr12 = 12;
            const char* ampm = (_schedules[i].hour >= 12) ? "PM" : "AM";
            char nb[16];
            snprintf(nb, sizeof(nb), "%02d:%02d %s", hr12, _schedules[i].minute, ampm);
            nextBell = nb;
        }
    }

    // Date string
    // Note: RTC date not easily available from rtcGetTime; provide a static format
    // The SPA computes its own date from the browser clock

    unsigned long uptimeSec = millis() / 1000;
    char uptimeBuf[24];
    snprintf(uptimeBuf, sizeof(uptimeBuf), "%luh %02lum %02lus",
             uptimeSec / 3600, (uptimeSec % 3600) / 60, uptimeSec % 60);

    String json = "{";
    json += "\"time\":\"" + String(timeBuf) + "\",";
    json += "\"date\":\"IST\",";
    json += "\"year\":" + String(y) + ",";
    json += "\"month\":" + String(mo) + ",";
    json += "\"day\":" + String(d) + ",";
    json += "\"hour\":" + String(h) + ",";
    json += "\"minute\":" + String(m) + ",";
    json += "\"second\":" + String(s) + ",";
    json += "\"nextBell\":\"" + nextBell + "\",";
    json += "\"scheduleCount\":" + String(*_scheduleCount) + ",";
    json += "\"uptime\":\"" + String(uptimeBuf) + "\",";
    json += "\"freeHeap\":" + String(ESP.getFreeHeap() / 1024) + ",";
    json += "\"deviceName\":\"" + String(_settings->deviceName) + "\",";
    json += "\"masterEnable\":" + String(_settings->masterEnable ? "true" : "false");
    json += "}";

    _server.send(200, "application/json", json);
}

// GET /api/schedules
static void handleApiGetSchedules() {
    sendCorsHeaders();

    String json = "[";
    for (uint8_t i = 0; i < *_scheduleCount; i++) {
        if (i > 0) json += ",";
        json += "{";
        json += "\"hour\":" + String(_schedules[i].hour) + ",";
        json += "\"minute\":" + String(_schedules[i].minute) + ",";
        json += "\"stepCount\":" + String(_schedules[i].stepCount) + ",";
        json += "\"days\":" + String(_schedules[i].days) + ",";
        json += "\"enabled\":" + String(_schedules[i].enabled ? "true" : "false") + ",";
        json += "\"label\":\"" + String(_schedules[i].label) + "\",";
        json += "\"steps\":[";
        for (uint8_t st = 0; st < _schedules[i].stepCount && st < MAX_STEPS; st++) {
            if (st > 0) json += ",";
            json += "{\"duration\":" + String(_schedules[i].steps[st].duration);
            json += ",\"delay\":" + String(_schedules[i].steps[st].delay) + "}";
        }
        json += "]}";
    }
    json += "]";

    _server.send(200, "application/json", json);
}

// POST /api/schedules
static void handleApiAddSchedule() {
    sendCorsHeaders();

    if (*_scheduleCount >= MAX_SCHEDULES) {
        _server.send(400, "application/json", "{\"error\":\"Max schedules reached\"}");
        return;
    }

    String body = _server.arg("plain");

    BellTime newEntry;
    newEntry.hour      = (uint8_t)(jsonParseInt(body, "hour") % 24);
    newEntry.minute    = (uint8_t)(jsonParseInt(body, "minute") % 60);
    newEntry.stepCount = (uint8_t)jsonParseInt(body, "stepCount", 1);
    newEntry.days      = (uint8_t)jsonParseInt(body, "days", 127); // Default all days
    newEntry.enabled   = jsonParseBool(body, "enabled", true);
    
    String labelStr = jsonParseString(body, "label", "Bell Schedule");
    strncpy(newEntry.label, labelStr.c_str(), 15);
    newEntry.label[15] = '\0';

    if (newEntry.stepCount < 1)         newEntry.stepCount = 1;
    if (newEntry.stepCount > MAX_STEPS) newEntry.stepCount = MAX_STEPS;
    memset(newEntry.steps, 0, sizeof(newEntry.steps));

    uint8_t parsed = jsonParseSteps(body, newEntry.steps, newEntry.stepCount);
    // Ensure at least 1s duration for each step
    for (uint8_t i = 0; i < newEntry.stepCount; i++) {
        if (newEntry.steps[i].duration < 1) newEntry.steps[i].duration = 1;
    }

    _schedules[*_scheduleCount] = newEntry;
    (*_scheduleCount)++;
    storageSaveSchedules(_schedules, *_scheduleCount);

    DEBUG_PRINTF("[WEB] Added schedule: %02d:%02d (%d steps)\n",
                 newEntry.hour, newEntry.minute, newEntry.stepCount);

    _server.send(200, "application/json", "{\"ok\":true}");
}

// PUT /api/schedules?idx=N
static void handleApiEditSchedule() {
    sendCorsHeaders();

    if (!_server.hasArg("idx")) {
        _server.send(400, "application/json", "{\"error\":\"Missing idx\"}");
        return;
    }

    uint8_t idx = (uint8_t)_server.arg("idx").toInt();
    if (idx >= *_scheduleCount) {
        _server.send(400, "application/json", "{\"error\":\"Invalid idx\"}");
        return;
    }

    String body = _server.arg("plain");

    BellTime &editEntry = _schedules[idx];
    editEntry.hour      = (uint8_t)(jsonParseInt(body, "hour") % 24);
    editEntry.minute    = (uint8_t)(jsonParseInt(body, "minute") % 60);
    editEntry.stepCount = (uint8_t)jsonParseInt(body, "stepCount", 1);
    editEntry.days      = (uint8_t)jsonParseInt(body, "days", 127);
    editEntry.enabled   = jsonParseBool(body, "enabled", true);

    String labelStr = jsonParseString(body, "label", "Bell Schedule");
    strncpy(editEntry.label, labelStr.c_str(), 15);
    editEntry.label[15] = '\0';

    if (editEntry.stepCount < 1)         editEntry.stepCount = 1;
    if (editEntry.stepCount > MAX_STEPS) editEntry.stepCount = MAX_STEPS;
    memset(editEntry.steps, 0, sizeof(editEntry.steps));

    uint8_t parsed = jsonParseSteps(body, editEntry.steps, editEntry.stepCount);
    for (uint8_t i = 0; i < editEntry.stepCount; i++) {
        if (editEntry.steps[i].duration < 1) editEntry.steps[i].duration = 1;
    }

    storageSaveSchedules(_schedules, *_scheduleCount);

    DEBUG_PRINTF("[WEB] Edited schedule idx %d: %02d:%02d\n",
                 idx, editEntry.hour, editEntry.minute);

    _server.send(200, "application/json", "{\"ok\":true}");
}

// DELETE /api/schedules?idx=N
static void handleApiDeleteSchedule() {
    sendCorsHeaders();

    if (!_server.hasArg("idx")) {
        _server.send(400, "application/json", "{\"error\":\"Missing idx\"}");
        return;
    }

    uint8_t idx = (uint8_t)_server.arg("idx").toInt();
    if (idx >= *_scheduleCount) {
        _server.send(400, "application/json", "{\"error\":\"Invalid idx\"}");
        return;
    }

    for (uint8_t i = idx; i < *_scheduleCount - 1; i++)
        _schedules[i] = _schedules[i + 1];
    memset(&_schedules[--(*_scheduleCount)], 0, sizeof(BellTime));
    storageSaveSchedules(_schedules, *_scheduleCount);

    DEBUG_PRINTF("[WEB] Deleted idx %d, %d remaining\n", idx, *_scheduleCount);

    _server.send(200, "application/json", "{\"ok\":true}");
}

// POST /api/ring
static void handleApiRing() {
    sendCorsHeaders();

    String body = _server.arg("plain");
    String state = jsonParseString(body, "state", "on");

    if (state == "on") {
        // Start or refresh dynamic manual ring with 4 second watchdog
        patternStartDynamicManual(4);
    } else if (state == "off") {
        patternStop();
    }

    _server.send(200, "application/json", "{\"ok\":true}");
}

// POST /api/test-pattern
static void handleApiTestPattern() {
    sendCorsHeaders();

    String body = _server.arg("plain");

    BellTime tempEntry;
    tempEntry.hour      = 0;
    tempEntry.minute    = 0;
    tempEntry.stepCount = (uint8_t)jsonParseInt(body, "stepCount", 1);
    if (tempEntry.stepCount < 1)         tempEntry.stepCount = 1;
    if (tempEntry.stepCount > MAX_STEPS) tempEntry.stepCount = MAX_STEPS;
    memset(tempEntry.steps, 0, sizeof(tempEntry.steps));

    uint8_t parsed = jsonParseSteps(body, tempEntry.steps, tempEntry.stepCount);
    // Ensure at least 1s duration for each step
    for (uint8_t i = 0; i < tempEntry.stepCount; i++) {
        if (tempEntry.steps[i].duration < 1) tempEntry.steps[i].duration = 1;
    }

    if (!patternIsRunning()) {
        patternStartTest(tempEntry);
    } else {
        _server.send(400, "application/json", "{\"error\":\"Bell is currently ringing\"}");
        return;
    }

    _server.send(200, "application/json", "{\"ok\":true}");
}

// POST /api/set-time
static void handleApiSetTime() {
    sendCorsHeaders();

    String body = _server.arg("plain");

    rtcSetTime(
        (uint16_t)jsonParseInt(body, "year", 2026),
        (uint8_t)jsonParseInt(body, "month", 1),
        (uint8_t)jsonParseInt(body, "day", 1),
        (uint8_t)jsonParseInt(body, "hour", 0),
        (uint8_t)jsonParseInt(body, "min", 0),
        (uint8_t)jsonParseInt(body, "sec", 0)
    );

    DEBUG_PRINTLN("[WEB] RTC time updated via API");

    _server.send(200, "application/json", "{\"ok\":true}");
}

// POST /api/restart
static void handleApiRestart() {
    sendCorsHeaders();
    ledSetStatus(LED_EVT_RESTART);
    _server.send(200, "application/json", "{\"ok\":true}");
    delay(800);  // Allow 3-blink pattern to be visible
    ESP.restart();
}

// GET /api/leds
static void handleApiLeds() {
    sendCorsHeaders();

    LedInfo leds[4];
    ledGetStates(leds);

    String json = "{";
    const char* keys[] = { "wifi", "rtc", "system", "status" };
    for (int i = 0; i < 4; i++) {
        if (i > 0) json += ",";
        json += "\"";
        json += keys[i];
        json += "\":{\"label\":\"";
        json += leds[i].label;
        json += "\",\"color\":\"";
        json += leds[i].color;
        json += "\",\"state\":\"";
        json += leds[i].state;
        json += "\"}";
    }
    json += "}";

    _server.send(200, "application/json", json);
}

// GET /api/system
static void handleApiSystem() {
    sendCorsHeaders();

    unsigned long uptimeSec = millis() / 1000;
    char uptimeBuf[24];
    snprintf(uptimeBuf, sizeof(uptimeBuf), "%luh %02lum %02lus",
             uptimeSec / 3600, (uptimeSec % 3600) / 60, uptimeSec % 60);

    String json = "{";
    json += "\"uptime\":\"" + String(uptimeBuf) + "\",";
    json += "\"freeHeap\":" + String(ESP.getFreeHeap() / 1024) + ",";
    json += "\"firmwareVersion\":\"1.0.1\"";
    json += "}";

    _server.send(200, "application/json", json);
}

// GET /api/logs
static void handleApiLogs() {
    sendCorsHeaders();

    unsigned long uptimeSec = millis() / 1000;
    char uptimeBuf[24];
    snprintf(uptimeBuf, sizeof(uptimeBuf), "%luh %02lum %02lus",
             uptimeSec / 3600, (uptimeSec % 3600) / 60, uptimeSec % 60);

    // Simple log entries based on system state
    String json = "[";
    json += "{\"type\":\"system\",\"title\":\"System Ready\",\"time\":\"Uptime: " + String(uptimeBuf) + "\"},";
    json += "{\"type\":\"info\",\"title\":\"Free Heap\",\"time\":\"" + String(ESP.getFreeHeap() / 1024) + " KB available\"},";
    json += "{\"type\":\"wifi\",\"title\":\"WiFi AP Active\",\"time\":\"SSID: " + String(AP_SSID) + "\"}";
    if (*_scheduleCount > 0) {
        json += ",{\"type\":\"bell\",\"title\":\"Schedules Loaded\",\"time\":\"" + String(*_scheduleCount) + " schedule(s) active\"}";
    }
    json += "]";

    _server.send(200, "application/json", json);
}

// GET /api/wifi-status
static void handleApiWifiStatus() {
    sendCorsHeaders();

    WifiStatus s = wifiManagerGetStatus();
    
    String json = "{";
    json += "\"connected\":" + String(s.connected ? "true" : "false") + ",";
    json += "\"ip\":\"" + s.ip + "\",";
    json += "\"ssid\":\"" + s.ssid + "\",";
    json += "\"state\":\"" + s.state + "\",";
    json += "\"rssi\":" + String(s.rssi) + ",";
    json += "\"bssid\":\"" + s.bssid + "\",";
    json += "\"channel\":" + String(s.channel);
    json += "}";

    _server.send(200, "application/json", json);
}

// POST /api/wifi-config
static void handleApiWifiConfig() {
    sendCorsHeaders();

    String body = _server.arg("plain");
    String ssid = jsonParseString(body, "ssid", "");
    String password = jsonParseString(body, "password", "");

    if (ssid.length() > 0) {
        wifiManagerConnect(ssid, password);
        _server.send(200, "application/json", "{\"ok\":true}");
    } else {
        _server.send(400, "application/json", "{\"error\":\"SSID cannot be empty\"}");
    }
}

// POST /api/wifi-disconnect
static void handleApiWifiDisconnect() {
    sendCorsHeaders();
    wifiManagerDisconnect();
    _server.send(200, "application/json", "{\"ok\":true}");
}

// GET /api/settings
static void handleApiGetSettings() {
    sendCorsHeaders();

    String json = "{";
    json += "\"deviceName\":\"" + String(_settings->deviceName) + "\",";
    json += "\"masterEnable\":" + String(_settings->masterEnable ? "true" : "false");
    json += "}";

    _server.send(200, "application/json", json);
}

// POST /api/settings
static void handleApiPostSettings() {
    sendCorsHeaders();

    String body = _server.arg("plain");
    
    // Parse masterEnable
    _settings->masterEnable = jsonParseBool(body, "masterEnable", true);

    // Parse deviceName
    String newName = jsonParseString(body, "deviceName", "College Bell System");
    strncpy(_settings->deviceName, newName.c_str(), 31);
    _settings->deviceName[31] = '\0';

    // Commit to NVS
    storageSaveSettings(*_settings);

    _server.send(200, "application/json", "{\"ok\":true}");
}

// OPTIONS handler for CORS preflight
static void handleOptions() {
    sendCorsHeaders();
    _server.send(204);
}

// ============================================================
// OTA FIRMWARE UPDATE
// ============================================================

// POST /api/update – completion handler (called after all chunks received)
static void handleOtaComplete() {
    sendCorsHeaders();
    if (_otaSuccess) {
        _server.send(200, "application/json", "{\"ok\":true}");
        DEBUG_PRINTLN("[OTA] Update successful, restarting...");
        delay(500);
        ESP.restart();
    } else {
        String err = Update.errorString();
        DEBUG_PRINTF("[OTA] Update failed: %s\n", err.c_str());
        ledClearStatus();
        _otaInProgress = false;
        _server.send(500, "application/json",
            "{\"error\":\"" + err + "\"}");
    }
}

// POST /api/update – upload handler (called per chunk)
static void handleOtaUpload() {
    HTTPUpload& upload = _server.upload();

    switch (upload.status) {
        case UPLOAD_FILE_START:
            if (_otaInProgress) {
                DEBUG_PRINTLN("[OTA] Already in progress, rejecting");
                return;
            }
            _otaInProgress = true;
            _otaSuccess    = false;
            ledSetStatus(LED_EVT_OTA);
            DEBUG_PRINTF("[OTA] Starting: %s\n", upload.filename.c_str());

            if (!Update.begin(UPDATE_SIZE_UNKNOWN)) {
                DEBUG_PRINTF("[OTA] Begin failed: %s\n",
                             Update.errorString());
                _otaInProgress = false;
                ledClearStatus();
            }
            break;

        case UPLOAD_FILE_WRITE:
            if (Update.isRunning()) {
                // Blink onboard LED (pin 2) at 250ms
                static unsigned long lastBlinkMs = 0;
                unsigned long now = millis();
                if (now - lastBlinkMs >= 250) {
                    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
                    lastBlinkMs = now;
                }
                if (Update.write(upload.buf, upload.currentSize)
                    != upload.currentSize) {
                    DEBUG_PRINTF("[OTA] Write failed: %s\n",
                                 Update.errorString());
                }
            }
            break;

        case UPLOAD_FILE_END:
            if (Update.isRunning()) {
                if (Update.end(true) && Update.isFinished()) {
                    _otaSuccess = true;
                    DEBUG_PRINTF("[OTA] Finished: %u bytes\n",
                                 upload.totalSize);
                } else {
                    DEBUG_PRINTF("[OTA] End failed: %s\n",
                                 Update.errorString());
                }
            }
            _otaInProgress = false;
            ledClearStatus();
            digitalWrite(LED_PIN, LOW);  // Turn off onboard LED
            break;

        case UPLOAD_FILE_ABORTED:
            Update.abort();
            _otaInProgress = false;
            _otaSuccess    = false;
            ledClearStatus();
            digitalWrite(LED_PIN, LOW);  // Turn off onboard LED
            DEBUG_PRINTLN("[OTA] Upload aborted");
            break;
    }
}

// SPA fallback – serve index.html for unknown routes
static void handleNotFound() {
    // Check if it's an API route – return 404 JSON
    if (_server.uri().startsWith("/api/")) {
        sendCorsHeaders();
        _server.send(404, "application/json", "{\"error\":\"Not found\"}");
        return;
    }
    // For all other routes, serve index.html so SPA routing works
    _server.sendHeader("Content-Encoding", "gzip");
    _server.send_P(200, "text/html",
        (const char *)static_files::f_index_html_contents,
        static_files::f_index_html_size);
}

// ============================================================
// PUBLIC API
// ============================================================

void webConfigInit(BellTime* schedules, uint8_t* scheduleCount, SystemSettings* settings) {
    _schedules     = schedules;
    _scheduleCount = scheduleCount;
    _settings      = settings;

    // We no longer call WiFi.softAP here in isolation. The wifiManager handles 
    // switching to WIFI_AP_STA mode. But we STILL want the AP to come up.
    // So we'll call softAP here but rely on wifiManager for mode.
    WiFi.softAP(AP_SSID, AP_PASSWORD);
    DEBUG_PRINT("[WIFI] AP started: ");
    DEBUG_PRINTLN(AP_SSID);
    DEBUG_PRINT("[WIFI] AP IP: ");
    DEBUG_PRINTLN(WiFi.softAPIP().toString());

    // ---- Serve compiled SPA static files from static_files.h ----
    // Loop over all compiled assets and register a route for each
    for (int i = 0; i < static_files::num_of_files; i++) {
        _server.on(static_files::files[i].path, [i]() {
            _server.sendHeader("Content-Encoding", "gzip");
            _server.send_P(200,
                static_files::files[i].type,
                (const char *)static_files::files[i].contents,
                static_files::files[i].size);
        });
    }

    // Serve index.html as the root entry point
    _server.on("/", HTTP_GET, []() {
        _server.sendHeader("Content-Encoding", "gzip");
        _server.send_P(200, "text/html",
            (const char *)static_files::f_index_html_contents,
            static_files::f_index_html_size);
    });

    // ---- JSON API endpoints ----
    _server.on("/api/status",    HTTP_GET,    handleApiStatus);
    _server.on("/api/schedules", HTTP_GET,    handleApiGetSchedules);
    _server.on("/api/schedules", HTTP_POST,   handleApiAddSchedule);
    _server.on("/api/schedules", HTTP_PUT,    handleApiEditSchedule);
    _server.on("/api/schedules", HTTP_DELETE, handleApiDeleteSchedule);
    _server.on("/api/ring",      HTTP_POST,   handleApiRing);
    _server.on("/api/test-pattern", HTTP_POST, handleApiTestPattern);
    _server.on("/api/set-time",  HTTP_POST,   handleApiSetTime);
    _server.on("/api/restart",   HTTP_POST,   handleApiRestart);
    _server.on("/api/system",    HTTP_GET,    handleApiSystem);
    _server.on("/api/logs",      HTTP_GET,    handleApiLogs);
    _server.on("/api/leds",      HTTP_GET,    handleApiLeds);
    _server.on("/api/wifi-status", HTTP_GET,  handleApiWifiStatus);
    _server.on("/api/wifi-config", HTTP_POST, handleApiWifiConfig);
    _server.on("/api/wifi-disconnect", HTTP_POST, handleApiWifiDisconnect);
    _server.on("/api/settings",  HTTP_GET,    handleApiGetSettings);
    _server.on("/api/settings",  HTTP_POST,   handleApiPostSettings);
    _server.on("/api/update",    HTTP_POST,   handleOtaComplete, handleOtaUpload);

    // CORS preflight for all API routes
    _server.on("/api/status",    HTTP_OPTIONS, handleOptions);
    _server.on("/api/schedules", HTTP_OPTIONS, handleOptions);
    _server.on("/api/ring",      HTTP_OPTIONS, handleOptions);
    _server.on("/api/test-pattern", HTTP_OPTIONS, handleOptions);
    _server.on("/api/set-time",  HTTP_OPTIONS, handleOptions);
    _server.on("/api/restart",   HTTP_OPTIONS, handleOptions);
    _server.on("/api/system",    HTTP_OPTIONS, handleOptions);
    _server.on("/api/logs",      HTTP_OPTIONS, handleOptions);
    _server.on("/api/leds",      HTTP_OPTIONS, handleOptions);
    _server.on("/api/wifi-status", HTTP_OPTIONS, handleOptions);
    _server.on("/api/wifi-config", HTTP_OPTIONS, handleOptions);
    _server.on("/api/wifi-disconnect", HTTP_OPTIONS, handleOptions);
    _server.on("/api/settings",  HTTP_OPTIONS, handleOptions);
    _server.on("/api/update",    HTTP_OPTIONS, handleOptions);

    // SPA fallback for client-side routing
    _server.onNotFound(handleNotFound);

    _server.begin();
    DEBUG_PRINTLN("[WEB] SPA + JSON API server started on port 80");
}

void webConfigLoop() {
    _server.handleClient();
}
