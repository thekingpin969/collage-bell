/**
 * @file scheduler.h
 * @brief Scheduler Engine – compares RTC time with saved schedules
 *
 * Runs every 1 second via millis() tick check. When a match is
 * found, delegates to the Pattern Engine.
 */

#ifndef SCHEDULER_H
#define SCHEDULER_H

#include "config.h"

/**
 * @brief Initialise the scheduler (reset tracking state).
 * @param[in] schedules     Pointer to the global schedule array
 * @param[in] scheduleCount Pointer to the global schedule count
 * @param[in] settings      Pointer to the global system settings
 */
void schedulerInit(BellTime* schedules, uint8_t* scheduleCount, SystemSettings* settings);

/**
 * @brief Run one scheduler tick. Call every loop() iteration.
 * Internally throttled to 1 check per second.
 */
void schedulerLoop();

#endif // SCHEDULER_H
