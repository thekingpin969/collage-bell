/**
 * @file manual_override.h
 * @brief Manual Override Handler – debounced push-button
 */

#ifndef MANUAL_OVERRIDE_H
#define MANUAL_OVERRIDE_H

#include "config.h"

/**
 * @brief Configure the button GPIO (INPUT_PULLUP).
 */
void manualOverrideInit();

/**
 * @brief Check button state each loop(). Debounces and triggers
 * a manual ring if button is pressed and no pattern is running.
 */
void manualOverrideLoop();

#endif // MANUAL_OVERRIDE_H
