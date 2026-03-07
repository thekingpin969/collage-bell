/**
 * @file rtc_service.h
 * @brief RTC Service – thin wrapper around DS3231 via RTClib
 *
 * Provides simple functions to initialise the RTC, read
 * the current time, and set the time on admin request.
 */

#ifndef RTC_SERVICE_H
#define RTC_SERVICE_H

#include "config.h"

/**
 * @brief Initialise I2C and the DS3231 RTC module.
 * @return true if RTC was found and initialised, false otherwise.
 */
bool rtcInit();

/**
 * @brief Read current time from the RTC.
 * @param[out] hour   Current hour   (0–23)
 * @param[out] minute Current minute (0–59)
 * @param second Reference to store current second (0-59)
 * @param dayOfWeek Reference to store current day of the week (0=Sun..6=Sat)
 */
void rtcGetTime(uint8_t &hour, uint8_t &minute, uint8_t &second, uint8_t &dayOfWeek);

/**
 * @brief Read current date and time from the RTC.
 * @param[out] year   Current year   (e.g., 2026)
 * @param[out] month  Current month  (1-12)
 * @param[out] day    Current day    (1-31)
 * @param[out] hour   Current hour   (0-23)
 * @param[out] minute Current minute (0-59)
 * @param[out] second Current second (0-59)
 */
void rtcGetDateTime(uint16_t &year, uint8_t &month, uint8_t &day,
                    uint8_t &hour, uint8_t &minute, uint8_t &second);

/**
 * @brief Set the RTC to a specific date/time (admin request).
 * @return true on success.
 */
bool rtcSetTime(uint16_t year, uint8_t month, uint8_t day,
                uint8_t hour, uint8_t minute, uint8_t second);

/**
 * @brief Check whether the RTC lost power (battery dead/removed).
 * @return true if power was lost and time may be invalid.
 */
bool rtcLostPower();

#endif // RTC_SERVICE_H
