/**
 * @file web_config.h
 * @brief Web Config Service (AP mode, LittleFS-backed)
 *
 * Serves Tailwind CSS HTML pages from LittleFS /data folder.
 * Requires: pio run -t uploadfs before first use.
 */

#ifndef WEB_CONFIG_H
#define WEB_CONFIG_H

#include "config.h"

/**
 * @brief Mount LittleFS, start Wi-Fi AP and configure all HTTP routes.
 * @param[in] schedules     Pointer to the global schedule array
 * @param[in] scheduleCount Pointer to the global schedule count
 */
void webConfigInit(BellTime* schedules, uint8_t* scheduleCount);

/**
 * @brief Handle HTTP client requests. Call every loop().
 */
void webConfigLoop();

#endif // WEB_CONFIG_H
