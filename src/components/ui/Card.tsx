import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: 'none' | 'indigo' | 'cyan';
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  accent = 'none',
  hoverEffect = false,
  children,
  ...props
}) => {
  const accentStyles = {
    none: 'border-slate-800/80',
    indigo: 'border-indigo-500/30 hover:border-indigo-500/50 hover:shadow-indigo-500/10 hover:shadow-lg',
    cyan: 'border-cyan-500/30 hover:border-cyan-500/50 hover:shadow-cyan-500/10 hover:shadow-lg',
  };

  return (
    <div
      className={cn(
        'bg-slate-900/90 backdrop-blur-sm rounded-xl border text-slate-100 transition-all duration-200',
        accentStyles[accent],
        hoverEffect && 'hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn(
      'px-6 py-4 border-b border-slate-800/80 flex items-center justify-between',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('p-6', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn('px-6 py-4 border-t border-slate-800/80 bg-slate-950/40 rounded-b-xl', className)}
    {...props}
  >
    {children}
  </div>
);
