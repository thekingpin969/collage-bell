/**
 * @file storage_manager.h
 * @brief NVS Storage Manager – binary schedule persistence
 *
 * Stores/loads the schedule array as raw bytes in NVS
 * using ESP32 Preferences library. No JSON, no strings.
 */

#ifndef STORAGE_MANAGER_H
#define STORAGE_MANAGER_H

#include "config.h"

/**
 * @brief Open the NVS namespace for bell data.
 */
void storageInit();

/**
 * @brief Load schedules from NVS into the provided array.
 * @param[out] schedules  Array to fill (must be at least MAX_SCHEDULES in size)
 * @param[out] count      Number of valid schedules loaded
 */
void storageLoadSchedules(BellTime* schedules, uint8_t &count);

/**
 * @brief Save schedules to NVS from the provided array.
 * @param[in] schedules  Array of schedules to persist
 * @param[in] count      Number of valid schedules
 */
void storageSaveSchedules(const BellTime* schedules, uint8_t count);

/**
 * @brief Load system settings from NVS
 * @param[out] settings  Struct to populate with settings
 */
void storageLoadSettings(SystemSettings& settings);

/**
 * @brief Save system settings to NVS
 * @param[in] settings   Struct containing settings to save
 */
void storageSaveSettings(const SystemSettings& settings);

/**
 * @brief Load saved WiFi credentials
 * @param[out] ssid      String to store the loaded SSID
 * @param[out] password  String to store the loaded password
 */
void storageLoadWifiConfig(String& ssid, String& password);

/**
 * @brief Save WiFi credentials to NVS
 * @param[in] ssid      SSID to save
 * @param[in] password  Password to save
 */
void storageSaveWifiConfig(const String& ssid, const String& password);

#endif // STORAGE_MANAGER_H
