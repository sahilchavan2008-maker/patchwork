import { BugReport, BugSeverity } from './bug-report';

export type AmbiguitySeverity = 'high' | 'medium' | 'low';

export interface ClarificationOption {
  id: string;
  label: string;
  description?: string;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  contextExplanation: string;
  category: 'environment' | 'precondition' | 'payload' | 'expected_output' | 'concurrency';
  severity: AmbiguitySeverity;
  options?: ClarificationOption[];
  userResponse?: string;
  selectedOptionId?: string;
  isResolved: boolean;
  resolvedAt?: string;
}

export interface AmbiguityAssessment {
  score: number; // 0 to 100 where 100 is completely ambiguous
  ambiguityAreas: string[];
  missingContextFactors: string[];
  questions: ClarificationQuestion[];
  assessedAt: string;
}

export interface RootCauseHypothesis {
  id: string;
  title: string;
  probabilityScore: number; // 0 to 1
  rationale: string;
  culpritFile?: string;
  culpritFunction?: string;
  codeSnippet?: string;
}

export interface CodePatchDiff {
  filePath: string;
  originalSnippet: string;
  patchedSnippet: string;
  explanation: string;
}

export interface SuggestedFix {
  summary: string;
  patches: CodePatchDiff[];
  testingStrategy: string[];
  alternativeSolutions?: string[];
}

export interface DeveloperReport {
  id: string;
  reportNumber: string;
  bugReportId: string;
  generatedAt: string;
  executiveSummary: string;
  severity: BugSeverity;
  confidenceScore: number; // 0 to 1
  ambiguityStatus: 'fully_resolved' | 'partially_resolved' | 'unresolved';
  resolvedAmbiguitiesCount: number;
  totalAmbiguitiesCount: number;
  rootCause: RootCauseHypothesis;
  secondaryHypotheses?: RootCauseHypothesis[];
  reproductionScript?: string;
  verifiedSteps: string[];
  suggestedFix: SuggestedFix;
  impactedComponents: string[];
  regressionRisk: 'low' | 'medium' | 'high';
  developerActionChecklist: {
    id: string;
    task: string;
    completed: boolean;
  }[];
}

export interface PatchworkAnalysisState {
  bugReport: BugReport;
  ambiguityAssessment: AmbiguityAssessment;
  developerReport?: DeveloperReport;
  isAnalyzing: boolean;
  step: 'intake' | 'clarification' | 'report';
}
