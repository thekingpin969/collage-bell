/**
 * @file pattern_engine.h
 * @brief Non-blocking Pattern Execution Engine
 *
 * State machine that executes bell ring patterns without
 * using delay(). Called every loop iteration.
 */

#ifndef PATTERN_ENGINE_H
#define PATTERN_ENGINE_H

#include "config.h"

/**
 * @brief Provide the pattern engine with a pointer to the schedule array.
 * Must be called once during setup, before patternLoop().
 * @param[in] schedules Pointer to the global schedule array.
 */
void patternInit(BellTime* schedules);

/**
 * @brief Start executing the pattern for the given schedule index.
 * Turns relay ON immediately for the first step.
 * @param[in] scheduleIndex Index into the schedule array
 */
void patternStart(uint8_t scheduleIndex);

/**
 * @brief Start a one-shot manual pattern (not from schedule array).
 * Uses a temporary BellTime with a single step.
 * @param[in] durationSec  How long to ring (seconds)
 */
void patternStartManual(uint8_t durationSec);

/**
 * @brief Start or refresh a dynamic continuous manual ring.
 * Turns relay ON immediately. Call repeatedly to keep ringing.
 * @param[in] keepAliveSec Maximum time to keep ringing without a refresh.
 */
void patternStartDynamicManual(uint8_t keepAliveSec);

/**
 * @brief Test a custom bell pattern without saving it.
 * @param[in] testBell The BellTime structure containing the pattern to test.
 */
void patternStartTest(const BellTime& testBell);

/**
 * @brief Advance the pattern state machine. Call every loop().
 * Uses millis() to track elapsed time – never blocks.
 */
void patternLoop();

/**
 * @brief Check if a pattern is currently running.
 * @return true if relay is being driven by a pattern.
 */
bool patternIsRunning();

/**
 * @brief Emergency stop – forces relay OFF and resets state.
 */
void patternStop();

#endif // PATTERN_ENGINE_H
