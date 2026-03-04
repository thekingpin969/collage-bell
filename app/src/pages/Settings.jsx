import { h } from 'preact';
import { Layout } from '../components/Layout';
import { BottomNav } from '../components/BottomNav';
import { Link } from '../router';

export const Settings = () => {
  const syncTime = () => {
    alert("In a real app, this would POST to /set-time with current browser time");
  };

  return (
    <Layout>
      <header class="flex justify-between items-center px-4 py-4 sticky top-0 z-10 border-b border-border" style={{ background: 'rgba(28, 28, 30, 0.8)', backdropFilter: 'blur(12px)' }}>
        <div class="flex items-center gap-3">
          <svg class="text-primary" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
          </svg>
          <h1 class="text-xl font-semibold text-white">Settings</h1>
        </div>
      </header>

      <main class="space-y-8" style={{ padding: '16px 16px 80px', flex: 1, overflowY: 'auto' }}>
          <section class="space-y-4">
              <h2 class="text-xs font-semibold uppercase tracking-wider text-muted px-2">RTC Time Settings</h2>
              <div class="bg-surface rounded-2xl border border-border overflow-hidden">
                  <div class="flex justify-between items-center p-4 border-b border-border cursor-pointer hover:bg-surface-hover transition-colors" onClick={syncTime}>
                      <div>
                          <p class="font-medium text-base text-white">Sync with Browser</p>
                          <p class="text-xs text-muted mt-1">Update RTC with current device time</p>
                      </div>
                      <button class="bg-primary text-black p-2 rounded-full flex items-center justify-center">
                          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                              <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
                          </svg>
                      </button>
                  </div>
                  <div class="flex justify-between items-center p-4 border-b border-border">
                      <div>
                          <p class="font-medium text-base text-white">Date</p>
                          <p class="text-sm text-primary mt-1">{"{{DATE_STR}}"}</p>
                      </div>
                  </div>
                  <div class="flex justify-between items-center p-4">
                      <div>
                          <p class="font-medium text-base text-white">Time</p>
                          <p class="text-sm text-primary mt-1">{"{{TIME_STR}}"}</p>
                      </div>
                  </div>
              </div>
          </section>

          <section class="space-y-4">
              <h2 class="text-xs font-semibold uppercase tracking-wider text-muted px-2">System Options</h2>
              <div class="bg-surface rounded-2xl border border-border overflow-hidden">
                  <div class="flex justify-between items-center p-4 border-b border-border">
                      <div>
                          <p class="font-medium text-base text-white">Master Enable</p>
                          <p class="text-xs text-muted mt-1">Turn entire bell system on/off</p>
                      </div>
                      <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                          <input type="checkbox" defaultChecked style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                          <div style={{ width: '44px', height: '24px', backgroundColor: 'var(--primary)', borderRadius: '9999px', transition: '0.2s', position: 'relative' }}>
                              <div style={{ width: '20px', height: '20px', backgroundColor: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: '22px', transition: '0.2s' }}></div>
                          </div>
                      </label>
                  </div>
                  <div class="p-4 border-b border-border">
                      <label class="block font-medium text-base text-white mb-2" for="device-name">Device Name</label>
                      <input id="device-name" class="w-full bg-black border border-border text-white p-2 rounded-lg outline-none" type="text" defaultValue="Main Building Bell" />
                  </div>
                  <div class="flex justify-between items-center p-4">
                      <div>
                          <p class="font-medium text-base text-white">Timezone</p>
                          <p class="text-xs text-muted mt-1">UTC +5:30 (IST)</p>
                      </div>
                      <svg class="text-muted" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z" />
                      </svg>
                  </div>
              </div>
          </section>

          <div class="flex justify-center pt-4 mb-8">
              <button class="bg-primary text-black font-semibold py-3 px-8 rounded-full w-full max-w-sm flex items-center justify-center gap-2" style={{ boxShadow: '0 10px 15px -3px rgba(52, 211, 153, 0.2)' }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                      <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" />
                  </svg>
                  Save Settings
              </button>
          </div>
      </main>

      <BottomNav />
    </Layout>
  );
};
