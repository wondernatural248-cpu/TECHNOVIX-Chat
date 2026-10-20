import React from 'react';
import { Database, LogOut, Sparkles, Terminal, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';

export const AppHeader: React.FC = () => {
  const { setActiveScreen, setIsProfileOpen, activeView } = useApp();

  return (
    <header className="h-14 border-b border-white/10 bg-technovix-void/80 px-4 flex items-center justify-between shrink-0 select-none backdrop-blur-xl z-10">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-neon-violet to-neon-cyan p-[1.5px] flex items-center justify-center shadow-glow-cyan-sm">
            <div className="w-full h-full bg-technovix-panel rounded-[6.5px] flex items-center justify-center">
              <Terminal className="w-4 h-4 text-neon-cyan" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-tight text-white text-base">
              TECHNOVIX
            </span>
            <span className="font-extrabold text-neon-cyan text-base">
              {activeView === 'arcade' ? 'ARCADE' : 'CHAT'}
            </span>
          </div>
        </div>

        <Badge variant={activeView === 'arcade' ? 'violet' : 'cyan'} size="xs" className="hidden sm:inline-flex">
          {activeView === 'arcade' ? 'CYBER DRIFT' : 'v1.0-PREVIEW'}
        </Badge>
      </div>

      <div className="hidden md:flex items-center gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 bg-technovix-surface/70 px-3 py-1 rounded-full border border-white/5">
          <Database className="w-3.5 h-3.5 text-neon-cyan" />
          <span>
            {activeView === 'arcade'
              ? 'Flagship 2.5D Cyberpunk Arcade Racer • 60 FPS'
              : 'PostgreSQL & Supabase Real-Time Architecture Prepared'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="demo" size="xs">
          <Sparkles className="w-3 h-3 text-neon-cyan" />
          UI PREVIEW MODE
        </Badge>

        <button
          onClick={() => setIsProfileOpen(true)}
          title="Open Profile Settings"
          className="p-1.5 rounded-lg text-slate-400 hover:text-neon-cyan hover:bg-white/5 transition-colors"
        >
          <User className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveScreen('welcome')}
          title="Return to Welcome / Sign-in"
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
