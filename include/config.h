/**
 * @file config.h
 * @brief Central configuration for ESP32 College Bell System
 *
 * Defines all pin assignments, system limits, data structures,
 * and debug macros used across all firmware modules.
 */

#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// ============================================================
// PIN ASSIGNMENTS
// ============================================================
#define RELAY_PIN       26    // Relay control (active LOW)
#define BUTTON_PIN      27    // Manual ring push-button (INPUT_PULLUP)
#define LED_PIN         2     // On-board LED for status

// ============================================================
// SYSTEM LIMITS
// ============================================================
#define MAX_SCHEDULES   50    // Maximum bell schedule entries
#define MAX_STEPS       5     // Maximum pattern steps per schedule

// ============================================================
// TIMING CONSTANTS
// ============================================================
#define SCHEDULER_INTERVAL_MS   1000    // Check schedules every 1 second
#define BUTTON_DEBOUNCE_MS      50      // Debounce delay for push-button
#define MANUAL_RING_DURATION_S  3       // Default manual ring (seconds)
#define MANUAL_RING_DELAY_S     0       // No gap after manual ring

// ============================================================
// WI-FI ACCESS POINT
// ============================================================
#define AP_SSID         "CollegeBell"
#define AP_PASSWORD     ""              // Open network (no password)
#define WEB_SERVER_PORT 80

// ============================================================
// DATA STRUCTURES
// ============================================================

/**
 * @brief Single step in a ring pattern.
 *
 * Each step defines how long the relay stays ON (duration)
 * and how long it stays OFF before the next step (delay).
 * Size: 2 bytes.
 */
struct PatternStep {
    uint8_t duration;   // Seconds relay ON
    uint8_t delay;      // Seconds relay OFF after this step
};

/**
 * @brief One bell schedule entry (Option B – embedded pattern).
 *
 * Contains the trigger time (hour:minute) and its own
 * ring pattern (up to MAX_STEPS steps).
 * Size: 3 + (2 * MAX_STEPS) = 13 bytes when MAX_STEPS = 5.
 */
struct BellTime {
    uint8_t hour;                   // 0–23
    uint8_t minute;                 // 0–59
    uint8_t stepCount;              // Number of active steps (1–MAX_STEPS)
    uint8_t days;                   // Bitmask for days (0:Sun, 1:Mon, ..., 6:Sat)
    bool enabled;                   // Is schedule active
    char label[16];                 // Optional label (max 15 chars)
    PatternStep steps[MAX_STEPS];   // Ring pattern for this schedule
};

// ============================================================
// DEBUG MACROS
// Compile with -D DEBUG_ENABLED to enable serial logging.
// In production, remove -D DEBUG_ENABLED to strip all prints.
// ============================================================
#ifdef DEBUG_ENABLED
    #define DEBUG_INIT(baud) Serial.begin(baud)
    #define DEBUG_PRINT(x)   Serial.print(x)
    #define DEBUG_PRINTLN(x) Serial.println(x)
    #define DEBUG_PRINTF(...) Serial.printf(__VA_ARGS__)
#else
    #define DEBUG_INIT(baud) ((void)0)
    #define DEBUG_PRINT(x)   ((void)0)
    #define DEBUG_PRINTLN(x) ((void)0)
    #define DEBUG_PRINTF(...) ((void)0)
#endif

#endif // CONFIG_H
