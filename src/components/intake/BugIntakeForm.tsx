'use client';

import React, { useState } from 'react';
import { BugReport, BugSeverity, ReproducibilityLevel } from '@/types/bug-report';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import {
  AlertTriangle,
  Send,
  Sparkles,
  Terminal,
  FileText,
  RotateCcw,
  CheckCircle2,
  Plus,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { initialMockBugReport } from '@/lib/mock-data';

interface BugIntakeFormProps {
  initialReport?: BugReport;
  onSubmit: (report: BugReport) => void;
  onAnalyze: () => void;
  isAnalyzing?: boolean;
}

export const BugIntakeForm: React.FC<BugIntakeFormProps> = ({
  initialReport = initialMockBugReport,
  onSubmit,
  onAnalyze,
  isAnalyzing = false,
}) => {
  const [report, setReport] = useState<BugReport>(initialReport);
  const [stepInputs, setStepInputs] = useState<string[]>(
    initialReport.stepsToReproduce && initialReport.stepsToReproduce.length > 0
      ? initialReport.stepsToReproduce
      : ['']
  );
  const [isSaved, setIsSaved] = useState(false);

  const severities: { label: string; value: BugSeverity; variant: 'rose' | 'amber' | 'indigo' | 'slate' }[] = [
    { label: 'Critical', value: 'critical', variant: 'rose' },
    { label: 'High', value: 'high', variant: 'amber' },
    { label: 'Medium', value: 'medium', variant: 'indigo' },
    { label: 'Low', value: 'low', variant: 'slate' },
  ];

  const reproducibilityOptions: { label: string; value: ReproducibilityLevel }[] = [
    { label: 'Always (100%)', value: 'always' },
    { label: 'Intermittent', value: 'intermittent' },
    { label: 'Rare (<10%)', value: 'rare' },
    { label: 'Unable to reproduce', value: 'unable_to_reproduce' },
  ];

  const handleStepChange = (index: number, val: string) => {
    const updated = [...stepInputs];
    updated[index] = val;
    setStepInputs(updated);
    setReport({ ...report, stepsToReproduce: updated });
  };

  const addStep = () => {
    setStepInputs([...stepInputs, '']);
  };

  const removeStep = (index: number) => {
    if (stepInputs.length <= 1) return;
    const updated = stepInputs.filter((_, i) => i !== index);
    setStepInputs(updated);
    setReport({ ...report, stepsToReproduce: updated });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...report,
      stepsToReproduce: stepInputs.filter((s) => s.trim() !== ''),
      updatedAt: new Date().toISOString(),
    };
    onSubmit(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleResetToDemo = () => {
    setReport(initialMockBugReport);
    setStepInputs(initialMockBugReport.stepsToReproduce);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <h2 className="text-base font-semibold text-white">Intake Engine</h2>
            <Badge variant="indigo" size="sm">Phase 1</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Provide structured bug symptom details, execution logs, and preconditions for ambiguity analysis.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleResetToDemo}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Load Sample Bug</span>
          </Button>

          <Button
            type="button"
            variant="cyan"
            size="sm"
            onClick={onAnalyze}
            isLoading={isAnalyzing}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Scan For Ambiguities</span>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Main Details Card */}
        <Card accent="indigo">
          <CardHeader>
            <div className="flex items-center space-x-2.5">
              <FileText className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-200">Incident Details & Triage</h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-mono">ID:</span>
              <span className="text-xs font-mono font-bold text-cyan-400">{report.id}</span>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <Input
              label="Bug Title / Incident Summary"
              placeholder="e.g. Memory leak in WebSocket reconnect loop"
              value={report.title}
              onChange={(e) => setReport({ ...report, title: e.target.value })}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Severity Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {severities.map((sev) => {
                    const isSelected = report.severity === sev.value;
                    return (
                      <button
                        key={sev.value}
                        type="button"
                        onClick={() => setReport({ ...report, severity: sev.value })}
                        className={cn(
                          'px-2 py-2 text-xs font-medium rounded-lg border text-center transition-all',
                          isSelected
                            ? 'bg-indigo-600/30 border-indigo-400 text-white font-semibold ring-1 ring-indigo-400 shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        )}
                      >
                        {sev.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Reproducibility
                </label>
                <select
                  value={report.reproducibility}
                  onChange={(e) =>
                    setReport({
                      ...report,
                      reproducibility: e.target.value as ReproducibilityLevel,
                    })
                  }
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  {reproducibilityOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="Affected Component / Subsystem"
              placeholder="e.g. auth/session-sync, client/checkout"
              value={report.affectedComponent}
              onChange={(e) => setReport({ ...report, affectedComponent: e.target.value })}
            />

            <Textarea
              label="Summary Description"
              rows={3}
              placeholder="Concise overview of what broke and who was impacted..."
              value={report.summary}
              onChange={(e) => setReport({ ...report, summary: e.target.value })}
            />
          </CardContent>
        </Card>

        {/* Reproduction Steps Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-200">Steps to Reproduce</h3>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addStep}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Step</span>
            </Button>
          </CardHeader>

          <CardContent className="space-y-3">
            {stepInputs.map((step, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-mono shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={step}
                  onChange={(e) => handleStepChange(idx, e.target.value)}
                  placeholder={`Step ${idx + 1} detail...`}
                  className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
                {stepInputs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStep(idx)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
              <Textarea
                label="Expected Behavior"
                rows={3}
                placeholder="What should have happened..."
                value={report.expectedBehavior}
                onChange={(e) => setReport({ ...report, expectedBehavior: e.target.value })}
              />

              <Textarea
                label="Actual Behavior"
                rows={3}
                placeholder="What actually occurred..."
                value={report.actualBehavior}
                onChange={(e) => setReport({ ...report, actualBehavior: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Diagnostic Logs & Stacktrace */}
        <Card accent="cyan">
          <CardHeader>
            <div className="flex items-center space-x-2.5">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-200">Diagnostics & Server Logs</h3>
            </div>
            <Badge variant="cyan" size="sm">Telemetric Capture</Badge>
          </CardHeader>

          <CardContent className="space-y-4">
            <Textarea
              label="Console / Telemetry Logs"
              rows={4}
              placeholder="Paste raw log output..."
              value={report.errorLogs || ''}
              onChange={(e) => setReport({ ...report, errorLogs: e.target.value })}
            />

            <Textarea
              label="Stack Trace"
              rows={3}
              placeholder="Exception stack trace..."
              value={report.stackTrace || ''}
              onChange={(e) => setReport({ ...report, stackTrace: e.target.value })}
            />
          </CardContent>

          <CardFooter className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              {isSaved ? (
                <span className="flex items-center text-emerald-400 space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Report intake saved!</span>
                </span>
              ) : (
                <span>All modifications preserved in session state.</span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <Button type="submit" variant="secondary" size="md">
                <Send className="w-4 h-4" />
                <span>Save Intake</span>
              </Button>
              <Button
                type="button"
                variant="cyan"
                size="md"
                onClick={onAnalyze}
                isLoading={isAnalyzing}
              >
                <Sparkles className="w-4 h-4" />
                <span>Analyze Ambiguities &rarr;</span>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};
