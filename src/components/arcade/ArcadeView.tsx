import React from 'react';
import { ArrowLeft, Flame, Gamepad2, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { CyberDriftGame } from './cyber-drift/CyberDriftGame';

export const ArcadeView: React.FC = () => {
  const { setActiveView } = useApp();

  return (
    <div className="flex-1 flex flex-col h-full bg-technovix-void relative overflow-hidden select-none">
      {/* Arcade Sub-Header */}
      <div className="h-14 px-4 border-b border-white/10 bg-technovix-void/90 backdrop-blur-xl flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('chat')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-technovix-surface/80 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:border-neon-cyan/40 transition-colors group"
            title="Return to Chat Dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-neon-cyan transition-colors" />
            <span>Return to Chat</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-neon-violet to-neon-cyan p-[1.5px] flex items-center justify-center shadow-glow-cyan-sm">
              <div className="w-full h-full bg-technovix-panel rounded-[5px] flex items-center justify-center">
                <Gamepad2 className="w-3.5 h-3.5 text-neon-cyan" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-white text-xs tracking-tight">TECHNOVIX</span>{' '}
              <span className="font-extrabold text-neon-violet-light text-xs">ARCADE</span>
            </div>
          </div>

          <Badge variant="violet" size="xs" className="hidden md:inline-flex">
            <Flame className="w-3 h-3 text-neon-magenta" />
            CYBER DRIFT 3D
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="cyan" size="xs">
            <Sparkles className="w-3 h-3 text-neon-cyan" />
            REAL-TIME THREE.JS 3D
          </Badge>
        </div>
      </div>

      {/* Main Game Stage */}
      <div className="flex-1 relative overflow-hidden">
        <CyberDriftGame onReturnToArcade={() => setActiveView('chat')} />
      </div>
    </div>
  );
};
