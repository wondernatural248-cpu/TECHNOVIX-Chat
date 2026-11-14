import React from 'react';
import logoSrc from '../../assets/FB_IMG_1784179369479.jpg';

export interface TechnovixLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
  glow?: boolean;
}

const sizeClasses: Record<NonNullable<TechnovixLogoProps['size']>, string> = {
  xs: 'w-6 h-6 rounded-md',
  sm: 'w-8 h-8 rounded-lg',
  md: 'w-10 h-10 rounded-xl',
  lg: 'w-14 h-14 rounded-2xl',
  xl: 'w-20 h-20 rounded-3xl',
};

export const TechnovixLogo: React.FC<TechnovixLogoProps> = ({
  size = 'md',
  className = '',
  alt = 'TECHNOVIX Logo',
  glow = true,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center p-[1.5px] bg-gradient-to-tr from-neon-violet to-neon-cyan ${
        glow ? 'shadow-glow-cyan-sm' : ''
      } overflow-hidden shrink-0 ${sizeClasses[size]} ${className}`}
    >
      <img
        src={logoSrc}
        alt={alt}
        className="w-full h-full object-cover rounded-[inherit]"
        loading="eager"
      />
    </div>
  );
};
