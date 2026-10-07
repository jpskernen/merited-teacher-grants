export type UserRole =
  | 'Teacher'
  | 'Reviewer'
  | 'NonVotingReviewer'
  | 'Admin'
  | 'Owner';

export type ApplicationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Principal Approval'
  | 'Under Review'
  | 'More Info Needed'
  | 'Funded'
  | 'Partially Funded'
  | 'Not Funded'
  | 'Final Report Due'
  | 'Complete';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  campus?: string;
  recusedAppIds: string[];
}

export interface BudgetItem {
  id: string;
  name: string;
  vendor: string;
  quantity: number;
  unitCost: number;
  shipping: number;
  productLink: string;
  consumable: boolean;
  isApprovedVendor: boolean;
  matchedApprovedVendor?: string;
  justification?: string;
}

export interface FinalReportData {
  outcomesVsObjectives: string;
  actualStudentImpact: number;
  summaryOfLearnings: string;
  receiptNotes: string;
  photoDescription?: string;
  submittedAt: string;
}

export interface Application {
  id: string;
  applicantEmail: string;
  applicantNames: Array<{ name: string; email: string }>;
  campus: string;
  gradeLevels: string[];
  subjectArea: string;
  category: 'Category 1' | 'Category 2';
  title: string;
  objectives: string;
  areaOfFocus: 'STEM' | 'Early Literacy/Numeracy' | 'Workforce/Career-Connected Learning' | 'Fine Arts' | 'Other';
  areaOfFocusOther?: string;
  abstract: string;
  amountRequested: number;
  studentsImpacted: number;
  evaluationStrategy: string;
  partners: string;
  sustainability: string;
  budgetItems: BudgetItem[];
  plainTextBudget: string;
  involvesTech: boolean;
  involvesFacilities: boolean;
  principalEmail?: string;
  techDirectorEmail?: string;
  facilityDirectorEmail?: string;
  principalApproved?: boolean;
  principalApprovedAt?: string;
  principalComment?: string;
  ackImplementation: boolean;
  ackProperty: boolean;
  ackApprovals: boolean;
  electronicSignature: string;
  signedAt: string;
  status: ApplicationStatus;
  statusReason?: string;
  committeeFeedback?: string;
  awardedAmount?: number;
  moreInfoQuestion?: string;
  moreInfoResponse?: string;
  moreInfoRespondedAt?: string;
  finalReport?: FinalReportData;
  createdAt: string;
  updatedAt: string;
}

export interface RubricCriterion {
  id: string;
  order: number;
  title: string;
  helper: string;
  weight: number; // 1 to 5 multiplier or standard weight
  levelDescriptors: {
    level1: string; // Missing or unclear
    level3: string; // Adequate
    level5: string; // Exceptional
  };
}

export interface EligibilityChecklist {
  eligibleApplicant: boolean;
  withinCategoryCap: boolean;
  acknowledgementsYes: boolean;
  noProhibitedCosts: boolean;
  priorReportSubmitted: boolean;
}

export interface Review {
  id: string;
  applicationId: string;
  reviewerEmail: string;
  reviewerName: string;
  isVoting: boolean;
  scores: Record<string, number>; // criterionId -> 1..5
  comments: Record<string, string>; // criterionId -> required comment
  totalScore: number; // weighted sum
  maxPossibleScore: number;
  percentageScore: number;
  eligibilityChecklist: EligibilityChecklist;
  generalFeedback: string;
  shareWithApplicant: boolean;
  recused: boolean;
  recusalReason?: string;
  submittedAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  applicationId: string;
  status: ApplicationStatus;
  title: string;
  description: string;
  actorEmail: string;
  actorRole: string;
  timestamp: string;
}

export interface ProgramSettings {
  id: string;
  schoolYear: string;
  callForGrantsDate: string;
  applicationsDueDate: string;
  awardsAnnouncedDate: string;
  spendingDeadlineDate: string;
  category1Cap: number;
  category2Cap: number;
  availableFunds: number;
  blindReviewEnabled: boolean;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  website: string;
  notes: string;
  isApproved: boolean;
}

export type AuditCategory =
  | 'Settings'
  | 'Vendors'
  | 'Rubric'
  | 'Awards & Decisions'
  | 'Inquiries'
  | 'System';

export interface AdminAuditLog {
  id: string;
  action: string;
  category: AuditCategory;
  details: string;
  userEmail: string;
  userName: string;
  userRole: UserRole;
  timestamp: string;
  metadata?: Record<string, any>;
}

