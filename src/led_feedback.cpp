/**
 * @file led_feedback.cpp
 * @brief LED Feedback System – Non-blocking visual diagnostics
 *
 * Drives 4 external LEDs using millis()-based state machines:
 *   WiFi   (Blue,   GPIO16) – AP client connectivity
 *   RTC    (Yellow, GPIO17) – RTC health
 *   System (Green,  GPIO18) – Heartbeat
 *   Status (Red,    GPIO19) – Event-driven alerts
 */

#include "led_feedback.h"
#include "rtc_service.h"
#include <WiFi.h>
#include "wifi_manager.h"

// ============================================================
// INTERNAL STATE
// ============================================================

// Per-LED timing state
struct LedTiming {
    uint8_t       pin;
    bool          currentOutput;   // Current digitalWrite state
    unsigned long lastToggleMs;
};

static LedTiming _wifi   = { WIFI_LED_PIN,   false, 0 };
static LedTiming _rtc    = { RTC_LED_PIN,    false, 0 };
static LedTiming _sys    = { SYS_LED_PIN,    false, 0 };
static LedTiming _status = { STATUS_LED_PIN, false, 0 };

// Module state
static bool           _rtcHealthy     = true;
static LedStatusEvent _statusEvent    = LED_EVT_NONE;
static uint8_t        _statusBlinks   = 0;   // Countdown for restart pattern
static unsigned long  _statusStartMs  = 0;   // When the event was set

// ============================================================
// HELPERS
// ============================================================

static void ledOn(LedTiming& led) {
    led.currentOutput = true;
    digitalWrite(led.pin, HIGH);
}

static void ledOff(LedTiming& led) {
    led.currentOutput = false;
    digitalWrite(led.pin, LOW);
}

static void ledToggle(LedTiming& led) {
    led.currentOutput = !led.currentOutput;
    digitalWrite(led.pin, led.currentOutput ? HIGH : LOW);
    led.lastToggleMs = millis();
}

// ============================================================
// WiFi LED – Blue
// ON = connected to router, Blink 500ms = connecting, OFF = idle/failed
// ============================================================
static void updateWifiLed() {
    WifiStatus ws = wifiManagerGetStatus();
    
    if (ws.connected) {
        // Solid ON - Connected
        if (!_wifi.currentOutput) ledOn(_wifi);
    } else if (ws.state == "connecting") {
        // Blink at 500ms - Connecting
        unsigned long now = millis();
        if (now - _wifi.lastToggleMs >= 500) {
            ledToggle(_wifi);
        }
    } else {
        // Idle/Failed - OFF
        if (_wifi.currentOutput) ledOff(_wifi);
    }
}

// ============================================================
// RTC LED – Yellow
// Solid ON = RTC OK, Slow blink 1500ms = lost power
// ============================================================
static void updateRtcLed() {
    _rtcHealthy = !rtcLostPower();

    if (_rtcHealthy) {
        if (!_rtc.currentOutput) ledOn(_rtc);
    } else {
        unsigned long now = millis();
        if (now - _rtc.lastToggleMs >= 1500) {
            ledToggle(_rtc);
        }
    }
}

// ============================================================
// System LED – Green (Heartbeat, 1s toggle)
// ============================================================
static void updateSystemLed() {
    unsigned long now = millis();
    if (now - _sys.lastToggleMs >= 1000) {
        ledToggle(_sys);
    }
}

// ============================================================
// Status LED – Red (Event-driven)
// NONE     → OFF
// OTA      → Fast blink 150ms (continuous until cleared)
// RESTART  → 3 quick blinks (200ms on, 200ms off) then OFF
// ERROR    → Solid ON (stays until cleared)
// ============================================================
static void updateStatusLed() {
    unsigned long now = millis();

    switch (_statusEvent) {
        case LED_EVT_NONE:
            if (_status.currentOutput) ledOff(_status);
            break;

        case LED_EVT_OTA:
            // Fast blink at 150ms interval
            if (now - _status.lastToggleMs >= 150) {
                ledToggle(_status);
            }
            break;

        case LED_EVT_RESTART:
            // 3 quick blinks (200ms on/off each)
            if (_statusBlinks > 0) {
                if (now - _status.lastToggleMs >= 200) {
                    ledToggle(_status);
                    // Count a full on→off cycle as one blink
                    if (!_status.currentOutput) {
                        _statusBlinks--;
                    }
                }
            } else {
                ledOff(_status);
                _statusEvent = LED_EVT_NONE;
            }
            break;

        case LED_EVT_ERROR:
            // Solid ON
            if (!_status.currentOutput) ledOn(_status);
            break;
    }
}

// ============================================================
// PUBLIC API
// ============================================================

void ledInit(bool rtcOk) {
    _rtcHealthy = rtcOk;

    // Configure pins
    pinMode(WIFI_LED_PIN,   OUTPUT);
    pinMode(RTC_LED_PIN,    OUTPUT);
    pinMode(SYS_LED_PIN,    OUTPUT);
    pinMode(STATUS_LED_PIN, OUTPUT);

    // Start all OFF
    digitalWrite(WIFI_LED_PIN,   LOW);
    digitalWrite(RTC_LED_PIN,    LOW);
    digitalWrite(SYS_LED_PIN,    LOW);
    digitalWrite(STATUS_LED_PIN, LOW);

    // Init timing
    unsigned long now = millis();
    _wifi.lastToggleMs   = now;
    _rtc.lastToggleMs    = now;
    _sys.lastToggleMs    = now;
    _status.lastToggleMs = now;

    // If RTC was OK at boot, turn RTC LED on immediately
    if (rtcOk) {
        ledOn(_rtc);
    }

    DEBUG_PRINTLN("[LED] Feedback system initialised");
}

void ledLoop() {
    updateWifiLed();
    updateRtcLed();
    updateSystemLed();
    updateStatusLed();
}

void ledSetStatus(LedStatusEvent evt) {
    _statusEvent   = evt;
    _statusStartMs = millis();
    _status.lastToggleMs = millis();

    if (evt == LED_EVT_RESTART) {
        _statusBlinks = 3;
    }

    DEBUG_PRINTF("[LED] Status event: %d\n", evt);
}

void ledClearStatus() {
    _statusEvent = LED_EVT_NONE;
    ledOff(_status);
}

void ledGetStates(LedInfo out[4]) {
    // WiFi LED
    out[0].label = "WiFi";
    out[0].color = "blue";
    
    WifiStatus ws = wifiManagerGetStatus();
    if (ws.connected) {
        out[0].state = "on";
    } else if (ws.state == "connecting") {
        out[0].state = "blink";
    } else {
        out[0].state = "off";
    }

    // RTC LED
    out[1].label = "RTC";
    out[1].color = "yellow";
    if (_rtcHealthy) {
        out[1].state = "on";
    } else {
        out[1].state = "blink";
    }

    // System LED (always heartbeat while running)
    out[2].label = "System";
    out[2].color = "green";
    out[2].state = "heartbeat";

    // Status LED
    out[3].label = "Status";
    out[3].color = "red";
    switch (_statusEvent) {
        case LED_EVT_NONE:    out[3].state = "off";        break;
        case LED_EVT_OTA:     out[3].state = "fast_blink"; break;
        case LED_EVT_RESTART: out[3].state = "fast_blink"; break;
        case LED_EVT_ERROR:   out[3].state = "on";         break;
    }
}
