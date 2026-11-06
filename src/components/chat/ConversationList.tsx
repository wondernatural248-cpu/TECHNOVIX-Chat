import React from 'react';
import { Filter, MessageSquarePlus, Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ConversationFilter } from '../../types/chat';
import { ConversationItem } from './ConversationItem';
import { NewChatModal } from './NewChatModal';
import { StoryBar } from '../stories/StoryBar';

export const ConversationList: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    isNewChatOpen,
    setIsNewChatOpen,
    isSupabaseActive,
  } = useApp();

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    // Search query match
    if (searchQuery.trim()) {
      const matchTitle = c.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchMsg = c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchTitle && !matchMsg) return false;
    }

    // Filter type match
    if (activeFilter === 'direct') return c.type === 'direct';
    if (activeFilter === 'groups') return c.type === 'group' || c.type === 'channel';
    if (activeFilter === 'unread') return c.unreadCount > 0;
    return true;
  });

  const pinnedList = filteredConversations.filter((c) => c.pinned);
  const otherList = filteredConversations.filter((c) => !c.pinned);

  const filterTabs: { id: ConversationFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'direct', label: 'Direct' },
    { id: 'groups', label: 'Channels' },
    { id: 'unread', label: 'Unread' },
  ];

  return (
    <div className="flex flex-col h-full bg-technovix-panel/80 border-r border-white/10 select-none relative">
      {/* Top Search & Filter Bar */}
      <div className="p-4 space-y-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Messages</h2>
            {isSupabaseActive ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-amber-400 bg-amber-500/15 border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Disconnected
              </span>
            )}
          </div>

          <button
            onClick={() => setIsNewChatOpen(true)}
            title="Start new encrypted conversation"
            className="p-2 rounded-xl bg-technovix-surface border border-white/10 text-slate-300 hover:text-neon-cyan hover:border-neon-cyan/40 transition-colors cursor-pointer group active:scale-95"
          >
            <MessageSquarePlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Search input */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages, channels..."
            className="w-full rounded-xl bg-technovix-surface/80 border border-white/10 pl-9 pr-8 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/40 transition-all font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                activeFilter === tab.id
                  ? 'bg-gradient-to-r from-neon-violet/30 to-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-glow-cyan-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stories / Status Row */}
      <StoryBar />

      {/* Conversations Stream */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {filteredConversations.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Filter className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
            <p className="text-xs text-slate-400 font-medium">No conversations found</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[200px] mx-auto">
              Click the <span className="text-neon-cyan font-semibold">+</span> icon above to search registered identities and transmit your first message.
            </p>
          </div>
        ) : (
          <>
            {/* Pinned section */}
            {pinnedList.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Pinned Chats
                </div>
                {pinnedList.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={activeConversationId === conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                  />
                ))}
              </div>
            )}

            {/* Other conversations */}
            {otherList.length > 0 && (
              <div className="space-y-1">
                {pinnedList.length > 0 && (
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Recent Messages
                  </div>
                )}
                {otherList.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={activeConversationId === conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* User Search & New Chat Modal */}
      <NewChatModal isOpen={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} />
    </div>
  );
};
