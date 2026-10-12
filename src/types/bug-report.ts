export type BugSeverity = 'critical' | 'high' | 'medium' | 'low';

export type BugStatus =
  | 'draft'
  | 'intake_received'
  | 'clarification_needed'
  | 'analyzing'
  | 'resolved'
  | 'closed';

export type ReproducibilityLevel =
  | 'always'
  | 'intermittent'
  | 'rare'
  | 'unable_to_reproduce';

export interface EnvironmentInfo {
  os?: string;
  browser?: string;
  appVersion?: string;
  nodeVersion?: string;
  runtime?: string;
  device?: string;
}

export interface BugReportInput {
  title: string;
  summary: string;
  severity: BugSeverity;
  affectedComponent: string;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  environment?: EnvironmentInfo;
  errorLogs?: string;
  stackTrace?: string;
  tags?: string[];
}

export interface BugReport extends BugReportInput {
  id: string;
  createdAt: string;
  updatedAt: string;
  reporter?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  status: BugStatus;
  reproducibility: ReproducibilityLevel;
  rawIntakePayload?: string;
  clarificationRequired: boolean;
}
