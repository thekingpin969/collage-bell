#ifndef WEB_ASSETS_H
#define WEB_ASSETS_H

#include <Arduino.h>

// Dashboard Page
const char HTML_DASHBOARD[] PROGMEM = R"rawhtml(
<!DOCTYPE html>
<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>College Bell - Dashboard</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/>
<script>
    tailwind.config = {
        darkMode: "class",
        theme: {
            extend: {
                colors: {
                    primary: "#34D399",
                    "background-light": "#F3F4F6",
                    "background-dark": "#000000",
                    "surface-light": "#FFFFFF",
                    "surface-dark": "#1C1C1E",
                    "text-light": "#111827",
                    "text-dark": "#FFFFFF",
                    "text-muted-light": "#6B7280",
                    "text-muted-dark": "#9CA3AF",
                },
                fontFamily: { display: ["Inter", "sans-serif"] },
                borderRadius: { DEFAULT: "1rem", 'lg': "1.5rem", 'xl': "2rem", 'full': "9999px" },
            },
        },
    };
</script>
<style>
    body { font-family: 'Inter', sans-serif; min-height: 100dvh; }
    .clock-ring { box-shadow: 0 0 40px rgba(52, 211, 153, 0.15); }
</style>
</head>
<body class="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark min-h-screen flex flex-col font-display antialiased pb-[88px]">
<header class="px-6 py-4 flex justify-between items-center">
    <h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
</header>
<main class="flex-1 px-4 sm:px-6 py-2 space-y-8 flex flex-col items-center max-w-md mx-auto w-full">
    <div class="relative w-64 h-64 flex items-center justify-center mt-4">
        <div class="absolute inset-0 rounded-full border border-surface-dark bg-surface-dark/50 clock-ring flex items-center justify-center">
            <div class="w-[90%] h-[90%] rounded-full relative flex items-center justify-center">
                <span class="absolute top-2 text-text-muted-dark font-bold text-lg">12</span>
                <span class="absolute right-3 text-text-muted-dark font-bold text-lg">3</span>
                <span class="absolute bottom-2 text-text-muted-dark font-bold text-lg">6</span>
                <span class="absolute left-3 text-text-muted-dark font-bold text-lg">9</span>
                <div class="absolute w-3 h-3 bg-white rounded-full z-10"></div>
            </div>
        </div>
    </div>
    <div class="text-center w-full">
        <p class="text-text-muted-light dark:text-text-muted-dark text-sm font-medium">{{DATE_STR}}</p>
        <p class="text-4xl font-bold mt-1">{{TIME_STR}}</p>
    </div>
    <div class="w-full bg-surface-light dark:bg-surface-dark rounded-2xl p-5 shadow-sm space-y-4">
        <div class="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
            <h2 class="text-lg font-semibold">System Status</h2>
            <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">Online</span>
        </div>
        <div class="grid grid-cols-2 gap-4 pt-1">
            <div class="space-y-1">
                <p class="text-xs text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider font-semibold">Next Bell</p>
                <p class="text-2xl font-bold">{{NEXT_BELL_TIME}}</p>
            </div>
            <div class="space-y-1">
                <p class="text-xs text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider font-semibold">Schedules</p>
                <p class="text-2xl font-bold">{{TOTAL_SCHEDULES}}</p>
            </div>
        </div>
    </div>
</main>
<div class="fixed bottom-24 left-0 right-0 flex justify-center z-40 pointer-events-none">
    <form action="/ring" method="POST" class="pointer-events-auto">
        <button type="submit" class="bg-primary hover:bg-emerald-500 text-white shadow-lg shadow-primary/30 rounded-full p-4 flex items-center justify-center transition-transform active:scale-95">
            <span class="material-icons text-3xl">notifications_active</span>
        </button>
    </form>
</div>
<nav class="fixed bottom-0 left-0 right-0 bg-background-light dark:bg-background-dark border-t border-gray-200 dark:border-gray-900 z-50">
    <div class="flex justify-around items-center h-16">
        <a class="flex flex-col items-center justify-center w-full h-full text-text-muted-light dark:text-text-muted-dark hover:text-primary" href="/schedules"><span class="material-icons mb-1">alarm</span><span class="text-[10px] font-medium">Schedules</span></a>
        <a class="flex flex-col items-center justify-center w-full h-full text-primary" href="/"><span class="material-icons mb-1">dashboard</span><span class="text-[10px] font-medium">Dashboard</span></a>
        <a class="flex flex-col items-center justify-center w-full h-full text-text-muted-light dark:text-text-muted-dark hover:text-primary" href="/settings"><span class="material-icons mb-1">settings</span><span class="text-[10px] font-medium">Settings</span></a>
        <a class="flex flex-col items-center justify-center w-full h-full text-text-muted-light dark:text-text-muted-dark hover:text-primary" href="/maintenance"><span class="material-icons mb-1">build</span><span class="text-[10px] font-medium">Maint</span></a>
    </div>
</nav>
</body></html>
)rawhtml";

// Schedules List Page
const char HTML_SCHEDULES[] PROGMEM = R"rawhtml(
<!DOCTYPE html>
<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Bell Schedule Management</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/>
<script>
    tailwind.config = {
        darkMode: "class",
        theme: {
            extend: {
                colors: {
                    primary: "#34D399",
                    "background-light": "#F3F4F6",
                    "background-dark": "#000000",
                    "card-light": "#FFFFFF",
                    "card-dark": "#1F1F1F",
                },
                fontFamily: { display: ["Inter", "sans-serif"] },
                borderRadius: { DEFAULT: "1rem" },
            },
        },
    };
</script>
</head>
<body class="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark min-h-screen flex flex-col relative pb-20">
<header class="pt-12 pb-4 px-6 sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-10 flex justify-between items-center">
    <h1 class="text-3xl font-bold tracking-tight">Schedules</h1>
</header>
<main class="flex-1 px-4 flex flex-col gap-4 mt-2">
    {{SCHEDULE_LIST}}
</main>
<a href="/configure" class="fixed bottom-[88px] right-6 w-14 h-14 bg-primary text-black rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform z-20">
    <span class="material-icons text-3xl">add</span>
</a>
<nav class="fixed bottom-0 w-full bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-lg border-t border-black/5 dark:border-white/5 px-6 py-4 flex justify-between items-center z-20">
    <a href="/" class="flex flex-col items-center gap-1 text-text-muted-light dark:text-text-muted-dark hover:text-text-light"><span class="material-icons">dashboard</span><span class="text-[10px] font-medium">Dashboard</span></a>
    <a href="/schedules" class="flex flex-col items-center gap-1 text-primary"><span class="material-icons">schedule</span><span class="text-[10px] font-medium">Schedules</span></a>
    <a href="/settings" class="flex flex-col items-center gap-1 text-text-muted-light dark:text-text-muted-dark hover:text-text-light"><span class="material-icons">settings</span><span class="text-[10px] font-medium">Settings</span></a>
    <a href="/maintenance" class="flex flex-col items-center gap-1 text-text-muted-light dark:text-text-muted-dark hover:text-text-light"><span class="material-icons">build</span><span class="text-[10px] font-medium">Maint</span></a>
</nav>
</body></html>
)rawhtml";

// Configure Page (Add/Edit)
const char HTML_CONFIGURE[] PROGMEM = R"rawhtml(
<!DOCTYPE html>
<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Configure Schedule</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/>
<script>
    tailwind.config = {
        darkMode: "class",
        theme: {
            extend: {
                colors: {
                    primary: "#10B981",
                    "background-light": "#F3F4F6",
                    "background-dark": "#0B0B0B",
                    "card-light": "#FFFFFF",
                    "card-dark": "#1C1C1E",
                },
                borderRadius: { DEFAULT: "1rem" },
            },
        },
    };
</script>
</head>
<body class="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark min-h-screen flex flex-col antialiased">
<header class="pt-12 pb-4 px-4 flex items-center justify-between sticky top-0 bg-background-light dark:bg-background-dark z-10">
    <a href="/schedules" class="p-2 -ml-2 rounded-full hover:bg-black/5"><span class="material-icons text-primary">close</span></a>
    <h1 class="text-xl font-semibold">New Schedule</h1>
</header>
<main class="flex-1 px-4 pb-24">
    <form action="/add" method="POST" id="schedForm">
        <div class="bg-card-light dark:bg-card-dark rounded p-4 space-y-4 shadow-sm mb-6">
            <div class="flex items-center justify-between">
                <label class="font-medium text-lg">Time</label>
                <div class="flex items-center space-x-2">
                    <input type="number" name="hour" min="0" max="23" value="9" class="w-16 bg-background-light dark:bg-black/20 border-none rounded p-2 text-center text-xl font-bold">
                    <span class="text-xl font-bold">:</span>
                    <input type="number" name="minute" min="0" max="59" value="00" class="w-16 bg-background-light dark:bg-black/20 border-none rounded p-2 text-center text-xl font-bold">
                </div>
            </div>
            <div class="flex items-center justify-between">
                <label class="font-medium text-lg">Steps (1-5)</label>
                <input type="number" name="stepCount" min="1" max="5" value="1" class="w-16 bg-background-light dark:bg-black/20 border-none rounded p-2 text-center font-bold">
            </div>
        </div>
        <div class="space-y-4">
            <h2 class="text-sm font-semibold uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark ml-2">Pattern</h2>
            <div class="space-y-3">
                <div class="bg-card-light dark:bg-card-dark rounded p-4 shadow-sm space-y-4">
                    <div class="flex items-center space-x-4">
                        <div class="flex-1 grid grid-cols-2 gap-4">
                            <div class="space-y-1">
                                <span class="text-xs text-text-muted-light underline">Duration (ON) s</span>
                                <input type="number" name="d0" min="1" max="255" value="3" class="w-full bg-background-light dark:bg-black/20 border-none rounded p-2 text-center">
                            </div>
                            <div class="space-y-1">
                                <span class="text-xs text-text-muted-light underline">Delay (OFF) s</span>
                                <input type="number" name="l0" min="0" max="255" value="0" class="w-full bg-background-light dark:bg-black/20 border-none rounded p-2 text-center">
                            </div>
                        </div>
                    </div>
                    <div class="text-xs text-text-muted-light italic">Note: Fill d1, l1 etc. if Steps > 1</div>
                    <div class="grid grid-cols-2 gap-4 opacity-50">
                        <input type="number" name="d1" placeholder="d1" class="bg-background-light dark:bg-black/20 border-none rounded p-1 text-center">
                        <input type="number" name="l1" placeholder="l1" class="bg-background-light dark:bg-black/20 border-none rounded p-1 text-center">
                    </div>
                </div>
            </div>
        </div>
        <div class="fixed bottom-0 left-0 right-0 p-4 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md">
            <button type="submit" class="w-full bg-primary text-white py-3 rounded-full font-semibold shadow-md">Save Schedule</button>
        </div>
    </form>
</main>
</body></html>
)rawhtml";

// Settings Page
const char HTML_SETTINGS[] PROGMEM = R"rawhtml(
<!DOCTYPE html>
<html class="dark" lang="en"><head>
<meta charset="utf-8"/><meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Settings</title>
<script src="https://cdn.tailwindcss.com?plugins=forms"></script>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/>
<script>
    tailwind.config = {
        theme: {
            extend: {
                colors: { primary: "#10b981", background: "#121212", surface: "#1e1e1e", border: "#2c2c2e" },
                borderRadius: { DEFAULT: "1rem" },
            },
        },
    };
</script>
</head>
<body class="bg-background text-gray-100 min-h-screen pb-24">
<header class="flex justify-between items-center px-4 py-4 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
    <div class="flex items-center gap-3"><span class="material-icons text-primary">settings</span><h1 class="text-2xl font-semibold">Settings</h1></div>
</header>
<main class="p-4 space-y-8">
    <form action="/set-time" method="POST" class="space-y-4">
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider pl-2">RTC Time Settings</h2>
        <div class="bg-surface rounded-2xl border border-border p-4 space-y-4">
            <div class="grid grid-cols-3 gap-2">
                <input type="number" name="year" value="2026" class="bg-background border-none rounded p-2 text-center">
                <input type="number" name="month" min="1" max="12" value="3" class="bg-background border-none rounded p-2 text-center">
                <input type="number" name="day" min="1" max="31" value="4" class="bg-background border-none rounded p-2 text-center">
            </div>
            <div class="grid grid-cols-3 gap-2">
                <input type="number" name="hour" min="0" max="23" value="12" class="bg-background border-none rounded p-2 text-center">
                <input type="number" name="min" min="0" max="59" value="00" class="bg-background border-none rounded p-2 text-center">
                <input type="number" name="sec" min="0" max="59" value="00" class="bg-background border-none rounded p-2 text-center">
            </div>
            <button type="submit" class="w-full bg-primary text-white py-2 rounded-lg font-bold">Update RTC Time</button>
        </div>
    </form>
</main>
<nav class="fixed bottom-0 w-full bg-background/90 backdrop-blur-lg border-t border-border px-6 py-4 flex justify-between">
    <a href="/"><span class="material-icons">dashboard</span></a>
    <a href="/schedules"><span class="material-icons">schedule</span></a>
    <a href="/settings" class="text-primary"><span class="material-icons">settings</span></a>
    <a href="/maintenance"><span class="material-icons">build</span></a>
</nav>
</body></html>
)rawhtml";

// Maintenance Page
const char HTML_MAINTENANCE[] PROGMEM = R"rawhtml(
<!DOCTYPE html>
<html class="dark" lang="en"><head>
<meta charset="utf-8"/><meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Maintenance</title>
<script src="https://cdn.tailwindcss.com?plugins=forms"></script>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/>
<script>
    tailwind.config = {
        darkMode: "class",
        theme: {
            extend: {
                colors: { primary: "#34D399", background: "#000000", surface: "#1C1C1E" },
                borderRadius: { DEFAULT: "1rem" },
            },
        },
    };
</script>
</head>
<body class="bg-background text-white min-h-screen flex flex-col antialiased">
<header class="pt-12 pb-4 px-4 sticky top-0 bg-background/80 backdrop-blur-md flex justify-between items-center">
    <h1 class="text-3xl font-bold">Maintenance</h1>
</header>
<main class="flex-1 px-4 pb-24 space-y-6">
    <section class="space-y-4">
        <h2 class="text-lg font-semibold text-gray-400">System Info</h2>
        <div class="bg-surface rounded-2xl p-5 shadow-sm space-y-2">
            <p class="flex justify-between"><span>Uptime:</span><span class="text-primary">{{UPTIME}}</span></p>
            <p class="flex justify-between"><span>Heap:</span><span class="text-primary">{{FREE_HEAP}} KB</span></p>
        </div>
    </section>
    <section class="space-y-4">
        <h2 class="text-lg font-semibold text-gray-400">Recent Logs</h2>
        <div class="bg-surface rounded-2xl overflow-hidden shadow-sm divide-y divide-white/5">
            {{LOG_ENTRIES}}
        </div>
    </section>
</main>
<nav class="fixed bottom-0 w-full bg-background border-t border-white/5 px-6 py-4 flex justify-between">
    <a href="/"><span class="material-icons">dashboard</span></a>
    <a href="/schedules"><span class="material-icons">schedule</span></a>
    <a href="/settings"><span class="material-icons">settings</span></a>
    <a href="/maintenance" class="text-primary"><span class="material-icons">build</span></a>
</nav>
</body></html>
)rawhtml";

#endif
