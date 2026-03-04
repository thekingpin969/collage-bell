/**
 * @file web_config.cpp
 * @brief Web Config Service – LittleFS-based UI
 *
 * Serves the redesigned Tailwind CSS pages from the /data folder
 * using LittleFS. Dynamic placeholders are replaced on-the-fly
 * before streaming the file to the client.
 *
 * Endpoints:
 *   GET  /            → Dashboard (index.html)
 *   GET  /schedules   → Schedule list (schedules.html)
 *   GET  /configure   → Add schedule form (configure.html)
 *   GET  /settings    → RTC settings (settings.html)
 *   GET  /maintenance → System info (maintenance.html)
 *   POST /add         → Add a new schedule
 *   GET  /delete      → Delete a schedule by index
 *   POST /ring        → Manual ring
 *   POST /set-time    → Set RTC time
 */

#include "web_config.h"
#include "rtc_service.h"
#include "storage_manager.h"
#include "pattern_engine.h"
#include <WiFi.h>
#include <WebServer.h>
#include <FS.h>

// LittleFS support: works on ESP32 Arduino core 2.x+
#ifdef ESP_ARDUINO_VERSION_MAJOR
  #if ESP_ARDUINO_VERSION_MAJOR >= 2
    #include <LittleFS.h>
    #define FILESYSTEM LittleFS
  #else
    #include <SPIFFS.h>
    #define FILESYSTEM SPIFFS
    #warning "Using SPIFFS – upgrade ESP32 core to 2.x for LittleFS support"
  #endif
#else
  #include <LittleFS.h>
  #define FILESYSTEM LittleFS
#endif

// ---- Module-private state ----
static WebServer   _server(WEB_SERVER_PORT);
static BellTime*   _schedules     = nullptr;
static uint8_t*    _scheduleCount = nullptr;

// ============================================================
// HELPER – read an HTML file from FILESYSTEM, do placeholder
// substitution and stream to client.
// ============================================================
static void sendPage(const char* path) {
    if (!FILESYSTEM.exists(path)) {
        _server.send(404, "text/plain", "Page not found. Please upload data/ files via: pio run -t uploadfs");
        return;
    }

    File f = FILESYSTEM.open(path, "r");
    if (!f) {
        _server.send(500, "text/plain", "Failed to open file");
        return;
    }

    String html = f.readString();
    f.close();

    // ------- Time / Date -------
    uint8_t h, m, s;
    rtcGetTime(h, m, s);

    char timeBuf[12];
    snprintf(timeBuf, sizeof(timeBuf), "%02d:%02d:%02d", h, m, s);
    html.replace("{{TIME_STR}}", timeBuf);

    // RTC fields for the settings form
    html.replace("{{HOUR}}",   String(h));
    html.replace("{{MINUTE}}", String(m));
    html.replace("{{SECOND}}", String(s));
    html.replace("{{YEAR}}",   "2026");
    html.replace("{{MONTH}}",  "3");
    html.replace("{{DAY}}",    "4");

    // Date string – static for now
    html.replace("{{DATE_STR}}", "India Standard Time | Wed, 4 Mar");

    // ------- Schedule count -------
    html.replace("{{TOTAL_SCHEDULES}}", String(*_scheduleCount));

    // ------- Next Bell --------
    // Find the soonest schedule after current time
    String nextBell = "--:--";
    uint16_t nowMins = (uint16_t)h * 60 + m;
    uint16_t bestMins = 0xFFFF;
    for (uint8_t i = 0; i < *_scheduleCount; i++) {
        uint16_t schedMins = (uint16_t)_schedules[i].hour * 60 + _schedules[i].minute;
        if (schedMins > nowMins && schedMins < bestMins) {
            bestMins = schedMins;
            char nb[8];
            snprintf(nb, sizeof(nb), "%02d:%02d", _schedules[i].hour, _schedules[i].minute);
            nextBell = nb;
        }
    }
    html.replace("{{NEXT_BELL}}", nextBell);

    // ------- Schedule list HTML -------
    if (html.indexOf("{{SCHEDULE_LIST}}") != -1) {
        String listHtml = "";
        if (*_scheduleCount == 0) {
            listHtml = "<div class='empty'>"
                       "<span class='empty-icon'><svg viewBox=\"0 0 24 24\" fill=\"currentColor\"><path d=\"M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z\"/></svg></span>"
                       "<p class='empty-text'>No schedules yet</p>"
                       "<a href='/configure' class='add-first'>Add First Schedule</a>"
                       "</div>";
        } else {
            for (uint8_t i = 0; i < *_scheduleCount; i++) {
                // Build pattern summary: e.g. 3s/1s, 5s
                String pattern = "";
                for (uint8_t st = 0; st < _schedules[i].stepCount && st < MAX_STEPS; st++) {
                    if (st > 0) pattern += ", ";
                    pattern += String(_schedules[i].steps[st].duration) + "s";
                    if (_schedules[i].steps[st].delay > 0)
                        pattern += "/" + String(_schedules[i].steps[st].delay) + "s";
                }

                int hr12 = _schedules[i].hour % 12;
                if (hr12 == 0) hr12 = 12;
                const char* ampm = (_schedules[i].hour >= 12) ? "PM" : "AM";

                char entry[1500];
                snprintf(entry, sizeof(entry),
                    "<div class='card'>"
                        "<div class='flex justify-between items-start mb-4'>"
                            "<div>"
                                "<h3 class='flex items-baseline gap-1'>"
                                    "<span class='time-display'>%02d:%02d</span>"
                                    "<span class='time-ampm'>%s</span>"
                                "</h3>"
                                "<p class='card-title'>Schedule #%d</p>"
                            "</div>"
                            "<label class='switch'>"
                                "<input type='checkbox' checked>"
                                "<div class='switch-track'><div class='switch-thumb'></div></div>"
                            "</label>"
                        "</div>"
                        "<div class='pattern-info flex justify-between items-center'>"
                            "<div class='flex items-center gap-2'>"
                                "<span class='pattern-info-icon'><svg viewBox=\"0 0 24 24\" width=\"14\" height=\"14\" fill=\"currentColor\"><path d=\"M7 18h2V6H7v12zm4 4h2V2h-2v20zm-8-8h2v-4H3v4zm12 4h2V6h-2v12zm4-8v4h2v-4h-2z\"/></svg></span>"
                                "<span class='pattern-text'>%s</span>"
                            "</div>"
                            "<span class='pattern-badge'>%d step(s)</span>"
                        "</div>"
                        "<div class='flex items-center gap-3'>"
                            "<form action='/ring' method='POST' style='flex:1;display:flex;'><button type='submit' class='btn-test'>"
                                "<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" fill=\"currentColor\"><path d=\"M8 5v14l11-7z\"/></svg>"
                                "Test"
                            "</button></form>"
                            "<div class='flex gap-2'>"
                                "<a href='#' class='btn-icon' aria-label='Edit'>"
                                    "<svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" fill=\"currentColor\"><path d=\"M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z\"/></svg>"
                                "</a>"
                                "<a href='/delete?idx=%d' class='btn-icon danger' aria-label='Delete'>"
                                    "<svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" fill=\"currentColor\"><path d=\"M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z\"/></svg>"
                                "</a>"
                            "</div>"
                        "</div>"
                    "</div>",
                    hr12, _schedules[i].minute, ampm,
                    i + 1,
                    pattern.c_str(),
                    _schedules[i].stepCount,
                    i
                );
                listHtml += entry;
            }
        }
        html.replace("{{SCHEDULE_LIST}}", listHtml);
    }

    // ------- Maintenance data -------
    unsigned long uptimeSec = millis() / 1000;
    char uptimeBuf[24];
    snprintf(uptimeBuf, sizeof(uptimeBuf), "%luh %02lum %02lus",
             uptimeSec / 3600, (uptimeSec % 3600) / 60, uptimeSec % 60);
    html.replace("{{UPTIME}}", uptimeBuf);
    html.replace("{{FREE_HEAP}}", String(ESP.getFreeHeap() / 1024));

    // Log entries placeholder
    html.replace("{{LOG_ENTRIES}}",
        String("<div class='log-entry'>"
            "<div class='log-dot green'>&#x2714;</div>"
            "<div>"
                "<div class='log-title'>System Ready</div>"
                "<div class='log-time'>Uptime: ") + uptimeBuf + "</div>"
            "</div>"
        "</div>"
        "<div class='log-entry'>"
            "<div class='log-dot blue'>&#x1F4CA;</div>"
            "<div>"
                "<div class='log-title'>Free Heap</div>"
                "<div class='log-time'>" + String(ESP.getFreeHeap() / 1024) + " KB available</div>"
            "</div>"
        "</div>"
    );

    _server.send(200, "text/html", html);
}

// ============================================================
// ROUTE HANDLERS
// ============================================================

static void handleRoot()        { sendPage("/index.html"); }
static void handleSchedules()   { sendPage("/schedules.html"); }
static void handleConfigure()   { sendPage("/configure.html"); }
static void handleSettings()    { sendPage("/settings.html"); }
static void handleMaintenance() { sendPage("/maintenance.html"); }

static void handleAdd() {
    if (*_scheduleCount >= MAX_SCHEDULES) {
        _server.sendHeader("Location", "/schedules");
        _server.send(303);
        return;
    }

    uint8_t hour      = (uint8_t)_server.arg("hour").toInt();
    uint8_t minute    = (uint8_t)_server.arg("minute").toInt();
    uint8_t stepCount = (uint8_t)_server.arg("stepCount").toInt();

    if (stepCount < 1)         stepCount = 1;
    if (stepCount > MAX_STEPS) stepCount = MAX_STEPS;

    BellTime newEntry;
    newEntry.hour      = hour % 24;
    newEntry.minute    = minute % 60;
    newEntry.stepCount = stepCount;
    memset(newEntry.steps, 0, sizeof(newEntry.steps));

    char paramName[8];
    for (uint8_t i = 0; i < stepCount; i++) {
        snprintf(paramName, sizeof(paramName), "d%d", i);
        uint8_t dur = (uint8_t)_server.arg(paramName).toInt();
        newEntry.steps[i].duration = (dur < 1) ? 1 : dur;  // minimum 1s ON

        snprintf(paramName, sizeof(paramName), "l%d", i);
        newEntry.steps[i].delay = (uint8_t)_server.arg(paramName).toInt();
    }

    _schedules[*_scheduleCount] = newEntry;
    (*_scheduleCount)++;
    storageSaveSchedules(_schedules, *_scheduleCount);

    DEBUG_PRINTF("[WEB] Added schedule: %02d:%02d (%d steps)\n",
                 hour, minute, stepCount);

    _server.sendHeader("Location", "/schedules");
    _server.send(303);
}

static void handleDelete() {
    if (_server.hasArg("idx")) {
        uint8_t idx = (uint8_t)_server.arg("idx").toInt();
        if (idx < *_scheduleCount) {
            for (uint8_t i = idx; i < *_scheduleCount - 1; i++)
                _schedules[i] = _schedules[i + 1];
            memset(&_schedules[--(*_scheduleCount)], 0, sizeof(BellTime));
            storageSaveSchedules(_schedules, *_scheduleCount);
            DEBUG_PRINTF("[WEB] Deleted idx %d, %d remaining\n", idx, *_scheduleCount);
        }
    }
    _server.sendHeader("Location", "/schedules");
    _server.send(303);
}

static void handleRing() {
    if (!patternIsRunning())
        patternStartManual(MANUAL_RING_DURATION_S);
    _server.sendHeader("Location", "/");
    _server.send(303);
}

static void handleSetTime() {
    rtcSetTime(
        (uint16_t)_server.arg("year").toInt(),
        (uint8_t)_server.arg("month").toInt(),
        (uint8_t)_server.arg("day").toInt(),
        (uint8_t)_server.arg("hour").toInt(),
        (uint8_t)_server.arg("min").toInt(),
        (uint8_t)_server.arg("sec").toInt()
    );
    _server.sendHeader("Location", "/settings");
    _server.send(303);
}

// ============================================================
// PUBLIC API
// ============================================================

void webConfigInit(BellTime* schedules, uint8_t* scheduleCount) {
    _schedules     = schedules;
    _scheduleCount = scheduleCount;

    // Mount filesystem (LittleFS on core 2.x, SPIFFS on core 1.x)
    if (!FILESYSTEM.begin(true)) {
        DEBUG_PRINTLN("[FS] Filesystem mount failed. Run: pio run -t uploadfs");
    } else {
        DEBUG_PRINTLN("[FS] Filesystem mounted OK");
    }

    // Start Wi-Fi AP
    WiFi.softAP(AP_SSID, AP_PASSWORD);
    DEBUG_PRINT("[WIFI] AP started: ");
    DEBUG_PRINTLN(AP_SSID);
    DEBUG_PRINT("[WIFI] IP: ");
    DEBUG_PRINTLN(WiFi.softAPIP().toString());

    // Register routes
    _server.on("/",            HTTP_GET,  handleRoot);
    _server.on("/schedules",   HTTP_GET,  handleSchedules);
    _server.on("/configure",   HTTP_GET,  handleConfigure);
    _server.on("/settings",    HTTP_GET,  handleSettings);
    _server.on("/maintenance", HTTP_GET,  handleMaintenance);

    _server.on("/add",         HTTP_POST, handleAdd);
    _server.on("/delete",      HTTP_GET,  handleDelete);
    _server.on("/ring",        HTTP_POST, handleRing);
    _server.on("/set-time",    HTTP_POST, handleSetTime);

    _server.begin();
    DEBUG_PRINTLN("[WEB] LittleFS-backed server started on port 80");
}

void webConfigLoop() {
    _server.handleClient();
}
