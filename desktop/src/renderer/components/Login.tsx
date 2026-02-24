import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Zap, Lock, Mail, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginProps {
    onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [appName, setAppName] = useState(localStorage.getItem('appName') || 'MeraMeter');
    const [appLogo, setAppLogo] = useState(localStorage.getItem('appLogo') || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        setTimeout(() => {
            const cleanEmail = email.trim().toLowerCase();
            const cleanPassword = password.trim();

            const ADMIN_EMAIL = (localStorage.getItem('userEmail') || 'admin@merameter.com').toLowerCase();
            const ADMIN_PASSWORD = (localStorage.getItem('adminPassword') || 'admin123');

            if (cleanEmail !== ADMIN_EMAIL) {
                setError('Unauthorized access. Please verify your credentials.');
                setIsLoading(false);
                return;
            }

            if (cleanPassword !== ADMIN_PASSWORD) {
                setError('The password you entered is incorrect.');
                setIsLoading(false);
                return;
            }

            localStorage.setItem('isAdminLoggedIn', 'true');
            onLogin();
        }, 800);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 relative overflow-hidden font-sans transition-colors duration-500">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-emerald-500/5 rounded-full blur-[120px]" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-blue-500/5 rounded-full blur-[120px]" />
                <div
                    className="absolute inset-0 opacity-[0.4] dark:opacity-[0.1]"
                    style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '32px 32px' }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-md relative z-10 px-6"
            >
                <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 backdrop-blur-xl">
                    <div className="text-center mb-10">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/10 dark:shadow-black/30 border border-slate-100 dark:border-slate-700"
                        >
                            {appLogo ? (
                                <img src={appLogo} alt="App Logo" className="w-full h-full object-contain p-4" />
                            ) : (
                                <Zap className="text-emerald-500 w-10 h-10" />
                            )}
                        </motion.div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2 uppercase tracking-tighter">{appName}</h2>
                        <div className="flex items-center justify-center gap-2">
                            <div className="h-px w-8 bg-slate-200 dark:bg-slate-800" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Matrix Authentication</p>
                            <div className="h-px w-8 bg-slate-200 dark:bg-slate-800" />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-800/50">
                                        <AlertCircle className="w-5 h-5 shrink-0" />
                                        <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-5">
                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Credential ID</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                    </div>
                                    <input
                                        required
                                        type="email"
                                        placeholder="admin@merameter.com"
                                        className="w-full h-14 pl-12 pr-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Protocol</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center">
                                        <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                    </div>
                                    <input
                                        required
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="w-full h-14 pl-12 pr-12 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            disabled={isLoading}
                            type="submit"
                            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 h-16 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 dark:shadow-white/5 hover:bg-emerald-600 dark:hover:bg-emerald-400 dark:hover:text-white hover:shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin" />
                            ) : (
                                <>
                                    Initialize
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-full">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                Ledger Security Level 9
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
