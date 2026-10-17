import React from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardSpotlightProps extends React.HTMLAttributes<HTMLDivElement> {
  radius?: number;
  color?: string;
  children: React.ReactNode;
  className?: string;
}

export const CardSpotlight: React.FC<CardSpotlightProps> = ({
  children,
  radius = 280,
  color = 'rgba(59, 130, 246, 0.16)',
  className,
  ...props
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={cn(
        'group/spotlight p-5 rounded-2xl relative border border-border/50 bg-card/60 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-lg',
        className
      )}
      onMouseMove={handleMouseMove}
      {...props}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover/spotlight:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              ${radius}px circle at ${mouseX}px ${mouseY}px,
              ${color},
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
