'use client';

import React, { useState } from 'react';
import { Navbar, WorkflowStep } from '@/components/layout/Navbar';
import { IntakeForm } from '@/components/IntakeForm';
import { ClarificationForm } from '@/components/ClarificationForm';
import { DeveloperReportView } from '@/components/report/DeveloperReportView';
import { RawReport, BugAnalysis, ClarificationSubmission } from '@/types/bug';
import { DeveloperReport } from '@/types/analysis';
import { initialMockDeveloperReport } from '@/lib/mock-data';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('intake');
  const [rawReport, setRawReport] = useState<RawReport | null>(null);
  const [analysis, setAnalysis] = useState<BugAnalysis | null>(null);
  const [developerReport, setDeveloperReport] = useState<DeveloperReport>(
    initialMockDeveloperReport
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPacket, setIsGeneratingPacket] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Step 1: Analyze raw report via /api/analyze
  const handleAnalyzeReport = async (report: RawReport) => {
    setIsAnalyzing(true);
    setApiError(null);
    setRawReport(report);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }

      const data: BugAnalysis = await res.json();
      setAnalysis(data);
      setCurrentStep('clarification');
    } catch (err: unknown) {
      console.error('Error analyzing bug report:', err);
      setApiError(err instanceof Error ? err.message : 'Failed to analyze report.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 2: Generate developer packet after clarifying missing questions
  const handleGeneratePacket = (submission: ClarificationSubmission) => {
    setIsGeneratingPacket(true);

    setTimeout(() => {
      // Synthesize user clarifications into the final developer report
      const clarifiedAnswersSummary = Object.entries(submission.answers)
        .map(([qId, ans]) => {
          const qObj = submission.analysis.missingQuestions.find((q) => q.id === qId);
          return `${qObj?.question || qId}: "${ans}"`;
        })
        .join('; ');

      const totalQuestions = submission.analysis.missingQuestions.length;
      const answeredCount = Object.values(submission.answers).filter(
        (v) => v.trim().length > 0
      ).length;

      setDeveloperReport((prev) => ({
        ...prev,
        bugReportId: submission.analysis.id || prev.bugReportId,
        executiveSummary: `${submission.analysis.summary} Verified clarification factors: ${
          clarifiedAnswersSummary || 'Default runtime parameters assumed.'
        }`,
        resolvedAmbiguitiesCount: answeredCount,
        totalAmbiguitiesCount: totalQuestions,
        ambiguityStatus: answeredCount === totalQuestions ? 'fully_resolved' : 'partially_resolved',
        verifiedSteps: submission.analysis.reproductionSteps,
      }));

      setIsGeneratingPacket(false);
      setCurrentStep('report');
    }, 600);
  };

  const pendingQuestionsCount = analysis
    ? analysis.missingQuestions.filter((q) => !q.answer || q.answer.trim().length === 0).length
    : 3;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        clarificationCount={pendingQuestionsCount}
        isReportReady={!!analysis || currentStep === 'report'}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {apiError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
            <strong>Analysis Error:</strong> {apiError}
          </div>
        )}

        {/* Step 1: Intake Form */}
        {currentStep === 'intake' && (
          <IntakeForm
            onAnalyze={handleAnalyzeReport}
            isLoading={isAnalyzing}
          />
        )}

        {/* Step 2: Clarification Form */}
        {currentStep === 'clarification' && analysis && (
          <ClarificationForm
            analysis={analysis}
            rawReport={rawReport || undefined}
            onGeneratePacket={handleGeneratePacket}
            onBackToIntake={() => setCurrentStep('intake')}
            isGenerating={isGeneratingPacket}
          />
        )}

        {/* Fallback if user clicked clarification before analysis */}
        {currentStep === 'clarification' && !analysis && (
          <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="text-base font-semibold text-white mb-2">No Active Bug Ingest Found</h3>
            <p className="text-xs text-slate-400 mb-4">
              Please enter an unstructured bug report or select a preset in the Intake tab first.
            </p>
            <button
              onClick={() => setCurrentStep('intake')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium"
            >
              Go to Bug Intake &rarr;
            </button>
          </div>
        )}

        {/* Step 3: Developer Report View */}
        {currentStep === 'report' && (
          <DeveloperReportView
            report={developerReport}
            onBackToClarification={() => setCurrentStep('clarification')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>patchwork &bull; Ingest & Ambiguity Resolution Engine</span>
          <span className="text-slate-400">
            Phase 2: Live Ingest &bull; Known Extraction &bull; Disambiguation
          </span>
        </div>
      </footer>
    </div>
  );
}
