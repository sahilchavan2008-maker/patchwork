import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'cyan' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed select-none';

    const variants = {
      primary:
        'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 hover:shadow-indigo-500/50 focus:ring-indigo-500 border border-indigo-400/30',
      cyan:
        'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-md shadow-cyan-500/30 hover:shadow-cyan-400/50 focus:ring-cyan-400 border border-cyan-300/40',
      secondary:
        'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 focus:ring-slate-500',
      ghost:
        'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white focus:ring-slate-600',
      danger:
        'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 hover:border-rose-700 shadow-sm shadow-rose-950 focus:ring-rose-500',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
