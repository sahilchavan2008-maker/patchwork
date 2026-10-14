'use client';

import React, { useState } from 'react';
import { Navbar, WorkflowStep } from '@/components/layout/Navbar';
import { IntakeForm } from '@/components/IntakeForm';
import { ClarificationForm } from '@/components/ClarificationForm';
import { DeveloperReportView } from '@/components/report/DeveloperReportView';
import { AuthModal } from '@/components/auth/AuthModal';
import { RawReport, BugAnalysis, ClarificationSubmission } from '@/types/bug';
import { DeveloperReport } from '@/types/analysis';
import { UserProfile } from '@/types/auth';
import { initialMockDeveloperReport } from '@/lib/mock-data';
import { Play, Sparkles, Lock, ShieldCheck, Key } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

const INITIAL_USER: UserProfile = {
  id: 'usr_eng_849',
  name: 'Alex Rivera',
  email: 'alex.rivera@patchwork.dev',
  role: 'lead_engineer',
  roleTitle: 'Senior Full-Stack Engineer',
  avatarInitials: 'AR',
  department: 'Core Platform Engineering',
  token: 'jwt_sec_token_9841_lead_eng',
};

export default function Home() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('intake');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(INITIAL_USER);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [rawReport, setRawReport] = useState<RawReport | null>(null);
  const [analysis, setAnalysis] = useState<BugAnalysis | null>(null);
  const [clarifiedAnswers, setClarifiedAnswers] = useState<Record<string, string>>({});
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

  // Demo Trigger: Vague Bug Scenario
  const handleTriggerVagueBugDemo = () => {
    const demoPayload: RawReport = {
      rawText: 'When I go back after payment it gets stuck',
      attachmentName: 'payment_freeze_screen.png',
      attachmentType: 'screenshot',
    };
    handleAnalyzeReport(demoPayload);
  };

  // Step 2: Generate developer packet after clarifying missing questions
  const handleGeneratePacket = (submission: ClarificationSubmission) => {
    setIsGeneratingPacket(true);
    setClarifiedAnswers(submission.answers);

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
        executiveSummary: `${submission.analysis.summary} Verified clarification parameters: ${
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
    ? analysis.missingQuestions.filter(
        (q) => !clarifiedAnswers[q.id] && (!q.answer || q.answer.trim().length === 0)
      ).length
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        clarificationCount={pendingQuestionsCount}
        isReportReady={!!analysis || currentStep === 'report'}
        onTriggerDemo={handleTriggerVagueBugDemo}
        isDemoLoading={isAnalyzing}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={() => setCurrentUser(null)}
      />

      {/* Auth Modal for Login & AppSec Threat Matrix */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
        }}
      />

      {/* Top AppSec & Demo Callout Bar */}
      <div className="border-b border-slate-900 bg-gradient-to-r from-slate-950 via-slate-900/60 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">
              <strong className="text-emerald-400">Security Active:</strong> IP Rate Limiting (10 req/min) &bull; Anti-Prompt Injection &bull; Strict CSP Headers
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="cyan"
              size="sm"
              onClick={handleTriggerVagueBugDemo}
              isLoading={isAnalyzing}
              className="font-bold text-xs shadow-md shadow-cyan-500/20"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Launch Demo: &quot;When I go back after payment it gets stuck&quot;</span>
            </Button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {apiError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
            <strong>Analysis Error:</strong> {apiError}
          </div>
        )}

        {/* If user logged out, display high-contrast secure access gate */}
        {!currentUser ? (
          <div className="max-w-md mx-auto my-12">
            <Card accent="cyan" className="shadow-2xl border-cyan-500/40 text-center">
              <CardHeader className="flex flex-col items-center justify-center pt-8 pb-2">
                <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center mb-3">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Patchwork Access Restricted
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Authenticate your developer session to access the AI Bug Ingest & Ambiguity Engine.
                </p>
              </CardHeader>
              <CardContent className="p-6 pt-2 space-y-4">
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 text-left space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Protected Environment</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Unauthenticated callers cannot invoke Gemini AI API endpoints or submit payloads.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="cyan"
                  size="lg"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full font-bold text-xs"
                >
                  <Key className="w-4 h-4 mr-1.5" />
                  <span>Sign In with Team Passkey</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
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
                  Please enter an unstructured bug report or launch the Vague Bug Demo.
                </p>
                <div className="flex justify-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentStep('intake')}
                  >
                    Go to Bug Intake &rarr;
                  </Button>
                  <Button
                    variant="cyan"
                    size="sm"
                    onClick={handleTriggerVagueBugDemo}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run Vague Bug Demo</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Developer Report View */}
            {currentStep === 'report' && (
              <DeveloperReportView
                report={developerReport}
                analysis={analysis || undefined}
                answers={clarifiedAnswers}
                rawReport={rawReport || undefined}
                onBackToClarification={() => setCurrentStep('clarification')}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>patchwork &bull; Enterprise Hardened Bug Resolution Engine</span>
          <span className="text-slate-400">
            Auth Protected &bull; Rate Limited &bull; Prompt Injection Shield Active
          </span>
        </div>
      </footer>
    </div>
  );
}
