/**
 * @file led_feedback.h
 * @brief LED Feedback System – Visual diagnostics via 4 external LEDs
 *
 * Provides non-blocking LED control for:
 *   - WiFi LED   (Blue,   GPIO16) – AP client connectivity
 *   - RTC LED    (Yellow, GPIO17) – RTC health / battery status
 *   - System LED (Green,  GPIO18) – Firmware heartbeat
 *   - Status LED (Red,    GPIO19) – Errors / restart / OTA events
 */

#ifndef LED_FEEDBACK_H
#define LED_FEEDBACK_H

#include "config.h"

// ============================================================
// STATUS LED EVENT TYPES
// ============================================================
enum LedStatusEvent : uint8_t {
    LED_EVT_NONE    = 0,   // Status LED OFF
    LED_EVT_OTA     = 1,   // Fast blink  – OTA update in progress
    LED_EVT_RESTART = 2,   // 3 quick blinks – device restarting
    LED_EVT_ERROR   = 3    // Solid ON    – error state
};

// ============================================================
// LED STATE DESCRIPTOR (for API reporting)
// ============================================================
struct LedInfo {
    const char* label;     // Human-readable name
    const char* color;     // CSS color name
    const char* state;     // "on" | "off" | "blink" | "heartbeat" | "fast_blink"
};

// ============================================================
// PUBLIC API
// ============================================================

/**
 * @brief Initialise all 4 LED pins and set default states.
 * @param rtcOk  true if RTC initialised successfully at boot.
 */
void ledInit(bool rtcOk);

/**
 * @brief Non-blocking LED update – call every loop().
 */
void ledLoop();

/**
 * @brief Set a Status LED event (OTA, restart, error).
 *        Event auto-clears after its pattern finishes (except ERROR which stays).
 */
void ledSetStatus(LedStatusEvent evt);

/**
 * @brief Clear Status LED event (return to OFF).
 */
void ledClearStatus();

/**
 * @brief Fill an array of 4 LedInfo structs with current LED states.
 *        Order: [WiFi, RTC, System, Status]
 */
void ledGetStates(LedInfo out[4]);

#endif // LED_FEEDBACK_H
