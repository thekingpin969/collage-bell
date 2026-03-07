/**
 * @file main.cpp
 * @brief ESP32 College Bell System – Main Entry Point
 *
 * Wires together all firmware modules:
 *   1. Config        – pin/limit definitions
 *   2. RTC Service   – DS3231 time
 *   3. Storage       – NVS schedule persistence
 *   4. Pattern Engine– non-blocking relay control
 *   5. Scheduler     – time-based trigger
 *   6. Manual Override– push-button handler
 *   7. Web Config    – AP mode HTTP dashboard
 *
 * Boot flow:
 *   btStop() → GPIO init → RTC init → NVS load → Web server →
 *   Scheduler init → Manual override init
 *
 * Main loop (non-blocking):
 *   Web server → Scheduler → Pattern engine → Manual override
 */

#include <Arduino.h>
#include "config.h"
#include "rtc_service.h"
#include "storage_manager.h"
#include "pattern_engine.h"
#include "pattern_engine.h"
#include "scheduler.h"
#include "manual_override.h"
#include "web_config.h"
#include "led_feedback.h"
#include "wifi_manager.h"

// ============================================================
// GLOBAL RUNTIME DATA (static, no heap)
// ============================================================
static BellTime g_schedules[MAX_SCHEDULES];
static uint8_t  g_scheduleCount = 0;
static SystemSettings g_settings;

// ============================================================
// SETUP
// ============================================================
void setup() {
    // --- 0. Disable Bluetooth to save memory ---
    btStop();

    // --- 1. Debug serial (only active if DEBUG_ENABLED defined) ---
    DEBUG_INIT(115200);
    DEBUG_PRINTLN("");
    DEBUG_PRINTLN("================================");
    DEBUG_PRINTLN(" College Bell System v1.0");
    DEBUG_PRINTLN("================================");

    // --- 2. GPIO init: relay OFF, LED OFF ---
    pinMode(RELAY_PIN, OUTPUT);
    digitalWrite(RELAY_PIN, HIGH);   // Relay OFF (active LOW)
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);      // LED OFF

    // --- 3. RTC init ---
    bool rtcOk = rtcInit();
    if (!rtcOk) {
        DEBUG_PRINTLN("[BOOT] RTC FAILED – system will not schedule bells");
        // Don't halt – web config and manual override still work
    }

    // --- 3a. LED feedback init (needs RTC result) ---
    ledInit(rtcOk);

    // --- 4. NVS init + load schedules/settings ---
    storageInit();
    storageLoadSchedules(g_schedules, g_scheduleCount);
    storageLoadSettings(g_settings);

    // --- 5. Pattern engine init (needs schedule pointer) ---
    patternInit(g_schedules);

    // --- 6. Web config (starts AP + HTTP server) ---
    webConfigInit(g_schedules, &g_scheduleCount, &g_settings);

    // --- 7. Scheduler init ---
    schedulerInit(g_schedules, &g_scheduleCount, &g_settings);

    // --- 8. Manual override button ---
    manualOverrideInit();

    // --- 9. WiFi Client (STA) init ---
    // Start after AP has been set up in web_config
    wifiManagerInit();

    DEBUG_PRINTLN("[BOOT] System ready");
    DEBUG_PRINTLN("================================");
}

// ============================================================
// MAIN LOOP (non-blocking, runs continuously)
// ============================================================
void loop() {
    webConfigLoop();        // Handle HTTP client requests
    schedulerLoop();        // Check RTC vs schedules (once/sec)
    patternLoop();          // Advance pattern state machine
    manualOverrideLoop();   // Check push-button
    ledLoop();              // Update diagnostic LEDs
    wifiManagerLoop();      // Handle STA WiFi connections
}