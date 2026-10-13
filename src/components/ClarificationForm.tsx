'use client';

import React, { useState } from 'react';
import { BugAnalysis, MissingQuestion, ClarificationSubmission, RawReport } from '@/types/bug';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  HelpCircle,
  CheckCircle2,
  Layers,
  ArrowRight,
  FileCheck2,
  Terminal,
  RotateCcw,
  Tag,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClarificationFormProps {
  analysis: BugAnalysis;
  rawReport?: RawReport;
  onGeneratePacket: (submission: ClarificationSubmission) => void;
  onBackToIntake?: () => void;
  isGenerating?: boolean;
}

export const ClarificationForm: React.FC<ClarificationFormProps> = ({
  analysis,
  rawReport,
  onGeneratePacket,
  onBackToIntake,
  isGenerating = false,
}) => {
  // Store user answers keyed by question ID
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    analysis.missingQuestions.forEach((q) => {
      if (q.answer) {
        initial[q.id] = q.answer;
      }
    });
    return initial;
  });

  const handleAnswerChange = (questionId: string, val: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: val,
    }));
  };

  const handleFillQuickAnswer = (questionId: string, quickVal: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: quickVal,
    }));
  };

  const totalQuestions = analysis.missingQuestions.length;
  const answeredCount = analysis.missingQuestions.filter(
    (q) => answers[q.id] && answers[q.id].trim().length > 0
  ).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGeneratePacket({
      analysisId: analysis.id,
      answers,
      rawReport: rawReport || { rawText: analysis.summary },
      analysis: {
        ...analysis,
        missingQuestions: analysis.missingQuestions.map((q) => ({
          ...q,
          answer: answers[q.id] || '',
        })),
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Ambiguity Status Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Badge variant="cyan" size="sm">
              Ambiguity Triage
            </Badge>
            <Badge variant="indigo" size="sm">
              {analysis.id || 'ANL-ACTIVE'}
            </Badge>
            {analysis.aiPowered ? (
              <Badge variant="cyan" size="sm" className="border-cyan-400 shadow-sm shadow-cyan-950 font-bold">
                <Sparkles className="w-3 h-3 mr-1 text-cyan-400" />
                {analysis.aiModel || 'Gemini AI'}
              </Badge>
            ) : (
              <Badge variant="slate" size="sm">
                {analysis.aiModel || 'Deterministic Engine'}
              </Badge>
            )}
            {analysis.severity && (
              <Badge
                variant={
                  analysis.severity === 'critical'
                    ? 'rose'
                    : analysis.severity === 'high'
                    ? 'amber'
                    : 'indigo'
                }
                size="sm"
              >
                {analysis.severity}
              </Badge>
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Ambiguity Resolution & Context Disambiguation</span>
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Patchwork extracted confident signals from the report. To construct an airtight developer packet, please clarify the key unknown vectors below.
          </p>
        </div>

        {/* Progress Pill */}
        <div className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="text-right">
            <div className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">
              Clarifications
            </div>
            <div className="text-lg font-bold font-mono text-cyan-400">
              {answeredCount}/{totalQuestions} Answered
            </div>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-slate-800 flex items-center justify-center relative">
            <span className="text-xs font-mono font-bold text-slate-200">
              {totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 100}%
            </span>
          </div>
        </div>
      </div>

      {/* 1. Parsed Knowns as Clear Badge Tags */}
      <Card accent="indigo">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Parsed Knowns (Extracted Signals)</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {analysis.knowns.length} verified signals
          </span>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {analysis.knowns.map((known, idx) => (
              <Badge
                key={idx}
                variant={idx % 2 === 0 ? 'indigo' : 'cyan'}
                size="md"
                className="py-1.5 px-3 text-xs tracking-normal normal-case font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 opacity-80" />
                {known}
              </Badge>
            ))}
          </div>

          {/* Quick Summary Pill */}
          <div className="mt-4 p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
            <span className="font-semibold text-cyan-300">Intake Summary: </span>
            {analysis.summary}
          </div>
        </CardContent>
      </Card>

      {/* 2. Dynamic Follow-Up Input Fields for Missing Questions */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card accent="cyan">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">
                Missing Context (Resolve Ambiguities)
              </h3>
            </div>
            <Badge variant="cyan" size="sm">
              Action Required
            </Badge>
          </CardHeader>

          <CardContent className="space-y-5">
            {analysis.missingQuestions.map((q: MissingQuestion, idx: number) => {
              const currentVal = answers[q.id] || '';
              const isFilled = currentVal.trim().length > 0;

              return (
                <div
                  key={q.id}
                  className={cn(
                    'p-4 rounded-xl border transition-all duration-150 space-y-2.5',
                    isFilled
                      ? 'bg-slate-950/70 border-emerald-500/40'
                      : 'bg-slate-950/90 border-slate-800 focus-within:border-cyan-500/80'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-md bg-slate-800 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <label
                        htmlFor={q.id}
                        className="text-xs font-semibold text-slate-100"
                      >
                        {q.question}
                      </label>
                    </div>

                    {isFilled ? (
                      <span className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Clarified
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-mono">
                        Ambiguous
                      </span>
                    )}
                  </div>

                  <input
                    id={q.id}
                    type="text"
                    value={currentVal}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder={q.placeholder || 'Type resolution details here...'}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
                  />

                  {/* Suggestion shortcut buttons */}
                  {q.category === 'payment_gateway' && (
                    <div className="flex items-center space-x-2 pt-1">
                      <span className="text-[10px] text-slate-500 font-mono">Quick select:</span>
                      {['Stripe Elements (Custom)', 'PayPal Checkout SDK', 'Stripe Hosted Checkout'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleFillQuickAnswer(q.id, opt)}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {q.category === 'device_os' && (
                    <div className="flex items-center space-x-2 pt-1">
                      <span className="text-[10px] text-slate-500 font-mono">Quick select:</span>
                      {['macOS Sequoia (Chrome 130)', 'Windows 11 (Firefox 131)', 'iOS 18 (Safari)'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleFillQuickAnswer(q.id, opt)}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {q.category === 'recovery_action' && (
                    <div className="flex items-center space-x-2 pt-1">
                      <span className="text-[10px] text-slate-500 font-mono">Quick select:</span>
                      {['Forced complete re-login (cart cleared)', 'Cookie recovered on refresh'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleFillQuickAnswer(q.id, opt)}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* 3. Initial Reproduction Steps & Expected/Actual Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Initial Reconstructed Steps
                </h3>
              </div>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-xs font-mono text-slate-300">
                {analysis.reproductionSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start space-x-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-cyan-400 font-bold shrink-0">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Behavior Contrast
                </h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
                <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold mb-1">
                  Expected Result:
                </div>
                <div className="text-slate-300">{analysis.expectedResult}</div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
                <div className="text-[10px] font-mono uppercase text-rose-400 font-bold mb-1">
                  Actual Result:
                </div>
                <div className="text-slate-300">{analysis.actualResult}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Footer */}
        <CardFooter className="flex items-center justify-between p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center space-x-2">
            {onBackToIntake && (
              <Button type="button" variant="secondary" size="md" onClick={onBackToIntake}>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Back to Raw Ingest</span>
              </Button>
            )}
          </div>

          <Button
            type="submit"
            variant="cyan"
            size="lg"
            isLoading={isGenerating}
            className="px-6"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Generate Developer Packet</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardFooter>
      </form>
    </div>
  );
};
