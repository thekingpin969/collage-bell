import { h } from 'preact';
import { Layout } from '../components/Layout';
import { BottomNav } from '../components/BottomNav';
import { Link } from '../router';

export const Maintenance = () => {
  return (
    <Layout>
      <header class="header">
        <h1>Maintenance</h1>
        <button class="icon-btn" aria-label="More options">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
        </button>
      </header>

      <main class="space-y-6" style={{ padding: '0 16px 80px', flex: 1, overflowY: 'auto' }}>
        {/* Firmware Update */}
        <section class="space-y-4">
            <h2 class="text-lg font-semibold text-muted">Firmware Update</h2>
            <form onSubmit={e => e.preventDefault()} class="bg-surface rounded-2xl p-4 flex flex-col gap-4">
                <div style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                    <span class="text-muted mb-2">
                        <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor">
                            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.36 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                        </svg>
                    </span>
                    <div class="text-center">
                        <p class="text-sm font-medium">Select firmware file</p>
                        <p class="text-xs text-muted mt-1">.bin files only</p>
                    </div>
                    <div class="mt-4 px-4 py-2 bg-border text-white rounded-lg text-sm font-medium">Browse Files</div>
                    <input type="file" accept=".bin" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                </div>

                <button type="button" class="bg-primary text-black font-semibold rounded-xl p-3 flex justify-center items-center gap-2 w-full mt-2">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14zm-1-6h-3V8h-2v5H8l4 4 4-4z" />
                    </svg>
                    Start Update
                </button>
            </form>
        </section>

        {/* Logs */}
        <section class="space-y-4">
            <div class="flex justify-between items-end">
                <h2 class="text-lg font-semibold text-muted">Recent Logs</h2>
                <div class="flex gap-3">
                    <button class="text-primary text-sm font-medium flex items-center gap-1">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                        </svg>
                        Refresh
                    </button>
                    <button class="text-red-500 text-sm font-medium flex items-center gap-1">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z" />
                        </svg>
                        Clear
                    </button>
                </div>
            </div>

            <div class="bg-surface rounded-2xl overflow-hidden">
                <div id="log-entries" class="flex flex-col">
                    <div class="flex gap-4 p-4 items-start border-b border-border">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(52, 211, 153, 0.2)', color: 'var(--primary)', fontSize: '14px' }}>&#x2714;</div>
                        <div class="flex-1 overflow-hidden">
                            <div class="text-base font-medium truncate">System Ready</div>
                            <div class="text-sm text-muted mt-1">Uptime: 0h 02m</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
      </main>

      <BottomNav />
    </Layout>
  );
};
