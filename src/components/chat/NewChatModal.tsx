import React, { useEffect, useState } from 'react';
import { AtSign, Loader2, MessageSquare, Search, Shield, UserPlus, X, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserProfile } from '../../types/chat';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const { searchUsers, startDirectChat, isSupabaseActive } = useApp();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [startingChatWith, setStartingChatWith] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setUsers([]);
      setErrorMsg(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setErrorMsg(null);

    const timer = setTimeout(async () => {
      try {
        const results = await searchUsers(query);
        if (isMounted) {
          setUsers(results);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setIsLoading(false);
          const message = err instanceof Error ? err.message : 'Failed to search users';
          setErrorMsg(message);
        }
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, query, searchUsers]);

  if (!isOpen) return null;

  const handleStartChat = async (user: UserProfile) => {
    setStartingChatWith(user.id);
    setErrorMsg(null);
    try {
      await startDirectChat(user.id);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not initialize direct chat channel';
      setErrorMsg(message);
    } finally {
      setStartingChatWith(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      {/* Modal Card */}
      <div className="w-full max-w-lg bg-technovix-panel border border-white/15 rounded-3xl shadow-glow-violet overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-technovix-void/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan shadow-glow-cyan-sm">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Start Encrypted Chat
                {isSupabaseActive ? (
                  <Badge variant="cyan" size="xs">
                    Live Supabase
                  </Badge>
                ) : (
                  <Badge variant="violet" size="xs">
                    Supabase Offline
                  </Badge>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Discover registered users on the TECHNOVIX neural network
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-white/5 bg-technovix-surface/30">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-neon-cyan absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by full name or @handle..."
              autoFocus
              className="w-full rounded-2xl bg-technovix-void/80 border border-white/15 pl-10 pr-9 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/40 transition-all font-mono text-xs"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Error notice if any */}
        {errorMsg && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
            <Shield className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* User Search Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[220px]">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-neon-cyan animate-spin mb-3" />
              <p className="text-xs text-slate-400">Scanning cryptographic registry...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <AtSign className="w-8 h-8 text-slate-600 mx-auto opacity-50" />
              <p className="text-xs text-slate-300 font-medium">
                {query ? `No users matching "${query}"` : 'No other registered users found'}
              </p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                {isSupabaseActive
                  ? 'Open another browser session or incognito window, create a second account, and it will appear here instantly!'
                  : 'Configure your Supabase credentials in .env.local to enable live database user search across sessions.'}
              </p>
            </div>
          ) : (
            users.map((user) => {
              const isStarting = startingChatWith === user.id;
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-technovix-void/50 border border-white/5 hover:border-neon-cyan/40 hover:bg-technovix-surface/40 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      src={user.avatar}
                      name={user.displayName}
                      size="md"
                      status={user.status}
                      showStatus
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white group-hover:text-neon-cyan transition-colors truncate">
                          {user.displayName}
                        </span>
                        {user.isVerified && (
                          <span title="Verified identity" className="text-neon-cyan text-xs">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-mono truncate">@{user.username}</p>
                      {user.bio && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{user.bio}</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartChat(user)}
                    disabled={isStarting}
                    className="ml-3 shrink-0 px-3.5 py-1.5 rounded-xl bg-neon-cyan/15 hover:bg-neon-cyan text-neon-cyan hover:text-technovix-void border border-neon-cyan/40 text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    {isStarting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Opening...</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-technovix-void/90 border-t border-white/5 text-[11px] text-slate-500 flex items-center justify-between px-5">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-neon-cyan" />
            1-on-1 direct messages are stored in PostgreSQL with Row Level Security.
          </span>
          <span className="font-mono text-[10px]">End-to-End Isolated</span>
        </div>
      </div>
    </div>
  );
};
