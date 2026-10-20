import React, { useState } from 'react';
import { Check, CheckCheck, Smile } from 'lucide-react';
import { Message } from '../../types/chat';
import { Avatar } from '../common/Avatar';

interface MessageBubbleProps {
  message: Message;
  showSenderInfo?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  showSenderInfo = false,
}) => {
  const [localReactions, setLocalReactions] = useState(message.reactions || []);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const handleAddReaction = (emoji: string) => {
    setLocalReactions((prev) => {
      const existing = prev.find((r) => r.emoji === emoji);
      if (existing) {
        return prev.map((r) =>
          r.emoji === emoji ? { ...r, count: r.count + 1 } : r
        );
      }
      return [...prev, { emoji, count: 1, users: ['me'] }];
    });
    setShowReactionPicker(false);
  };

  return (
    <div
      className={`group relative flex gap-2.5 my-2.5 transition-all ${
        message.isOutgoing ? 'flex-row-reverse self-end' : 'flex-row self-start'
      } max-w-[85%] sm:max-w-[75%]`}
    >
      {/* Avatar for incoming message */}
      {!message.isOutgoing && (
        <Avatar
          src={message.senderAvatar}
          name={message.senderName}
          size="sm"
          className="mt-0.5"
        />
      )}

      {/* Bubble container */}
      <div className="relative">
        {/* Sender name for group chats */}
        {!message.isOutgoing && showSenderInfo && (
          <div className="text-[11px] font-semibold text-neon-cyan mb-1 ml-1">
            {message.senderName}
          </div>
        )}

        {/* Message Card */}
        <div
          className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed transition-all ${
            message.isOutgoing
              ? 'bg-gradient-to-br from-neon-violet to-purple-700 text-white rounded-br-sm shadow-glow-violet-sm'
              : 'bg-technovix-card/90 text-slate-100 rounded-bl-sm border border-white/10 shadow-glass'
          }`}
        >
          {/* Text Content */}
          <p className="break-words select-text">{message.content}</p>

          {/* Attachments if any */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="rounded-xl overflow-hidden border border-white/10 bg-technovix-void/50 p-2 text-xs flex items-center gap-2"
                >
                  {att.type === 'image' && (
                    <img
                      src={att.url}
                      alt={att.name}
                      className="w-10 h-10 object-cover rounded-lg"
                    />
                  )}
                  <div className="truncate">
                    <span className="font-medium text-white block truncate">{att.name}</span>
                    <span className="text-[10px] text-slate-400">{att.size || 'Attachment'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Timestamp and delivery status */}
          <div
            className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
              message.isOutgoing ? 'text-purple-200/80' : 'text-slate-400'
            }`}
          >
            <span>{message.timestamp}</span>
            {message.isOutgoing && (
              <span className="text-neon-cyan inline-flex items-center">
                {message.status === 'read' ? (
                  <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : message.status === 'delivered' ? (
                  <CheckCheck className="w-3.5 h-3.5 text-slate-300 stroke-[2]" />
                ) : (
                  <Check className="w-3.5 h-3.5 stroke-[2]" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Reaction badges pill below bubble */}
        {localReactions.length > 0 && (
          <div
            className={`flex items-center gap-1 mt-1 flex-wrap ${
              message.isOutgoing ? 'justify-end' : 'justify-start'
            }`}
          >
            {localReactions.map((rec) => (
              <button
                key={rec.emoji}
                onClick={() => handleAddReaction(rec.emoji)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-technovix-surface/90 border border-white/10 text-xs hover:border-neon-cyan/40 transition-colors shadow-sm"
              >
                <span>{rec.emoji}</span>
                <span className="text-[10px] font-medium text-slate-300">{rec.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Quick reaction trigger hover popup */}
        <div
          className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity ${
            message.isOutgoing ? '-left-12' : '-right-12'
          }`}
        >
          <div className="relative">
            <button
              onClick={() => setShowReactionPicker((p) => !p)}
              className="p-1 rounded-full bg-technovix-surface border border-white/10 text-slate-400 hover:text-neon-cyan shadow-md transition-colors"
              title="Add reaction"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>

            {/* Emoji picker balloon */}
            {showReactionPicker && (
              <div
                className={`absolute bottom-full mb-1 z-30 flex items-center gap-1 p-1 bg-technovix-panel border border-white/15 rounded-xl shadow-glass backdrop-blur-xl ${
                  message.isOutgoing ? 'right-0' : 'left-0'
                }`}
              >
                {['⚡', '💜', '🔥', '🚀', '👍'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleAddReaction(emoji)}
                    className="p-1 text-sm hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
