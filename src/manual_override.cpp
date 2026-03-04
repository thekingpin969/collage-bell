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

    // Detect falling edge (HIGH → LOW = button pressed)
    if (reading == LOW && _btnStable == HIGH) {
        DEBUG_PRINTLN("[BTN] Button pressed – manual ring");

        if (!patternIsRunning()) {
            patternStartManual(MANUAL_RING_DURATION_S);
        }
    }

    _btnStable = reading;
}
