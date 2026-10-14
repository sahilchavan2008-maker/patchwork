export type UserRole = 'lead_engineer' | 'qa_architect' | 'security_auditor' | 'guest';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  avatarInitials: string;
  department: string;
  token?: string;
}
