import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Send, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';

export const StoryViewerModal: React.FC = () => {
  const { activeStoryId, setActiveStoryId, stories, markStoryAsRead } = useApp();
  const [itemIndex, setItemIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');

  const currentStoryIndex = stories.findIndex((s) => s.id === activeStoryId);
  const currentStory = currentStoryIndex !== -1 ? stories[currentStoryIndex] : null;

  useEffect(() => {
    if (!currentStory) return;
    markStoryAsRead(currentStory.id);
    setItemIndex(0);
    setProgress(0);
  }, [activeStoryId]);

  // Timer loop for auto-progressing story
  useEffect(() => {
    if (!currentStory || isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Advance to next item or next story
          if (itemIndex < currentStory.items.length - 1) {
            setItemIndex((i) => i + 1);
            return 0;
          } else {
            // Next story if available, else close
            if (currentStoryIndex < stories.length - 1) {
              setActiveStoryId(stories[currentStoryIndex + 1].id);
              setItemIndex(0);
              return 0;
            } else {
              setActiveStoryId(null);
              return 100;
            }
          }
        }
        return prev + 2; // ~2.5s duration per item
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentStory, isPaused, itemIndex, currentStoryIndex, stories]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveStoryId(null);
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === ' ') {
        setIsPaused((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [itemIndex, currentStoryIndex]);

  if (!currentStory) return null;

  const currentItem = currentStory.items[itemIndex] || currentStory.items[0];

  const handleNext = () => {
    setProgress(0);
    if (itemIndex < currentStory.items.length - 1) {
      setItemIndex((i) => i + 1);
    } else if (currentStoryIndex < stories.length - 1) {
      setActiveStoryId(stories[currentStoryIndex + 1].id);
      setItemIndex(0);
    } else {
      setActiveStoryId(null);
    }
  };

  const handlePrev = () => {
    setProgress(0);
    if (itemIndex > 0) {
      setItemIndex((i) => i - 1);
    } else if (currentStoryIndex > 0) {
      setActiveStoryId(stories[currentStoryIndex - 1].id);
      setItemIndex(0);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    alert(`Story reply sent: "${replyText}"`);
    setReplyText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-2 sm:p-4 select-none">
      {/* Container simulating mobile story aspect ratio */}
      <div className="relative w-full max-w-md h-[92vh] max-h-[780px] bg-technovix-void rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col justify-between">
        {/* Story background media */}
        <div className="absolute inset-0 z-0">
          <img
            src={currentItem.mediaUrl}
            alt={currentItem.caption || 'Story media'}
            className="w-full h-full object-cover brightness-[0.85]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />
        </div>

        {/* Top bar with progress bars & user header */}
        <div className="relative z-10 p-4 space-y-3">
          {/* Progress Bars */}
          <div className="flex items-center gap-1.5 w-full">
            {currentStory.items.map((_, idx) => (
              <div
                key={idx}
                className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden backdrop-blur"
              >
                <div
                  className="h-full bg-gradient-to-r from-neon-cyan to-neon-violet transition-all duration-75"
                  style={{
                    width:
                      idx < itemIndex
                        ? '100%'
                        : idx === itemIndex
                        ? `${progress}%`
                        : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* User Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Avatar
                src={currentStory.userAvatar}
                name={currentStory.userName}
                size="sm"
                className="ring-2 ring-neon-cyan/70"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-white drop-shadow">
                    {currentStory.userName}
                  </span>
                  <Badge variant="cyan" size="xs">
                    {currentItem.timestamp}
                  </Badge>
                </div>
                <span className="text-xs text-slate-300">@{currentStory.userHandle}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPaused((p) => !p)}
                className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur transition-colors"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setActiveStoryId(null)}
                className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur transition-colors"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Click zones for navigation */}
        <button
          onClick={handlePrev}
          className="absolute left-0 top-20 bottom-24 w-1/3 z-10 cursor-pointer opacity-0 hover:opacity-100 flex items-center justify-start p-2 transition-opacity"
          aria-label="Previous story"
        >
          <span className="p-2 rounded-full bg-black/50 text-white backdrop-blur">
            <ChevronLeft className="w-5 h-5" />
          </span>
        </button>

        <button
          onClick={handleNext}
          className="absolute right-0 top-20 bottom-24 w-1/3 z-10 cursor-pointer opacity-0 hover:opacity-100 flex items-center justify-end p-2 transition-opacity"
          aria-label="Next story"
        >
          <span className="p-2 rounded-full bg-black/50 text-white backdrop-blur">
            <ChevronRight className="w-5 h-5" />
          </span>
        </button>

        {/* Bottom Area: Caption & Reply Composer */}
        <div className="relative z-10 p-4 space-y-3">
          {currentItem.caption && (
            <div className="bg-black/60 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-sm text-slate-100 shadow-lg">
              {currentItem.caption}
            </div>
          )}

          {/* Quick Reaction Pills */}
          <div className="flex items-center gap-2">
            {['⚡', '💜', '🔥', '🚀', '✨'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => alert(`Reacted with ${emoji}`)}
                className="px-2.5 py-1 rounded-full bg-black/50 hover:bg-white/20 backdrop-blur text-sm transition-transform active:scale-90"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Reply Input */}
          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${currentStory.userName.split(' ')[0]}...`}
              className="flex-1 rounded-full bg-black/60 backdrop-blur border border-white/20 px-4 py-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan"
            />
            <button
              type="submit"
              className="p-2.5 rounded-full bg-neon-cyan text-technovix-void hover:brightness-110 active:scale-95 transition-all shadow-glow-cyan-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
