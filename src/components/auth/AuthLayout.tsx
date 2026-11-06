import React from 'react';
import { ShieldCheck, Sparkles, Terminal } from 'lucide-react';
import { Badge } from '../common/Badge';

interface AuthLayoutProps {
  children: React.ReactNode;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, subtitle }) => {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-technovix-void overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-neon-violet/15 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-neon-cyan/15 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-cyan/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Cyber Grid pattern */}
      <div className="absolute inset-0 cyber-grid opacity-60 pointer-events-none" />

      {/* Main card */}
      <div className="relative z-10 w-full max-w-md sm:max-w-lg">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-neon-violet via-purple-600 to-neon-cyan p-[2px] shadow-glow-violet-sm mb-3">
            <div className="w-full h-full bg-technovix-panel rounded-[14px] flex items-center justify-center">
              <Terminal className="w-7 h-7 text-neon-cyan" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              TECHNOVIX
            </h1>
            <span className="text-2xl sm:text-3xl font-extrabold text-neon-cyan">
              CHAT
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 font-normal">
            {subtitle}
          </p>

          <div className="mt-3 flex items-center justify-center">
            <Badge variant="cyan" size="sm">
              <Sparkles className="w-3 h-3 text-neon-cyan" />
              Encrypted Real-Time Messaging
            </Badge>
          </div>
        </div>

        {/* Content Box */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-glass border border-white/10 relative">
          <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent" />
          {children}
        </div>

        {/* Footer Notice */}
        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400/80" />
          <span>Zero Secrets Exposed • Supabase PostgreSQL Real-Time Mesh</span>
        </div>
      </div>
    </div>
  );
};
