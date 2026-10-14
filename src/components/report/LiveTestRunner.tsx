'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Terminal,
  Zap,
  ShieldCheck,
  Clock,
  Trash2,
  Code2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TerminalLog, RunTestResponse } from '@/app/api/run-test/route';

interface LiveTestRunnerProps {
  testType?: 'playwright' | 'jest';
  bugTitle?: string;
}

export const LiveTestRunner: React.FC<LiveTestRunnerProps> = ({
  testType: initialType = 'playwright',
  bugTitle,
}) => {
  const [testType, setTestType] = useState<'playwright' | 'jest'>(initialType);
  const [activeMode, setActiveMode] = useState<'buggy' | 'patched'>('buggy');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<TerminalLog[]>([]);
  const [result, setResult] = useState<RunTestResponse | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleRunExecution = async (modeToRun: 'buggy' | 'patched') => {
    setActiveMode(modeToRun);
    setIsRunning(true);
    setResult(null);

    // Initial boot message
    const bootLog: TerminalLog = {
      id: `boot_${Date.now()}`,
      timestamp: new Date().toTimeString().split(' ')[0],
      type: 'cmd',
      message: `$ Initializing sandbox runner for mode: [${modeToRun.toUpperCase()}]...`,
    };
    setLogs([bootLog]);

    try {
      const res = await fetch('/api/run-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testType,
          mode: modeToRun,
          bugTitle,
        }),
      });

      if (!res.ok) {
        throw new Error(`Runner error: ${res.statusText}`);
      }

      const data: RunTestResponse = await res.json();

      // Animate logs sequentially for realistic terminal streaming experience
      for (let i = 0; i < data.logs.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 80));
        setLogs((prev) => [...prev, data.logs[i]]);
      }

      setResult(data);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown execution error';
      setLogs((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          timestamp: new Date().toTimeString().split(' ')[0],
          type: 'error',
          message: `Fatal: ${errorMsg}`,
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
    setResult(null);
  };

  return (
    <Card accent="indigo" className="overflow-hidden border-indigo-500/40">
      {/* Top Terminal Header */}
      <CardHeader className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* OS Window Traffic Lights */}
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>

          <div className="h-4 w-[1px] bg-slate-800" />

          <div className="flex items-center space-x-2 text-xs font-mono text-slate-300">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-white">sandbox-runner</span>
            <span className="text-slate-500 hidden sm:inline">&bull;</span>
            <span className="text-slate-400 hidden sm:inline">
              {testType === 'playwright' ? 'playwright-chromium (headless)' : 'jest-node-worker'}
            </span>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center space-x-2">
          {isRunning ? (
            <Badge variant="cyan" size="sm" className="animate-pulse">
              <span className="w-2 h-2 rounded-full bg-cyan-400 mr-1.5 animate-ping" />
              EXECUTING TEST...
            </Badge>
          ) : result?.status === 'failed' ? (
            <Badge variant="rose" size="sm">
              <XCircle className="w-3 h-3 mr-1" />
              BUG CONFIRMED (FAILED)
            </Badge>
          ) : result?.status === 'passed' ? (
            <Badge variant="emerald" size="sm">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              PATCH VERIFIED (PASSED)
            </Badge>
          ) : (
            <Badge variant="slate" size="sm">
              READY TO EXECUTE
            </Badge>
          )}
        </div>
      </CardHeader>

      {/* Interactive Controls Bar */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          {/* Test Framework Selector */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setTestType('playwright')}
              disabled={isRunning}
              className={cn(
                'px-2.5 py-1 rounded font-mono text-[11px] transition-colors',
                testType === 'playwright'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Playwright E2E
            </button>
            <button
              onClick={() => setTestType('jest')}
              disabled={isRunning}
              className={cn(
                'px-2.5 py-1 rounded font-mono text-[11px] transition-colors',
                testType === 'jest'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Jest Unit
            </button>
          </div>
        </div>

        {/* Action Buttons: Run Buggy vs Run Patched */}
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="danger"
            size="sm"
            isLoading={isRunning && activeMode === 'buggy'}
            disabled={isRunning}
            onClick={() => handleRunExecution('buggy')}
            className="text-xs font-bold shadow-md shadow-rose-950/40"
          >
            <Play className="w-3.5 h-3.5 mr-1 fill-current" />
            <span>1. Run on Buggy State</span>
          </Button>

          <Button
            type="button"
            variant="cyan"
            size="sm"
            isLoading={isRunning && activeMode === 'patched'}
            disabled={isRunning}
            onClick={() => handleRunExecution('patched')}
            className="text-xs font-bold shadow-md shadow-cyan-950/40 text-slate-950"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            <span>2. Run with Patch Applied</span>
          </Button>

          {logs.length > 0 && (
            <button
              type="button"
              onClick={handleClearLogs}
              disabled={isRunning}
              title="Clear terminal"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors ml-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Terminal Monospace Output Screen */}
      <CardContent className="p-0">
        <div className="bg-[#030712] p-4 min-h-[280px] max-h-[380px] overflow-y-auto font-mono text-xs leading-relaxed select-text">
          {logs.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-600 space-y-2">
              <Code2 className="w-8 h-8 opacity-40 text-cyan-400" />
              <p className="text-xs font-mono">
                Click <span className="text-rose-400 font-bold">&quot;Run on Buggy State&quot;</span> to reproduce the failure,
              </p>
              <p className="text-xs font-mono text-slate-500">
                or <span className="text-cyan-400 font-bold">&quot;Run with Patch Applied&quot;</span> to verify the fix passes in the headless sandbox.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log) => {
                let colorClass = 'text-slate-300';
                if (log.type === 'cmd') colorClass = 'text-cyan-300 font-bold';
                else if (log.type === 'error') colorClass = 'text-rose-400 font-semibold';
                else if (log.type === 'success') colorClass = 'text-emerald-400 font-bold';
                else if (log.type === 'warn') colorClass = 'text-amber-300';

                return (
                  <div key={log.id} className="flex items-start space-x-2 font-mono">
                    <span className="text-slate-600 select-none text-[10px] w-14 shrink-0 pt-0.5">
                      {log.timestamp}
                    </span>
                    <span className={cn('whitespace-pre-wrap break-all flex-1', colorClass)}>
                      {log.message}
                    </span>
                  </div>
                );
              })}

              {/* Blinking cursor */}
              {isRunning && (
                <div className="flex items-center space-x-2 text-cyan-400 pt-1">
                  <span className="w-14 shrink-0" />
                  <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse" />
                </div>
              )}
              <div ref={terminalEndRef} />
            </div>
          )}
        </div>

        {/* Assertion Error or Success Breakdown Card */}
        {result && (
          <div
            className={cn(
              'p-3.5 px-4 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs',
              result.status === 'failed'
                ? 'bg-rose-950/30 border-rose-900/60 text-rose-300'
                : 'bg-emerald-950/30 border-emerald-900/60 text-emerald-300'
            )}
          >
            <div className="flex items-center space-x-2.5">
              {result.status === 'failed' ? (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <div>
                <span className="font-bold">
                  {result.status === 'failed' ? 'Reproduction Confirmed: ' : 'Fix Verified: '}
                </span>
                <span>
                  {result.status === 'failed'
                    ? 'Test failed as expected under buggy state.'
                    : 'All assertions passed with zero regressions.'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{(result.durationMs / 1000).toFixed(2)}s</span>
              </span>
              <span>Exit: {result.exitCode}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
