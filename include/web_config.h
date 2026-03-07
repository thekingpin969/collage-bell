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
 * @brief Start Wi-Fi AP, register SPA static file routes and JSON API endpoints.
 * @param[in] schedules     Pointer to the global schedule array
 * @param[in] scheduleCount Pointer to the global schedule count
 */
void webConfigInit(BellTime* schedules, uint8_t* scheduleCount);

/**
 * @brief Handle HTTP client requests. Call every loop().
 */
void webConfigLoop();

#endif // WEB_CONFIG_H
