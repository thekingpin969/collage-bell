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

void storageLoadSettings(SystemSettings& settings) {
    // Set absolute defaults
    strncpy(settings.deviceName, "College Bell System", 31);
    settings.deviceName[31] = '\0';
    settings.masterEnable = true;

    size_t len = _prefs.getBytes("sys_cfg", &settings, sizeof(SystemSettings));
    if (len == sizeof(SystemSettings)) {
        DEBUG_PRINTF("[NVS] Loaded settings. Name: %s, Master: %d\n", settings.deviceName, settings.masterEnable);
    } else {
        DEBUG_PRINTLN("[NVS] No saved settings, using defaults");
    }
}

void storageSaveSettings(const SystemSettings& settings) {
    _prefs.putBytes("sys_cfg", &settings, sizeof(SystemSettings));
    DEBUG_PRINTF("[NVS] Saved settings. Name: %s, Master: %d\n", settings.deviceName, settings.masterEnable);
}

void storageLoadWifiConfig(String& ssid, String& password) {
    ssid = _prefs.getString("wifi_ssid", "");
    password = _prefs.getString("wifi_pass", "");
    DEBUG_PRINTF("[NVS] Loaded WiFi Config: %s\n", ssid.isEmpty() ? "(none)" : ssid.c_str());
}

void storageSaveWifiConfig(const String& ssid, const String& password) {
    _prefs.putString("wifi_ssid", ssid);
    _prefs.putString("wifi_pass", password);
    DEBUG_PRINTF("[NVS] Saved WiFi Config: %s\n", ssid.c_str());
}
