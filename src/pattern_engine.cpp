/**
 * @file pattern_engine.cpp
 * @brief Non-blocking Pattern Execution Engine implementation
 *
 * State machine driven by millis(). Zero delay() calls.
 *
 * States per step:
 *   1. relayState == true  → relay ON, wait for step.duration seconds
 *   2. relayState == false → relay OFF, wait for step.delay seconds
 *   Then advance to next step or finish.
 */

#include "pattern_engine.h"

// ---- Module-private state ----
static BellTime*     _schedules       = nullptr;
static bool          _running         = false;
static uint8_t       _schedIdx        = 0;
static uint8_t       _stepIdx         = 0;
static unsigned long _stepStartMs     = 0;
static bool          _relayOn         = false;
static bool          _useManual       = false;
static BellTime      _manualBell;     // Temp storage for manual ring

// ---- Dynamic Manual State ----
static bool          _dynamicManual   = false;
static unsigned long _dynamicTimeoutMs = 0;
static unsigned long _dynamicMinMs     = 0;

// ---- Helpers ----
static void relayON() {
    digitalWrite(RELAY_PIN, LOW);   // Active-LOW relay
    digitalWrite(LED_PIN, HIGH);    // LED indicator ON
    _relayOn = true;
}

static void relayOFF() {
    digitalWrite(RELAY_PIN, HIGH);  // Relay OFF
    digitalWrite(LED_PIN, LOW);     // LED indicator OFF
    _relayOn = false;
}

// ---- Public API ----

void patternInit(BellTime* schedules) {
    _schedules = schedules;
    _running   = false;
    relayOFF();
    DEBUG_PRINTLN("[PATTERN] Engine initialised");
}

void patternStart(uint8_t scheduleIndex) {
    if (_schedules == nullptr) return;
    if (_running) return;  // Don't interrupt an active pattern

    _useManual = false;
    _dynamicManual = false;
    _schedIdx  = scheduleIndex;
    _stepIdx   = 0;
    _running   = true;
    _stepStartMs = millis();
    relayON();

    DEBUG_PRINTF("[PATTERN] Started schedule #%d (%d steps)\n",
                 scheduleIndex, _schedules[scheduleIndex].stepCount);
}

void patternStartManual(uint8_t durationSec) {
    if (_running) return;

    // Build a temporary single-step pattern
    _manualBell.hour      = 0;
    _manualBell.minute    = 0;
    _manualBell.stepCount = 1;
    _manualBell.steps[0].duration = durationSec;
    _manualBell.steps[0].delay    = 0;

    _useManual   = true;
    _dynamicManual = false;
    _stepIdx     = 0;
    _running     = true;
    _stepStartMs = millis();
    relayON();

    DEBUG_PRINTF("[PATTERN] Manual ring for %d sec\n", durationSec);
}

void patternStartDynamicManual(uint8_t keepAliveSec) {
    unsigned long now = millis();
    
    // If we're running a pattern that is NOT dynamic manual, don't interrupt it.
    if (_running && !_dynamicManual) return;
    
    _dynamicManual = true;
    _running = true;
    _dynamicTimeoutMs = now + (keepAliveSec * 1000UL);

    if (!_relayOn) {
        _dynamicMinMs = now + 500UL; // Enforce at least 500ms ring duration
        relayON();
        DEBUG_PRINTLN("[PATTERN] Dynamic manual ring started");
    }
}

void patternStartTest(const BellTime& testBell) {
    if (_running) return;

    _manualBell = testBell;
    _useManual  = true;
    _stepIdx    = 0;
    _running    = true;
    _stepStartMs = millis();
    
    // Only turn on the relay if the first step has a duration > 0 
    // Usually step.duration is guaranteed to be >= 1 by web API, but just to be safe.
    if (_manualBell.stepCount > 0 && _manualBell.steps[0].duration > 0) {
        relayON();
    }
    
    DEBUG_PRINTF("[PATTERN] Testing pattern (%d steps)\n", testBell.stepCount);
}

void patternLoop() {
    if (!_running) return;

    if (_dynamicManual) {
        unsigned long now = millis();
        // Check if watchdog expired
        if (now >= _dynamicTimeoutMs) {
            // Also ensure minimum duration has been met
            if (now >= _dynamicMinMs) {
                _running = false;
                _dynamicManual = false;
                relayOFF();
                DEBUG_PRINTLN("[PATTERN] Dynamic manual ring stopped (watchdog/timeout)");
            }
        }
        return; // Skip normal pattern processing if in dynamic manual mode
    }

    // Get the active BellTime (either from schedule array or manual)
    BellTime &bell = _useManual ? _manualBell : _schedules[_schedIdx];
    PatternStep &step = bell.steps[_stepIdx];

    unsigned long elapsed = millis() - _stepStartMs;

    if (_relayOn) {
        // --- Relay is ON, waiting for duration to expire ---
        if (elapsed >= (unsigned long)step.duration * 1000UL) {
            relayOFF();
            _stepStartMs = millis();

            // If this is the last step AND delay is 0, finish immediately
            if (step.delay == 0 && (_stepIdx + 1) >= bell.stepCount) {
                _running = false;
                DEBUG_PRINTLN("[PATTERN] Finished (last step, no delay)");
            }
        }
    } else {
        // --- Relay is OFF, waiting for delay to expire ---
        if (elapsed >= (unsigned long)step.delay * 1000UL) {
            _stepIdx++;

            if (_stepIdx >= bell.stepCount) {
                // All steps complete
                _running = false;
                relayOFF();   // Safety: ensure OFF
                DEBUG_PRINTLN("[PATTERN] Finished");
            } else {
                // Start next step
                relayON();
                _stepStartMs = millis();
                DEBUG_PRINTF("[PATTERN] Step %d started\n", _stepIdx);
            }
        }
    }
}

bool patternIsRunning() {
    return _running;
}

void patternStop() {
    unsigned long now = millis();
    
    // If it's a dynamic manual ring, ensure the minimum ring time is respected
    if (_dynamicManual && _relayOn && now < _dynamicMinMs) {
        _dynamicTimeoutMs = _dynamicMinMs; // Let it run exactly until min duration expires
        return;
    }

    _running = false;
    _dynamicManual = false;
    relayOFF();
    DEBUG_PRINTLN("[PATTERN] Stopped");
}
