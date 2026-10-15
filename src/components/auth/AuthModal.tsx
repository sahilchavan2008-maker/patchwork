'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Lock,
  Mail,
  Key,
  X,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithGoogle, loginWithEmail, signUpWithEmail, loginAsDemo } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuthError = (err: unknown) => {
    console.error('Firebase Auth Error:', err);
    const code = (err as { code?: string })?.code;
    const msg = (err as Error)?.message || '';

    if (code === 'auth/api-key-not-valid' || code === 'auth/invalid-api-key' || msg.includes('api-key-not-valid')) {
      setError(
        'Invalid API Key: Google rejected the key in .env.local (AIzaSy...). Please verify your key in Firebase Console → ⚙️ Project Settings → General → "Web API Key" (or under "Your apps" web app snippet), or check Google Cloud Console credentials for restrictions. Alternatively, click "Test Without Firebase" below to bypass.'
      );
    } else if (code === 'auth/operation-not-allowed') {
      setError(
        'Sign-in provider is disabled in Firebase Console. Enable Email/Password or Google under Authentication → Sign-in method, or use Demo Mode.'
      );
    } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      setError('Invalid email or password. Please check your credentials.');
    } else if (code === 'auth/email-already-in-use') {
      setError('This email is already registered. Please sign in instead.');
    } else if (code === 'auth/weak-password') {
      setError('Password must be at least 6 characters.');
    } else if (code === 'auth/invalid-email') {
      setError('Please enter a valid email address.');
    } else if (code === 'auth/popup-closed-by-user') {
      setError('Google sign-in popup was closed before completing.');
    } else if (code === 'auth/cancelled-popup-request') {
      setError('Sign-in was cancelled.');
    } else {
      setError(msg || 'Authentication failed. Please check your Firebase settings or use Demo Mode.');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === 'signin') {
        await loginWithEmail(email, password);
        setSuccessMsg('Signed in successfully!');
      } else {
        await signUpWithEmail(email, password);
        setSuccessMsg('Account created and signed in successfully!');
      }
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: unknown) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await loginWithGoogle();
      setSuccessMsg('Signed in with Google!');
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: unknown) {
      handleAuthError(err);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleDemoLogin = () => {
    loginAsDemo('Lead QA Engineer', 'qa-lead@patchwork.dev');
    setSuccessMsg('Logged in via Demo Session!');
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md">
        <Card accent="cyan" className="shadow-2xl border-cyan-500/40 bg-slate-900/95 backdrop-blur-xl">
          <CardHeader className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Firebase Authentication</span>
                  <Badge variant="cyan" size="sm">
                    Live Auth
                  </Badge>
                </h3>
                <p className="text-xs text-slate-400">
                  {mode === 'signin' ? 'Sign in to access Patchwork' : 'Create an account to continue'}
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

          <CardContent className="p-6 space-y-4">
            {/* Mode Switcher Tabs */}
            <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                }}
                className={cn(
                  'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all',
                  mode === 'signin'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className={cn(
                  'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all',
                  mode === 'signup'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                Create Account
              </button>
            </div>

            {/* Error / Success Feedback */}
            {error && (
              <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl flex items-start space-x-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-xl flex items-center space-x-2 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Google Action Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isGoogleLoading || isLoading}
              className="w-full flex items-center justify-center space-x-3 p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/60 rounded-xl text-xs font-medium text-slate-100 transition-all duration-150 shadow-sm disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-[10px] font-mono text-slate-500">
                  Or with email and password
                </span>
              </div>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="engineer@company.com"
                  required
                  className="w-full bg-slate-950/90 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  minLength={6}
                  className="w-full bg-slate-950/90 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
                />
              </div>

              <Button
                type="submit"
                variant={mode === 'signin' ? 'primary' : 'cyan'}
                size="md"
                isLoading={isLoading}
                disabled={isLoading || isGoogleLoading}
                className="w-full font-bold text-xs mt-2"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                <span>{mode === 'signin' ? 'Sign In to Session' : 'Create Patchwork Account'}</span>
              </Button>
            </form>

            {/* Local Sandbox / Demo Bypass */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-mono text-slate-300 hover:text-cyan-300 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Test Without Firebase (Demo Mode Bypass)</span>
              </button>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between bg-slate-950/60 p-4 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Firebase Auth Live</span>
            </span>
            <span className="text-cyan-400">patchwork-aba5f</span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
