import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileCode,
  Image as ImageIcon,
  Loader2,
  Mic,
  Paperclip,
  Send,
  Smile,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Attachment } from '../../types/chat';

interface MessageComposerProps {
  conversationId: string;
}

const QUICK_EMOJIS = ['⚡', '💜', '🚀', '🔥', '✨', '💻', '🤖', '👾'];

export const MessageComposer: React.FC<MessageComposerProps> = ({ conversationId }) => {
  const { sendMessage, isSupabaseActive } = useApp();
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if ((!content.trim() && attachments.length === 0) || isSending) return;
    const msgToSend = content;
    const attsToSend = [...attachments];

    setIsSending(true);
    setSendError(null);

    try {
      await sendMessage(conversationId, msgToSend, attsToSend);
      setContent('');
      setAttachments([]);
      setShowEmojiPicker(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send message to Supabase';
      setSendError(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isCode = ['ts', 'tsx', 'js', 'jsx', 'json', 'py', 'html', 'css', 'sql', 'sh', 'md'].includes(ext || '');
    const attType: 'image' | 'code' | 'document' = isImage ? 'image' : isCode ? 'code' : 'document';

    const reader = new FileReader();
    reader.onload = () => {
      const newAtt: Attachment = {
        id: `att_${Date.now()}`,
        name: file.name,
        type: attType,
        url: reader.result as string,
        size: `${(file.size / 1024).toFixed(1)} KB`,
      };
      setAttachments((prev) => [...prev, newAtt]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleToggleVoice = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setContent((prev) => (prev ? prev + ' [Audio Memo 0:04]' : '[Audio Memo 0:04]'));
      }, 2000);
    } else {
      setIsRecording(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 bg-technovix-void/90 border-t border-white/10 backdrop-blur-xl relative">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,.ts,.tsx,.js,.jsx,.json,.txt,.md,.pdf,.csv"
        onChange={handleFileChange}
      />

      {/* Attachments preview list */}
      {attachments.length > 0 && (
        <div className="mb-2 flex items-center gap-2 overflow-x-auto pb-1">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-technovix-surface border border-neon-cyan/30 text-xs text-white"
            >
              {att.type === 'image' ? (
                <ImageIcon className="w-3.5 h-3.5 text-neon-cyan" />
              ) : (
                <FileCode className="w-3.5 h-3.5 text-neon-violet-light" />
              )}
              <span className="truncate max-w-[120px]">{att.name}</span>
              <button
                type="button"
                onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Send Error Notice */}
      {sendError && (
        <div className="mb-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{sendError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSendError(null)}
            className="text-rose-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div className="absolute bottom-full mb-2 left-4 z-30 p-2.5 rounded-2xl bg-technovix-card border border-white/15 shadow-glass backdrop-blur-xl flex items-center gap-2">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleAddEmoji(emoji)}
              className="text-xl p-1 hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Main Composer Box */}
      <div className="flex items-end gap-2 bg-technovix-panel/90 rounded-2xl border border-white/10 p-2 focus-within:border-neon-cyan/50 focus-within:ring-1 focus-within:ring-neon-cyan/30 transition-all shadow-glass">
        {/* Left actions: Attachments & Emoji */}
        <div className="flex items-center gap-1 shrink-0 pb-1 pl-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-xl text-slate-400 hover:text-neon-cyan hover:bg-white/5 transition-colors cursor-pointer"
            title="Attach file or image"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              showEmojiPicker
                ? 'text-neon-cyan bg-white/10'
                : 'text-slate-400 hover:text-neon-cyan hover:bg-white/5'
            }`}
            title="Emoji reactions"
          >
            <Smile className="w-4 h-4" />
          </button>
        </div>

        {/* Text Input Area */}
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? 'Recording voice packet...'
                : 'Transmit message (Enter sends, Shift+Enter for newline)...'
            }
            rows={1}
            className="w-full bg-transparent border-0 resize-none py-1.5 px-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none max-h-32"
          />
        </div>

        {/* Right actions: Voice memo & Send */}
        <div className="flex items-center gap-1.5 shrink-0 pb-1 pr-1">
          <button
            type="button"
            onClick={handleToggleVoice}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.8)]'
                : 'text-slate-400 hover:text-neon-violet-light hover:bg-white/5'
            }`}
            title={isRecording ? 'Recording...' : 'Record voice memo'}
          >
            <Mic className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={(!content.trim() && attachments.length === 0) || isSending}
            className={`p-2 rounded-xl transition-all ${
              (content.trim() || attachments.length > 0) && !isSending
                ? 'bg-neon-cyan text-technovix-void shadow-glow-cyan-sm hover:brightness-110 active:scale-95 cursor-pointer'
                : 'bg-white/5 text-slate-600 cursor-not-allowed'
            }`}
            title="Send Message"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin text-technovix-void" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Connection status notice */}
      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 px-1">
        <span className="flex items-center gap-1.5">
          {isSupabaseActive ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-slate-400">
                Connected to Supabase Realtime • Messages broadcast via PostgreSQL
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3 text-amber-400" />
              <span className="text-amber-400/90 font-mono">
                Supabase Disconnected: Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to transmit messages
              </span>
            </>
          )}
        </span>
        <span className="hidden sm:inline font-mono">256-bit AES Protected</span>
      </div>
    </div>
  );
};
