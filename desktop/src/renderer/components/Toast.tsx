import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className="pointer-events-auto"
                        >
                            <ToastItem toast={toast} onClose={() => removeToast(toast.id)} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    };

    const bgStyles = {
        success: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-800/50',
        error: 'bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-800/50',
        info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-800/50',
        warning: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-800/50',
    };

    return (
        <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border shadow-xl backdrop-blur-md min-w-[320px] max-w-md ${bgStyles[toast.type]}`}>
            <div className="shrink-0">{icons[toast.type]}</div>
            <p className="text-sm font-bold text-slate-900 dark:text-white flex-1">{toast.message}</p>
            <button
                onClick={onClose}
                className="p-1 hover:bg-slate-900/5 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-400"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};
