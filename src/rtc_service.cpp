/**
 * @file rtc_service.cpp
 * @brief RTC Service implementation using DS3231 + RTClib
 */

#include "rtc_service.h"
#include <Wire.h>
#include <RTClib.h>

// Module-private RTC instance
static RTC_DS3231 _rtc;

bool rtcInit() {
    Wire.begin();  // Default SDA=21, SCL=22 on ESP32

    if (!_rtc.begin()) {
        DEBUG_PRINTLN("[RTC] DS3231 not found!");
        return false;
    }

    if (_rtc.lostPower()) {
        DEBUG_PRINTLN("[RTC] Lost power – setting to compile time as fallback");
        _rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
    }

    DEBUG_PRINTLN("[RTC] Initialised OK");
    return true;
}

void rtcGetTime(uint8_t &hour, uint8_t &minute, uint8_t &second) {
    DateTime now = _rtc.now();
    hour   = now.hour();
    minute = now.minute();
    second = now.second();
}

bool rtcSetTime(uint16_t year, uint8_t month, uint8_t day,
                uint8_t hour, uint8_t minute, uint8_t second) {
    _rtc.adjust(DateTime(year, month, day, hour, minute, second));
    DEBUG_PRINTF("[RTC] Time set to %04d-%02d-%02d %02d:%02d:%02d\n",
                 year, month, day, hour, minute, second);
    return true;
}

bool rtcLostPower() {
    return _rtc.lostPower();
}
