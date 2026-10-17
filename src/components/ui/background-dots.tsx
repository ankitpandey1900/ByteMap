import React from 'react';
import { cn } from '@/lib/utils';

interface BackgroundDotsProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'dots' | 'grid';
}

export const BackgroundDots: React.FC<BackgroundDotsProps> = ({
  children,
  className,
  variant = 'dots',
}) => {
  return (
    <div
      className={cn(
        'relative w-full h-full bg-background flex flex-col overflow-hidden',
        className
      )}
    >
      {/* Pattern layer */}
      <div
        className={cn(
          'absolute inset-0 pointer-events-none z-0 opacity-70',
          variant === 'dots' ? 'bg-dot-pattern' : 'bg-grid-pattern'
        )}
      />

      {/* Radial fade mask */}
      <div
        className="absolute inset-0 pointer-events-none z-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] bg-background/40"
      />

      {/* Interactive content layer */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
};
