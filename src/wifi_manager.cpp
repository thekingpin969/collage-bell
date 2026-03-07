/**
 * @file wifi_manager.cpp
 * @brief WiFi Client (STA) Manager implementation
 */

#include "wifi_manager.h"
#include "storage_manager.h"
#include <WiFi.h>

// ============================================================
// INTERNAL STATE
// ============================================================

static String _targetSsid;
static String _targetPassword;
static unsigned long _connectStartTime = 0;
static const unsigned long CONNECT_TIMEOUT_MS = 15000; // 15 seconds timeout

// Connection states
enum WifiState {
    WIFI_IDLE,
    WIFI_CONNECTING,
    WIFI_CONNECTED,
    WIFI_FAILED
};

static WifiState _state = WIFI_IDLE;

// ============================================================
// PUBLIC API
// ============================================================

void wifiManagerInit() {
    // We assume the ESP is already in WIFI_AP_STA mode due to web_config init, 
    // or we will ensure it when connecting. (We set it here just in case).
    WiFi.mode(WIFI_AP_STA);
    
    // Disconnect any existing STA connections left over from a warm boot
    WiFi.disconnect(true);
    
    storageLoadWifiConfig(_targetSsid, _targetPassword);
    
    if (_targetSsid.length() > 0) {
        DEBUG_PRINT("[WIFI-STA] Saved credentials found. Attempting to connect to: ");
        DEBUG_PRINTLN(_targetSsid);
        wifiManagerConnect(_targetSsid, _targetPassword);
    } else {
        DEBUG_PRINTLN("[WIFI-STA] No credentials found. Standing by in AP mode.");
        _state = WIFI_IDLE;
    }
}

void wifiManagerLoop() {
    if (_state == WIFI_CONNECTING) {
        if (WiFi.status() == WL_CONNECTED) {
            _state = WIFI_CONNECTED;
            DEBUG_PRINTLN("");
            DEBUG_PRINT("[WIFI-STA] Connected! IP address: ");
            DEBUG_PRINTLN(WiFi.localIP().toString());
        } else if (millis() - _connectStartTime > CONNECT_TIMEOUT_MS) {
            _state = WIFI_FAILED;
            DEBUG_PRINTLN("");
            DEBUG_PRINTLN("[WIFI-STA] Connection timeout.");
            WiFi.disconnect(true); // Stop trying
        } else {
            // Still trying... we could print dots here, but we are non-blocking.
        }
    } else if (_state == WIFI_CONNECTED) {
        // Monitor for drops
        if (WiFi.status() != WL_CONNECTED) {
            DEBUG_PRINTLN("[WIFI-STA] Connection lost. Reconnecting...");
            _state = WIFI_IDLE; // Will let the user try again manually for now, or we could auto-retry.
            wifiManagerConnect(_targetSsid, _targetPassword); // Auto-retry logic
        }
    }
}

void wifiManagerConnect(const String& ssid, const String& password) {
    _targetSsid = ssid;
    _targetPassword = password;
    
    // Save the new config
    storageSaveWifiConfig(_targetSsid, _targetPassword);
    
    DEBUG_PRINT("[WIFI-STA] Connecting to: ");
    DEBUG_PRINTLN(_targetSsid);
    
    // Initiate connection
    WiFi.begin(_targetSsid.c_str(), _targetPassword.c_str());
    _state = WIFI_CONNECTING;
    _connectStartTime = millis();
}

void wifiManagerDisconnect() {
    _targetSsid = "";
    _targetPassword = "";
    
    // Clear saved config
    storageSaveWifiConfig(_targetSsid, _targetPassword);
    
    DEBUG_PRINTLN("[WIFI-STA] Disconnecting and clearing credentials.");
    
    WiFi.disconnect(true);
    _state = WIFI_IDLE;
}

WifiStatus wifiManagerGetStatus() {
    WifiStatus s;
    s.connected = (WiFi.status() == WL_CONNECTED);
    s.ip = s.connected ? WiFi.localIP().toString() : "";
    s.rssi = s.connected ? WiFi.RSSI() : 0;
    s.bssid = s.connected ? WiFi.BSSIDstr() : "";
    s.channel = s.connected ? WiFi.channel() : 0;
    
    switch(_state) {
        case WIFI_IDLE:       s.state = "idle";       break;
        case WIFI_CONNECTING: s.state = "connecting"; break;
        case WIFI_CONNECTED:  s.state = "connected";  break;
        case WIFI_FAILED:     s.state = "failed";     break;
        default:              s.state = "unknown";    break;
    }
    
    // Only return the SSID if we are intending to connect to something
    s.ssid = _targetSsid;
    
    return s;
}
