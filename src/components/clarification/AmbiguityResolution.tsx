'use client';

import React, { useState } from 'react';
import {
  AmbiguityAssessment,
  ClarificationQuestion,
} from '@/types/analysis';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  HelpCircle,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Check,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { initialMockAmbiguityAssessment } from '@/lib/mock-data';

interface AmbiguityResolutionProps {
  assessment?: AmbiguityAssessment;
  onUpdateAssessment?: (updated: AmbiguityAssessment) => void;
  onProceedToReport: () => void;
  isGeneratingReport?: boolean;
}

export const AmbiguityResolution: React.FC<AmbiguityResolutionProps> = ({
  assessment = initialMockAmbiguityAssessment,
  onUpdateAssessment,
  onProceedToReport,
  isGeneratingReport = false,
}) => {
  const [currentData, setCurrentData] = useState<AmbiguityAssessment>(assessment);
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});

  const totalQuestions = currentData.questions.length;
  const resolvedQuestions = currentData.questions.filter((q) => q.isResolved).length;
  const progressPercent =
    totalQuestions > 0 ? Math.round((resolvedQuestions / totalQuestions) * 100) : 100;

  const handleSelectOption = (questionId: string, optionId: string, label: string) => {
    const updatedQuestions = currentData.questions.map((q) => {
      if (q.id === questionId) {
        return {
          ...q,
          selectedOptionId: optionId,
          userResponse: label,
          isResolved: true,
          resolvedAt: new Date().toISOString(),
        };
      }
      return q;
    });

    const newScore = Math.max(0, Math.round(currentData.score * (1 - 1 / totalQuestions)));
    const updated = {
      ...currentData,
      score: newScore,
      questions: updatedQuestions,
    };
    setCurrentData(updated);
    onUpdateAssessment?.(updated);
  };

  const handleCustomResponse = (questionId: string) => {
    const text = customAnswers[questionId];
    if (!text || !text.trim()) return;

    const updatedQuestions = currentData.questions.map((q) => {
      if (q.id === questionId) {
        return {
          ...q,
          selectedOptionId: undefined,
          userResponse: text.trim(),
          isResolved: true,
          resolvedAt: new Date().toISOString(),
        };
      }
      return q;
    });

    const newScore = Math.max(0, Math.round(currentData.score * (1 - 1 / totalQuestions)));
    const updated = {
      ...currentData,
      score: newScore,
      questions: updatedQuestions,
    };
    setCurrentData(updated);
    onUpdateAssessment?.(updated);
  };

  const handleResetQuestion = (questionId: string) => {
    const updatedQuestions = currentData.questions.map((q) => {
      if (q.id === questionId) {
        return {
          ...q,
          selectedOptionId: undefined,
          userResponse: undefined,
          isResolved: false,
          resolvedAt: undefined,
        };
      }
      return q;
    });

    const updated = {
      ...currentData,
      questions: updatedQuestions,
    };
    setCurrentData(updated);
    onUpdateAssessment?.(updated);
  };

  return (
    <div className="space-y-6">
      {/* Ambiguity Header Card with Slate / Indigo & Cyan Accents */}
      <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="cyan" size="sm">
                Ambiguity Engine
              </Badge>
              <Badge variant="slate" size="sm">
                Phase 2
              </Badge>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Clarification & Conflict Disambiguation</span>
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Patchwork extracted conflicting signals, missing state assumptions, and concurrency parameters from the intake report. Answering these eliminates developer guesswork.
            </p>
          </div>

          {/* Ambiguity Score Metric */}
          <div className="flex items-center space-x-6 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div className="text-right">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Resolution Progress
              </div>
              <div className="text-2xl font-black font-mono text-cyan-400">
                {resolvedQuestions}/{totalQuestions}
              </div>
              <div className="text-[10px] text-slate-500">queries answered</div>
            </div>

            <div className="w-16 h-16 rounded-full border-4 border-slate-800 flex items-center justify-center relative">
              <div
                className="absolute inset-0 rounded-full border-4 border-cyan-400 transition-all duration-500"
                style={{
                  clipPath: `polygon(0 0, 100% 0, 100% ${progressPercent}%, 0 ${progressPercent}%)`,
                }}
              />
              <span className="text-xs font-mono font-bold text-white">
                {progressPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 h-2 rounded-full mt-6 overflow-hidden border border-slate-800/80">
          <div
            className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Ambiguity Areas & Missing Context Tags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card accent="indigo">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Identified Ambiguity Vectors
              </h3>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {currentData.ambiguityAreas.map((area, idx) => (
                <li
                  key={idx}
                  className="flex items-center space-x-2.5 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card accent="cyan">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Missing Context Factors
              </h3>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {currentData.missingContextFactors.map((factor, idx) => (
                <li
                  key={idx}
                  className="flex items-center space-x-2.5 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Question Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Interactive Disambiguation Questionnaire</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {resolvedQuestions} of {totalQuestions} completed
          </span>
        </div>

        {currentData.questions.map((q: ClarificationQuestion, index: number) => {
          const isResolved = q.isResolved;

          return (
            <Card
              key={q.id}
              accent={isResolved ? 'cyan' : 'indigo'}
              className={cn(
                'transition-all duration-200',
                isResolved
                  ? 'border-emerald-500/30 bg-slate-900/60'
                  : 'border-slate-800 bg-slate-900/90'
              )}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold',
                      isResolved
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                    )}
                  >
                    Q{index + 1}
                  </div>
                  <div>
                    <span className="text-xs font-mono text-slate-400">{q.id}</span>
                    <h4 className="text-sm font-semibold text-white">{q.question}</h4>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      q.severity === 'high'
                        ? 'rose'
                        : q.severity === 'medium'
                        ? 'amber'
                        : 'slate'
                    }
                    size="sm"
                  >
                    {q.severity} ambiguity
                  </Badge>

                  {isResolved ? (
                    <Badge variant="emerald" size="sm">
                      <Check className="w-3 h-3 mr-1" />
                      Resolved
                    </Badge>
                  ) : (
                    <Badge variant="cyan" size="sm">
                      Needs Input
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Why this matters: </span>
                  {q.contextExplanation}
                </div>

                {/* Multiple choice options */}
                {q.options && q.options.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-mono uppercase tracking-wider text-slate-400">
                      Select clarification scenario:
                    </p>
                    <div className="grid grid-cols-1 gap-2.5">
                      {q.options.map((opt) => {
                        const isSelected = q.selectedOptionId === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSelectOption(q.id, opt.id, opt.label)}
                            className={cn(
                              'text-left p-3.5 rounded-xl border transition-all flex items-start space-x-3',
                              isSelected
                                ? 'bg-cyan-950/40 border-cyan-500/80 ring-1 ring-cyan-500 shadow-md shadow-cyan-950 text-slate-100'
                                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950/90 text-slate-300'
                            )}
                          >
                            <div
                              className={cn(
                                'w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0',
                                isSelected
                                  ? 'border-cyan-400 bg-cyan-500'
                                  : 'border-slate-600'
                              )}
                            >
                              {isSelected && <Check className="w-3 h-3 text-slate-950 font-bold" />}
                            </div>

                            <div className="flex-1">
                              <div className="text-xs font-semibold text-slate-200">
                                {opt.label}
                              </div>
                              {opt.description && (
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {opt.description}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Custom response option */}
                {!isResolved && (
                  <div className="pt-2">
                    <p className="text-xs text-slate-400 mb-1.5 font-mono">
                      Or specify custom architectural behavior:
                    </p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Provide custom explanation or requirement..."
                        value={customAnswers[q.id] || ''}
                        onChange={(e) =>
                          setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })
                        }
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCustomResponse(q.id)}
                      >
                        Submit Custom
                      </Button>
                    </div>
                  </div>
                )}

                {isResolved && (
                  <div className="flex items-center justify-between p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-lg text-xs text-emerald-300">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>
                        Clarified: <strong>{q.userResponse}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleResetQuestion(q.id)}
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Change</span>
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer Navigation */}
      <CardFooter className="flex items-center justify-between p-5 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="text-xs text-slate-400">
          {resolvedQuestions < totalQuestions ? (
            <span className="text-amber-400">
              Notice: {totalQuestions - resolvedQuestions} questions remain unresolved. Resolving all ensures maximum root-cause accuracy.
            </span>
          ) : (
            <span className="text-emerald-400 font-medium">
              All ambiguity criteria resolved. Engine ready to generate developer synthesis!
            </span>
          )}
        </div>

        <Button
          type="button"
          variant="cyan"
          size="md"
          onClick={onProceedToReport}
          isLoading={isGeneratingReport}
        >
          <span>Generate Developer Report</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardFooter>
    </div>
  );
};
