import React from 'react';
import { cn } from '@/lib/utils';

export interface ShimmerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  borderRadius?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = 'rgba(255, 255, 255, 0.7)',
      borderRadius = '0.625rem',
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'group relative inline-flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap px-4 py-2 text-xs font-semibold text-white shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
          className
        )}
        style={{ borderRadius }}
        {...props}
      >
        {/* Shimmer rotating border container */}
        <div
          className="absolute inset-0 -z-10 overflow-hidden"
          style={{ borderRadius }}
        >
          <div
            className="absolute inset-[-150%] animate-[spin_4s_linear_infinite]"
            style={{
              background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${shimmerColor} 45deg, transparent 90deg)`,
            }}
          />
        </div>

        {/* Inner button surface */}
        <div
          className="absolute inset-[1px] -z-10 bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 group-hover:brightness-110"
          style={{ borderRadius: `calc(${borderRadius} - 1px)` }}
        />

        {/* Content */}
        <span className="relative z-10 flex items-center space-x-1.5">
          {children}
        </span>
      </button>
    );
  }
);

ShimmerButton.displayName = 'ShimmerButton';
