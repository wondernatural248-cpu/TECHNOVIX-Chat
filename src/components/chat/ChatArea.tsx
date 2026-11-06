import React, { useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Info,
  Loader2,
  Lock,
  MoreVertical,
  Phone,
  Shield,
  Video,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { EmptyChatState } from './EmptyChatState';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';

export const ChatArea: React.FC = () => {
  const {
    activeConversationId,
    conversations,
    messages,
    setMobileShowChat,
    setIsProfileOpen,
    isSupabaseActive,
    isMessagesLoading,
  } = useApp();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const currentMessages = activeConversationId ? messages[activeConversationId] || [] : [];

  // Auto scroll to bottom when messages change or conversation changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [currentMessages, activeConversationId]);

  if (!activeConversation) {
    return <EmptyChatState />;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-technovix-bg relative overflow-hidden">
      {/* Active Conversation Top Bar */}
      <div className="h-16 px-4 border-b border-white/10 bg-technovix-void/75 backdrop-blur-xl flex items-center justify-between shrink-0 select-none z-10">
        <div className="flex items-center gap-3">
          {/* Mobile Back Button */}
          <button
            onClick={() => setMobileShowChat(false)}
            className="md:hidden p-1.5 -ml-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
            title="Back to conversation list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Contact / Channel Avatar */}
          <Avatar
            src={activeConversation.avatar}
            name={activeConversation.title}
            size="md"
            status={activeConversation.isOnline ? 'online' : undefined}
            showStatus={activeConversation.type === 'direct'}
          />

          {/* Title and details */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight truncate max-w-[160px] sm:max-w-xs">
                {activeConversation.title}
              </h3>
              {activeConversation.type !== 'direct' ? (
                <Badge variant="violet" size="xs">
                  {activeConversation.memberCount || 2} members
                </Badge>
              ) : (
                <Badge variant="cyan" size="xs">
                  Direct
                </Badge>
              )}
            </div>

            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              {activeConversation.isOnline ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                  <span className="text-emerald-400 font-medium">Online on mesh</span>
                </>
              ) : activeConversation.statusText ? (
                <span>{activeConversation.statusText}</span>
              ) : (
                <span>Active recently</span>
              )}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => alert('Encrypted Voice Call connecting (Feature preview)')}
            className="p-2 rounded-xl text-slate-400 hover:text-neon-cyan hover:bg-white/5 transition-colors"
            title="Start voice call"
          >
            <Phone className="w-4 h-4" />
          </button>

          <button
            onClick={() => alert('Encrypted Video Link initializing (Feature preview)')}
            className="p-2 rounded-xl text-slate-400 hover:text-neon-cyan hover:bg-white/5 transition-colors"
            title="Start video conference"
          >
            <Video className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsProfileOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors hidden sm:inline-flex"
            title="Channel & User Profile info"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            onClick={() => alert('Channel encryption details')}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="More actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Security notice banner */}
      <div className="px-4 py-1.5 bg-technovix-void/40 border-b border-white/5 text-[11px] text-slate-400 flex items-center justify-center gap-2 select-none">
        <Lock className="w-3 h-3 text-neon-cyan" />
        <span>End-to-End Encrypted Session</span>
        <span className="text-slate-600">•</span>
        {isSupabaseActive ? (
          <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Supabase Realtime Live
          </span>
        ) : (
          <span className="text-amber-400 font-mono text-[10px] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Supabase Disconnected
          </span>
        )}
      </div>

      {/* Message Feed Stream */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 flex flex-col"
      >
        {/* Date separator pill */}
        <div className="flex items-center justify-center my-3">
          <span className="px-3 py-1 rounded-full bg-technovix-surface/80 border border-white/5 text-[10px] font-mono text-slate-400 select-none shadow-sm flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-neon-cyan" />
            Encrypted Channel Active
          </span>
        </div>

        {isMessagesLoading && currentMessages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <Loader2 className="w-8 h-8 text-neon-cyan animate-spin mb-3" />
            <p className="text-xs text-slate-400">Decrypting messages from PostgreSQL...</p>
          </div>
        ) : currentMessages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <Shield className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
            <p className="text-xs text-slate-400">No messages in this encrypted channel yet.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Be the first to transmit a message below!
            </p>
          </div>
        ) : (
          currentMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              showSenderInfo={activeConversation.type !== 'direct'}
            />
          ))
        )}
      </div>

      {/* Message Composer */}
      <MessageComposer conversationId={activeConversation.id} />
    </div>
  );
};
