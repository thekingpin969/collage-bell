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
    // Load explicitly via individual keys to avoid padding/size mismatch with struct bytes
    String dName = _prefs.getString("sys_name", "College Bell System");
    strncpy(settings.deviceName, dName.c_str(), 31);
    settings.deviceName[31] = '\0';
    
    settings.masterEnable = _prefs.getBool("sys_master", true);
    settings.isRegistered = _prefs.getBool("sys_reg", false);

    DEBUG_PRINTF("[NVS] Loaded settings. Name: %s, Master: %d\n", settings.deviceName, settings.masterEnable);
}

void storageSaveSettings(const SystemSettings& settings) {
    _prefs.putString("sys_name", settings.deviceName);
    _prefs.putBool("sys_master", settings.masterEnable);
    _prefs.putBool("sys_reg", settings.isRegistered);
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

void storageLoadApConfig(String& ssid, String& password) {
    // If the preference does not exist, it falls back to the hardcoded defaults
    ssid = _prefs.getString("ap_ssid", AP_SSID_DEFAULT);
    password = _prefs.getString("ap_pass", AP_PASSWORD_DEFAULT);
    
    // Save the hardcoded values to flash if they don't already exist in NVS
    if (!_prefs.isKey("ap_ssid")) {
        _prefs.putString("ap_ssid", ssid);
        _prefs.putString("ap_pass", password);
        DEBUG_PRINTLN("[NVS] Saved default AP Config to flash");
    }
    DEBUG_PRINTF("[NVS] Loaded AP Config: %s\n", ssid.c_str());
}

void storageSaveApConfig(const String& ssid, const String& password) {
    _prefs.putString("ap_ssid", ssid);
    _prefs.putString("ap_pass", password);
    DEBUG_PRINTF("[NVS] Saved AP Config: %s\n", ssid.c_str());
}

uint32_t storageLoadBellRings(uint32_t todayDate) {
    uint32_t storedDate = _prefs.getULong("ring_date", 0);
    uint32_t count = _prefs.getULong("ring_count", 0);
    
    if (storedDate != todayDate) {
        // New day – reset counter
        count = 0;
        _prefs.putULong("ring_date", todayDate);
        _prefs.putULong("ring_count", 0);
        DEBUG_PRINTLN("[NVS] New day detected, bell ring counter reset");
    }
    
    DEBUG_PRINTF("[NVS] Bell rings today: %lu\n", count);
    return count;
}

void storageSaveBellRings(uint32_t count, uint32_t todayDate) {
    _prefs.putULong("ring_count", count);
    _prefs.putULong("ring_date", todayDate);
}

void storageLoadServerUrl(String& url) {
    url = _prefs.getString("srv_url", "https://przs4zmv-3000.inc1.devtunnels.ms");
    DEBUG_PRINTF("[NVS] Loaded Server URL: %s\n", url.isEmpty() ? "(none)" : url.c_str());
}

void storageSaveServerUrl(const String& url) {
    _prefs.putString("srv_url", url);
    DEBUG_PRINTF("[NVS] Saved Server URL: %s\n", url.c_str());
}

void storageFactoryReset() {
    DEBUG_PRINTLN("[NVS] Factory Reset requested! Clearing all preferences...");
    _prefs.clear();
    DEBUG_PRINTLN("[NVS] Factory Reset complete. Restarting ESP...");
    delay(500);
    ESP.restart();
}
