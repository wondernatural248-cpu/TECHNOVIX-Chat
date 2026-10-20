import React from 'react';
import { Gamepad2, MessageSquare, Radio, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MobileNav: React.FC = () => {
  const {
    activeView,
    setActiveView,
    activeFilter,
    setActiveFilter,
    setIsProfileOpen,
    setActiveStoryId,
    stories,
    conversations,
    setMobileShowChat,
  } = useApp();

  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);
  const unreadStories = stories.filter((s) => s.hasUnread).length;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-technovix-void/95 border-t border-white/10 px-4 py-2 backdrop-blur-xl flex items-center justify-around select-none"
      aria-label="Mobile Navigation"
    >
      <button
        onClick={() => {
          setActiveView('chat');
          setActiveFilter('all');
          setMobileShowChat(false);
        }}
        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors relative ${
          activeView === 'chat' && (activeFilter === 'all' || activeFilter === 'direct')
            ? 'text-neon-cyan'
            : 'text-slate-400'
        }`}
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-[10px] font-medium">Chats</span>
        {totalUnread > 0 && (
          <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-neon-cyan shadow-[0_0_6px_#00f0ff]" />
        )}
      </button>

      <button
        onClick={() => {
          if (stories.length > 0) {
            setActiveStoryId(stories[0].id);
          }
        }}
        className="flex flex-col items-center gap-1 p-2 rounded-xl text-slate-400 hover:text-neon-violet-light transition-colors relative"
      >
        <Radio className="w-5 h-5 text-neon-violet-light" />
        <span className="text-[10px] font-medium">Stories</span>
        {unreadStories > 0 && (
          <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-neon-violet shadow-[0_0_6px_#a855f7]" />
        )}
      </button>

      {/* TECHNOVIX ARCADE — CYBER DRIFT */}
      <button
        onClick={() => {
          setActiveView('arcade');
          setMobileShowChat(false);
        }}
        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors relative ${
          activeView === 'arcade' ? 'text-neon-cyan' : 'text-slate-400'
        }`}
      >
        <Gamepad2 className="w-5 h-5" />
        <span className="text-[10px] font-medium">Arcade</span>
        <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
      </button>

      <button
        onClick={() => setIsProfileOpen(true)}
        className="flex flex-col items-center gap-1 p-2 rounded-xl text-slate-400 hover:text-white transition-colors"
      >
        <User className="w-5 h-5" />
        <span className="text-[10px] font-medium">Profile</span>
      </button>
    </nav>
  );
};
