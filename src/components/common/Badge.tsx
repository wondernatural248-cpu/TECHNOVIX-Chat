import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'neutral' | 'demo';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'cyan',
  size = 'sm',
  className = '',
  pulse = false,
}) => {
  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.5 leading-none',
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-xs px-3 py-1 font-medium',
  };

  const variantStyles = {
    cyan: 'bg-cyan-500/15 text-neon-cyan border border-cyan-500/30',
    violet: 'bg-purple-500/15 text-neon-violet-light border border-purple-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    neutral: 'bg-slate-800/80 text-slate-300 border border-slate-700/60',
    demo: 'bg-gradient-to-r from-neon-violet/20 to-neon-cyan/20 text-slate-200 border border-neon-cyan/40 shadow-glow-cyan-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${sizeStyles[size]} ${variantStyles[variant]} ${
        pulse ? 'animate-pulse' : ''
      } ${className}`}
    >
      {pulse && (
        <span className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_6px_currentColor]" />
      )}
      {children}
    </span>
  );
};
