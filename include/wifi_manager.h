/**
 * @file wifi_manager.h
 * @brief Handles WiFi Client (STA) mode connection logic.
 */

#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <Arduino.h>

/**
 * @brief Current status of the WiFi manager
 */
struct WifiStatus {
    bool connected;
    String ip;
    String ssid;
    String state; // "idle", "connecting", "connected", "failed"
    int32_t rssi;
    String bssid;
    int32_t channel;
};

/**
 * @brief Initialize the WiFi manager.
 * Loads saved credentials from NVS and starts connection attempt if they exist.
 */
void wifiManagerInit();

/**
 * @brief Main loop for WiFi manager.
 * Must be called repeatedly from main loop(). Handles non-blocking connection logic.
 */
void wifiManagerLoop();

/**
 * @brief Initiate a new WiFi connection and save the credentials.
 * @param ssid Target network SSID
 * @param password Target network password
 */
void wifiManagerConnect(const String& ssid, const String& password);

/**
 * @brief Disconnect from current WiFi and clear saved credentials.
 */
void wifiManagerDisconnect();

/**
 * @brief Get the current status of the WiFi connection.
 * @return A structure containing connection state details.
 */
WifiStatus wifiManagerGetStatus();

#endif // WIFI_MANAGER_H
