import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Zap, Lock, Mail, AlertCircle, ShieldCheck, ArrowRight, ShieldQuestion, X, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { SecurityQuestion } from '../types';
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

  // Recovery State
  const [isResetting, setIsResetting] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Email, 2: Questions, 3: New Password
  const [recoveryQuestions, setRecoveryQuestions] = useState<SecurityQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>(['', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const startRecovery = async () => {
    setRecoveryError(null);
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const ADMIN_EMAIL = (localStorage.getItem('userEmail') || 'admin@merameter.com').toLowerCase();

      if (!cleanEmail || cleanEmail !== ADMIN_EMAIL) {
        setRecoveryError('Please enter your registered email address first.');
        setIsLoading(false);
        return;
      }

      const { dbService } = await import('../services/dbService');
      const questions = await dbService.getAll<SecurityQuestion>('security_questions');

      if (!questions || questions.length === 0) {
        setRecoveryError('No security questions set. Please contact support.');
        setIsLoading(false);
        return;
      }

      setRecoveryQuestions(questions);
      setIsResetting(true);
      setResetStep(2);
    } catch (err) {
      setRecoveryError('Failed to initialize recovery.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAnswers = () => {
    const allCorrect = recoveryQuestions.every((q, i) =>
      q.answer.trim().toLowerCase() === userAnswers[i].trim().toLowerCase()
    );

    if (allCorrect) {
      setResetStep(3);
      setRecoveryError(null);
    } else {
      setRecoveryError('Incorrect answers to security questions.');
    }
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setRecoveryError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setRecoveryError('Passwords do not match.');
      return;
    }

    localStorage.setItem('adminPassword', newPassword);
    setSuccessMessage('Password reset successfully! Please login.');
    setTimeout(() => {
      setIsResetting(false);
      setResetStep(1);
      setSuccessMessage(null);
      setPassword('');
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 relative overflow-hidden font-sans transition-colors duration-500">
      {/* ─── BACKGROUND ELEMENTS ─── */}
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

          {/* ─── HEADER ─── */}
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
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">{appName}</h2>
            <div className="flex items-center justify-center gap-2">
              <div className="h-px w-8 bg-slate-200 dark:bg-slate-800" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Admin Portal</p>
              <div className="h-px w-8 bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>

          {/* ─── FORM ─── */}
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
                    <p className="text-xs font-bold">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input
                    required
                    type="email"
                    placeholder="admin@merameter.com"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
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
                <div className="flex justify-end pr-1">
                  <button
                    type="button"
                    onClick={startRecovery}
                    className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 dark:shadow-white/5 hover:bg-emerald-600 dark:hover:bg-emerald-400 dark:hover:text-white hover:shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* ─── FOOTER ─── */}
          <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-full">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Secure 256-bit Encrypted Connection
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── RECOVERY MODAL ─── */}
      <AnimatePresence>
        {isResetting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                    <ShieldQuestion className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Recover Password</h3>
                </div>
                <button
                  onClick={() => { setIsResetting(false); setResetStep(1); setRecoveryError(null); }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8">
                {recoveryError && (
                  <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-800/50">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-xs font-bold">{recoveryError}</p>
                  </div>
                )}

                {successMessage && (
                  <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <p className="text-xs font-bold">{successMessage}</p>
                  </div>
                )}

                {resetStep === 2 && (
                  <div className="space-y-6">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Please answer your security questions to continue.</p>
                    {recoveryQuestions.map((q, i) => (
                      <div key={q.id} className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{q.question}</label>
                        <input
                          type="text"
                          value={userAnswers[i]}
                          onChange={(e) => {
                            const newAnswers = [...userAnswers];
                            newAnswers[i] = e.target.value;
                            setUserAnswers(newAnswers);
                          }}
                          className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          placeholder="Your answer"
                        />
                      </div>
                    ))}
                    <button
                      onClick={verifyAnswers}
                      className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      Verify Answers <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {resetStep === 3 && (
                  <form onSubmit={handlePasswordReset} className="space-y-6">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Set a new strong password for your account.</p>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                        <input
                          required
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                        <input
                          required
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                    >
                      Reset Password
                    </button>
                  </form>
                )}

                <button
                  onClick={() => { setIsResetting(false); setResetStep(1); setRecoveryError(null); }}
                  className="w-full mt-6 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to Login
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
