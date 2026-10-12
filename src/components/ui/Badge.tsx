import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'indigo' | 'cyan' | 'slate' | 'emerald' | 'amber' | 'rose';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'slate',
  size = 'md',
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center font-medium uppercase tracking-wider rounded-full border';

  const variants = {
    indigo:
      'bg-indigo-950/80 text-indigo-300 border-indigo-700/60 shadow-sm shadow-indigo-950',
    cyan:
      'bg-cyan-950/80 text-cyan-300 border-cyan-700/60 shadow-sm shadow-cyan-950',
    slate:
      'bg-slate-900 text-slate-300 border-slate-700',
    emerald:
      'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
    amber:
      'bg-amber-950/80 text-amber-300 border-amber-700/60',
    rose:
      'bg-rose-950/80 text-rose-300 border-rose-700/60',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
};
