'use client';

import React, { useState } from 'react';
import { DeveloperReport } from '@/types/analysis';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  FileCode2,
  Copy,
  Check,
  ShieldCheck,
  CheckSquare,
  Square,
  Download,
  Share2,
} from 'lucide-react';
import { initialMockDeveloperReport } from '@/lib/mock-data';

interface DeveloperReportViewProps {
  report?: DeveloperReport;
  onBackToClarification?: () => void;
}

export const DeveloperReportView: React.FC<DeveloperReportViewProps> = ({
  report = initialMockDeveloperReport,
  onBackToClarification,
}) => {
  const [checklist, setChecklist] = useState(report.developerActionChecklist);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const toggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Badge variant="cyan" size="sm">
              Final Developer Report
            </Badge>
            <Badge variant="indigo" size="sm">
              {report.reportNumber}
            </Badge>
            <span className="text-xs text-slate-500 font-mono">
              Bug Ref: {report.bugReportId}
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Root Cause Diagnosis & Patch Blueprint
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Generated following automated ambiguity resolution and state trace synthesis.
          </p>
        </div>

        {/* Confidence & Regression Stats */}
        <div className="flex items-center space-x-4 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div className="text-center px-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
              Confidence
            </div>
            <div className="text-xl font-bold font-mono text-cyan-400">
              {Math.round(report.confidenceScore * 100)}%
            </div>
          </div>
          <div className="h-8 w-[1px] bg-slate-800" />
          <div className="text-center px-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
              Regression Risk
            </div>
            <div className="text-sm font-bold font-mono uppercase text-emerald-400">
              {report.regressionRisk}
            </div>
          </div>
          <div className="h-8 w-[1px] bg-slate-800" />
          <div className="text-center px-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
              Ambiguities
            </div>
            <div className="text-sm font-bold font-mono text-indigo-400">
              {report.resolvedAmbiguitiesCount}/{report.totalAmbiguitiesCount} Fixed
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary Card */}
      <Card accent="cyan">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Executive Diagnosis</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy(report.executiveSummary, 'exec')}
          >
            {copiedSection === 'exec' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span className="text-xs">Copy</span>
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-200 leading-relaxed font-sans">
            {report.executiveSummary}
          </p>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-mono text-slate-400">Impacted Modules:</span>
            {report.impactedComponents.map((comp, idx) => (
              <Badge key={idx} variant="slate" size="sm">
                {comp}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Primary Root Cause Hypothesis */}
      <Card accent="indigo">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FileCode2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">
              Primary Root Cause Hypothesis: {report.rootCause.title}
            </h3>
          </div>
          <Badge variant="indigo" size="sm">
            {Math.round(report.rootCause.probabilityScore * 100)}% Match
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed">
            {report.rootCause.rationale}
          </p>

          {report.rootCause.culpritFile && (
            <div className="flex items-center space-x-2 text-xs font-mono text-cyan-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500">Culprit Source:</span>
              <span className="font-semibold">{report.rootCause.culpritFile}</span>
              {report.rootCause.culpritFunction && (
                <span className="text-slate-400">
                  &rarr; {report.rootCause.culpritFunction}()
                </span>
              )}
            </div>
          )}

          {report.rootCause.codeSnippet && (
            <div className="relative group">
              <pre className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-rose-300 overflow-x-auto">
                <code>{report.rootCause.codeSnippet}</code>
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggested Fix & Code Patch Diff */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FileCode2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Suggested Code Patch</h3>
          </div>
          <Badge variant="cyan" size="sm">
            Diff Preview
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-slate-300">{report.suggestedFix.summary}</p>

          {report.suggestedFix.patches.map((patch, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden"
            >
              <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-slate-300">
                  {patch.filePath}
                </span>
                <span className="text-[11px] text-slate-400">{patch.explanation}</span>
              </div>

              <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs font-mono">
                {/* Original */}
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-rose-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Original (Vulnerable)</span>
                  </div>
                  <pre className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-lg text-rose-300 whitespace-pre-wrap">
                    <code>{patch.originalSnippet}</code>
                  </pre>
                </div>

                {/* Patched */}
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Patched (Safe)</span>
                  </div>
                  <pre className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-lg text-emerald-300 whitespace-pre-wrap">
                    <code>{patch.patchedSnippet}</code>
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Reproduction Script & Verification */}
      {report.reproductionScript && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <FileCode2 className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Automated Reproduction Test</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(report.reproductionScript || '', 'repro')}
            >
              {copiedSection === 'repro' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span className="text-xs">Copy Script</span>
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
              <code>{report.reproductionScript}</code>
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Developer Action Checklist */}
      <Card accent="indigo">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Actionable Next Steps</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {checklist.filter((c) => c.completed).length}/{checklist.length} Completed
          </span>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {checklist.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleChecklist(item.id)}
              className="w-full flex items-center space-x-3 p-3 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 rounded-lg text-left transition-colors"
            >
              {item.completed ? (
                <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-500 shrink-0" />
              )}
              <span
                className={`text-xs ${
                  item.completed ? 'line-through text-slate-500' : 'text-slate-200'
                }`}
              >
                {item.task}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Actions Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center space-x-2">
          {onBackToClarification && (
            <Button variant="secondary" size="sm" onClick={onBackToClarification}>
              &larr; Refine Clarifications
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleCopy(JSON.stringify(report, null, 2), 'json')}
          >
            {copiedSection === 'json' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
            <span>Export JSON</span>
          </Button>

          <Button
            variant="cyan"
            size="sm"
            onClick={() =>
              alert('Developer Report exported as Markdown & Patch summary!')
            }
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Report</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
