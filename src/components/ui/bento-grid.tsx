import React from 'react';
import { cn } from '@/lib/utils';

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl',
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  onClick,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'row-span-1 rounded-xl group/bento hover:shadow-lg transition-all duration-300 p-4 bg-card/60 backdrop-blur-md border border-border/50 justify-between flex flex-col space-y-3 hover:border-primary/40',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {header}
      <div className="group-hover/bento:translate-x-0.5 transition duration-200">
        <div className="flex items-center space-x-2 text-primary mb-1">
          {icon}
        </div>
        <div className="font-semibold text-foreground text-sm mb-0.5">
          {title}
        </div>
        <div className="font-normal text-muted-foreground text-xs">
          {description}
        </div>
      </div>
    </div>
  );
};
