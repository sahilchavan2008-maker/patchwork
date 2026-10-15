'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Bug,
  Sparkles,
  FileCode2,
  Layers,
  Play,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export type WorkflowStep = 'intake' | 'clarification' | 'report';

interface NavbarProps {
  currentStep: WorkflowStep;
  onStepChange: (step: WorkflowStep) => void;
  clarificationCount?: number;
  isReportReady?: boolean;
  onTriggerDemo?: () => void;
  isDemoLoading?: boolean;
  onOpenAuthModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStep,
  onStepChange,
  clarificationCount = 0,
  isReportReady = false,
  onTriggerDemo,
  isDemoLoading = false,
  onOpenAuthModal,
}) => {
  const { user, logout } = useAuth();

  const steps = [
    {
      id: 'intake' as WorkflowStep,
      label: 'Bug Intake',
      icon: Bug,
      detail: 'Capture & Context',
    },
    {
      id: 'clarification' as WorkflowStep,
      label: 'Ambiguity Resolution',
      icon: Sparkles,
      detail: clarificationCount > 0 ? `${clarificationCount} queries` : 'Resolved',
      badge: clarificationCount > 0 ? `${clarificationCount}` : undefined,
    },
    {
      id: 'report' as WorkflowStep,
      label: 'Developer Packet',
      icon: FileCode2,
      detail: isReportReady ? 'Ready' : 'Pending',
    },
  ];

  // Helper to extract user initials
  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'PW';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Layers className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-white">
                patch<span className="text-cyan-400">work</span>
              </span>
              <Badge variant="indigo" size="sm">
                Firebase Live
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 font-mono hidden md:block">
              AI Bug Clarification & Verified Auth Workbench
            </p>
          </div>
        </div>

        {/* Workflow Pipeline Nav */}
        <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;

            return (
              <button
                key={step.id}
                onClick={() => onStepChange(step.id)}
                className={cn(
                  'flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-slate-800 text-white shadow-inner border border-slate-700/80 shadow-indigo-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold font-mono',
                    isActive ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                  )}
                >
                  {idx + 1}
                </div>
                <Icon
                  className={cn(
                    'w-3.5 h-3.5',
                    isActive ? (step.id === 'clarification' ? 'text-cyan-400' : 'text-indigo-400') : 'text-slate-500'
                  )}
                />
                <span className="hidden sm:inline">{step.label}</span>
                {step.badge && (
                  <span className="ml-1 px-1.5 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-full text-[10px] font-mono">
                    {step.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Action Controls & Firebase Auth User Pill */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Security Status */}
          <button
            type="button"
            onClick={onOpenAuthModal}
            title="Inspect Firebase Auth & AppSec Status"
            className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-emerald-500/40 rounded-lg text-xs font-mono text-emerald-300 shadow-sm transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Firebase Protected</span>
          </button>

          {/* User Profile / Auth State */}
          {user ? (
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1 pl-2.5 rounded-xl text-xs">
              <div className="flex items-center space-x-2">
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-6 h-6 rounded-md object-cover border border-slate-700"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-md bg-indigo-600 text-white font-mono font-bold flex items-center justify-center text-[10px]">
                    {getInitials()}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <div className="text-[11px] font-bold text-slate-100 leading-tight max-w-[120px] truncate">
                    {user.displayName || user.email?.split('@')[0] || 'Authenticated'}
                  </div>
                  <div className="text-[9px] text-cyan-400 font-mono truncate max-w-[120px]">
                    {user.email || 'Firebase User'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => logout()}
                title="Sign Out from Firebase"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onOpenAuthModal}
              className="text-xs font-bold"
            >
              <Lock className="w-3.5 h-3.5 mr-1" />
              <span>Sign In</span>
            </Button>
          )}

          {/* Demo Button */}
          {onTriggerDemo && (
            <Button
              type="button"
              variant="cyan"
              size="sm"
              onClick={onTriggerDemo}
              isLoading={isDemoLoading}
              className="font-bold border border-cyan-300/40 shadow-md shadow-cyan-500/30 text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Demo Mode</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
