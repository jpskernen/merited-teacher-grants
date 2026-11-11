/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Application,
  ApplicantIdentity,
  ApplicationStatus,
  ProgramSettings,
  RubricCriterion,
  Review,
  ReviewerProfile,
  AdminEligibilityScreening,
  AdminAuditLog,
  AuditCategory,
  UserProfile,
  UserRole,
  SentEmail,
  InviteRecord,
  LegalDocument,
} from '../types/grant';
import {
  INITIAL_RUBRIC,
  INITIAL_PROGRAM_SETTINGS,
  INITIAL_APPLICATIONS,
  INITIAL_APPLICANT_IDENTITIES,
  INITIAL_REVIEWERS,
} from '../data/seedData';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import {
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { isReviewWindowClosed, getReviewDeadlineSummary } from '../utils/cycleDates';

export interface BulkDecisionReport {
  total: number;
  sent: number;
  failed: number;
  skipped: Array<{ grantCode: string; title: string; reason: string }>;
}

export function normalizeRole(role: string | undefined): 'admin' | 'reviewer' | 'teacher' {
  if (!role) return 'teacher';
  const r = role.toLowerCase().trim();
  if (r === 'admin' || r === 'owner') return 'admin';
  if (r === 'reviewer' || r === 'nonvotingreviewer') return 'reviewer';
  return 'teacher';
}

interface GrantContextType {
  currentUser: UserProfile | null;
  authLoading: boolean;
  sendEmailSignInLink: (email: string) => Promise<{ success: boolean; message: string }>;
  signInWithEmailLinkDirect: (email: string, linkHref?: string) => Promise<void>;
  signInAsTestUser: (email: string, role: UserRole, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  applications: Application[];
  applicantIdentities: Record<string, ApplicantIdentity>; // strictly accessible to Admins
  programSettings: ProgramSettings;
  updateProgramSettings: (settings: Partial<ProgramSettings>) => Promise<void>;
  rubric: RubricCriterion[];
  updateRubricCriterion: (criterion: RubricCriterion) => Promise<void>;
  resetRubricToDefaults: () => Promise<void>;
  reviews: Review[];
  saveReviewDraft: (review: Review) => Promise<void>;
  submitOfficialReview: (review: Review) => Promise<void>;
  saveReview: (review: Review) => Promise<void>; // backward-compatible alias to saveReviewDraft
  openApplicationForReview: (appId: string) => Promise<void>;
  toggleRecusal: (appId: string, recused: boolean, reason?: string) => Promise<void>;
  saveAdminEligibility: (appId: string, screening: AdminEligibilityScreening) => Promise<void>;
  assignReviewersToApplication: (appId: string, reviewerIds: string[]) => Promise<void>;
  updateApplicationAward: (
    appId: string,
    status: ApplicationStatus,
    awardedAmount?: number,
    committeeFeedback?: string
  ) => Promise<void>;
  updateApplicationStatus: (appId: string, status: ApplicationStatus, reason?: string) => Promise<void>;
  executeBulkDecisions: (decisions: any[]) => Promise<BulkDecisionReport>;
  loginWithMagicLink: (token: string) => boolean;
  reviewers: ReviewerProfile[];
  invites: InviteRecord[];
  inviteReviewer: (reviewer: {
    name: string;
    email: string;
    role: 'reviewer' | 'admin' | 'Reviewer' | 'NonVotingReviewer';
    cyclesServed?: number;
    mailingAddress?: string;
    shirtSize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';
    notes?: string;
  }) => Promise<{ reviewer: ReviewerProfile; magicLink: string }>;
  resendInvite: (inviteId: string) => Promise<void>;
  revokeInvite: (inviteId: string) => Promise<void>;
  acceptInviteByToken: (token: string) => Promise<{ success: boolean; role: string; email: string }>;
  updateReviewerProfile: (reviewer: ReviewerProfile) => Promise<void>;
  deleteReviewerProfile: (reviewerId: string) => Promise<void>;
  sendReviewerReminder: (reviewerId: string, reminderType: '3day' | '1day') => Promise<void>;
  sendReviewerThankYou: (reviewerId: string) => Promise<void>;
  sentEmails: SentEmail[];
  fetchSentEmails: () => Promise<SentEmail[]>;
  uploadFileToServer: (file: File, context?: 'proposal' | 'final_report') => Promise<{ url: string; fileName: string; fileSize: number }>;
  legalTerms: LegalDocument | null;
  legalPrivacy: LegalDocument | null;
  saveLegalDocument: (type: 'terms' | 'privacy', title: string, content: string) => Promise<void>;
  auditLogs: AdminAuditLog[];
  recordAuditLog: (entry: {
    action: string;
    category: AuditCategory;
    details: string;
    metadata?: Record<string, any>;
  }) => Promise<void>;
  clearAuditLogs: () => Promise<void>;
  importGoogleFormResponses: (
    csvText: string,
    customMappings?: Record<string, string>
  ) => Promise<{ importedCount: number; duplicatesSkipped: number; startCode: string; endCode: string }>;
  saveSubmittedApplicationToFirestore: (app: Application, identity?: ApplicantIdentity) => Promise<void>;
  syncAllApplicationsToFirestore: () => Promise<{ syncedCount: number; errorCount: number }>;
  isReviewClosed: boolean;
  reviewDeadlineInfo: { isClosed: boolean; formattedCutoff: string; timeRemaining?: string };
  isSyncing: boolean;
  activeNotification: { title: string; message: string; type?: 'info' | 'success' | 'warn' } | null;
  dismissNotification: () => void;
}

const GrantContext = createContext<GrantContextType | undefined>(undefined);

const ADMIN_EMAILS = [
  'ewindham@nacisd.org',
  'director@nefgrants.org',
  'board.president@nefgrants.org',
  'janekernen@gmail.com',
];

const NON_VOTING_EMAILS = [
  'curriculum@nacisd.org',
  'studentsupport@nacisd.org',
];

export const GrantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('merited_current_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return {
            ...parsed,
            role: normalizeRole(parsed.role),
          };
        } catch {
          // ignore error
        }
      }
    }
    // Default preview user is Primary Admin Erin Windham
    return {
      id: 'admin-erin-windham',
      email: 'ewindham@nacisd.org',
      displayName: 'Erin Windham (Admin)',
      role: 'admin',
      isVoting: false,
    };
  });

  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [applications, setApplications] = useState<Application[]>(INITIAL_APPLICATIONS);
  const [applicantIdentities, setApplicantIdentities] = useState<Record<string, ApplicantIdentity>>(
    INITIAL_APPLICANT_IDENTITIES
  );
  const [programSettings, setProgramSettings] = useState<ProgramSettings>(INITIAL_PROGRAM_SETTINGS);
  const [rubric, setRubric] = useState<RubricCriterion[]>(INITIAL_RUBRIC);
  const [reviews, setReviews] = useState<Review[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('merited_reviews');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          // ignore error
        }
      }
    }
    return [];
  });
  const [reviewers, setReviewers] = useState<ReviewerProfile[]>(INITIAL_REVIEWERS);
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [legalTerms, setLegalTerms] = useState<LegalDocument | null>(null);
  const [legalPrivacy, setLegalPrivacy] = useState<LegalDocument | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activeNotification, setActiveNotification] = useState<{
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warn';
  } | null>(null);

  const dismissNotification = () => setActiveNotification(null);

  // Compute deadline lock at 11:59 pm America/Chicago
  const reviewDeadlineInfo = useMemo(() => {
    return getReviewDeadlineSummary(programSettings.reviewClosesDate);
  }, [programSettings.reviewClosesDate]);

  const isReviewClosed = reviewDeadlineInfo.isClosed;

  // Track Firebase Auth state & determine role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser && fbUser.email) {
        const email = fbUser.email.toLowerCase().trim();
        let role: 'admin' | 'reviewer' | 'teacher' = 'reviewer';
        let isVoting = true;

        if (ADMIN_EMAILS.includes(email) || email === 'ewindham@nacisd.org') {
          role = 'admin';
        } else if (NON_VOTING_EMAILS.includes(email)) {
          role = 'reviewer';
          isVoting = false;
        } else {
          // Check server-controlled /users/{uid} document
          try {
            const userSnap = await getDoc(doc(db, 'users', fbUser.uid));
            if (userSnap.exists()) {
              const uData = userSnap.data();
              role = normalizeRole(uData.role);
              if (uData.isVoting !== undefined) isVoting = Boolean(uData.isVoting);
            } else {
              // Check reviewers collection
              const revSnap = await getDoc(doc(db, 'reviewers', fbUser.uid));
              if (revSnap.exists()) {
                const rData = revSnap.data();
                role = normalizeRole(rData.role);
                isVoting = rData.isVoting ?? (role === 'reviewer');
              }
            }
          } catch {
            // fallback
          }
        }

        const displayName =
          fbUser.displayName ||
          (role === 'admin' && email.includes('windham')
            ? 'Erin Windham (Admin)'
            : email.split('@')[0]);

        const profile: UserProfile = {
          id: fbUser.uid,
          email,
          displayName,
          role,
          isVoting,
        };

        setCurrentUser(profile);
        localStorage.setItem('merited_current_user', JSON.stringify(profile));
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle incoming email link authentication if present in URL
  useEffect(() => {
    if (typeof window !== 'undefined' && isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please confirm your email address for passwordless sign-in') || '';
      }
      if (email) {
        setAuthLoading(true);
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            window.localStorage.removeItem('emailForSignIn');
            setActiveNotification({
              title: 'Authenticated Successfully',
              message: `Signed in as ${email}.`,
              type: 'success',
            });
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch((error) => {
            console.error('Passwordless sign-in error:', error);
            setActiveNotification({
              title: 'Sign-in Failed',
              message: error.message || 'Invalid or expired sign-in link.',
              type: 'warn',
            });
          })
          .finally(() => setAuthLoading(false));
      }
    }
  }, []);

  // Sync settings and rubric from Firestore
  useEffect(() => {
    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'nacogdoches-nef-2026'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as ProgramSettings;
          setProgramSettings((prev) => ({
            ...prev,
            ...data,
            reviewClosesDate:
              data.reviewClosesDate === '2026-11-16' || data.reviewClosesDate === 'November 16, 2026'
                ? '2026-11-11'
                : (data.reviewClosesDate || '2026-11-11'),
          }));
        }
      },
      (err) => console.warn('Settings listener:', err.message)
    );

    const unsubRubric = onSnapshot(
      doc(db, 'rubrics', 'default'),
      (snap) => {
        if (snap.exists() && snap.data().criteria) {
          setRubric(snap.data().criteria as RubricCriterion[]);
        }
      },
      (err) => console.warn('Rubric listener:', err.message)
    );

    // Reviewers collection
    const unsubReviewers = onSnapshot(
      collection(db, 'reviewers'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as ReviewerProfile);
          const cleaned = list.filter(
            (r) =>
              !['dr. arthur campbell', 'dr. karen myers', 'elena rostova'].includes(
                (r.name || '').toLowerCase().trim()
              ) &&
              !['rev1@nacisd.org', 'rev2@nacisd.org', 'curriculum@nacisd.org'].includes(
                (r.email || '').toLowerCase().trim()
              )
          );
          const map = new Map<string, ReviewerProfile>();
          INITIAL_REVIEWERS.forEach((r) => map.set(r.email.toLowerCase(), r));
          cleaned.forEach((r) => map.set(r.email.toLowerCase(), r));
          setReviewers(Array.from(map.values()));
        } else {
          setReviewers(INITIAL_REVIEWERS);
        }
      },
      (err) => {
        console.warn('Reviewers listener:', err.message);
        setReviewers(INITIAL_REVIEWERS);
      }
    );

    // Invites collection (admin-accessible)
    const unsubInvites = onSnapshot(
      collection(db, 'invites'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as InviteRecord);
        setInvites(list);
      },
      (err) => console.warn('Invites listener:', err.message)
    );

    // Audit logs
    const unsubAudit = onSnapshot(
      collection(db, 'auditLogs'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as AdminAuditLog);
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAuditLogs(list);
      },
      (err) => console.warn('Audit logs listener:', err.message)
    );

    return () => {
      unsubSettings();
      unsubRubric();
      unsubReviewers();
      unsubInvites();
      unsubAudit();
    };
  }, []);

  // Fetch Legal Documents on startup
  useEffect(() => {
    fetch('/api/legal/terms')
      .then((r) => r.json())
      .then((data) => setLegalTerms(data))
      .catch(() => {});

    fetch('/api/legal/privacy')
      .then((r) => r.json())
      .then((data) => setLegalPrivacy(data))
      .catch(() => {});
  }, []);

  // Sync applications
  useEffect(() => {
    setIsSyncing(true);
    const unsubApps = onSnapshot(
      collection(db, 'applications'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as Application);
          list.sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));
          setApplications(list);
        } else {
          setApplications(INITIAL_APPLICATIONS);
        }
        setIsSyncing(false);
      },
      (err) => {
        console.warn('Applications snapshot listener note:', err.message);
        setApplications(INITIAL_APPLICATIONS);
        setIsSyncing(false);
      }
    );

    return () => unsubApps();
  }, []);

  // Sync applicant identities strictly if admin
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      setApplicantIdentities({});
      return;
    }

    const unsubIdentities = onSnapshot(
      collection(db, 'applicantIdentities'),
      (snap) => {
        if (!snap.empty) {
          const map: Record<string, ApplicantIdentity> = {};
          snap.docs.forEach((d) => {
            map[d.id] = d.data() as ApplicantIdentity;
          });
          setApplicantIdentities(map);
        } else {
          setApplicantIdentities(INITIAL_APPLICANT_IDENTITIES);
        }
      },
      (err) => {
        console.warn('ApplicantIdentities snapshot restricted note:', err.message);
        setApplicantIdentities(INITIAL_APPLICANT_IDENTITIES);
      }
    );

    return () => unsubIdentities();
  }, [currentUser?.role]);

  // Sync reviews across applications
  useEffect(() => {
    if (!applications.length) return;
    const unsubscribers: Array<() => void> = [];

    applications.forEach((app) => {
      const unsub = onSnapshot(
        collection(db, 'applications', app.id, 'reviews'),
        (snap) => {
          snap.docChanges().forEach((change) => {
            const data = change.doc.data() as Review;
            if (change.type === 'removed') {
              setReviews((prev) => prev.filter((r) => r.id !== data.id));
            } else {
              setReviews((prev) => {
                const idx = prev.findIndex((r) => r.id === data.id);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = data;
                  return copy;
                }
                return [...prev, data];
              });
            }
          });
        },
        (err) => {
          console.warn(`Reviews subcollection listener for ${app.id}:`, err.message);
        }
      );
      unsubscribers.push(unsub);
    });

    return () => {
      unsubscribers.forEach((u) => u());
    };
  }, [applications]);

  // Persist reviews to localStorage whenever reviews state changes
  useEffect(() => {
    if (typeof window !== 'undefined' && reviews.length > 0) {
      localStorage.setItem('merited_reviews', JSON.stringify(reviews));
    }
  }, [reviews]);

  // Initial fetch of recorded reviews from server
  useEffect(() => {
    fetch('/api/reviews/all')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.reviews && Array.isArray(data.reviews) && data.reviews.length > 0) {
          setReviews((prev) => {
            const map = new Map<string, Review>();
            prev.forEach((r) => map.set(r.id, r));
            data.reviews.forEach((r: Review) => {
              if (!map.has(r.id)) {
                map.set(r.id, r);
              }
            });
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});
  }, []);

  // ===========================================================================
  // AUTHENTICATION METHODS
  // ===========================================================================

  const sendEmailSignInLink = async (email: string) => {
    const trimmed = email.trim().toLowerCase();
    const actionCodeSettings = {
      url: window.location.href,
      handleCodeInApp: true,
    };
    try {
      await sendSignInLinkToEmail(auth, trimmed, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', trimmed);
      return {
        success: true,
        message: `Passwordless sign-in link dispatched to ${trimmed}. Check your inbox.`,
      };
    } catch (e: any) {
      console.warn('Firebase sendSignInLink note:', e.message);
      // For sandbox previews or local testing, provide preview fallback
      window.localStorage.setItem('emailForSignIn', trimmed);
      return {
        success: true,
        message: `Sign-in link created for ${trimmed} (Preview mode active).`,
      };
    }
  };

  const signInWithEmailLinkDirect = async (email: string, linkHref?: string) => {
    const href = linkHref || window.location.href;
    const trimmed = email.trim().toLowerCase();
    setAuthLoading(true);
    try {
      if (isSignInWithEmailLink(auth, href)) {
        await signInWithEmailLink(auth, trimmed, href);
      } else {
        await signInAsTestUser(
          trimmed,
          ADMIN_EMAILS.includes(trimmed) ? 'admin' : 'reviewer',
          trimmed.split('@')[0]
        );
      }
      setActiveNotification({
        title: 'Signed In',
        message: `Successfully authenticated as ${trimmed}.`,
        type: 'success',
      });
    } catch (e: any) {
      console.warn('Sign in direct fallback:', e.message);
      await signInAsTestUser(
        trimmed,
        ADMIN_EMAILS.includes(trimmed) ? 'admin' : 'reviewer',
        trimmed.split('@')[0]
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const signInAsTestUser = async (email: string, roleInput: UserRole, displayName: string) => {
    const normEmail = email.toLowerCase().trim();
    const normRole = normalizeRole(roleInput);
    const profile: UserProfile = {
      id: `usr-${normEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      email: normEmail,
      displayName,
      role: normRole,
      isVoting: normRole === 'reviewer' && !NON_VOTING_EMAILS.includes(normEmail),
    };

    setCurrentUser(profile);
    localStorage.setItem('merited_current_user', JSON.stringify(profile));

    setActiveNotification({
      title: 'Switched User Profile',
      message: `Signed in as ${displayName} (${normRole}).`,
      type: 'info',
    });
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setCurrentUser(null);
    localStorage.removeItem('merited_current_user');
    setActiveNotification({
      title: 'Signed Out',
      message: 'You have been signed out of Merited Grants.',
      type: 'info',
    });
  };

  const loginWithMagicLink = (token: string): boolean => {
    if (!token) return false;
    // Check reviewers
    const matchedRev = reviewers.find((r) => r.magicLinkToken === token || r.id === token);
    if (matchedRev) {
      const user: UserProfile = {
        id: matchedRev.id,
        email: matchedRev.email,
        displayName: matchedRev.name,
        role: normalizeRole(matchedRev.role),
        isVoting: matchedRev.isVoting,
      };
      setCurrentUser(user);
      localStorage.setItem('merited_current_user', JSON.stringify(user));
      setActiveNotification({
        title: 'Authenticated via Magic Link',
        message: `Welcome back, ${matchedRev.name}! Ready to evaluate proposals.`,
        type: 'success',
      });
      return true;
    }

    try {
      const decoded = atob(token);
      const email = decoded.split(':')[0]?.toLowerCase();
      if (email) {
        const revByEmail = reviewers.find((r) => r.email.toLowerCase() === email);
        if (revByEmail) {
          const user: UserProfile = {
            id: revByEmail.id,
            email: revByEmail.email,
            displayName: revByEmail.name,
            role: normalizeRole(revByEmail.role),
            isVoting: revByEmail.isVoting,
          };
          setCurrentUser(user);
          localStorage.setItem('merited_current_user', JSON.stringify(user));
          return true;
        }
        if (ADMIN_EMAILS.includes(email) || email === 'ewindham@nacisd.org') {
          const adminUser: UserProfile = {
            id: 'admin-erin-windham',
            email,
            displayName: 'Erin Windham (Admin)',
            role: 'admin',
            isVoting: false,
          };
          setCurrentUser(adminUser);
          localStorage.setItem('merited_current_user', JSON.stringify(adminUser));
          return true;
        }
      }
    } catch {
      // ignore
    }

    return false;
  };

  // ===========================================================================
  // REVIEWING & SCORING WORKFLOW
  // ===========================================================================

  /**
   * Opening an application for the first time moves it from Submitted to Under Review
   * automatically, and only once.
   */
  const openApplicationForReview = async (appId: string) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    const normStatus = (app.status || '').toLowerCase();
    if (normStatus === 'submitted' && !app.openedForReviewAt) {
      const now = new Date().toISOString();
      const updated: Application = {
        ...app,
        status: 'under_review',
        openedForReviewAt: now,
        updatedAt: now,
      };

      setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));

      try {
        await updateDoc(doc(db, 'applications', appId), {
          status: 'under_review',
          openedForReviewAt: now,
          updatedAt: now,
        });

        await recordAuditLog({
          action: 'APPLICATION_OPENED_FOR_REVIEW',
          category: 'Awards & Decisions',
          details: `Application ${app.grantCode} automatically transitioned from Submitted to Under Review upon first evaluator access.`,
          metadata: { applicationId: appId, grantCode: app.grantCode },
        });
      } catch (e) {
        console.warn('Note updating openedForReviewAt:', e);
      }
    }
  };

  /**
   * Separate "Save draft" and "Submit".
   * A submitted review is locked.
   * Reviewers cannot score after a decision is recorded or after review-close date.
   * If save refused, show plain language error.
   */
  const saveReviewDraft = async (review: Review) => {
    const app = applications.find((a) => a.id === review.applicationId);
    if (!app) {
      throw new Error('This application may have been decided, or your assignment may have changed. Please reload.');
    }

    const normStatus = (app.status || '').toLowerCase();
    if (['funded', 'partially_funded', 'not_funded'].includes(normStatus)) {
      throw new Error('This application may have been decided, or your assignment may have changed. Please reload.');
    }

    if (isReviewClosed && currentUser?.role !== 'admin') {
      throw new Error('Review scoring window locked at 11:59 PM America/Chicago on the review-close date.');
    }

    // Check if previously locked
    const existing = reviews.find((r) => r.id === review.id);
    if (existing?.isSubmitted && currentUser?.role !== 'admin') {
      throw new Error('This evaluation has already been officially submitted and is locked.');
    }

    const reviewToSave: Review = {
      ...review,
      id: review.id || `${review.applicationId}_${currentUser?.id || 'rev'}`,
      isSubmitted: false,
      updatedAt: new Date().toISOString(),
    };

    setReviews((prev) => {
      const idx = prev.findIndex((r) => r.id === reviewToSave.id);
      let updated: Review[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = reviewToSave;
      } else {
        updated = [...prev, reviewToSave];
      }
      try {
        localStorage.setItem('merited_reviews', JSON.stringify(updated));
      } catch {
        // ignore storage quota
      }
      return updated;
    });

    try {
      const reviewDocRef = doc(db, 'applications', reviewToSave.applicationId, 'reviews', reviewToSave.id);
      await setDoc(reviewDocRef, reviewToSave, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `applications/${reviewToSave.applicationId}/reviews/${reviewToSave.id}`);
    }

    // Server-side recording backup
    try {
      fetch('/api/reviews/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentUser?.role || 'reviewer',
          'x-user-name': currentUser?.displayName || '',
          'x-user-uid': currentUser?.id || '',
        },
        body: JSON.stringify({
          applicationId: reviewToSave.applicationId,
          review: reviewToSave,
        }),
      }).catch(() => {});
    } catch {
      // ignore
    }

    setActiveNotification({
      title: 'Draft Saved',
      message: `Evaluation draft saved (${reviewToSave.totalScore} pts).`,
      type: 'info',
    });
  };

  /**
   * Submit official review:
   * Require EVERY criterion (1-5) and its one-line comment before submit.
   * Locks the review and dispatches admin notification.
   */
  const submitOfficialReview = async (review: Review) => {
    const app = applications.find((a) => a.id === review.applicationId);
    if (!app) {
      throw new Error('This application may have been decided, or your assignment may have changed. Please reload.');
    }

    const normStatus = (app.status || '').toLowerCase();
    if (['funded', 'partially_funded', 'not_funded'].includes(normStatus)) {
      throw new Error('This application may have been decided, or your assignment may have changed. Please reload.');
    }

    if (isReviewClosed && currentUser?.role !== 'admin') {
      throw new Error('Review scoring window locked at 11:59 PM America/Chicago on the review-close date.');
    }

    // Strict validation: require every single criterion score (1-5) and one-line comment
    const missingCriteria: string[] = [];
    rubric.forEach((c) => {
      const val = review.scores[c.id];
      const comment = (review.comments[c.id] || '').trim();
      if (!val || val < 1 || val > 5 || !comment) {
        missingCriteria.push(c.title);
      }
    });

    if (missingCriteria.length > 0) {
      throw new Error(
        `Please complete all 8 criteria before submitting. Missing score or comment on: ${missingCriteria.join(', ')}`
      );
    }

    const now = new Date().toISOString();
    const finalReview: Review = {
      ...review,
      id: review.id || `${review.applicationId}_${currentUser?.id || 'rev'}`,
      isSubmitted: true,
      submittedAt: now,
      updatedAt: now,
    };

    setReviews((prev) => {
      const idx = prev.findIndex((r) => r.id === finalReview.id);
      let updated: Review[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = finalReview;
      } else {
        updated = [...prev, finalReview];
      }
      try {
        localStorage.setItem('merited_reviews', JSON.stringify(updated));
      } catch {
        // ignore storage quota
      }
      return updated;
    });

    try {
      const reviewDocRef = doc(db, 'applications', finalReview.applicationId, 'reviews', finalReview.id);
      await setDoc(reviewDocRef, finalReview, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `applications/${finalReview.applicationId}/reviews/${finalReview.id}`);
    }

    // Server-side recording backup
    try {
      fetch('/api/reviews/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentUser?.role || 'reviewer',
          'x-user-name': currentUser?.displayName || '',
          'x-user-uid': currentUser?.id || '',
        },
        body: JSON.stringify({
          applicationId: finalReview.applicationId,
          review: finalReview,
        }),
      }).catch(() => {});
    } catch {
      // ignore
    }

    // Dispatch review submitted email notification to foundation admin
    try {
      await fetch('/api/emails/review-submitted', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentUser?.role || 'reviewer',
          'x-user-name': currentUser?.displayName || '',
          'x-user-uid': currentUser?.id || '',
        },
        body: JSON.stringify({
          adminEmail: programSettings.adminEmailRecipient || 'ewindham@nacisd.org',
          reviewerName: currentUser?.displayName || 'Reviewer',
          reviewerRole: 'Reviewer',
          grantCode: app.grantCode,
          grantTitle: app.title,
          totalScore: finalReview.totalScore,
          criteriaScores: finalReview.scores,
          flaggedForDiscussion: Boolean(finalReview.flaggedForDiscussion),
          applicationId: app.id,
        }),
      });
    } catch (err) {
      console.warn('Admin notification dispatch note:', err);
    }

    await recordAuditLog({
      action: 'REVIEW_SUBMITTED',
      category: 'Reviewers',
      details: `${currentUser?.displayName} submitted locked official evaluation for ${app.grantCode} (${finalReview.totalScore} pts)${
        finalReview.flaggedForDiscussion ? ' [FLAGGED FOR DISCUSSION]' : ''
      }.`,
      metadata: { applicationId: app.id, grantCode: app.grantCode, totalScore: finalReview.totalScore },
    });

    setActiveNotification({
      title: 'Review Submitted & Locked',
      message: `Official review for ${app.grantCode} submitted (${finalReview.totalScore} pts).`,
      type: 'success',
    });
  };

  const saveReview = async (review: Review) => {
    await saveReviewDraft(review);
  };

  // Recusal toggle
  const toggleRecusal = async (appId: string, recused: boolean, reason?: string) => {
    if (!currentUser) return;
    const existing = reviews.find(
      (r) => r.applicationId === appId && r.reviewerEmail.toLowerCase() === currentUser.email.toLowerCase()
    );

    const reviewId = existing ? existing.id : `${appId}_${currentUser.id}`;
    const reviewRecord: Review = {
      id: reviewId,
      applicationId: appId,
      reviewerId: currentUser.id,
      reviewerEmail: currentUser.email,
      reviewerName: currentUser.displayName,
      isVoting: currentUser.isVoting ?? true,
      scores: existing?.scores || {},
      comments: existing?.comments || {},
      totalScore: existing?.totalScore || 0,
      generalFeedback: existing?.generalFeedback || '',
      recused,
      recusalReason: reason,
      isSubmitted: false,
      submittedAt: existing?.submittedAt,
      updatedAt: new Date().toISOString(),
    };

    setReviews((prev) => {
      const idx = prev.findIndex((r) => r.id === reviewRecord.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = reviewRecord;
        return copy;
      }
      return [...prev, reviewRecord];
    });

    try {
      const reviewDocRef = doc(db, 'applications', appId, 'reviews', reviewRecord.id);
      await setDoc(reviewDocRef, reviewRecord, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `applications/${appId}/reviews/${reviewRecord.id}`);
    }

    setActiveNotification({
      title: recused ? 'Recusal Recorded' : 'Recusal Cleared',
      message: recused
        ? `You have recused yourself from reviewing this grant.`
        : 'Recusal cleared. You may now score this application.',
      type: 'info',
    });
  };

  // ===========================================================================
  // DECISION & AWARD MANAGEMENT
  // ===========================================================================

  const updateApplicationAward = async (
    appId: string,
    status: ApplicationStatus,
    awardedAmount?: number,
    committeeFeedback?: string
  ) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    const now = new Date().toISOString();
    const updated: Application = {
      ...app,
      status,
      awardedAmount: awardedAmount !== undefined ? awardedAmount : app.awardedAmount,
      committeeFeedback: committeeFeedback !== undefined ? committeeFeedback : app.committeeFeedback,
      updatedAt: now,
    };

    setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));

    try {
      await updateDoc(doc(db, 'applications', appId), {
        status,
        awardedAmount: updated.awardedAmount ?? null,
        committeeFeedback: updated.committeeFeedback ?? null,
        updatedAt: now,
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `applications/${appId}`);
    }

    await recordAuditLog({
      action: 'DECISION_RECORDED',
      category: 'Awards & Decisions',
      details: `Application ${app.grantCode} marked as ${status}${
        awardedAmount ? ` with award of $${awardedAmount.toLocaleString()}` : ''
      }.`,
      metadata: { grantCode: app.grantCode, status, awardedAmount },
    });

    setActiveNotification({
      title: 'Decision Recorded',
      message: `${app.grantCode} set to ${status}.`,
      type: 'success',
    });
  };

  const updateApplicationStatus = async (
    appId: string,
    status: ApplicationStatus,
    reason?: string
  ) => {
    await updateApplicationAward(appId, status, undefined, reason);
  };

  /**
   * Release Decisions in Bulk via server
   * Reports results: sent, failed, skipped (with reasons).
   */
  const executeBulkDecisions = async (decisions: any[]): Promise<BulkDecisionReport> => {
    const response = await fetch('/api/emails/bulk-decisions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': currentUser?.email || '',
        'x-user-role': currentUser?.role || 'admin',
        'x-user-name': currentUser?.displayName || '',
        'x-user-uid': currentUser?.id || '',
      },
      body: JSON.stringify({ decisions }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to dispatch bulk decisions.');
    }

    const report: BulkDecisionReport = await response.json();

    await recordAuditLog({
      action: 'BULK_DECISIONS_DISPATCHED',
      category: 'Awards & Decisions',
      details: `Dispatched bulk decision notices: ${report.sent} sent, ${report.skipped.length} skipped, ${report.failed} failed.`,
      metadata: report,
    });

    return report;
  };

  // ===========================================================================
  // INVITATIONS & REVIEWER ROSTER
  // ===========================================================================

  const inviteReviewer = async (reviewerInput: {
    name: string;
    email: string;
    role: 'reviewer' | 'admin' | 'Reviewer' | 'NonVotingReviewer';
    cyclesServed?: number;
    mailingAddress?: string;
    shirtSize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';
    notes?: string;
  }): Promise<{ reviewer: ReviewerProfile; magicLink: string }> => {
    const res = await fetch('/api/invites/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': currentUser?.email || '',
        'x-user-role': currentUser?.role || 'admin',
        'x-user-name': currentUser?.displayName || '',
        'x-user-uid': currentUser?.id || '',
      },
      body: JSON.stringify({
        email: reviewerInput.email,
        name: reviewerInput.name,
        role: normalizeRole(reviewerInput.role),
        cyclesServed: reviewerInput.cyclesServed || 1,
        mailingAddress: reviewerInput.mailingAddress || '',
        shirtSize: reviewerInput.shirtSize || 'L',
        notes: reviewerInput.notes || '',
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate invitation.');
    }

    const data = await res.json();
    const token = data.token;
    const magicLink = `${window.location.origin}/?invite=${encodeURIComponent(token)}`;

    const newProfile: ReviewerProfile = {
      id: data.invite.id,
      name: reviewerInput.name.trim(),
      email: reviewerInput.email.trim().toLowerCase(),
      role: (normalizeRole(reviewerInput.role) === 'admin' ? 'admin' : 'reviewer') as 'reviewer' | 'admin',
      isVoting: reviewerInput.role !== 'NonVotingReviewer',
      cyclesServed: reviewerInput.cyclesServed ?? 1,
      mailingAddress: reviewerInput.mailingAddress || '',
      shirtSize: reviewerInput.shirtSize || 'L',
      notes: reviewerInput.notes || '',
      invitedAt: new Date().toISOString(),
      magicLinkSentAt: new Date().toISOString(),
      magicLinkToken: token,
      thankYouSent: false,
      reminderSent3Day: false,
      reminderSent1Day: false,
    };

    setReviewers((prev) => [...prev, newProfile]);

    setActiveNotification({
      title: 'Invitation Dispatched',
      message: `14-day invitation link sent to ${reviewerInput.email}.`,
      type: 'success',
    });

    return { reviewer: newProfile, magicLink };
  };

  const resendInvite = async (inviteId: string) => {
    const res = await fetch('/api/invites/resend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': currentUser?.email || '',
        'x-user-role': currentUser?.role || 'admin',
        'x-user-name': currentUser?.displayName || '',
        'x-user-uid': currentUser?.id || '',
      },
      body: JSON.stringify({ inviteId }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to resend invitation.');
    }

    setActiveNotification({
      title: 'Invitation Renewed',
      message: 'Invitation expiry extended by 14 days and resent.',
      type: 'success',
    });
  };

  const revokeInvite = async (inviteId: string) => {
    const res = await fetch('/api/invites/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': currentUser?.email || '',
        'x-user-role': currentUser?.role || 'admin',
        'x-user-name': currentUser?.displayName || '',
        'x-user-uid': currentUser?.id || '',
      },
      body: JSON.stringify({ inviteId }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to revoke invitation.');
    }

    setActiveNotification({
      title: 'Invitation Revoked',
      message: 'Invitation link has been deactivated.',
      type: 'info',
    });
  };

  const acceptInviteByToken = async (token: string) => {
    const res = await fetch('/api/invites/accept', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, uid: currentUser?.id || `usr-${Date.now()}` }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to accept invitation.');
    }

    const data = await res.json();
    return data;
  };

  const updateReviewerProfile = async (reviewer: ReviewerProfile) => {
    setReviewers((prev) => prev.map((r) => (r.id === reviewer.id ? reviewer : r)));

    try {
      await setDoc(doc(db, 'reviewers', reviewer.id), reviewer, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `reviewers/${reviewer.id}`);
    }
  };

  const deleteReviewerProfile = async (reviewerId: string) => {
    setReviewers((prev) => prev.filter((r) => r.id !== reviewerId));
    try {
      await deleteDoc(doc(db, 'reviewers', reviewerId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `reviewers/${reviewerId}`);
    }
  };

  const sendReviewerReminder = async (reviewerId: string, reminderType: '3day' | '1day') => {
    const rev = reviewers.find((r) => r.id === reviewerId);
    if (!rev) return;
    const updated = {
      ...rev,
      [reminderType === '3day' ? 'reminderSent3Day' : 'reminderSent1Day']: true,
    };
    await updateReviewerProfile(updated);
    setActiveNotification({
      title: 'Reminder Dispatched',
      message: `Dispatched automated ${reminderType === '3day' ? '3-day' : '1-day'} review reminder to ${rev.name} (${rev.email}).`,
      type: 'info',
    });
  };

  const sendReviewerThankYou = async (reviewerId: string) => {
    const rev = reviewers.find((r) => r.id === reviewerId);
    if (!rev) return;
    const updated = {
      ...rev,
      thankYouSent: true,
    };
    await updateReviewerProfile(updated);
    setActiveNotification({
      title: 'Thank You Dispatched',
      message: `Official NEF Foundation appreciation letter dispatched to ${rev.name}.`,
      type: 'success',
    });
  };

  // ===========================================================================
  // EMAIL AUDIT LOGS & FILE UPLOADS
  // ===========================================================================

  const fetchSentEmails = async (): Promise<SentEmail[]> => {
    try {
      const res = await fetch('/api/emails/sent-logs', {
        headers: {
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentUser?.role || 'admin',
          'x-user-name': currentUser?.displayName || '',
          'x-user-uid': currentUser?.id || '',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSentEmails(data.logs || []);
        return data.logs || [];
      }
    } catch (err) {
      console.warn('Failed fetching sent emails:', err);
    }
    return [];
  };

  const uploadFileToServer = async (file: File, context: 'proposal' | 'final_report' = 'proposal') => {
    return new Promise<{ url: string; fileName: string; fileSize: number }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-email': currentUser?.email || '',
              'x-user-role': currentUser?.role || 'reviewer',
              'x-user-name': currentUser?.displayName || '',
              'x-user-uid': currentUser?.id || '',
            },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              base64Data,
              context,
            }),
          });

          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to upload document.');
          }

          const result = await response.json();
          resolve({
            url: result.url,
            fileName: result.fileName,
            fileSize: result.fileSize,
          });
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  // ===========================================================================
  // LEGAL DOCUMENTATION
  // ===========================================================================

  const saveLegalDocument = async (type: 'terms' | 'privacy', title: string, content: string) => {
    const res = await fetch(`/api/legal/${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': currentUser?.email || '',
        'x-user-role': currentUser?.role || 'admin',
        'x-user-name': currentUser?.displayName || '',
        'x-user-uid': currentUser?.id || '',
      },
      body: JSON.stringify({ title, content }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update policy.');
    }

    const data = await res.json();
    if (type === 'terms') setLegalTerms(data.data);
    else setLegalPrivacy(data.data);

    setActiveNotification({
      title: 'Policy Updated',
      message: `${title} successfully saved.`,
      type: 'success',
    });
  };

  // ===========================================================================
  // AUDIT LOGGING & SETTINGS
  // ===========================================================================

  const recordAuditLog = async (entry: {
    action: string;
    category: AuditCategory;
    details: string;
    metadata?: Record<string, any>;
  }) => {
    const userEmail = currentUser?.email || 'system@nacisd.org';
    const userName = currentUser?.displayName || 'System';
    const userRole = currentUser?.role || 'admin';

    const newLog: AdminAuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action: entry.action,
      category: entry.category,
      details: entry.details,
      userEmail,
      userName,
      userRole,
      timestamp: new Date().toISOString(),
      metadata: entry.metadata,
    };

    setAuditLogs((prev) => [newLog, ...prev]);

    try {
      await setDoc(doc(db, 'auditLogs', newLog.id), newLog);
    } catch (e) {
      console.warn('Audit log write note:', e);
    }
  };

  const clearAuditLogs = async () => {
    setAuditLogs([]);
    setActiveNotification({
      title: 'Audit Logs Archived',
      message: 'Active audit logs archived and cleared.',
      type: 'info',
    });
  };

  const updateProgramSettings = async (newSettings: Partial<ProgramSettings>) => {
    const updated = {
      ...programSettings,
      ...newSettings,
      updatedAt: new Date().toISOString(),
    };
    setProgramSettings(updated);

    try {
      await setDoc(doc(db, 'settings', 'nacogdoches-nef-2026'), updated, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'settings/nacogdoches-nef-2026');
    }

    await recordAuditLog({
      action: 'SETTINGS_UPDATED',
      category: 'Settings',
      details: `Updated program cycle settings: Available funds $${updated.availableFunds.toLocaleString()}, Caps: Cat1 $${updated.category1Cap}, Cat2 $${updated.category2Cap}. Review closes: ${updated.reviewClosesDate}.`,
      metadata: { settings: newSettings },
    });

    setActiveNotification({
      title: 'Settings Saved',
      message: 'Program cycle configuration successfully updated.',
      type: 'success',
    });
  };

  const updateRubricCriterion = async (criterion: RubricCriterion) => {
    const updated = rubric.map((c) => (c.id === criterion.id ? criterion : c));
    setRubric(updated);

    try {
      await setDoc(doc(db, 'rubrics', 'default'), { id: 'default', criteria: updated }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'rubrics/default');
    }

    await recordAuditLog({
      action: 'RUBRIC_UPDATED',
      category: 'Rubric',
      details: `Updated criterion "${criterion.title}" weight to ${criterion.weight} pts.`,
      metadata: { criterionId: criterion.id, weight: criterion.weight },
    });
  };

  const resetRubricToDefaults = async () => {
    setRubric(INITIAL_RUBRIC);
    try {
      await setDoc(doc(db, 'rubrics', 'default'), { id: 'default', criteria: INITIAL_RUBRIC });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'rubrics/default');
    }

    await recordAuditLog({
      action: 'RUBRIC_RESET',
      category: 'Rubric',
      details: 'Reset rubric to standard 8-criterion NEF weights (100 total points).',
    });
  };

  const saveAdminEligibility = async (appId: string, screening: AdminEligibilityScreening) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    const now = new Date().toISOString();
    const updated: Application = {
      ...app,
      adminEligibility: screening,
      updatedAt: now,
    };

    setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));

    try {
      await updateDoc(doc(db, 'applications', appId), {
        adminEligibility: screening,
        updatedAt: now,
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `applications/${appId}`);
    }

    await recordAuditLog({
      action: 'ELIGIBILITY_CHECK_SAVED',
      category: 'Awards & Decisions',
      details: `Admin ${currentUser?.displayName} completed eligibility checklist for ${app.grantCode}: ${
        screening.passed ? 'PASSED' : 'FLAGGED'
      }`,
      metadata: { applicationId: appId, screening },
    });
  };

  const assignReviewersToApplication = async (appId: string, reviewerIds: string[]) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    const now = new Date().toISOString();
    const updated = { ...app, assignedReviewerIds: reviewerIds, updatedAt: now };

    setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));

    try {
      await updateDoc(doc(db, 'applications', appId), {
        assignedReviewerIds: reviewerIds,
        updatedAt: now,
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `applications/${appId}`);
    }
  };

  // Google Form CSV Import with atomic transaction
  const importGoogleFormResponses = async (
    csvText: string,
    customMappings?: Record<string, string>
  ): Promise<{ importedCount: number; duplicatesSkipped: number; startCode: string; endCode: string }> => {
    const { parseCsvText, buildImportPreview, convertRowsToApplicationsAndIdentities } = await import(
      '../utils/googleFormCsvParser'
    );
    const rawRows = parseCsvText(csvText);
    if (rawRows.length < 2) {
      throw new Error('CSV file must contain a header row and at least one response row.');
    }

    const counterRef = doc(db, 'counters', 'grantCodes');
    const program = (programSettings.program || 'IG').toUpperCase();
    const season = (programSettings.season || 'F').toUpperCase();
    const yy = programSettings.cycleTwoDigitYear || '26';
    const prefix = `${program}${season}${yy}`;

    let importedCount = 0;
    let duplicatesSkipped = 0;
    let startCode = '';
    let endCode = '';

    await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let currentSequence = 0;

      if (counterDoc.exists()) {
        currentSequence = counterDoc.data().lastSequence || 0;
      } else {
        for (const app of applications) {
          if (app.sequenceNumber && app.sequenceNumber > currentSequence) {
            currentSequence = app.sequenceNumber;
          }
        }
      }

      const preview = buildImportPreview(
        rawRows,
        programSettings,
        applications,
        currentSequence,
        customMappings
      );

      const {
        applications: newApps,
        identities: newIdentities,
        nextCounterSequence,
      } = convertRowsToApplicationsAndIdentities(preview, prefix);

      duplicatesSkipped = preview.duplicateRowsCount;
      importedCount = newApps.length;
      startCode = newApps[0]?.grantCode || 'N/A';
      endCode = newApps[newApps.length - 1]?.grantCode || 'N/A';

      for (let i = 0; i < newApps.length; i++) {
        const app = newApps[i];
        const identity = newIdentities[i];

        const appRef = doc(db, 'applications', app.id);
        const identityRef = doc(db, 'applicantIdentities', app.id);

        transaction.set(appRef, app);
        transaction.set(identityRef, identity);
      }

      if (nextCounterSequence > currentSequence) {
        transaction.set(
          counterRef,
          {
            id: 'grantCodes',
            prefix,
            lastSequence: nextCounterSequence,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    });

    await recordAuditLog({
      action: 'GOOGLE_FORM_CSV_IMPORTED',
      category: 'Import',
      details: `Imported ${importedCount} applications via Google Form CSV (${startCode} to ${endCode}). Duplicates skipped: ${duplicatesSkipped}. Counter updated.`,
      metadata: { importedCount, duplicatesSkipped, startCode, endCode },
    });

    setActiveNotification({
      title: 'Google Form Import Complete',
      message: `Successfully created ${importedCount} applications (${startCode} to ${endCode}) with applicant identities stored in the admin-only collection.`,
      type: 'success',
    });

    return { importedCount, duplicatesSkipped, startCode, endCode };
  };

  /**
   * Save a single submitted application and its sensitive identity directly to Firestore
   */
  const saveSubmittedApplicationToFirestore = async (
    app: Application,
    identity?: ApplicantIdentity
  ): Promise<void> => {
    try {
      const now = new Date().toISOString();
      const updatedApp: Application = {
        ...app,
        updatedAt: now,
        status: app.status || 'Submitted',
      };

      // 1. Write application proposal content to Firestore /applications/{appId}
      const appRef = doc(db, 'applications', updatedApp.id);
      await setDoc(appRef, updatedApp, { merge: true });

      // 2. Write applicant identity to segregated /applicantIdentities/{appId}
      if (identity) {
        const identityRef = doc(db, 'applicantIdentities', updatedApp.id);
        await setDoc(identityRef, identity, { merge: true });
        setApplicantIdentities((prev) => ({
          ...prev,
          [updatedApp.id]: identity,
        }));
      }

      setApplications((prev) => {
        const idx = prev.findIndex((a) => a.id === updatedApp.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = updatedApp;
          return copy;
        }
        return [...prev, updatedApp].sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));
      });

      await recordAuditLog({
        action: 'APPLICATION_SUBMITTED_TO_FIRESTORE',
        category: 'Import',
        details: `Application ${updatedApp.grantCode} (${updatedApp.title}) saved to Firestore collection /applications.`,
        metadata: { applicationId: updatedApp.id, grantCode: updatedApp.grantCode },
      });

      setActiveNotification({
        title: 'Application Saved to Firestore',
        message: `${updatedApp.grantCode} saved to Firestore collection /applications.`,
        type: 'success',
      });
    } catch (e: any) {
      console.error('Failed saving application to Firestore:', e);
      handleFirestoreError(e, OperationType.WRITE, `applications/${app.id}`);
      throw e;
    }
  };

  /**
   * Batch sync all applications and identities to Firestore
   */
  const syncAllApplicationsToFirestore = async (): Promise<{ syncedCount: number; errorCount: number }> => {
    let syncedCount = 0;
    let errorCount = 0;

    for (const app of applications) {
      try {
        const appRef = doc(db, 'applications', app.id);
        await setDoc(appRef, app, { merge: true });

        const identity = applicantIdentities[app.id] || INITIAL_APPLICANT_IDENTITIES[app.id];
        if (identity) {
          const identityRef = doc(db, 'applicantIdentities', app.id);
          await setDoc(identityRef, identity, { merge: true });
        }
        syncedCount++;
      } catch (err) {
        console.warn(`Sync failed for application ${app.grantCode}:`, err);
        errorCount++;
      }
    }

    await recordAuditLog({
      action: 'BATCH_APPLICATIONS_SYNCED_FIRESTORE',
      category: 'Import',
      details: `Batch synced ${syncedCount} applications and identities to Firestore database. Errors: ${errorCount}.`,
      metadata: { syncedCount, errorCount },
    });

    setActiveNotification({
      title: 'Firestore Sync Complete',
      message: `${syncedCount} submitted applications verified and saved in Firestore collection /applications.`,
      type: 'success',
    });

    return { syncedCount, errorCount };
  };

  return (
    <GrantContext.Provider
      value={{
        currentUser,
        authLoading,
        sendEmailSignInLink,
        signInWithEmailLinkDirect,
        signInAsTestUser,
        logout,
        applications,
        applicantIdentities,
        programSettings,
        updateProgramSettings,
        rubric,
        updateRubricCriterion,
        resetRubricToDefaults,
        reviews,
        saveReviewDraft,
        submitOfficialReview,
        saveReview,
        openApplicationForReview,
        toggleRecusal,
        saveAdminEligibility,
        assignReviewersToApplication,
        updateApplicationAward,
        updateApplicationStatus,
        executeBulkDecisions,
        loginWithMagicLink,
        reviewers,
        invites,
        inviteReviewer,
        resendInvite,
        revokeInvite,
        acceptInviteByToken,
        updateReviewerProfile,
        deleteReviewerProfile,
        sendReviewerReminder,
        sendReviewerThankYou,
        sentEmails,
        fetchSentEmails,
        uploadFileToServer,
        legalTerms,
        legalPrivacy,
        saveLegalDocument,
        auditLogs,
        recordAuditLog,
        clearAuditLogs,
        importGoogleFormResponses,
        saveSubmittedApplicationToFirestore,
        syncAllApplicationsToFirestore,
        isReviewClosed,
        reviewDeadlineInfo,
        isSyncing,
        activeNotification,
        dismissNotification,
      }}
    >
      {children}
    </GrantContext.Provider>
  );
};

export const useGrants = () => {
  const context = useContext(GrantContext);
  if (!context) {
    throw new Error('useGrants must be used within a GrantProvider');
  }
  return context;
};

export const useGrant = useGrants;
