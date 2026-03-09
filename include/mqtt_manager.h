/**
 * @file mqtt_manager.h
 * @brief MQTT and OTA integration for College Bell System
 * 
 * Connects to EMQX broker, reports status, and handles remote triggers,
 * remote commands (sync_time, restart), and OTA firmware updates.
 */

#ifndef MQTT_MANAGER_H
#define MQTT_MANAGER_H

#include <Arduino.h>
#include "config.h"

struct SystemSettings;

/**
 * @brief Initialize MQTT client and assign callback topics.
 * Call this from setup(), ideally after WiFi is connected.
 */
void mqttManagerInit(SystemSettings* settings);

/**
 * @brief Keep MQTT connection alive, process incoming messages, and publish periodic status.
 * Call this from loop(). It handles reconnections internally.
 */
void mqttManagerLoop();

/**
 * @brief Fetch Mac Address to derive unique Device ID string.
 */
String getDeviceId();

/**
 * @brief Publish a custom event log to the server.
 */
void mqttPublishEvent(const char* eventName);

/**
 * @brief Check if currently connected to MQTT broker
 */
bool mqttIsConnected();

/**
 * @brief Register device to the cloud directly.
 */
void mqttRegisterDevice(const char* name);

/**
 * @brief Manually publish current status via HTTP to server
 */
void publishStatus();

/**
 * @brief Increment today's bell ring counter and save to NVS
 */
void mqttIncrementBellRings();

/**
 * @brief Pass the schedules array and count pointer so publishStatus can report it and sync_schedules can update it
 * @param[in] schedules Pointer to global schedules array
 * @param[in] scheduleCount Pointer to global schedule count
 */
void mqttSetScheduleInfo(BellTime* schedules, uint8_t* scheduleCount);

/**
 * @brief Reloads the server URL from NVS. Called when the web API updates it.
 */
void mqttReloadServerUrl();

#endif // MQTT_MANAGER_H
