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

/**
 * @brief Load saved Access Point credentials
 * @param[out] ssid      String to store the loaded AP SSID
 * @param[out] password  String to store the loaded AP password
 */
void storageLoadApConfig(String& ssid, String& password);

/**
 * @brief Save Access Point credentials to NVS
 * @param[in] ssid      AP SSID to save
 * @param[in] password  AP Password to save
 */
void storageSaveApConfig(const String& ssid, const String& password);

/**
 * @brief Load today's bell ring count from NVS. Resets to 0 if date changed.
 * @param[in] todayDate  Current date as YYYYMMDD integer
 * @return Today's bell ring count
 */
uint32_t storageLoadBellRings(uint32_t todayDate);

/**
 * @brief Save bell ring count and date to NVS
 * @param[in] count     Current bell ring count
 * @param[in] todayDate Current date as YYYYMMDD integer
 */
void storageSaveBellRings(uint32_t count, uint32_t todayDate);

/**
 * @brief Load the server URL from NVS
 * @param[out] url  String to store the server URL
 */
void storageLoadServerUrl(String& url);

/**
 * @brief Save the server URL to NVS
 * @param[in] url  Server URL to save
 */
void storageSaveServerUrl(const String& url);

/**
 * @brief Factory reset - clears all NVS preferences
 */
void storageFactoryReset();

#endif // STORAGE_MANAGER_H
