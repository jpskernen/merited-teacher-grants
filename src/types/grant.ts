export type UserRole =
  | 'admin'
  | 'reviewer'
  | 'teacher'
  | 'Admin'
  | 'Reviewer'
  | 'NonVotingReviewer';

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'more_info_needed'
  | 'funded'
  | 'partially_funded'
  | 'not_funded'
  | 'Draft'
  | 'Under Review'
  | 'More Info Needed'
  | 'Funded'
  | 'Partially Funded'
  | 'Not Funded';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  isVoting?: boolean;
}

export interface ReviewerProfile {
  id: string;
  name: string;
  email: string;
  role: 'reviewer' | 'Reviewer' | 'NonVotingReviewer' | 'admin' | 'Admin';
  isVoting: boolean;
  cyclesServed: number; // e.g. 1, 2, 3...
  mailingAddress?: string; // for thank-you cards and swag
  shirtSize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';
  invitedAt?: string;
  magicLinkSentAt?: string;
  magicLinkToken?: string;
  thankYouSent?: boolean;
  reminderSent3Day?: boolean;
  reminderSent1Day?: boolean;
  lastActiveAt?: string;
  notes?: string;
}

// Sensitive applicant personal identity details - strictly ADMIN-ONLY collection (/applicantIdentities/{applicationId})
export interface ApplicantIdentity {
  id: string; // matches applicationId
  applicationId: string;
  grantCode: string;
  applicantEmail: string;
  applicantNames: Array<{ name: string; email: string }>;
  campus: string;
  principalEmail?: string;
  electronicSignature?: string;
  signedAt?: string;
  importedTimestamp?: string;
  createdAt: string;
}

// Blind proposal content - viewable by reviewers and admins in /applications/{applicationId}
// Notice: NO applicant names, email, or campus are present here!
export interface Application {
  id: string;
  grantCode: string; // e.g. IGF2601
  sequenceNumber: number; // 1, 2, ...
  title: string;
  category: 'Category 1' | 'Category 2';
  gradeLevels: string[];
  subjectArea: string;
  objectives: string;
  areaOfFocus: 'STEM' | 'Early Literacy/Numeracy' | 'Workforce/Career-Connected Learning' | 'Fine Arts' | 'Other';
  areaOfFocusOther?: string;
  abstract: string;
  amountRequested: number;
  studentsImpacted: number;
  evaluationStrategy: string;
  partners: string;
  sustainability: string;
  plainTextBudget: string;
  involvesTech: boolean;
  involvesFacilities: boolean;
  status: ApplicationStatus;
  statusReason?: string;
  committeeFeedback?: string;
  awardedAmount?: number;
  adminEligibility?: AdminEligibilityScreening; // Admin pre-screening checklist
  assignedReviewerIds?: string[];
  isImportedFromGoogleForm?: boolean;
  rowTimestamp?: string; // Original Timestamp from Google Form
  teacherUid?: string;
  teacherEmail?: string;
  openedForReviewAt?: string;
  decisionEmailSentAt?: string;
  adminNotifiedAt?: string;
  reminderSentAt?: string;
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
  id: string; // ${applicationId}_${reviewerId}
  applicationId: string;
  reviewerId?: string;
  reviewerEmail: string;
  reviewerName: string;
  isVoting: boolean;
  scores: Record<string, number>; // criterionId -> 1..5
  comments: Record<string, string>; // criterionId -> required comment
  totalScore: number; // weighted sum out of 100
  generalFeedback?: string;
  recused: boolean;
  recusalReason?: string;
  flaggedForDiscussion?: boolean; // Highlighted for committee meeting
  isSubmitted?: boolean; // Separate from draft: locks review
  submittedAt?: string;
  updatedAt: string;
}

export interface AdminNotificationSettings {
  largeRequestThreshold: number; // default 6000
  emailAdminOnLargeRequest: boolean; // default true
  adminEmailRecipient: string; // default e.g. ewindham@nacisd.org
  notifyNewSubmission?: boolean;
  notifyReviewerFinished?: boolean;
  notifyAllReviewsComplete?: boolean;
  notifyTeacherPoSubmitted?: boolean;
  notifyTeacherEventDate?: boolean;
  notifyFinalReportSubmitted?: boolean;
  notifyThresholdExceeded?: boolean;
  [key: string]: any;
}

export interface ProgramSettings {
  id: string;
  program: string; // e.g. "IG"
  season: string; // e.g. "F"
  schoolYear: string; // e.g. "2026-2027"
  cycleTwoDigitYear: string; // e.g. "26"
  districtName: string; // e.g. "Nacogdoches ISD"
  callForGrantsDate: string;
  applicationsDueDate: string;
  reviewClosesDate: string; // e.g. "2026-11-16"
  awardsPresentedDate: string; // e.g. "2026-11-18"
  awardsAnnouncedDate?: string;
  spendingDeadlineDate?: string;
  blindReviewEnabled?: boolean;
  intakeMethod?: 'GoogleForm' | 'InApp';
  applicationIntakeMode?: 'InApp' | 'GoogleForm' | 'in_app' | 'google_form';
  applicationsOpenDate?: string;
  cycleProgramCode?: string;
  cycleSeasonCode?: string;
  eligibilityDescription?: string;
  category1Cap: number; // up to $1,500
  category2Cap: number; // up to $4,500
  availableFunds: number; // e.g. $52,000
  notificationThreshold: number; // e.g. $6,000
  adminEmailRecipient: string; // "ewindham@nacisd.org"
  notifications: AdminNotificationSettings;
  updatedAt: string;
}

export type AuditCategory =
  | 'Settings'
  | 'Import'
  | 'Rubric'
  | 'Awards & Decisions'
  | 'Reviewers'
  | 'Vendors'
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

export interface SentEmail {
  id: string;
  recipient: string;
  allRecipients?: string[];
  subject: string;
  type: string;
  delivered: boolean;
  simulated: boolean;
  timestamp: string;
  grantCode?: string | null;
  applicationId?: string | null;
  sentByUid?: string;
  sentByEmail?: string;
  messageId?: string;
  error?: string | null;
}

export interface InviteRecord {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'reviewer' | 'teacher';
  token: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  cyclesServed?: number;
  mailingAddress?: string;
  shirtSize?: string;
  notes?: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  revokedAt?: string;
  invitedByEmail?: string;
}

export interface LegalDocument {
  id: string; // 'terms' | 'privacy'
  title: string;
  content: string;
  updatedAt: string;
  updatedBy?: string;
}
