/**
 * @file web_config.h
 * @brief Web Config Service (AP mode, SPA + JSON API)
 *
 * Serves the compiled Preact SPA from static_files.h and
 * exposes JSON API endpoints for schedule management,
 * system status, manual ring, and RTC time setting.
 */

#ifndef WEB_CONFIG_H
#define WEB_CONFIG_H

#include "config.h"

/**
 * @brief Start the SPA + JSON API Web Server on port 80.
 * Sets up WiFi AP mode if not connected.
 * @param[in] schedules     Pointer to global schedules array
 * @param[in] scheduleCount Pointer to global schedules count
 * @param[in] settings      Pointer to global system settings
 */
void webConfigInit(BellTime* schedules, uint8_t* scheduleCount, SystemSettings* settings);

/**
 * @brief Handle HTTP client requests. Call every loop().
 */
void webConfigLoop();

#endif // WEB_CONFIG_H
