import { useEffect, useRef } from 'preact/compat';
import type { FC } from 'preact/compat';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    confirmColor?: 'rose' | 'primary' | 'amber';
}

export const ConfirmationModal: FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    confirmColor = 'primary',
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const colorConfig = {
        rose: 'bg-rose-500 hover:bg-rose-600 focus:ring-rose-500/50',
        primary: 'bg-primary hover:bg-primary/90 focus:ring-primary/50',
        amber: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500/50',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                ref={modalRef}
                className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800"
                role="dialog"
                aria-modal="true"
            >
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${confirmColor === 'rose' ? 'bg-rose-100 text-rose-500 dark:bg-rose-900/30' : confirmColor === 'amber' ? 'bg-amber-100 text-amber-500 dark:bg-amber-900/30' : 'bg-primary/10 text-primary'}`}>
                            <span className="material-symbols-outlined text-xl">
                                {confirmColor === 'rose' ? 'warning' : 'help'}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold dark:text-white leading-tight">
                            {title}
                        </h3>
                    </div>

                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
                        {message}
                    </p>

                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-95 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 px-4 py-3 rounded-xl font-bold text-white active:scale-95 transition-all focus:outline-none focus:ring-4 shadow-lg shadow-black/5 ${colorConfig[confirmColor]}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
