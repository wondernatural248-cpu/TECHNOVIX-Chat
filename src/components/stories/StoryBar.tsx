import React from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';

export const StoryBar: React.FC = () => {
  const { stories, setActiveStoryId, currentUser } = useApp();

  return (
    <div className="w-full px-4 py-3 border-b border-white/5 bg-technovix-void/40 overflow-x-auto select-none no-scrollbar">
      <div className="flex items-center gap-3 min-w-max">
        {/* Current user's add status button */}
        <div className="flex flex-col items-center gap-1.5 cursor-pointer group">
          <div className="relative">
            <Avatar
              src={currentUser.avatar}
              name={currentUser.displayName}
              size="md"
              className="ring-1 ring-white/10 group-hover:ring-neon-cyan/50 transition-all"
            />
            <button
              onClick={() => {
                const userStory = stories.find((s) => s.userId === currentUser.id);
                if (userStory) {
                  setActiveStoryId(userStory.id);
                } else {
                  alert('Status upload will connect to Supabase Storage in production.');
                }
              }}
              title="Add status / story"
              className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-tr from-neon-violet to-neon-cyan rounded-full flex items-center justify-center text-technovix-void shadow-glow-cyan-sm hover:scale-110 transition-transform"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
          <span className="text-[11px] font-medium text-slate-300 group-hover:text-neon-cyan transition-colors truncate max-w-[64px]">
            Your Status
          </span>
        </div>

        {/* Stories list */}
        {stories
          .filter((story) => story.userId !== currentUser.id)
          .map((story) => (
            <div
              key={story.id}
              onClick={() => setActiveStoryId(story.id)}
              className="flex flex-col items-center gap-1.5 cursor-pointer group"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setActiveStoryId(story.id);
                }
              }}
            >
              <Avatar
                src={story.userAvatar}
                name={story.userName}
                size="md"
                hasStoryRing
                isStoryUnread={story.hasUnread}
                className="group-hover:scale-105 transition-transform"
              />
              <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-200 transition-colors truncate max-w-[64px]">
                {story.userName.split(' ')[0]}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
};
