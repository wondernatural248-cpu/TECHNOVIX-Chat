import React from 'react';
import { Cpu, Lock, MessageSquare, Sparkles, Terminal } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';

export const EmptyChatState: React.FC = () => {
  const { conversations, setActiveConversationId } = useApp();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-technovix-void relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute w-80 h-80 bg-neon-cyan/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute w-80 h-80 bg-neon-violet/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Futuristic Center Card */}
      <div className="relative z-10 max-w-md w-full glass-panel rounded-3xl p-8 border border-white/10 shadow-glass">
        {/* Hologram icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-neon-violet via-purple-600 to-neon-cyan p-[2px] shadow-glow-cyan-sm mb-4">
          <div className="w-full h-full bg-technovix-panel rounded-[14px] flex items-center justify-center">
            <Terminal className="w-8 h-8 text-neon-cyan animate-pulse-subtle" />
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-1">
          TECHNOVIX Quantum Terminal
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Select a channel or direct identity from the sidebar to establish a secure encrypted stream.
        </p>

        <div className="flex items-center justify-center gap-2 mb-6">
          <Badge variant="cyan" size="xs">
            <Lock className="w-3 h-3" /> E2E Ready
          </Badge>
          <Badge variant="violet" size="xs">
            <Cpu className="w-3 h-3" /> Sub-15ms Edge
          </Badge>
          <Badge variant="demo" size="xs">
            <Sparkles className="w-3 h-3" /> UI Preview
          </Badge>
        </div>

        {/* Suggested chats to open */}
        <div className="space-y-2 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block px-1">
            Quick Launch Channels
          </span>
          {conversations.slice(0, 3).map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveConversationId(conv.id)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-technovix-surface/60 hover:bg-technovix-card border border-white/5 hover:border-neon-cyan/30 text-xs text-slate-200 hover:text-white transition-all group"
            >
              <div className="flex items-center gap-2 truncate">
                <MessageSquare className="w-3.5 h-3.5 text-neon-cyan group-hover:scale-110 transition-transform" />
                <span className="truncate">{conv.title}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Open →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
