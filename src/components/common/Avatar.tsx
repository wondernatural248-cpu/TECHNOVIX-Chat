import React from 'react';
import { StatusType } from '../../types/chat';

export interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: StatusType;
  showStatus?: boolean;
  className?: string;
  hasStoryRing?: boolean;
  isStoryUnread?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  status,
  showStatus = false,
  className = '',
  hasStoryRing = false,
  isStoryUnread = false,
}) => {
  const sizeMap = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-9 h-9 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl font-bold',
  };

  const statusSizeMap = {
    xs: 'w-2 h-2 ring-1',
    sm: 'w-2.5 h-2.5 ring-1.5',
    md: 'w-3 h-3 ring-2',
    lg: 'w-3.5 h-3.5 ring-2',
    xl: 'w-5 h-5 ring-4',
  };

  const statusColorMap: Record<StatusType, string> = {
    online: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
    away: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
    busy: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]',
    offline: 'bg-slate-500',
  };

  const getInitials = (nameStr: string) => {
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return nameStr.substring(0, 2).toUpperCase();
  };

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {/* Optional Neon Story Ring */}
      <div
        className={`rounded-full transition-all duration-300 p-[2px] ${
          hasStoryRing
            ? isStoryUnread
              ? 'bg-gradient-to-tr from-neon-cyan via-neon-violet to-neon-magenta p-[2.5px] shadow-glow-cyan-sm animate-pulse-subtle'
              : 'border border-slate-700/60 p-[2px]'
            : ''
        }`}
      >
        <div
          className={`${sizeMap[size]} rounded-full overflow-hidden bg-technovix-card flex items-center justify-center border border-white/10`}
        >
          {src ? (
            <img
              src={src}
              alt={name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to initial display
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <span className="font-semibold text-slate-300 select-none">
              {getInitials(name)}
            </span>
          )}
        </div>
      </div>

      {/* Online/Status Indicator */}
      {showStatus && status && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-technovix-bg ${statusSizeMap[size]} ${statusColorMap[status]}`}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};
