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

#endif // STORAGE_MANAGER_H
