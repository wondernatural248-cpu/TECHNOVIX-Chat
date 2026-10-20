import React from 'react';
import { Pin, Users } from 'lucide-react';
import { Conversation } from '../../types/chat';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
      className={`group relative flex items-center gap-3 px-3.5 py-3 rounded-2xl cursor-pointer transition-all duration-200 select-none ${
        isActive
          ? 'bg-gradient-to-r from-neon-violet/20 via-technovix-card to-technovix-card border border-neon-cyan/40 shadow-glow-cyan-sm'
          : 'hover:bg-technovix-surface/60 border border-transparent hover:border-white/5'
      }`}
    >
      {/* Active accent pill */}
      {isActive && (
        <span className="absolute left-0 top-3 bottom-3 w-1 bg-neon-cyan rounded-r-full shadow-[0_0_8px_#00f0ff]" />
      )}

      {/* Avatar with status indicator */}
      <div className="relative shrink-0">
        <Avatar
          src={conversation.avatar}
          name={conversation.title}
          size="md"
          status={conversation.isOnline ? 'online' : undefined}
          showStatus={conversation.type === 'direct'}
        />
        {conversation.type !== 'direct' && (
          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-technovix-panel border border-white/20 rounded-full flex items-center justify-center text-[9px] text-neon-cyan">
            <Users className="w-2.5 h-2.5" />
          </span>
        )}
      </div>

      {/* Conversation Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-1">
          <span
            className={`text-sm font-semibold truncate ${
              isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'
            }`}
          >
            {conversation.title}
          </span>
          <span className="text-[11px] text-slate-400 shrink-0 font-mono">
            {conversation.lastMessageTime}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p
            className={`text-xs truncate ${
              conversation.isTyping
                ? 'text-neon-cyan italic font-medium'
                : conversation.unreadCount > 0
                ? 'text-slate-200 font-medium'
                : 'text-slate-400'
            }`}
          >
            {conversation.isTyping ? 'typing...' : conversation.lastMessage}
          </p>

          <div className="flex items-center gap-1.5 shrink-0">
            {conversation.pinned && (
              <Pin className="w-3 h-3 text-slate-500 fill-slate-500 rotate-45" />
            )}
            {conversation.unreadCount > 0 && (
              <Badge variant="cyan" size="xs" className="font-bold px-1.5 py-0.5">
                {conversation.unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
