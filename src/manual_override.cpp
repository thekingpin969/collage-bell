/**
 * @file manual_override.cpp
 * @brief Manual Override Handler implementation
 *
 * Reads BUTTON_PIN (INPUT_PULLUP), debounces with BUTTON_DEBOUNCE_MS,
 * and triggers a manual ring pattern when pressed.
 */

#include "manual_override.h"
#include "pattern_engine.h"
#include "storage_manager.h" // Needed for storageFactoryReset()

// ---- Module-private state (Manual Ring) ----
static bool          _lastBtnState  = HIGH;   // Unpressed (pull-up)
static unsigned long _lastDebounceMs = 0;
static bool          _btnStable     = HIGH;

// ---- Module-private state (Reset/Restart Button) ----
static bool          _rstLastBtnState  = HIGH;
static unsigned long _rstLastDebounceMs = 0;
static bool          _rstBtnStable     = HIGH;
static unsigned long _rstPressTime      = 0;
static uint8_t       _rstPressCount     = 0;
static unsigned long _rstReleaseTime    = 0;

void manualOverrideInit() {
    pinMode(BUTTON_PIN, INPUT_PULLUP);
    pinMode(RESET_BTN_PIN, INPUT_PULLUP);
    DEBUG_PRINTLN("[BTN] Manual override and Reset buttons initialised");
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

    // --- Reset/Restart Button Logic (Pin 32) ---
    bool rstReading = digitalRead(RESET_BTN_PIN);
    
    if (rstReading != _rstLastBtnState) {
        _rstLastDebounceMs = millis();
    }
    _rstLastBtnState = rstReading;

    if ((millis() - _rstLastDebounceMs) >= BUTTON_DEBOUNCE_MS) {
        if (rstReading == LOW && _rstBtnStable == HIGH) {
            // Button just pressed
            if (millis() - _rstReleaseTime > 1000) {
                // More than 1s since last release -> treat as fresh sequence (single press)
                _rstPressCount = 1;
            } else {
                // Pressed again within 1s -> double press (or more)
                _rstPressCount++;
            }
            _rstPressTime = millis();
            DEBUG_PRINTF("[BTN] Reset button pressed. Count: %d\n", _rstPressCount);
        } else if (rstReading == HIGH && _rstBtnStable == LOW) {
            // Button released
            _rstReleaseTime = millis();
            DEBUG_PRINTLN("[BTN] Reset button released.");
        } else if (rstReading == LOW && _rstBtnStable == LOW) {
            // Button is being held
            unsigned long heldTime = millis() - _rstPressTime;
            
            if (_rstPressCount == 1 && heldTime >= 5000) {
                // 1. Press and hold 5 seconds -> Restart ESP
                DEBUG_PRINTLN("[BTN] 5-second hold detected. Restarting ESP...");
                delay(100);
                ESP.restart();
            } else if (_rstPressCount >= 2 && heldTime >= 10000) {
                // 2. Double press and hold 10 seconds -> Reset ESP
                DEBUG_PRINTLN("[BTN] Double press & 10-second hold detected. Factory Reset!");
                storageFactoryReset();
            }
        }
        _rstBtnStable = rstReading;
    }
}
