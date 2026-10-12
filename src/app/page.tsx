'use client';

import React, { useState } from 'react';
import { Navbar, WorkflowStep } from '@/components/layout/Navbar';
import { BugIntakeForm } from '@/components/intake/BugIntakeForm';
import { AmbiguityResolution } from '@/components/clarification/AmbiguityResolution';
import { DeveloperReportView } from '@/components/report/DeveloperReportView';
import {
  initialMockBugReport,
  initialMockAmbiguityAssessment,
  initialMockDeveloperReport,
} from '@/lib/mock-data';
import { BugReport } from '@/types/bug-report';
import { AmbiguityAssessment, DeveloperReport } from '@/types/analysis';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('intake');
  const [bugReport, setBugReport] = useState<BugReport>(initialMockBugReport);
  const [assessment, setAssessment] = useState<AmbiguityAssessment>(
    initialMockAmbiguityAssessment
  );
  const [developerReport, setDeveloperReport] = useState<DeveloperReport>(
    initialMockDeveloperReport
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const pendingQuestionsCount = assessment.questions.filter((q) => !q.isResolved).length;

  const handleIntakeSubmit = (updated: BugReport) => {
    setBugReport(updated);
  };

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setCurrentStep('clarification');
    }, 600);
  };

  const handleProceedToReport = () => {
    setIsGeneratingReport(true);
    setTimeout(() => {
      // Sync resolved count into report
      const resolvedCount = assessment.questions.filter((q) => q.isResolved).length;
      setDeveloperReport((prev) => ({
        ...prev,
        resolvedAmbiguitiesCount: resolvedCount,
        totalAmbiguitiesCount: assessment.questions.length,
        ambiguityStatus:
          resolvedCount === assessment.questions.length
            ? 'fully_resolved'
            : 'partially_resolved',
      }));
      setIsGeneratingReport(false);
      setCurrentStep('report');
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        clarificationCount={pendingQuestionsCount}
        isReportReady={true}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 'intake' && (
          <BugIntakeForm
            initialReport={bugReport}
            onSubmit={handleIntakeSubmit}
            onAnalyze={handleStartAnalysis}
            isAnalyzing={isAnalyzing}
          />
        )}

        {currentStep === 'clarification' && (
          <AmbiguityResolution
            assessment={assessment}
            onUpdateAssessment={setAssessment}
            onProceedToReport={handleProceedToReport}
            isGeneratingReport={isGeneratingReport}
          />
        )}

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
          <span>patchwork &bull; AI-Assisted Bug Clarification & Analysis</span>
          <span className="text-slate-400">
            Slate & Indigo/Cyan High-Contrast Theme System
          </span>
        </div>
      </footer>
    </div>
  );
}
