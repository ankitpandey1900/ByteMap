import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HoverBorderGradientProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  containerClassName?: string;
  className?: string;
  duration?: number;
  clockwise?: boolean;
  children: React.ReactNode;
}

export const HoverBorderGradient: React.FC<HoverBorderGradientProps> = ({
  children,
  containerClassName,
  className,
  as: Tag = 'button',
  duration = 1,
  clockwise = true,
  ...props
}) => {
  const [hovered, setHovered] = useState<boolean>(false);
  const [direction, setDirection] = useState<'TOP' | 'LEFT' | 'BOTTOM' | 'RIGHT'>('TOP');

  const rotateDirection = (currentDirection: 'TOP' | 'LEFT' | 'BOTTOM' | 'RIGHT') => {
    const directions: Array<'TOP' | 'LEFT' | 'BOTTOM' | 'RIGHT'> = ['TOP', 'LEFT', 'BOTTOM', 'RIGHT'];
    const index = directions.indexOf(currentDirection);
    const nextIndex = clockwise
      ? (index + 1) % directions.length
      : (index - 1 + directions.length) % directions.length;
    return directions[nextIndex];
  };

  const movingMap = {
    TOP: 'radial-gradient(20.7% 50% at 50% 0%, hsl(var(--primary)) 0%, rgba(255, 255, 255, 0) 100%)',
    LEFT: 'radial-gradient(16.6% 43.1% at 0% 50%, hsl(var(--primary)) 0%, rgba(255, 255, 255, 0) 100%)',
    BOTTOM: 'radial-gradient(20.7% 50% at 50% 100%, hsl(var(--primary)) 0%, rgba(255, 255, 255, 0) 100%)',
    RIGHT: 'radial-gradient(16.2% 41.2% at 100% 50%, hsl(var(--primary)) 0%, rgba(255, 255, 255, 0) 100%)',
  };

  const highlight =
    'radial-gradient(75% 181.16% at 50% 50%, #3b82f6 0%, rgba(255, 255, 255, 0) 100%)';

  useEffect(() => {
    if (!hovered) {
      const interval = setInterval(() => {
        setDirection((prevState) => rotateDirection(prevState));
      }, duration * 1000);
      return () => clearInterval(interval);
    }
  }, [hovered, duration, clockwise]);

  return (
    <Tag
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'relative flex rounded-xl border border-transparent content-center bg-black/20 hover:bg-black/10 transition duration-500 items-center flex-col flex-nowrap gap-10 h-min justify-center overflow-visible p-px decoration-clone w-fit',
        containerClassName
      )}
      {...props}
    >
      <div
        className={cn(
          'w-auto text-foreground z-10 bg-card/80 px-3 py-1.5 rounded-[11px]',
          className
        )}
      >
        {children}
      </div>
      <motion.div
        className="flex-none inset-0 overflow-hidden absolute z-0 rounded-[12px]"
        style={{
          filter: 'blur(2px)',
          position: 'absolute',
          width: '100%',
          height: '100%',
        }}
        initial={{ background: movingMap[direction] }}
        animate={{
          background: hovered
            ? [movingMap[direction], highlight]
            : movingMap[direction],
        }}
        transition={{ ease: 'linear', duration: duration ?? 1 }}
      />
      <div className="bg-background absolute z-1 flex-none inset-[2px] rounded-[10px]" />
    </Tag>
  );
};
