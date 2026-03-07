/**
 * @file scheduler.cpp
 * @brief Scheduler Engine implementation
 *
 * Every 1 second:
 *   1. Read current time from RTC
 *   2. Compare with each schedule entry
 *   3. If match found AND not already triggered this minute → start pattern
 *   4. Double-trigger prevention via lastTriggeredHour/Minute
 */

#include "scheduler.h"
#include "rtc_service.h"
#include "pattern_engine.h"

// ---- Module-private state ----
static BellTime*       _schedules      = nullptr;
static uint8_t*        _scheduleCount  = nullptr;
static SystemSettings* _settings       = nullptr;
static unsigned long   _lastCheckMs    = 0;
static uint8_t         _lastTrigHour   = 255;  // Invalid sentinel
static uint8_t         _lastTrigMinute = 255;

void schedulerInit(BellTime* schedules, uint8_t* scheduleCount, SystemSettings* settings) {
    _schedules     = schedules;
    _scheduleCount = scheduleCount;
    _settings      = settings;
    _lastCheckMs   = 0;
    _lastTrigHour  = 255;
    _lastTrigMinute = 255;
    DEBUG_PRINTLN("[SCHED] Scheduler initialised");
}

void schedulerLoop() {
    // Throttle to one check per second
    unsigned long now = millis();
    if (now - _lastCheckMs < SCHEDULER_INTERVAL_MS) return;
    _lastCheckMs = now;

    if (_schedules == nullptr || _scheduleCount == nullptr || _settings == nullptr) return;

    // Master switch overrides all schedules
    if (!_settings->masterEnable) return;

    // Read current time from RTC
    uint8_t curHour, curMinute, curSecond, curDow;
    rtcGetTime(curHour, curMinute, curSecond, curDow);

    // Only trigger on second 0 for precise timing
    // (avoids multiple triggers within the same minute)
    if (curSecond != 0) {
        // Reset trigger tracking when we leave the triggered minute
        if (_lastTrigHour != 255) {
            if (curHour != _lastTrigHour || curMinute != _lastTrigMinute) {
                _lastTrigHour   = 255;
                _lastTrigMinute = 255;
            }
        }
        return;
    }

    // Don't trigger if pattern is already running
    if (patternIsRunning()) return;

    // Check all schedules
    for (uint8_t i = 0; i < *_scheduleCount; i++) {
        if (_schedules[i].enabled &&
            (_schedules[i].days & (1 << curDow)) &&
            _schedules[i].hour   == curHour &&
            _schedules[i].minute == curMinute) {

            // Prevent double-trigger in the same minute
            if (_lastTrigHour == curHour && _lastTrigMinute == curMinute) {
                return;
            }

            // Match! Start the pattern
            DEBUG_PRINTF("[SCHED] Matched schedule #%d at %02d:%02d\n",
                         i, curHour, curMinute);
            patternStart(i);
            _lastTrigHour   = curHour;
            _lastTrigMinute = curMinute;
            return;  // Only trigger first match per minute
        }
    }
}
