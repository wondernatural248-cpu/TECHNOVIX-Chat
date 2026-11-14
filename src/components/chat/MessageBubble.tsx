import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Ban,
  Check,
  CheckCheck,
  Loader2,
  Pencil,
  Smile,
  Trash2,
  X,
} from 'lucide-react';
import { Message } from '../../types/chat';
import { Avatar } from '../common/Avatar';
import { useApp } from '../../context/AppContext';

interface MessageBubbleProps {
  message: Message;
  showSenderInfo?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  showSenderInfo = false,
}) => {
  const { editMessage, deleteMessage } = useApp();
  const [localReactions, setLocalReactions] = useState(message.reactions || []);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(message.content);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isDeleted = Boolean(message.deletedAt || message.content === 'This message was deleted');

  useEffect(() => {
    setEditDraft(message.content);
  }, [message.content]);

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

  const handleSaveEdit = async () => {
    const trimmed = editDraft.trim();
    if (!trimmed || trimmed === message.content) {
      setIsEditing(false);
      setEditError(null);
      return;
    }

    setIsSaving(true);
    setEditError(null);
    try {
      await editMessage(message.id, trimmed);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to edit message:', err);
      setEditError(err.message || 'Failed to save edit.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMessage(message.id);
      setShowDeleteConfirm(false);
    } catch (err: any) {
      console.error('Failed to delete message:', err);
      alert(err.message || 'Failed to delete message.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
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
        <div className="relative max-w-full">
          {/* Sender name for group chats */}
          {!message.isOutgoing && showSenderInfo && (
            <div className="text-[11px] font-semibold text-neon-cyan mb-1 ml-1">
              {message.senderName}
            </div>
          )}

          {/* Message Card */}
          <div
            className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed transition-all ${
              isDeleted
                ? message.isOutgoing
                  ? 'bg-technovix-void/70 text-slate-400 border border-white/5 rounded-br-sm italic'
                  : 'bg-technovix-surface/40 text-slate-400 border border-white/5 rounded-bl-sm italic'
                : message.isOutgoing
                ? 'bg-gradient-to-br from-neon-violet to-purple-700 text-white rounded-br-sm shadow-glow-violet-sm'
                : 'bg-technovix-card/90 text-slate-100 rounded-bl-sm border border-white/10 shadow-glass'
            }`}
          >
            {/* Deleted state */}
            {isDeleted ? (
              <div className="flex items-center gap-2 py-0.5">
                <Ban className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-xs text-slate-400 select-none">This message was deleted</span>
              </div>
            ) : isEditing ? (
              /* Inline Editing Form */
              <div className="space-y-2 min-w-[220px] sm:min-w-[280px]">
                <textarea
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveEdit();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      setIsEditing(false);
                      setEditDraft(message.content);
                      setEditError(null);
                    }
                  }}
                  rows={Math.min(4, Math.max(1, editDraft.split('\n').length))}
                  className="w-full bg-black/40 text-white text-sm rounded-xl p-2.5 border border-neon-cyan/50 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan/50 resize-none font-sans"
                  autoFocus
                  placeholder="Edit message..."
                />
                {editError && (
                  <p className="text-[11px] text-rose-300 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {editError}
                  </p>
                )}
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-purple-200/60 text-[10px] hidden sm:inline">
                    Esc: cancel • Enter: save
                  </span>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditDraft(message.content);
                        setEditError(null);
                      }}
                      disabled={isSaving}
                      className="px-2 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1 text-xs"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={isSaving || !editDraft.trim() || editDraft.trim() === message.content}
                      className="px-2.5 py-1 rounded-lg bg-neon-cyan text-technovix-void font-bold hover:shadow-[0_0_12px_#06b6d4] transition-all disabled:opacity-50 flex items-center gap-1 text-xs"
                    >
                      {isSaving ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      )}
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Normal Text Content */
              <p className="break-words select-text whitespace-pre-wrap">{message.content}</p>
            )}

            {/* Attachments if any (hidden if deleted) */}
            {!isDeleted && !isEditing && message.attachments && message.attachments.length > 0 && (
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

            {/* Timestamp, edited label, and delivery status */}
            {!isEditing && (
              <div
                className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] ${
                  message.isOutgoing ? 'text-purple-200/80' : 'text-slate-400'
                }`}
              >
                {message.isEdited && !isDeleted && (
                  <span className="text-[9px] opacity-75 italic">(edited)</span>
                )}
                <span>{message.timestamp}</span>
                {message.isOutgoing && !isDeleted && (
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
            )}
          </div>

          {/* Reaction badges pill below bubble */}
          {!isDeleted && localReactions.length > 0 && (
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

          {/* Quick action toolbar on hover */}
          {!isDeleted && !isEditing && (
            <div
              className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-20 ${
                message.isOutgoing ? '-left-24' : '-right-12'
              }`}
            >
              {/* Emoji reaction button */}
              <div className="relative">
                <button
                  onClick={() => setShowReactionPicker((p) => !p)}
                  className="p-1.5 rounded-full bg-technovix-surface border border-white/10 text-slate-400 hover:text-neon-cyan hover:border-neon-cyan/40 shadow-md transition-colors"
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

              {/* Edit & Delete for Outgoing messages */}
              {message.isOutgoing && (
                <>
                  <button
                    onClick={() => {
                      setEditDraft(message.content);
                      setIsEditing(true);
                      setShowDeleteConfirm(false);
                      setShowReactionPicker(false);
                    }}
                    className="p-1.5 rounded-full bg-technovix-surface border border-white/10 text-slate-400 hover:text-neon-cyan hover:border-neon-cyan/40 shadow-md transition-colors"
                    title="Edit message"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      setShowReactionPicker(false);
                    }}
                    className="p-1.5 rounded-full bg-technovix-surface border border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-400/40 shadow-md transition-colors"
                    title="Delete message"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-technovix-card border border-rose-500/30 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Delete Message?</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  This message will be deleted for everyone in this conversation.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500 hover:text-white transition-all flex items-center gap-1.5"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Delete for everyone</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
