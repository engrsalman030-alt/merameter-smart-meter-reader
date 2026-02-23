import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Zap, Lock, Mail, AlertCircle, ShieldCheck } from 'lucide-react';
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

  // Dynamic Branding State
  const [appName, setAppName] = useState(localStorage.getItem('appName') || 'MeraMeter');
  const [appLogo, setAppLogo] = useState(localStorage.getItem('appLogo') || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Minor delay for realistic feel
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

      // SUCCESS
      localStorage.setItem('isAdminLoggedIn', 'true');
      onLogin();
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090B10] relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[140px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[140px] animate-pulse" />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg p-6 relative z-10"
      >
        <div className="bg-[#11141D]/80 backdrop-blur-3xl p-10 md:p-14 rounded-[3rem] border border-white/5 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.5)] space-y-10">

          {/* Header & Branding */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-gradient-to-br from-emerald-500 to-indigo-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/20 overflow-hidden"
            >
              {appLogo ? (
                <img src={appLogo} alt="App Logo" className="w-full h-full object-contain p-4" />
              ) : (
                <Zap className="text-white w-10 h-10" />
              )}
            </motion.div>
            <h2 className="text-4xl font-black text-white tracking-tight">{appName}</h2>
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Secure Administrative Access</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 p-5 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-bold">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity Endpoint</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    required
                    type="email"
                    placeholder="admin@platform.com"
                    className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold text-white placeholder:text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 focus:bg-[#1A1F2B] outline-none transition-all"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Security Cipher</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pl-14 pr-14 py-5 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold text-white placeholder:text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 focus:bg-[#1A1F2B] outline-none transition-all"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Establish Session
                  <Lock className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </>
              )}
            </button>
          </form>

          <div className="pt-8 border-t border-white/5 flex flex-col items-center gap-4">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
              Authorized Personnel Only
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
