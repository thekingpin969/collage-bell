import { Link, useRoute } from 'wouter';
import type { ComponentChildren } from 'preact';

const NavItem = ({ href, icon, label, isMobile = false }: { href: string, icon: string, label: string, isMobile?: boolean }) => {
    const [isActive] = useRoute(href);

    if (isMobile) {
        return (
            <Link href={href} className={`flex flex-col items-center gap-1 p-2 transition-colors ${isActive ? 'text-primary' : 'text-slate-500 dark:text-slate-400 hover:text-primary'}`}>
                <span className={`material-symbols-outlined ${isActive ? 'font-bold fill-1' : ''}`}>{icon}</span>
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'} uppercase tracking-wider`}>{label}</span>
            </Link>
        );
    }

    return (
        <Link href={href} className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-primary/10 text-primary font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <span className="material-symbols-outlined">{icon}</span>
            {label}
        </Link>
    );
};

export default function Layout({ children }: { children: ComponentChildren }) {
    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col md:flex-row">

            {/* Desktop Sidebar (md and up) */}
            <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 sticky top-0 h-screen overflow-y-auto">
                <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">notifications_active</span>
                    </div>
                    <div className="text-xl font-bold text-primary tracking-tight">BellSystem.io</div>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-2">
                    <NavItem href="/" icon="dashboard" label="Dashboard" />
                    <NavItem href="/devices" icon="router" label="Devices" />
                    <NavItem href="/schedules" icon="calendar_month" label="Schedules" />
                    <NavItem href="/firmware" icon="system_update" label="Firmware" />
                </nav>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0 relative">

                {/* Mobile Top Navigation */}
                <nav className="md:hidden sticky top-0 z-40 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                            <span className="material-symbols-outlined block">menu</span>
                        </button>
                        <h1 className="text-lg font-bold tracking-tight text-primary">BellSystem.io</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                            <span className="material-symbols-outlined block text-slate-600 dark:text-slate-400">notifications</span>
                            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white leading-none">!</span>
                        </button>
                    </div>
                </nav>

                {/* Content Area */}
                <main className="flex-1 w-full">
                    {children}
                </main>

                {/* Mobile Bottom Navigation */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 flex justify-around items-center h-20 px-2 z-50">
                    <NavItem href="/" icon="dashboard" label="Home" isMobile />
                    <NavItem href="/devices" icon="router" label="Devices" isMobile />
                    <NavItem href="/schedules" icon="calendar_month" label="Schedules" isMobile />
                    <NavItem href="/firmware" icon="system_update" label="Firmware" isMobile />
                </div>
            </div>
        </div>
    );
}
