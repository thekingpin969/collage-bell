/**
 * @file LEDStatus.jsx
 * @brief Visual LED status panel component
 *
 * Shows 4 animated LED indicators that poll /api/leds
 * and mirror physical LED state with CSS animations.
 */

import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { api } from '../api';
import './LEDStatus.css';

/** Human-readable state labels */
const STATE_LABELS = {
    on:         'Active',
    off:        'Inactive',
    blink:      'Blinking',
    heartbeat:  'Heartbeat',
    fast_blink: 'Alert',
};

/** Default LED data while loading */
const DEFAULT_LEDS = {
    wifi:   { label: 'WiFi',   color: 'blue',   state: 'off' },
    rtc:    { label: 'RTC',    color: 'yellow', state: 'off' },
    system: { label: 'System', color: 'green',  state: 'off' },
    status: { label: 'Status', color: 'red',    state: 'off' },
};

export const LEDStatus = () => {
    const [leds, setLeds] = useState(DEFAULT_LEDS);
    const timerRef = useRef(null);

    const fetchLeds = () => {
        api.getLedStatus()
            .then(data => setLeds(data))
            .catch(() => {});
    };

    useEffect(() => {
        fetchLeds();
        // Poll every 3 seconds
        timerRef.current = setInterval(fetchLeds, 3000);
        return () => clearInterval(timerRef.current);
    }, []);

    const entries = Object.entries(leds);

    return (
        <section class="mnt-section">
            <h2 class="mnt-section-title">LED Diagnostics</h2>
            <div class="led-grid">
                {entries.map(([key, led]) => (
                    <div class="led-item" key={key} id={`led-${key}`}>
                        <div class="led-dot-wrapper">
                            <div class={`led-glow ${led.color} ${led.state}`} />
                            <div class={`led-dot ${led.color} ${led.state}`} />
                        </div>
                        <div class="led-info">
                            <p class="led-label">{led.label}</p>
                            <p class="led-state">{STATE_LABELS[led.state] || led.state}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
