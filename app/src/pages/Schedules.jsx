import { h } from 'preact';
import { Layout } from '../components/Layout';
import { BottomNav } from '../components/BottomNav';
import { Link } from '../router';

export const Schedules = () => {
  return (
    <Layout>
      <header class="header">
        <h1>Schedules</h1>
        <button aria-label="More options" class="icon-btn">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
        </button>
      </header>

      <main class="flex flex-col gap-4 px-4 w-full max-w-sm mx-auto">
        <div class="flex justify-between items-end section-header pb-1" style="padding: 0 0.5rem 0.25rem;">
            <h2 class="text-sm font-medium text-gray-400 uppercase tracking-wider">Active Schedules</h2>
            <span class="text-xs text-primary font-medium">{"{{TOTAL_SCHEDULES}} Total"}</span>
        </div>

        {/* Schedule list placeholder - in real app, map over state */}
        <div class="schedule-list">
            {"{{SCHEDULE_LIST}}"}
        </div>
        
        {/* Example Empty state from html
        <div class="empty">
            <span class="empty-icon">
               <svg viewBox="0 0 24 24" fill="currentColor">...</svg>
            </span>
            <div class="empty-text">No schedules found</div>
            <Link to="/configure" class="add-first">Add First Schedule</Link>
        </div>
        */}
      </main>

      <Link to="/configure" class="fab bottom-right" aria-label="Add Schedule" title="Add Schedule">
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
      </Link>

      <BottomNav />
    </Layout>
  );
};
