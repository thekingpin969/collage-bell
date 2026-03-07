/**
 * @file manual_override.cpp
 * @brief Manual Override Handler implementation
 *
 * Reads BUTTON_PIN (INPUT_PULLUP), debounces with BUTTON_DEBOUNCE_MS,
 * and triggers a manual ring pattern when pressed.
 */

#include "manual_override.h"
#include "pattern_engine.h"

// ---- Module-private state ----
static bool          _lastBtnState  = HIGH;   // Unpressed (pull-up)
static unsigned long _lastDebounceMs = 0;
static bool          _btnStable     = HIGH;

void manualOverrideInit() {
    pinMode(BUTTON_PIN, INPUT_PULLUP);
    DEBUG_PRINTLN("[BTN] Manual override initialised");
}

void manualOverrideLoop() {
    bool reading = digitalRead(BUTTON_PIN);

    // Reset debounce timer on state change
    if (reading != _lastBtnState) {
        _lastDebounceMs = millis();
    }
    _lastBtnState = reading;

    // Wait for stable state
    if ((millis() - _lastDebounceMs) < BUTTON_DEBOUNCE_MS) return;

    // Detect state changes and holds
    if (reading == LOW) {
        // Button is currently being held
        if (_btnStable == HIGH) {
            DEBUG_PRINTLN("[BTN] Button pressed – starting dynamic manual ring");
        }
        // Continuously refresh the watchdog timer (e.g., 2 seconds timeout)
        patternStartDynamicManual(2);
    } else if (reading == HIGH && _btnStable == LOW) {
        // Button released
        DEBUG_PRINTLN("[BTN] Button released – stopping manual ring");
        patternStop();
    }

    _btnStable = reading;
}
