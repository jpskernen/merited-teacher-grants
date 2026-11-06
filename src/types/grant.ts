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

export interface ReviewerProfile {
  id: string;
  name: string;
  email: string;
  role: 'Reviewer' | 'NonVotingReviewer';
  cyclesServed: number; // e.g. 1, 2, 3...
  mailingAddress?: string; // for thank-you cards and swag
  shirtSize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';
  invitedAt?: string;
  magicLinkToken?: string;
  lastActiveAt?: string;
  reminderSent3Day?: boolean;
  reminderSent1Day?: boolean;
  thankYouSent?: boolean;
  notes?: string;
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
  grantCode?: string; // e.g. IGF2601 (format: [Program][Season][YY][Line])
  sequenceNumber?: number; // 1, 2, ...
  adminEligibility?: AdminEligibilityScreening; // Completed by admin before reviewer scoring
  assignedReviewerIds?: string[]; // Reviewer IDs assigned (empty or ['all'] means all reviewers)
  checkSent?: boolean; // When finance/foundation disburses check
  checkSentAt?: string;
  checkNumber?: string;
  checkAmount?: number;
  checkNotes?: string;
  poSubmittedAt?: string; // When teacher reports PO submitted
  eventDate?: string; // When teacher shares an upcoming showcase/project event date
  createdAt: string;
  updatedAt: string;
}

export interface RubricCriterion {
  id: string;
  order: number;
  title: string;
  formSource: string; // e.g. "Q9 Abstract", "Q7", "Q8, Q9", "Q10, Q11", "Q12", "Q14", "Q15", "Q13"
  helper: string;
  weight: number; // Exact points weight totaling 100: 15, 15, 20, 15, 10, 10, 10, 5
  levelDescriptors: {
    level1: string; // Missing or unclear
    level3: string; // Adequate
    level5: string; // Exceptional
  };
}

export interface EligibilityChecklist {
  eligibleApplicant: boolean; // NISD teacher or team in instruction or student support
  withinCategoryCap: boolean; // <= $1,500 (Cat 1) or <= $4,500 (Cat 2)
  acknowledgementsYes: boolean; // Q16, Q17, Q18 all "Yes" and e-signature present
  noProhibitedCosts: boolean; // No unaligned travel/training or items district already provides
  priorReportSubmitted: boolean; // Any past recipient has submitted final report
  checkedAt?: string;
  checkedBy?: string;
  notes?: string;
}

export interface AdminEligibilityScreening {
  passed: boolean;
  eligibleApplicant: boolean;
  withinCategoryCap: boolean;
  acknowledgementsYes: boolean;
  noProhibitedCosts: boolean;
  priorReportSubmitted: boolean;
  checkedBy: string;
  checkedAt: string;
  notes?: string;
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

export interface AdminNotificationSettings {
  largeRequestThreshold: number; // default 6000
  emailAdminOnLargeRequest: boolean; // default true
  notifyNewSubmission: boolean; // default true
  notifyThresholdExceeded: boolean; // default true
  notifyReviewerFinished: boolean; // default true
  notifyAllReviewsComplete: boolean; // default true
  notifyTeacherPoSubmitted: boolean; // default true
  notifyTeacherEventDate: boolean; // default true
  notifyFinalReportSubmitted: boolean; // default true
  adminEmailRecipient: string; // default e.g. director@nefgrants.org
}

export interface ProgramSettings {
  id: string;
  schoolYear: string;
  eligibilityDescription: string;
  applicationsOpenDate: string; // e.g. "October 21, 2026"
  callForGrantsDate?: string;
  applicationsDueDate: string; // default e.g. "November 11, 2026" (Closes at 11:59 PM)
  reviewClosesDate: string; // default e.g. "November 16, 2026" (Closes at 11:59 PM)
  awardsPresentedDate: string; // default e.g. "November 18, 2026" (before Thanksgiving)
  awardsAnnouncedDate?: string;
  spendingDeadlineDate: string; // e.g. "End of following school year (May 26, 2028)"
  category1Cap: number; // up to $1,500
  category2Cap: number; // up to $4,500 for campus teams (3+ teachers), departments & district-initiated
  availableFunds: number; // default $52,000 (editable)
  blindReviewEnabled: boolean;
  // Grant Code Configuration: [Program][Season][YY][Line] e.g. IGF2601
  cycleProgramCode: 'IG' | 'MG'; // IG = Innovative Grant, MG = Mini Grant
  cycleSeasonCode: 'F' | 'S'; // F = Fall, S = Spring
  cycleTwoDigitYear: string; // e.g. "26"
  // Admin Notification Settings
  notifications: AdminNotificationSettings;
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

