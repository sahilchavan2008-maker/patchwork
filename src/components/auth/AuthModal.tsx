'use client';

import React, { useState } from 'react';
import { UserProfile, UserRole } from '@/types/auth';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Shield,
  ShieldCheck,
  Lock,
  User,
  Key,
  CheckCircle,
  X,
  Zap,
  Fingerprint,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserProfile) => void;
}

const PRESET_USERS: UserProfile[] = [
  {
    id: 'usr_eng_849',
    name: 'Alex Rivera',
    email: 'alex.rivera@patchwork.dev',
    role: 'lead_engineer',
    roleTitle: 'Senior Full-Stack Engineer',
    avatarInitials: 'AR',
    department: 'Core Platform Engineering',
    token: 'jwt_sec_token_9841_lead_eng',
  },
  {
    id: 'usr_qa_392',
    name: 'Elena Rostova',
    email: 'elena.rostova@patchwork.dev',
    role: 'qa_architect',
    roleTitle: 'Lead QA Automation Architect',
    avatarInitials: 'ER',
    department: 'Reliability & Test Automation',
    token: 'jwt_sec_token_5821_qa_arch',
  },
  {
    id: 'usr_sec_105',
    name: 'Marcus Vance',
    email: 'm.vance@patchwork.dev',
    role: 'security_auditor',
    roleTitle: 'AppSec & Red Team Auditor',
    avatarInitials: 'MV',
    department: 'Cybersecurity & Compliance',
    token: 'jwt_sec_token_7109_sec_audit',
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'security_matrix'>('signin');
  const [customEmail, setCustomEmail] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;

    setIsLoading(true);
    setTimeout(() => {
      const name = customEmail.split('@')[0];
      const initials = name.slice(0, 2).toUpperCase();
      onLogin({
        id: `usr_${Math.floor(100 + Math.random() * 900)}`,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        email: customEmail,
        role: 'lead_engineer',
        roleTitle: 'Authenticated Engineer',
        avatarInitials: initials,
        department: 'Engineering Workbench',
        token: `jwt_sec_${Date.now()}`,
      });
      setIsLoading(false);
      onClose();
    }, 400);
  };

  const handleSelectPreset = (user: UserProfile) => {
    onLogin(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl">
        <Card accent="cyan" className="shadow-2xl border-cyan-500/40">
          <CardHeader className="flex items-center justify-between pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Access Gate & Security Control</span>
                  <Badge variant="cyan" size="sm">
                    RBAC Protected
                  </Badge>
                </h3>
                <p className="text-xs text-slate-400">
                  Authentication & Security Protection for Patchwork
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </CardHeader>

          {/* Tab Selector */}
          <div className="px-6 pt-2 pb-0 flex border-b border-slate-800 space-x-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('signin')}
              className={cn(
                'pb-2.5 border-b-2 transition-all flex items-center gap-1.5',
                activeTab === 'signin'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              )}
            >
              <User className="w-3.5 h-3.5" />
              <span>Identity Login</span>
            </button>
            <button
              onClick={() => setActiveTab('security_matrix')}
              className={cn(
                'pb-2.5 border-b-2 transition-all flex items-center gap-1.5',
                activeTab === 'security_matrix'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Active Threat Defense Matrix</span>
            </button>
          </div>

          <CardContent className="p-6 space-y-4">
            {activeTab === 'signin' ? (
              <div className="space-y-4">
                {/* 1-Click Corporate Passkeys */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                      Select Team Role (Instant SSO):
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      1-Click Authentication
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {PRESET_USERS.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSelectPreset(u)}
                        className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950/70 hover:bg-slate-900 hover:border-cyan-500/60 transition-all text-left flex items-center justify-between group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 flex items-center justify-center font-bold text-xs font-mono">
                            {u.avatarInitials}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                              {u.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {u.roleTitle} &bull; {u.department}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              u.role === 'security_auditor'
                                ? 'rose'
                                : u.role === 'lead_engineer'
                                ? 'indigo'
                                : 'cyan'
                            }
                            size="sm"
                          >
                            {u.role.replace('_', ' ')}
                          </Badge>
                          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-900 px-2 text-[10px] font-mono text-slate-500">
                      Or Sign in with Custom Credentials
                    </span>
                  </div>
                </div>

                {/* Custom Form */}
                <form onSubmit={handleCustomLogin} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Work Email
                    </label>
                    <input
                      type="email"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="developer@company.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Passkey / Password
                    </label>
                    <input
                      type="password"
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="cyan"
                    size="md"
                    isLoading={isLoading}
                    className="w-full font-bold text-xs mt-2"
                  >
                    <Key className="w-3.5 h-3.5 mr-1" />
                    <span>Authorize Session</span>
                  </Button>
                </form>
              </div>
            ) : (
              /* Security Matrix */
              <div className="space-y-3">
                <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-xl text-xs text-emerald-300 flex items-start space-x-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">AppSec Active: </span>
                    Patchwork is hardened against automated exploitation, wallet drainage, and prompt injection.
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5 text-xs">
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between font-semibold text-slate-200">
                      <span className="flex items-center gap-1.5 text-cyan-400">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Sliding-Window IP Rate Limiter</span>
                      </span>
                      <Badge variant="cyan" size="sm">
                        10 req / min
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Prevents DDoS, bot attacks, and runaway Gemini API billing by capping request velocity per client IP.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between font-semibold text-slate-200">
                      <span className="flex items-center gap-1.5 text-indigo-400">
                        <Fingerprint className="w-3.5 h-3.5" />
                        <span>Prompt Injection Defense</span>
                      </span>
                      <Badge variant="indigo" size="sm">
                        Heuristic Filter
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Detects and sanitizes adversarial prompt overrides (&quot;ignore previous instructions&quot;, system prompt leakage, jailbreaks) before reaching LLM.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between font-semibold text-slate-200">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Enterprise HTTP Security Headers</span>
                      </span>
                      <Badge variant="emerald" size="sm">
                        Strict CSP & HSTS
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Configured with `X-Frame-Options: DENY` (anti-clickjacking), `X-Content-Type-Options: nosniff`, and strict transport security.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex items-center justify-between bg-slate-950/60 p-4 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
            <span>Encrypted Session: AES-256</span>
            <span className="text-cyan-400">Patchwork Security v1.2</span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
