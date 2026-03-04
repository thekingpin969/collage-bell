/**
 * @file storage_manager.cpp
 * @brief NVS Storage Manager implementation using Preferences
 */

#include "storage_manager.h"
#include <Preferences.h>

// Module-private Preferences instance
static Preferences _prefs;

void storageInit() {
    _prefs.begin("bell", false);  // namespace "bell", read-write
    DEBUG_PRINTLN("[NVS] Storage initialised");
}

void storageLoadSchedules(BellTime* schedules, uint8_t &count) {
    count = _prefs.getUChar("count", 0);

    if (count > MAX_SCHEDULES) {
        count = 0;  // Corrupted data guard
    }

    if (count > 0) {
        size_t len = _prefs.getBytes("sched", schedules,
                                      sizeof(BellTime) * MAX_SCHEDULES);
        if (len == 0) {
            count = 0;  // Read failed, reset
        }
    }

    DEBUG_PRINTF("[NVS] Loaded %d schedule(s)\n", count);
}

void storageSaveSchedules(const BellTime* schedules, uint8_t count) {
    if (count > MAX_SCHEDULES) {
        count = MAX_SCHEDULES;
    }

    _prefs.putUChar("count", count);
    _prefs.putBytes("sched", schedules, sizeof(BellTime) * MAX_SCHEDULES);

    DEBUG_PRINTF("[NVS] Saved %d schedule(s)\n", count);
}
