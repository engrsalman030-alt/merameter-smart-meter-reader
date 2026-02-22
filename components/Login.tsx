import React, { useState } from 'react';
import { Eye, EyeOff, Zap, Lock, Mail, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const ADMIN_EMAIL = 'admin@merameter.com';
const ADMIN_PASSWORD = 'admin123';

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('ADMIN@MERAMETER.COM');
  const [password, setPassword] = useState('ADMIN123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Minor delay for realistic feel
    setTimeout(() => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim(); // Trim password too to avoid accidental spaces

      if (cleanEmail !== ADMIN_EMAIL) {
        setError('The email you entered is incorrect.');
        setIsLoading(false);
        return;
      }

      if (cleanPassword.toLowerCase() !== ADMIN_PASSWORD.toLowerCase()) {
        setError('The password you entered is incorrect.');
        setIsLoading(false);
        return;
      }

      // ✅ SUCCESS
      localStorage.setItem('isAdminLoggedIn', 'true');
      onLogin();
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/50 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[100px] animate-pulse" />

      <div className="w-full max-w-md p-4 relative z-10">
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 space-y-8">

          {/* Header */}
          <div className="text-center space-y-3">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-200">
              <Zap className="text-white w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Welcome Back</h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Administrator Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Email Field */}
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  required
                  type="email"
                  placeholder="Admin Email"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold placeholder:font-medium focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              {/* Password Field */}
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold placeholder:font-medium focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 transition-all hover:bg-black active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Secure Login'
              )}
            </button>
          </form>

          <div className="pt-6 border-t border-slate-50 text-center">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">
              Default Credentials:<br />
              <span className="text-slate-400">admin@merameter.com / admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
