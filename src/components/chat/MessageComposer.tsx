import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  Code,
  FileCode,
  Image as ImageIcon,
  Mic,
  Paperclip,
  Send,
  Smile,
  X,
  Zap,
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!content.trim() && attachments.length === 0) return;
    const msgToSend = content;
    const attsToSend = attachments;

    setContent('');
    setAttachments([]);
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await sendMessage(conversationId, msgToSend, attsToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAttachDemoFile = (type: 'image' | 'code') => {
    if (type === 'image') {
      const mockImg: Attachment = {
        id: `att_${Date.now()}`,
        name: 'neural-topology-render.png',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80',
        size: '1.4 MB',
      };
      setAttachments((prev) => [...prev, mockImg]);
    } else {
      const mockCode: Attachment = {
        id: `att_${Date.now()}`,
        name: 'schema-validation.ts',
        type: 'code',
        url: '#',
        size: '4.2 KB',
      };
      setAttachments((prev) => [...prev, mockCode]);
    }
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
                onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div className="absolute bottom-full mb-2 left-4 z-30 p-2.5 rounded-2xl bg-technovix-card border border-white/15 shadow-glass backdrop-blur-xl flex items-center gap-2">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
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
          <div className="relative group">
            <button
              type="button"
              className="p-1.5 rounded-xl text-slate-400 hover:text-neon-cyan hover:bg-white/5 transition-colors cursor-pointer"
              title="Attach media or code file"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Attach dropdown mock */}
            <div className="absolute bottom-full mb-1 left-0 hidden group-hover:flex flex-col gap-1 p-1 bg-technovix-panel border border-white/15 rounded-xl shadow-glass z-20 min-w-[140px]">
              <button
                type="button"
                onClick={() => handleAttachDemoFile('image')}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5"
              >
                <ImageIcon className="w-3.5 h-3.5 text-neon-cyan" /> Attach Image
              </button>
              <button
                type="button"
                onClick={() => handleAttachDemoFile('code')}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5"
              >
                <Code className="w-3.5 h-3.5 text-neon-violet-light" /> Share Code File
              </button>
            </div>
          </div>

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
              // auto resize
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
            title={isRecording ? 'Recording...' : 'Record voice memo (mock)'}
          >
            <Mic className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={!content.trim() && attachments.length === 0}
            className={`p-2 rounded-xl transition-all ${
              content.trim() || attachments.length > 0
                ? 'bg-neon-cyan text-technovix-void shadow-glow-cyan-sm hover:brightness-110 active:scale-95 cursor-pointer'
                : 'bg-white/5 text-slate-600 cursor-not-allowed'
            }`}
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Connection status sub-notice */}
      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 px-1">
        <span className="flex items-center gap-1">
          {isSupabaseActive ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-slate-400">
                Connected to Supabase Realtime • Messages broadcast instantaneously
              </span>
            </>
          ) : (
            <>
              <Zap className="w-3 h-3 text-neon-cyan" />
              <span>Interactive Demo: Sent messages update conversation preview in-memory</span>
            </>
          )}
        </span>
        <span className="hidden sm:inline font-mono">256-bit AES Protected</span>
      </div>
    </div>
  );
};
