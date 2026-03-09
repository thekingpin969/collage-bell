import { useState, useRef, useEffect } from 'preact/hooks';
import { sendCommand } from '../api';

interface ManualTriggerBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    deviceId: string;
    deviceName: string;
}

export function ManualTriggerBottomSheet({ isOpen, onClose, deviceId, deviceName }: ManualTriggerBottomSheetProps) {
    const [sliderValue, setSliderValue] = useState(0);
    const [isRinging, setIsRinging] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const ringIntervalRef = useRef<any>(null);
    const isRingingRef = useRef(false);

    // Reset when closed
    useEffect(() => {
        if (!isOpen) {
            setSliderValue(0);
            stopRinging();
        }
    }, [isOpen]);

    // Handle visibility changes for safety
    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden) {
                setSliderValue(0);
                stopRinging();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            stopRinging();
        };
    }, []);

    const startRinging = () => {
        if (isRingingRef.current) return;
        isRingingRef.current = true;
        setIsRinging(true);

        sendCommand([deviceId], 'ring_on').catch(() => { });
        ringIntervalRef.current = setInterval(() => {
            sendCommand([deviceId], 'ring_on').catch(() => { });
        }, 1500);
    };

    const stopRinging = () => {
        if (!isRingingRef.current) return;
        isRingingRef.current = false;
        setIsRinging(false);

        if (ringIntervalRef.current) {
            clearInterval(ringIntervalRef.current);
            ringIntervalRef.current = null;
        }
        sendCommand([deviceId], 'ring_off').catch(() => { });
    };

    const handlePointerMove = (e: any) => {
        if (!sliderRef.current || !thumbRef.current) return;

        // Prevent default touch scrolling when sliding
        if (e.type === 'touchmove') e.preventDefault();

        const sliderRect = sliderRef.current.getBoundingClientRect();
        let clientX = e.clientX || (e.touches && e.touches[0].clientX);
        if (clientX === undefined) return;

        let newLeft = clientX - sliderRect.left;
        const maxLeft = sliderRect.width - thumbRef.current.offsetWidth;

        if (newLeft < 0) newLeft = 0;
        if (newLeft > maxLeft) newLeft = maxLeft;

        const percentage = (newLeft / maxLeft) * 100;
        setSliderValue(percentage);

        if (percentage > 95) {
            startRinging();
        } else {
            stopRinging();
        }
    };

    const handlePointerUp = () => {
        setSliderValue(0); // Snap back
        stopRinging();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/50 backdrop-blur-sm transition-opacity pb-20 md:pb-0">
            <div className={`absolute inset-0 ${isRinging ? 'pointer-events-none' : ''}`} onClick={onClose} />

            <div className="bg-white dark:bg-slate-900 w-full rounded-t-3xl shadow-2xl relative z-10 flex flex-col pb-safe transition-all duration-300 border-t border-slate-200 dark:border-slate-800">
                {/* Drag Handle & Header */}
                <div className="p-4 flex flex-col items-center border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
                    <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mb-4" />
                    <div className="flex justify-between items-center w-full px-2">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Manual Ring</h2>
                            <p className="text-xs text-slate-500 font-medium">on {deviceName}</p>
                        </div>
                        <button onClick={onClose} disabled={isRinging} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-50">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                </div>

                <div className="px-6 py-6 flex flex-col items-center justify-center space-y-6">
                    {/* Visual Indicator */}
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${isRinging ? 'bg-amber-100 dark:bg-amber-900/30 scale-110 shadow-[0_0_40px_-5px_rgba(245,158,11,0.4)]' : 'bg-slate-50 dark:bg-slate-800/50 grayscale'}`}>
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 relative ${isRinging ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                            {isRinging && (
                                <>
                                    <div className="absolute inset-0 rounded-full border border-amber-500 animate-[ping_1.5s_ease-out_infinite]" />
                                    <div className="absolute inset-0 rounded-full border border-amber-500 animate-[ping_1.5s_ease-out_0.5s_infinite] opacity-50" />
                                </>
                            )}
                            <span className={`material-symbols-outlined text-5xl transition-transform duration-200 ${isRinging ? 'animate-[wiggle_0.3s_ease-in-out_infinite]' : ''}`}>
                                notifications_active
                            </span>
                        </div>
                    </div>

                    <div className="text-center max-w-sm">
                        <h3 className="text-lg font-bold mb-1">{isRinging ? 'Ringing...' : 'Slide and Hold'}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            Drag the slider all the way to the right and <strong>hold it there</strong> to manually ring the bell. Release to stop.
                        </p>
                    </div>
                </div>

                {/* Slider Button Section */}
                <div className="p-6 pt-2 pb-8 mt-auto">
                    <div
                        ref={sliderRef}
                        className="relative w-full h-16 rounded-2xl overflow-hidden border touch-none flex items-center transition-colors duration-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-inner"
                    >
                        {/* Slide Track Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className={`font-bold tracking-widest uppercase transition-opacity duration-300 text-sm ${isRinging ? 'opacity-0' : (sliderValue > 50 ? 'opacity-0' : 'text-slate-400 drop-shadow-sm')}`}>
                                Slide & Hold
                            </span>
                        </div>

                        {/* Progress Fill Area */}
                        <div
                            className="absolute left-0 top-0 bottom-0 bg-amber-500/20 pointer-events-none transition-opacity"
                            style={{
                                width: `calc(${sliderValue}% + 3.5rem)`,
                                opacity: isRinging ? 1 : (sliderValue / 100)
                            }}
                        />

                        {/* Draggable Thumb */}
                        <div
                            ref={thumbRef}
                            className={`absolute left-0 h-12 w-16 m-2 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg select-none z-10 ${(!isRingingRef.current && sliderValue === 0) ? 'transition-all duration-300' : ''} ${isRinging ? 'bg-amber-500 text-white' : 'bg-slate-800 dark:bg-slate-600 text-white'}`}
                            style={{ left: `calc(${sliderValue}% - ${sliderValue * 0.8}px)` }}
                            onPointerDown={() => {
                                document.addEventListener('pointermove', handlePointerMove);
                                document.addEventListener('pointerup', () => {
                                    handlePointerUp();
                                    document.removeEventListener('pointermove', handlePointerMove);
                                    document.removeEventListener('pointerup', handlePointerUp);
                                }, { once: true });
                            }}
                        >
                            <span className="material-symbols-outlined text-2xl">
                                {isRinging ? 'volume_up' : 'touch_app'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
