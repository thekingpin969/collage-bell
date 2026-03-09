import { useState, useRef, useEffect } from 'preact/hooks';

interface TriggerBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onTrigger: (pattern: number[][]) => void;
    deviceName: string;
}

export function TriggerBottomSheet({ isOpen, onClose, onTrigger, deviceName }: TriggerBottomSheetProps) {
    const [stepCount, setStepCount] = useState(1);
    const [steps, setSteps] = useState([
        { on: 2, pause: 1 },
        { on: 2, pause: 1 },
        { on: 0, pause: 0 },
        { on: 0, pause: 0 },
        { on: 0, pause: 0 }
    ]);
    const [sliderValue, setSliderValue] = useState(0);
    const [isTriggering, setIsTriggering] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setSliderValue(0);
            setIsTriggering(false);
        }
    }, [isOpen]);

    const updateStep = (index: number, field: 'on' | 'pause', value: string) => {
        const newSteps = [...steps];
        let val = parseInt(value, 10);
        if (isNaN(val) || val < 0) val = 0;
        newSteps[index][field] = val;
        setSteps(newSteps);
    };

    const handlePointerMove = (e: any) => {
        if (!sliderRef.current || !thumbRef.current || isTriggering) return;

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
            handleCompleteTrigger();
        }
    };

    const handlePointerUp = () => {
        if (isTriggering) return;
        if (sliderValue < 95) {
            setSliderValue(0); // Snap back
        } else {
            handleCompleteTrigger();
        }
    };

    const handleCompleteTrigger = () => {
        setSliderValue(100);
        setIsTriggering(true);
        const pattern = steps.slice(0, stepCount).map(s => [s.on, s.pause]);
        onTrigger(pattern);
        setTimeout(() => {
            onClose();
        }, 1000);
    };

    const totalTimePattern = steps.slice(0, stepCount).reduce((acc, step) => acc + step.on + step.pause, 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/50 backdrop-blur-sm transition-opacity pb-20 md:pb-0">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="bg-white dark:bg-slate-900 w-full rounded-t-3xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] pb-safe animate-slide-up border-t border-slate-200 dark:border-slate-800">
                {/* Drag Handle & Header */}
                <div className="p-4 flex flex-col items-center border-b border-slate-100 dark:border-slate-800">
                    <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mb-4" />
                    <div className="flex justify-between items-center w-full px-2">
                        <div>
                            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">Trigger Bell</h2>
                            <p className="text-xs text-slate-500 font-medium">on {deviceName}</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto px-6 py-4 flex-1 space-y-6">
                    {/* Pattern Builder */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Pattern Builder</h3>
                            <button
                                onClick={() => setStepCount(Math.min(5, stepCount + 1))}
                                disabled={stepCount >= 5}
                                className="text-xs font-bold text-primary flex items-center gap-1 disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-sm">add_circle</span> Add Step
                            </button>
                        </div>

                        <div className="space-y-3">
                            {steps.slice(0, stepCount).map((step, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 font-bold text-xs flex items-center justify-center text-slate-500">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 mb-1">ON DURATION</span>
                                            <div className="flex items-center relative">
                                                <input
                                                    type="number" min="0" max="60"
                                                    value={step.on}
                                                    onInput={(e: any) => updateStep(idx, 'on', e.target.value)}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-6 py-1.5 text-sm font-mono font-bold focus:border-primary outline-none"
                                                />
                                                <span className="absolute right-3 text-xs font-bold text-slate-400">s</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 mb-1">PAUSE AFTER</span>
                                            <div className="flex items-center relative">
                                                <input
                                                    type="number" min="0" max="60"
                                                    value={step.pause}
                                                    onInput={(e: any) => updateStep(idx, 'pause', e.target.value)}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-6 py-1.5 text-sm font-mono font-bold focus:border-primary outline-none"
                                                />
                                                <span className="absolute right-3 text-xs font-bold text-slate-400">s</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setStepCount(Math.max(1, stepCount - 1))}
                                        disabled={stepCount <= 1}
                                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg disabled:opacity-30 transition"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Preview Visualizer */}
                        <div className="space-y-2 mt-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Pattern Preview ({totalTimePattern}s)</p>
                            <div className="h-3 flex rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                                {totalTimePattern > 0 ? steps.slice(0, stepCount).map((step, idx) => (
                                    <div key={'p' + idx} className="h-full flex" style={{ width: `${((step.on + step.pause) / totalTimePattern) * 100}%` }}>
                                        {step.on > 0 && <div className="h-full bg-emerald-500 relative overflow-hidden pattern-stripes" style={{ width: `${(step.on / (step.on + step.pause)) * 100}%` }} />}
                                        {step.pause > 0 && <div className="h-full bg-transparent" style={{ width: `${(step.pause / (step.on + step.pause)) * 100}%` }} />}
                                    </div>
                                )) : <div className="w-full h-full bg-slate-200 dark:bg-slate-800" />}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Slider Button Section */}
                <div className="p-6 pt-2 pb-8 bg-white dark:bg-slate-900 mt-auto shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                    <div
                        ref={sliderRef}
                        className="relative w-full h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 touch-none flex items-center shadow-inner"
                    >
                        {/* Slide Track Text */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className={`font-bold tracking-widest uppercase transition-opacity duration-300 text-sm ${sliderValue > 50 ? 'opacity-0' : 'text-slate-400 drop-shadow-sm'}`}>
                                Slide to Trigger
                            </span>
                        </div>

                        {/* Progress Fill Area */}
                        <div
                            className="absolute left-0 top-0 bottom-0 bg-primary/20 pointer-events-none"
                            style={{ width: `calc(${sliderValue}% + 3rem)` }}
                        />

                        {/* Draggable Thumb */}
                        <div
                            ref={thumbRef}
                            className={`absolute left-0 h-14 w-16 m-1 rounded-xl bg-primary text-white flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg select-none ${!isTriggering && sliderValue === 0 ? 'transition-all duration-300' : ''}`}
                            style={{ left: `calc(${sliderValue}% - ${sliderValue * 0.64}px)` }}
                            onPointerDown={() => {
                                document.addEventListener('pointermove', handlePointerMove);
                                document.addEventListener('pointerup', () => {
                                    handlePointerUp();
                                    document.removeEventListener('pointermove', handlePointerMove);
                                    document.removeEventListener('pointerup', handlePointerUp);
                                }, { once: true });
                            }}
                        >
                            <span className={`material-symbols-outlined text-2xl transition-transform ${isTriggering ? 'animate-bounce' : ''}`}>
                                {isTriggering ? 'done' : 'double_arrow'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
