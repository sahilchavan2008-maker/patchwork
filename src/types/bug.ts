export type AttachmentType = 'screenshot' | 'log' | 'recording' | 'har' | 'none';

export interface RawReport {
  rawText: string;
  attachmentType?: AttachmentType;
  attachmentName?: string;
  attachmentSize?: string;
  attachmentPreview?: string;
}

export interface MissingQuestion {
  id: string;
  question: string;
  category?: string;
  placeholder?: string;
  answer?: string;
}

export interface BugAnalysis {
  id?: string;
  summary: string;
  knowns: string[];
  missingQuestions: MissingQuestion[];
  reproductionSteps: string[];
  expectedResult: string;
  actualResult: string;
  environment?: {
    browser?: string;
    os?: string;
    device?: string;
    appVersion?: string;
    runtime?: string;
  };
  severity?: 'critical' | 'high' | 'medium' | 'low';
  confidenceScore?: number;
}

export interface ClarificationSubmission {
  analysisId?: string;
  answers: Record<string, string>; // questionId -> answer text
  rawReport: RawReport;
  analysis: BugAnalysis;
}
