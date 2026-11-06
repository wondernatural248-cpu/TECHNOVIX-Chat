import React from 'react';
import {
  Bell,
  Gamepad2,
  MessageSquare,
  Radio,
  Settings,
  ShieldAlert,
  Terminal,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';

export const Sidebar: React.FC = () => {
  const {
    currentUser,
    setIsProfileOpen,
    activeView,
    setActiveView,
    activeFilter,
    setActiveFilter,
    setActiveStoryId,
    stories,
    conversations,
  } = useApp();

  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);
  const unreadStories = stories.filter((s) => s.hasUnread).length;

  return (
    <aside
      className="hidden md:flex flex-col items-center justify-between w-20 py-5 bg-technovix-void/90 border-r border-white/10 shrink-0 z-20 select-none backdrop-blur-xl"
      aria-label="Primary Navigation"
    >
      {/* Brand Icon */}
      <div className="flex flex-col items-center gap-6">
        <button
          onClick={() => setActiveFilter('all')}
          title="TECHNOVIX Chat Home"
          className="group relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-neon-violet to-neon-cyan p-[2px] shadow-glow-cyan-sm transition-transform hover:scale-105 active:scale-95"
        >
          <div className="w-full h-full bg-technovix-panel rounded-[14px] flex items-center justify-center">
            <Terminal className="w-6 h-6 text-neon-cyan group-hover:text-white transition-colors" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-neon-cyan rounded-full border-2 border-technovix-void" />
        </button>

        {/* Navigation Tabs */}
        <nav className="flex flex-col items-center gap-3">
          {/* Chats */}
          <button
            onClick={() => {
              setActiveView('chat');
              setActiveFilter('all');
            }}
            title="All Conversations"
            className={`relative p-3 rounded-xl transition-all duration-200 group ${
              activeView === 'chat' && (activeFilter === 'all' || activeFilter === 'direct')
                ? 'bg-neon-cyan/15 text-neon-cyan shadow-glow-cyan-sm'
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            {totalUnread > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-neon-cyan shadow-[0_0_6px_#00f0ff]" />
            )}
          </button>

          {/* Stories / Status */}
          <button
            onClick={() => {
              if (stories.length > 0) {
                setActiveStoryId(stories[0].id);
              }
            }}
            title="Stories & Ephemeral Statuses"
            className="relative p-3 rounded-xl transition-all duration-200 group text-slate-400 hover:text-slate-100 hover:bg-white/5"
          >
            <Radio className="w-5 h-5 text-neon-violet-light group-hover:text-neon-violet-glow" />
            {unreadStories > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-neon-violet shadow-[0_0_6px_#a855f7]" />
            )}
          </button>

          {/* TECHNOVIX ARCADE — CYBER DRIFT */}
          <button
            onClick={() => setActiveView('arcade')}
            title="TECHNOVIX ARCADE: CYBER DRIFT"
            className={`relative p-3 rounded-xl transition-all duration-200 group ${
              activeView === 'arcade'
                ? 'bg-gradient-to-tr from-neon-violet/30 to-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-glow-cyan-sm'
                : 'text-slate-400 hover:text-neon-cyan hover:bg-white/5'
            }`}
          >
            <Gamepad2 className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 px-1 rounded bg-neon-cyan text-[8px] font-black text-black">
              PLAY
            </span>
          </button>

          {/* Notifications */}
          <button
            onClick={() => alert('Realtime Notifications active with Supabase channels.')}
            title="Notifications"
            className="p-3 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
          >
            <Bell className="w-5 h-5" />
          </button>
        </nav>
      </div>

      {/* Bottom Actions & User Profile */}
      <div className="flex flex-col items-center gap-4">
        {/* Security badge pill */}
        <div
          title="PostgreSQL RLS Protected"
          className="p-2 text-slate-500 hover:text-neon-cyan transition-colors cursor-pointer"
          onClick={() => alert('Supabase RLS: All messages encrypted and isolated per user session.')}
        >
          <ShieldAlert className="w-5 h-5 text-slate-400 hover:text-neon-cyan" />
        </div>

        {/* Settings button */}
        <button
          onClick={() => setIsProfileOpen(true)}
          title="Terminal Settings"
          className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Profile Trigger */}
        <button
          onClick={() => setIsProfileOpen(true)}
          title="Open User Profile & Terminal Settings"
          className="relative group p-1 rounded-full transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
        >
          <Avatar
            src={currentUser.avatar}
            name={currentUser.displayName}
            size="md"
            status={currentUser.status}
            showStatus
            className="ring-2 ring-white/10 group-hover:ring-neon-cyan/50 transition-all"
          />
        </button>
      </div>
    </aside>
  );
};
