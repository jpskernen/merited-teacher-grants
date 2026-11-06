import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  AdminAuditLog,
  AdminEligibilityScreening,
  Application,
  ApplicationStatus,
  AuditCategory,
  BudgetItem,
  FinalReportData,
  ProgramSettings,
  Review,
  ReviewerProfile,
  RubricCriterion,
  TimelineEvent,
  UserProfile,
  UserRole,
  Vendor,
} from '../types/grant';
import {
  INITIAL_APPLICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_PROGRAM_SETTINGS,
  INITIAL_REVIEWERS,
  INITIAL_REVIEWS,
  INITIAL_RUBRIC,
  INITIAL_VENDORS,
} from '../data/seedData';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { generateNextGrantCode } from '../utils/grantCodeUtils';

interface GrantContextType {
  currentUser: UserProfile;
  switchUser: (role: UserRole, email?: string, name?: string) => void;
  applications: Application[];
  programSettings: ProgramSettings;
  updateProgramSettings: (settings: Partial<ProgramSettings>) => Promise<void>;
  vendors: Vendor[];
  addVendor: (vendor: Omit<Vendor, 'id'>) => Promise<void>;
  updateVendor: (vendor: Vendor) => Promise<void>;
  deleteVendor: (vendorId: string) => Promise<void>;
  uploadVendorCsv: (csvText: string) => Promise<number>;
  rubric: RubricCriterion[];
  updateRubricCriterion: (criterion: RubricCriterion) => Promise<void>;
  resetRubricToDefaults: () => Promise<void>;
  reviews: Review[];
  saveReview: (review: Review) => Promise<void>;
  saveApplicationDraft: (app: Partial<Application> & { id?: string }) => Promise<string>;
  submitApplication: (appId: string) => Promise<void>;
  updateApplicationStatus: (
    appId: string,
    status: ApplicationStatus,
    reason?: string,
    committeeFeedback?: string,
    awardedAmount?: number
  ) => Promise<void>;
  sendMoreInfoRequest: (appId: string, question: string) => Promise<void>;
  respondToMoreInfo: (appId: string, response: string) => Promise<void>;
  saveAdminEligibility: (appId: string, screening: AdminEligibilityScreening) => Promise<void>;
  assignReviewersToApplication: (appId: string, reviewerIds: string[]) => Promise<void>;
  markCheckSent: (appId: string, checkData: { checkNumber: string; checkSentAt: string; checkAmount?: number; checkNotes?: string }) => Promise<void>;
  reportPoSubmitted: (appId: string) => Promise<void>;
  reportEventDate: (appId: string, eventDate: string) => Promise<void>;
  submitFinalReport: (appId: string, report: FinalReportData) => Promise<void>;
  simulatePrincipalApproval: (appId: string, approved: boolean, comment?: string) => Promise<void>;
  toggleRecusal: (appId: string, recused: boolean, reason?: string) => Promise<void>;
  timelineEvents: TimelineEvent[];
  auditLogs: AdminAuditLog[];
  recordAuditLog: (entry: {
    action: string;
    category: AuditCategory;
    details: string;
    metadata?: Record<string, any>;
  }) => Promise<void>;
  clearAuditLogs: () => Promise<void>;
  isSyncing: boolean;
  activeNotification: { title: string; message: string; type?: 'info' | 'success' | 'warn' } | null;
  dismissNotification: () => void;
  userPendingFinalReport: boolean;
  reviewers: ReviewerProfile[];
  inviteReviewer: (reviewer: {
    name: string;
    email: string;
    role: 'Reviewer' | 'NonVotingReviewer';
    cyclesServed?: number;
    mailingAddress?: string;
    shirtSize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';
  }) => Promise<{ reviewer: ReviewerProfile; magicLink: string }>;
  updateReviewerProfile: (reviewer: ReviewerProfile) => Promise<void>;
  deleteReviewerProfile: (reviewerId: string) => Promise<void>;
  sendReviewerReminder: (reviewerId: string, reminderType: '3-day' | '1-day') => Promise<void>;
  sendReviewerThankYou: (reviewerId: string) => Promise<void>;
  loginWithMagicLink: (tokenOrEmail: string) => boolean;
  resetToGoogleSheetData: () => Promise<void>;
}

const GrantContext = createContext<GrantContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'merited_grants_cache_v2_gsheet';

export const GrantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user state (Defaulting to first applicant in Google Sheet)
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    return {
      id: 'usr-teacher-1',
      email: 'jcmay@nacisd.org',
      displayName: 'Jessica May',
      role: 'Teacher',
      campus: 'Brooks Quinn Jones Elementary',
      recusedAppIds: [],
    };
  });

  // State collections initialized from seed data or local cache
  const [programSettings, setProgramSettings] = useState<ProgramSettings>(() => {
    const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY}_settings`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return {
          ...INITIAL_PROGRAM_SETTINGS,
          ...parsed,
          reviewClosesDate: parsed.reviewClosesDate || INITIAL_PROGRAM_SETTINGS.reviewClosesDate,
          awardsPresentedDate: parsed.awardsPresentedDate || INITIAL_PROGRAM_SETTINGS.awardsPresentedDate,
          applicationsOpenDate: parsed.applicationsOpenDate || INITIAL_PROGRAM_SETTINGS.applicationsOpenDate,
          eligibilityDescription: parsed.eligibilityDescription || INITIAL_PROGRAM_SETTINGS.eligibilityDescription,
          availableFunds: parsed.availableFunds && parsed.availableFunds !== 35000 ? parsed.availableFunds : 52000,
        };
      } catch {
        // fallback
      }
    }
    return INITIAL_PROGRAM_SETTINGS;
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY}_vendors`);
    return cached ? JSON.parse(cached) : INITIAL_VENDORS;
  });

  const [rubric, setRubric] = useState<RubricCriterion[]>(() => {
    const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY}_rubric`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as RubricCriterion[];
        // Auto-upgrade if previous schema or total weight is under 100
        const totalWeight = parsed.reduce((sum, c) => sum + (c.weight || 0), 0);
        if (totalWeight === 100 && parsed.every((p) => p.formSource)) {
          return parsed;
        }
      } catch {
        // fallback to INITIAL_RUBRIC
      }
    }
    return INITIAL_RUBRIC;
  });

  const [applications, setApplications] = useState<Application[]>(() => {
    const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY}_apps`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Application[];
        if (Array.isArray(parsed) && parsed.length >= 10 && parsed.some((a) => a.id.startsWith('app-nisd-'))) {
          return parsed;
        }
      } catch {}
    }
    return INITIAL_APPLICATIONS;
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY}_reviews`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Review[];
        if (Array.isArray(parsed) && parsed.some((r) => r.applicationId.startsWith('app-nisd-'))) {
          return parsed;
        }
      } catch {}
    }
    return INITIAL_REVIEWS;
  });

  const [reviewers, setReviewers] = useState<ReviewerProfile[]>(() => {
    const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY}_reviewers`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as ReviewerProfile[];
        if (Array.isArray(parsed) && parsed.length >= 4) {
          return parsed;
        }
      } catch {}
    }
    return INITIAL_REVIEWERS;
  });

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_reviewers`, JSON.stringify(reviewers));
  }, [reviewers]);

  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(() => {
    const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY}_timeline`);
    if (cached) return JSON.parse(cached);
    return [
      {
        id: 'tl-1',
        applicationId: 'app-nef-001',
        status: 'Submitted',
        title: 'Application Submitted',
        description: 'Completed multi-step application and budget verification.',
        actorEmail: 'janekernen@gmail.com',
        actorRole: 'Teacher',
        timestamp: '2026-10-23T11:20:00Z',
      },
      {
        id: 'tl-2',
        applicationId: 'app-nef-001',
        status: 'Principal Approval',
        title: 'Principal Endorsement Received',
        description: 'Principal approved proposal with commendation.',
        actorEmail: 'principal.raguet@nacisd.org',
        actorRole: 'Principal',
        timestamp: '2026-10-24T14:15:00Z',
      },
      {
        id: 'tl-3',
        applicationId: 'app-nef-001',
        status: 'Under Review',
        title: 'Assigned to Committee',
        description: 'Proposal entered blind scoring queue.',
        actorEmail: 'admin@nefgrants.org',
        actorRole: 'Admin',
        timestamp: '2026-10-24T15:00:00Z',
      },
    ];
  });

  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>(() => {
    const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY}_audit_logs`);
    return cached ? JSON.parse(cached) : INITIAL_AUDIT_LOGS;
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activeNotification, setActiveNotification] = useState<{
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warn';
  } | null>(null);

  const dismissNotification = () => setActiveNotification(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_settings`, JSON.stringify(programSettings));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_vendors`, JSON.stringify(vendors));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_rubric`, JSON.stringify(rubric));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_apps`, JSON.stringify(applications));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_reviews`, JSON.stringify(reviews));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_timeline`, JSON.stringify(timelineEvents));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_audit_logs`, JSON.stringify(auditLogs));
    } catch {
      // ignore quota errors
    }
  }, [programSettings, vendors, rubric, applications, reviews, timelineEvents, auditLogs]);

  // Initial Firestore synchronization with defensive error handling
  useEffect(() => {
    let unsubscribeSettings: (() => void) | undefined;
    let unsubscribeVendors: (() => void) | undefined;
    let unsubscribeApps: (() => void) | undefined;
    let unsubscribeAuditLogs: (() => void) | undefined;

    const setupFirestoreListeners = async () => {
      try {
        setIsSyncing(true);

        // Bootstrap initial records if Firestore is completely empty
        const appsRef = collection(db, 'applications');
        const snap = await getDocs(appsRef).catch((e) => {
          console.warn('Initial apps read note:', e);
          return null;
        });

        if (snap && (snap.empty || snap.docs.length < 10 || !snap.docs.some((d) => d.id.startsWith('app-nisd-')))) {
          // Seed Google Sheet applications to Firestore
          for (const app of INITIAL_APPLICATIONS) {
            await setDoc(doc(db, 'applications', app.id), app).catch(() => {});
          }
          for (const vendor of INITIAL_VENDORS) {
            await setDoc(doc(db, 'vendors', vendor.id), vendor).catch(() => {});
          }
          await setDoc(doc(db, 'programs', INITIAL_PROGRAM_SETTINGS.id), INITIAL_PROGRAM_SETTINGS).catch(() => {});
        }

        // Bootstrap audit logs if empty
        const auditRef = collection(db, 'auditLogs');
        const auditSnap = await getDocs(auditRef).catch(() => null);
        if (auditSnap && auditSnap.empty) {
          for (const log of INITIAL_AUDIT_LOGS) {
            await setDoc(doc(db, 'auditLogs', log.id), log).catch(() => {});
          }
        }

        // Setup real-time listener for applications
        unsubscribeApps = onSnapshot(
          collection(db, 'applications'),
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded: Application[] = [];
              snapshot.forEach((d) => loaded.push(d.data() as Application));
              if (loaded.length >= 10 || loaded.some((a) => a.id.startsWith('app-nisd-'))) {
                setApplications(loaded);
              }
            }
          },
          (error) => {
            console.warn('Firestore apps listener fallback:', error.message);
          }
        );

        // Setup listener for vendors
        unsubscribeVendors = onSnapshot(
          collection(db, 'vendors'),
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded: Vendor[] = [];
              snapshot.forEach((d) => loaded.push(d.data() as Vendor));
              setVendors(loaded);
            }
          },
          (error) => {
            console.warn('Firestore vendors listener fallback:', error.message);
          }
        );

        // Setup listener for program settings
        unsubscribeSettings = onSnapshot(
          collection(db, 'programs'),
          (snapshot) => {
            if (!snapshot.empty) {
              snapshot.forEach((d) => {
                setProgramSettings(d.data() as ProgramSettings);
              });
            }
          },
          (error) => {
            console.warn('Firestore programs listener fallback:', error.message);
          }
        );

        // Setup listener for audit logs
        unsubscribeAuditLogs = onSnapshot(
          collection(db, 'auditLogs'),
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded: AdminAuditLog[] = [];
              snapshot.forEach((d) => loaded.push(d.data() as AdminAuditLog));
              loaded.sort(
                (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              );
              setAuditLogs(loaded);
            }
          },
          (error) => {
            console.warn('Firestore auditLogs listener fallback:', error.message);
          }
        );
      } catch (err) {
        console.warn('Firestore initialization notice:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    setupFirestoreListeners();

    return () => {
      unsubscribeSettings?.();
      unsubscribeVendors?.();
      unsubscribeApps?.();
      unsubscribeAuditLogs?.();
    };
  }, []);

  // Check if current user has a pending final report on a funded grant from past/current cycle
  const userPendingFinalReport = useMemo(() => {
    if (currentUser.role !== 'Teacher') return false;
    return applications.some(
      (app) =>
        app.applicantEmail.toLowerCase() === currentUser.email.toLowerCase() &&
        app.status === 'Funded' &&
        !app.finalReport
    );
  }, [applications, currentUser]);

  // Switch role and prefill standard user test accounts
  const switchUser = (role: UserRole, email?: string, name?: string) => {
    let defaultEmail = email;
    let defaultName = name;
    let defaultCampus = 'Brooks Quinn Jones Elementary';

    switch (role) {
      case 'Teacher':
        defaultEmail = email || 'jcmay@nacisd.org';
        defaultName = name || 'Jessica May';
        defaultCampus = 'Brooks Quinn Jones Elementary';
        // Auto-match campus and name from applications list
        const matched = applications.find(
          (a) =>
            a.applicantEmail.toLowerCase() === (defaultEmail || '').toLowerCase() ||
            (a.applicantNames || []).some(
              (n) => n.email.toLowerCase() === (defaultEmail || '').toLowerCase()
            )
        );
        if (matched) {
          defaultCampus = matched.campus;
          defaultName =
            name ||
            matched.applicantNames.find(
              (n) => n.email.toLowerCase() === (defaultEmail || '').toLowerCase()
            )?.name ||
            matched.applicantNames[0]?.name ||
            defaultName;
        }
        break;
      case 'Reviewer':
        defaultEmail = email || 'rev1@nacisd.org';
        defaultName = name || 'Dr. Arthur Campbell (NEF Director)';
        break;
      case 'NonVotingReviewer':
        defaultEmail = email || 'curriculum@nacisd.org';
        defaultName = name || 'Dr. Karen Myers (Exec. Dir. Teaching & Learning)';
        break;
      case 'Admin':
        defaultEmail = email || 'director@nefgrants.org';
        defaultName = name || 'Sarah Holcomb (NEF Executive Director)';
        break;
      case 'Owner':
        defaultEmail = email || 'board.president@nefgrants.org';
        defaultName = name || 'Marcus Sterling (NEF Board President)';
        break;
    }

    setCurrentUser({
      id: `usr-${role.toLowerCase()}-${Date.now()}`,
      email: defaultEmail!,
      displayName: defaultName!,
      role,
      campus: defaultCampus,
      recusedAppIds: [],
    });

    setActiveNotification({
      title: `Switched to ${role}`,
      message: `Operating as ${defaultName} (${defaultEmail})`,
      type: 'info',
    });
  };

  const resetToGoogleSheetData = async () => {
    setApplications(INITIAL_APPLICATIONS);
    setReviews(INITIAL_REVIEWS);
    setReviewers(INITIAL_REVIEWERS);
    setProgramSettings(INITIAL_PROGRAM_SETTINGS);
    setVendors(INITIAL_VENDORS);
    setRubric(INITIAL_RUBRIC);
    setAuditLogs(INITIAL_AUDIT_LOGS);

    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_apps`, JSON.stringify(INITIAL_APPLICATIONS));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_reviews`, JSON.stringify(INITIAL_REVIEWS));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_reviewers`, JSON.stringify(INITIAL_REVIEWERS));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_settings`, JSON.stringify(INITIAL_PROGRAM_SETTINGS));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_vendors`, JSON.stringify(INITIAL_VENDORS));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_rubric`, JSON.stringify(INITIAL_RUBRIC));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_audit_logs`, JSON.stringify(INITIAL_AUDIT_LOGS));

      for (const app of INITIAL_APPLICATIONS) {
        await setDoc(doc(db, 'applications', app.id), app).catch(() => {});
      }
    } catch (e) {
      console.warn('Reset persistence note:', e);
    }

    setActiveNotification({
      title: 'Google Sheet Synced',
      message: 'Successfully reloaded all 11 applications and people from the Google Sheet.',
      type: 'success',
    });
  };

  const updateProgramSettings = async (settings: Partial<ProgramSettings>) => {
    const prev = programSettings;
    const updated = {
      ...programSettings,
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    setProgramSettings(updated);

    try {
      await updateDoc(doc(db, 'programs', updated.id), updated);
    } catch {
      // local state already updated
    }

    // Build human-readable audit trail details
    const changes: string[] = [];
    if (settings.category1Cap !== undefined && settings.category1Cap !== prev.category1Cap) {
      changes.push(`Category 1 Cap: $${prev.category1Cap.toLocaleString()} → $${settings.category1Cap.toLocaleString()}`);
    }
    if (settings.category2Cap !== undefined && settings.category2Cap !== prev.category2Cap) {
      changes.push(`Category 2 Cap: $${prev.category2Cap.toLocaleString()} → $${settings.category2Cap.toLocaleString()}`);
    }
    if (settings.availableFunds !== undefined && settings.availableFunds !== prev.availableFunds) {
      changes.push(`Available Grant Pool: $${prev.availableFunds.toLocaleString()} → $${settings.availableFunds.toLocaleString()}`);
    }
    if (settings.blindReviewEnabled !== undefined && settings.blindReviewEnabled !== prev.blindReviewEnabled) {
      changes.push(`Blind Review: ${settings.blindReviewEnabled ? 'Enabled' : 'Disabled'}`);
    }
    if (settings.callForGrantsDate !== undefined && settings.callForGrantsDate !== prev.callForGrantsDate) {
      changes.push(`Call for Grants Date: "${settings.callForGrantsDate}"`);
    }
    if (settings.applicationsDueDate !== undefined && settings.applicationsDueDate !== prev.applicationsDueDate) {
      changes.push(`Applications Due Date: "${settings.applicationsDueDate}"`);
    }
    if (settings.awardsAnnouncedDate !== undefined && settings.awardsAnnouncedDate !== prev.awardsAnnouncedDate) {
      changes.push(`Awards Announced Date: "${settings.awardsAnnouncedDate}"`);
    }

    const detailText = changes.length > 0
      ? `Updated program cycle configuration: ${changes.join('; ')}`
      : 'Updated program settings configuration.';

    await recordAuditLog({
      action: 'CYCLE_OR_SETTINGS_UPDATED',
      category: 'Settings',
      details: detailText,
      metadata: { previous: prev, updated: settings },
    });
  };

  const addVendor = async (vendorData: Omit<Vendor, 'id'>) => {
    const newVendor: Vendor = {
      ...vendorData,
      id: `v-${Date.now()}`,
    };
    setVendors((prev) => [newVendor, ...prev]);

    try {
      await setDoc(doc(db, 'vendors', newVendor.id), newVendor);
    } catch {
      // local state updated
    }

    await recordAuditLog({
      action: 'VENDOR_ADDED',
      category: 'Vendors',
      details: `Added approved district vendor "${newVendor.name}" (Category: ${newVendor.category}).`,
      metadata: { vendorId: newVendor.id, vendorName: newVendor.name, category: newVendor.category },
    });
  };

  const updateVendor = async (vendor: Vendor) => {
    setVendors((prev) => prev.map((v) => (v.id === vendor.id ? vendor : v)));
    try {
      await updateDoc(doc(db, 'vendors', vendor.id), { ...vendor });
    } catch {
      // local state updated
    }

    await recordAuditLog({
      action: 'VENDOR_UPDATED',
      category: 'Vendors',
      details: `Updated vendor details for "${vendor.name}" (Category: ${vendor.category}).`,
      metadata: { vendorId: vendor.id, vendorName: vendor.name },
    });
  };

  const deleteVendor = async (vendorId: string) => {
    const target = vendors.find((v) => v.id === vendorId);
    setVendors((prev) => prev.filter((v) => v.id !== vendorId));

    await recordAuditLog({
      action: 'VENDOR_DELETED',
      category: 'Vendors',
      details: `Removed vendor "${target?.name || vendorId}" from district approved vendor list.`,
      metadata: { vendorId, vendorName: target?.name },
    });
  };

  const uploadVendorCsv = async (csvText: string): Promise<number> => {
    const lines = csvText.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return 0;

    let addedCount = 0;
    const newVendors: Vendor[] = [];

    // Parse header and lines
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.replace(/^"|"$/g, '').trim());
      if (parts[0]) {
        const v: Vendor = {
          id: `v-csv-${Date.now()}-${i}`,
          name: parts[0],
          category: parts[1] || 'Instructional Materials',
          website: parts[2] || '',
          notes: parts[3] || 'Imported via district approved vendor CSV upload',
          isApproved: true,
        };
        newVendors.push(v);
        addedCount++;
        try {
          await setDoc(doc(db, 'vendors', v.id), v);
        } catch {
          // ignore error
        }
      }
    }

    if (newVendors.length > 0) {
      setVendors((prev) => [...newVendors, ...prev]);
      await recordAuditLog({
        action: 'VENDORS_CSV_IMPORTED',
        category: 'Vendors',
        details: `Imported ${addedCount} approved vendors via CSV batch upload.`,
        metadata: { importedCount: addedCount },
      });
    }
    return addedCount;
  };

  const updateRubricCriterion = async (criterion: RubricCriterion) => {
    const prev = rubric.find((c) => c.id === criterion.id);
    setRubric((prevList) => prevList.map((c) => (c.id === criterion.id ? criterion : c)));

    await recordAuditLog({
      action: 'RUBRIC_CRITERION_UPDATED',
      category: 'Rubric',
      details: `Updated rubric criterion "${criterion.title}" (weight: ${prev?.weight}x → ${criterion.weight}x, helper: "${criterion.helper.slice(0, 60)}...").`,
      metadata: { criterionId: criterion.id, title: criterion.title, weight: criterion.weight },
    });
  };

  const resetRubricToDefaults = async () => {
    setRubric(INITIAL_RUBRIC);
    await recordAuditLog({
      action: 'RUBRIC_RESET_TO_DEFAULTS',
      category: 'Rubric',
      details: 'Reset scoring rubric to standard NISD NEF 8-criterion foundation defaults.',
      metadata: { criteriaCount: INITIAL_RUBRIC.length },
    });
    setActiveNotification({
      title: 'Rubric Restored',
      message: 'Scoring rubric has been reset to foundation default criteria and weights.',
      type: 'info',
    });
  };

  const saveReview = async (review: Review) => {
    const prevReview = reviews.find((r) => r.id === review.id);
    const criteriaCount = rubric.length;
    const prevScoredCount = prevReview ? Object.keys(prevReview.scores || {}).length : 0;
    const newScoredCount = Object.keys(review.scores || {}).length;
    const isNowFinished = criteriaCount > 0 && newScoredCount >= criteriaCount;
    const wasAlreadyFinished = criteriaCount > 0 && prevScoredCount >= criteriaCount;

    setReviews((prev) => {
      const exists = prev.findIndex((r) => r.id === review.id);
      if (exists >= 0) {
        const copy = [...prev];
        copy[exists] = review;
        return copy;
      }
      return [...prev, review];
    });

    try {
      await setDoc(
        doc(db, 'applications', review.applicationId, 'reviews', review.id),
        review
      );
    } catch {
      // local state maintained
    }

    const app = applications.find((a) => a.id === review.applicationId);
    const grantCodeOrId = app?.grantCode || review.applicationId;
    const adminEmail = programSettings.notifications?.adminEmailRecipient || 'director@nefgrants.org';

    // Notify: Reviewer finished scoring
    if (isNowFinished && !wasAlreadyFinished && programSettings.notifications?.notifyReviewerFinished !== false) {
      await recordAuditLog({
        action: 'REVIEWER_FINISHED_SCORING',
        category: 'System',
        details: `Reviewer ${review.reviewerName || review.reviewerEmail} finished scoring application ${grantCodeOrId} ("${app?.title || ''}"): total score ${review.totalScore}/${review.maxPossibleScore} (${review.percentageScore}%). Notification dispatched to ${adminEmail}.`,
        metadata: {
          applicationId: review.applicationId,
          grantCode: app?.grantCode,
          reviewerEmail: review.reviewerEmail,
          totalScore: review.totalScore,
        },
      });
    }

    // Check if all reviews for this application are complete
    const otherReviews = reviews.filter((r) => r.applicationId === review.applicationId && r.id !== review.id);
    const allAppReviews = [...otherReviews, review];
    const votingReviews = allAppReviews.filter((r) => r.isVoting && !r.recused);
    const allVotingFinished = votingReviews.length >= 2 && votingReviews.every((r) => Object.keys(r.scores || {}).length >= criteriaCount);

    if (allVotingFinished && programSettings.notifications?.notifyAllReviewsComplete !== false) {
      await recordAuditLog({
        action: 'ALL_REVIEWS_COMPLETE',
        category: 'Awards & Decisions',
        details: `All committee reviews completed for application ${grantCodeOrId} ("${app?.title || ''}") with ${votingReviews.length} evaluations recorded. Proposal ready for award determination. Notification dispatched to ${adminEmail}.`,
        metadata: {
          applicationId: review.applicationId,
          grantCode: app?.grantCode,
          completedCount: votingReviews.length,
        },
      });
    }
  };

  const saveApplicationDraft = async (
    appData: Partial<Application> & { id?: string }
  ): Promise<string> => {
    const id = appData.id || `app-nef-${Date.now()}`;
    const now = new Date().toISOString();

    const existing = applications.find((a) => a.id === id);

    const fullApp: Application = {
      id,
      applicantEmail: appData.applicantEmail || currentUser.email,
      applicantNames: appData.applicantNames || [
        { name: currentUser.displayName, email: currentUser.email },
      ],
      campus: appData.campus || currentUser.campus || 'Raguet Elementary',
      gradeLevels: appData.gradeLevels || ['3rd'],
      subjectArea: appData.subjectArea || 'Instructional',
      category: appData.category || 'Category 1',
      title: appData.title || 'Untitled Proposal',
      objectives: appData.objectives || '',
      areaOfFocus: appData.areaOfFocus || 'STEM',
      areaOfFocusOther: appData.areaOfFocusOther || '',
      abstract: appData.abstract || '',
      amountRequested: Number(appData.amountRequested || 0),
      studentsImpacted: Number(appData.studentsImpacted || 0),
      evaluationStrategy: appData.evaluationStrategy || '',
      partners: appData.partners || '',
      sustainability: appData.sustainability || '',
      budgetItems: appData.budgetItems || [],
      plainTextBudget: appData.plainTextBudget || '',
      involvesTech: appData.involvesTech || false,
      involvesFacilities: appData.involvesFacilities || false,
      principalEmail: appData.principalEmail || '',
      techDirectorEmail: appData.techDirectorEmail || '',
      facilityDirectorEmail: appData.facilityDirectorEmail || '',
      principalApproved: existing ? existing.principalApproved : false,
      ackImplementation: appData.ackImplementation ?? false,
      ackProperty: appData.ackProperty ?? false,
      ackApprovals: appData.ackApprovals ?? false,
      electronicSignature: appData.electronicSignature || '',
      signedAt: appData.signedAt || '',
      status: (appData.status as ApplicationStatus) || existing?.status || 'Draft',
      statusReason: appData.statusReason || existing?.statusReason || 'Draft auto-saved.',
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    setApplications((prev) => {
      const idx = prev.findIndex((a) => a.id === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = fullApp;
        return copy;
      }
      return [fullApp, ...prev];
    });

    try {
      await setDoc(doc(db, 'applications', id), fullApp);
    } catch {
      // local state updated
    }

    return id;
  };

  const addTimelineEvent = async (
    applicationId: string,
    status: ApplicationStatus,
    title: string,
    description: string
  ) => {
    const newEvent: TimelineEvent = {
      id: `tl-${Date.now()}`,
      applicationId,
      status,
      title,
      description,
      actorEmail: currentUser.email,
      actorRole: currentUser.role,
      timestamp: new Date().toISOString(),
    };

    setTimelineEvents((prev) => [newEvent, ...prev]);

    try {
      await setDoc(
        doc(db, 'applications', applicationId, 'timeline', newEvent.id),
        newEvent
      );
    } catch {
      // local state updated
    }
  };

  const submitApplication = async (appId: string) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    // Assign grant code strictly on submit if not already assigned
    const { grantCode, sequenceNumber } = app.grantCode
      ? { grantCode: app.grantCode, sequenceNumber: app.sequenceNumber }
      : generateNextGrantCode(programSettings, applications);

    const nextStatus: ApplicationStatus = app.principalEmail ? 'Submitted' : 'Under Review';

    const updated: Application = {
      ...app,
      grantCode,
      sequenceNumber,
      status: nextStatus,
      statusReason: 'Application submitted successfully.',
      updatedAt: new Date().toISOString(),
    };

    setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));

    await addTimelineEvent(
      appId,
      'Submitted',
      'Application Submitted',
      `Submitted by ${currentUser.displayName}. Assigned Grant Code ${grantCode}. Email copy sent to ${app.applicantEmail}.`
    );

    try {
      await updateDoc(doc(db, 'applications', appId), {
        grantCode,
        sequenceNumber,
        status: nextStatus,
        statusReason: updated.statusReason,
        updatedAt: updated.updatedAt,
      });
    } catch {
      // local state updated
    }

    const adminEmail = programSettings.notifications?.adminEmailRecipient || 'director@nefgrants.org';
    const threshold = programSettings.notifications?.largeRequestThreshold ?? 6000;
    const isLargeRequest = (app.amountRequested || 0) >= threshold;

    // Check Large Request Threshold
    if (isLargeRequest && programSettings.notifications?.notifyThresholdExceeded !== false) {
      await recordAuditLog({
        action: 'LARGE_REQUEST_ALERT',
        category: 'System',
        details: `Large Request Alert: Application ${grantCode} requested $${app.amountRequested.toLocaleString()} (Threshold: $${threshold.toLocaleString()}). Immediate notification dispatched to ${adminEmail}.`,
        metadata: {
          grantCode,
          applicationId: appId,
          amountRequested: app.amountRequested,
          threshold,
          recipient: adminEmail,
        },
      });
    }

    // New Submission Notification
    if (programSettings.notifications?.notifyNewSubmission !== false) {
      await recordAuditLog({
        action: 'NEW_SUBMISSION_NOTIFICATION',
        category: 'System',
        details: `New grant submission received: ${grantCode} — "${app.title}" ($${app.amountRequested.toLocaleString()}) by ${app.applicantNames?.[0]?.name || app.applicantEmail}. Notification dispatched to ${adminEmail}.`,
        metadata: {
          grantCode,
          applicationId: appId,
          applicant: app.applicantEmail,
          title: app.title,
          amountRequested: app.amountRequested,
        },
      });
    }

    setActiveNotification({
      title: 'Proposal Submitted Successfully!',
      message: `Your grant proposal "${app.title}" has been assigned Grant Code ${grantCode}. A confirmation copy has been generated.`,
      type: 'success',
    });
  };

  const updateApplicationStatus = async (
    appId: string,
    status: ApplicationStatus,
    reason?: string,
    committeeFeedback?: string,
    awardedAmount?: number
  ) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    const updated: Application = {
      ...app,
      status,
      statusReason: reason || `Status updated to ${status}`,
      committeeFeedback: committeeFeedback !== undefined ? committeeFeedback : app.committeeFeedback,
      awardedAmount: awardedAmount !== undefined ? awardedAmount : app.awardedAmount,
      updatedAt: new Date().toISOString(),
    };

    setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));

    await addTimelineEvent(
      appId,
      status,
      `Status: ${status}`,
      reason || `Decision or lifecycle state updated by ${currentUser.displayName}.`
    );

    try {
      await updateDoc(doc(db, 'applications', appId), {
        status,
        statusReason: updated.statusReason,
        committeeFeedback: updated.committeeFeedback || null,
        awardedAmount: updated.awardedAmount || null,
        updatedAt: updated.updatedAt,
      });
    } catch {
      // local state updated
    }

    // Record admin decision audit log
    await recordAuditLog({
      action: 'DECISION_OR_STATUS_UPDATED',
      category: 'Awards & Decisions',
      details: `Application ${appId} ("${app.title}") status changed to "${status}"${
        awardedAmount !== undefined && awardedAmount > 0 ? ` with award amount of $${awardedAmount.toFixed(2)}` : ''
      }${committeeFeedback ? ` (Feedback provided)` : ''}.`,
      metadata: {
        applicationId: appId,
        title: app.title,
        status,
        awardedAmount,
        reason,
      },
    });
  };

  const sendMoreInfoRequest = async (appId: string, question: string) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    const updated: Application = {
      ...app,
      status: 'More Info Needed',
      moreInfoQuestion: question,
      statusReason: 'Review committee requested additional clarification.',
      updatedAt: new Date().toISOString(),
    };

    setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));

    await addTimelineEvent(
      appId,
      'More Info Needed',
      'Committee Inquiry Sent',
      `Inquiry: "${question}"`
    );

    try {
      await updateDoc(doc(db, 'applications', appId), {
        status: 'More Info Needed',
        moreInfoQuestion: question,
        statusReason: updated.statusReason,
        updatedAt: updated.updatedAt,
      });
    } catch {
      // local state updated
    }

    // Record inquiry in admin audit log
    await recordAuditLog({
      action: 'INQUIRY_SENT',
      category: 'Inquiries',
      details: `Sent official committee inquiry to application ${appId} ("${app.title}"): "${question.slice(0, 100)}${
        question.length > 100 ? '...' : ''
      }"`,
      metadata: { applicationId: appId, title: app.title, question },
    });
  };

  const saveAdminEligibility = async (appId: string, screening: AdminEligibilityScreening) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    const now = new Date().toISOString();
    const newStatus = screening.passed && (app.status === 'Submitted' || app.status === 'More Info Needed')
      ? 'Under Review'
      : app.status;

    const updated: Application = {
      ...app,
      status: newStatus,
      adminEligibility: screening,
      statusReason: screening.passed
        ? `Eligibility verified by admin ${screening.checkedBy}. All 5 gates passed.`
        : `Admin eligibility screening flagged paperwork issues: ${screening.notes || 'Review required'}.`,
      updatedAt: now,
    };

    setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));

    await addTimelineEvent(
      appId,
      newStatus,
      screening.passed ? 'Eligibility Screening Passed' : 'Eligibility Screening Incomplete',
      screening.passed
        ? `Admin verified all 5 baseline criteria (NISD applicant, within cap, Q16-18 yes, no prohibited costs, prior report submitted). Cleared for reviewer scoring.`
        : `Eligibility check noted: ${screening.notes || 'Fixable paperwork items detected.'}`
    );

    try {
      await updateDoc(doc(db, 'applications', appId), {
        status: newStatus,
        adminEligibility: screening,
        statusReason: updated.statusReason,
        updatedAt: now,
      });
    } catch {
      // local state updated
    }

    await recordAuditLog({
      action: screening.passed ? 'ELIGIBILITY_PASSED' : 'ELIGIBILITY_FLAGGED',
      category: 'Awards & Decisions',
      details: `Admin ${currentUser.displayName} completed eligibility checklist for ${app.grantCode || appId} ("${app.title}"): ${
        screening.passed ? 'PASSED (All 5 gates verified)' : 'FAILED/FIXABLE'
      }.`,
      metadata: { applicationId: appId, grantCode: app.grantCode, screening },
    });

    setActiveNotification({
      title: screening.passed ? 'Eligibility Passed' : 'Eligibility Flagged',
      message: screening.passed
        ? `${app.grantCode || 'Application'} verified and cleared for reviewer evaluation.`
        : `Paperwork issue recorded. You can request clarification via "More Info Needed".`,
      type: screening.passed ? 'success' : 'warn',
    });
  };

  const assignReviewersToApplication = async (appId: string, reviewerIds: string[]) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    const now = new Date().toISOString();
    const updated: Application = {
      ...app,
      assignedReviewerIds: reviewerIds,
      updatedAt: now,
    };

    setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));

    try {
      await updateDoc(doc(db, 'applications', appId), {
        assignedReviewerIds: reviewerIds,
        updatedAt: now,
      });
    } catch {
      // local state updated
    }

    await recordAuditLog({
      action: 'REVIEWERS_ASSIGNED',
      category: 'Awards & Decisions',
      details: `Reviewer assignments updated for ${app.grantCode || appId}: ${
        reviewerIds.length === 0 || reviewerIds.includes('all')
          ? 'All Reviewers (Default)'
          : `${reviewerIds.length} specific reviewers assigned`
      }.`,
      metadata: { applicationId: appId, grantCode: app.grantCode, reviewerIds },
    });

    setActiveNotification({
      title: 'Reviewers Assigned',
      message: `Reviewer assignment updated for ${app.grantCode || 'application'}.`,
      type: 'success',
    });
  };

  const markCheckSent = async (
    appId: string,
    checkData: {
      checkNumber: string;
      checkSentAt: string;
      checkAmount?: number;
      checkNotes?: string;
    }
  ) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    const now = new Date().toISOString();
    const finalAmount = checkData.checkAmount || app.awardedAmount || app.amountRequested;
    const updated: Application = {
      ...app,
      checkSent: true,
      checkSentAt: checkData.checkSentAt || now,
      checkNumber: checkData.checkNumber,
      checkAmount: finalAmount,
      checkNotes: checkData.checkNotes,
      updatedAt: now,
    };

    setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));

    await addTimelineEvent(
      appId,
      app.status,
      'Grant Check Disbursed',
      `Check #${checkData.checkNumber} for $${finalAmount.toFixed(2)} disbursed to campus activity fund.`
    );

    try {
      await updateDoc(doc(db, 'applications', appId), {
        checkSent: true,
        checkSentAt: updated.checkSentAt,
        checkNumber: updated.checkNumber,
        checkAmount: updated.checkAmount,
        checkNotes: updated.checkNotes,
        updatedAt: now,
      });
    } catch {
      // local state updated
    }

    await recordAuditLog({
      action: 'CHECK_SENT_MARKED',
      category: 'Awards & Decisions',
      details: `Grant check #${checkData.checkNumber} for $${finalAmount.toFixed(2)} marked as sent for ${app.grantCode || appId} ("${app.title}").`,
      metadata: { applicationId: appId, grantCode: app.grantCode, checkNumber: checkData.checkNumber, amount: finalAmount },
    });

    setActiveNotification({
      title: 'Check Marked Disbursed',
      message: `Check #${checkData.checkNumber} recorded for ${app.grantCode || 'this grant'}.`,
      type: 'success',
    });
  };

  const recordAuditLog = async (entry: {
    action: string;
    category: AuditCategory;
    details: string;
    metadata?: Record<string, any>;
  }) => {
    const newLog: AdminAuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action: entry.action,
      category: entry.category,
      details: entry.details,
      userEmail: currentUser.email,
      userName: currentUser.displayName,
      userRole: currentUser.role,
      timestamp: new Date().toISOString(),
      metadata: entry.metadata,
    };

    setAuditLogs((prev) => [newLog, ...prev]);

    try {
      await setDoc(doc(db, 'auditLogs', newLog.id), newLog);
    } catch {
      // local state maintained
    }
  };

  const clearAuditLogs = async () => {
    const resetLog: AdminAuditLog = {
      id: `log-${Date.now()}`,
      action: 'AUDIT_LOGS_ARCHIVED',
      category: 'System',
      details: `Admin audit log history archived and reset by ${currentUser.displayName} (${currentUser.role}).`,
      userEmail: currentUser.email,
      userName: currentUser.displayName,
      userRole: currentUser.role,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs([resetLog]);
    try {
      await setDoc(doc(db, 'auditLogs', resetLog.id), resetLog);
    } catch {
      // local state maintained
    }
  };

  const respondToMoreInfo = async (appId: string, response: string) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    const now = new Date().toISOString();
    const updated: Application = {
      ...app,
      status: 'Under Review',
      moreInfoResponse: response,
      moreInfoRespondedAt: now,
      statusReason: 'Applicant responded to committee inquiry. Returned to Under Review.',
      updatedAt: now,
    };

    setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));

    await addTimelineEvent(
      appId,
      'Under Review',
      'Applicant Inquiry Response',
      `Applicant submitted clarification: "${response.slice(0, 100)}..."`
    );

    try {
      await updateDoc(doc(db, 'applications', appId), {
        status: 'Under Review',
        moreInfoResponse: response,
        moreInfoRespondedAt: now,
        statusReason: updated.statusReason,
        updatedAt: now,
      });
    } catch {
      // local state updated
    }

    setActiveNotification({
      title: 'Inquiry Response Sent',
      message: 'Your response was submitted to the review committee. Application is now Under Review.',
      type: 'success',
    });
  };

  const reportPoSubmitted = async (appId: string) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;
    const now = new Date().toISOString();
    const updated: Application = {
      ...app,
      poSubmittedAt: now,
      updatedAt: now,
    };
    setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));

    await addTimelineEvent(
      appId,
      app.status,
      'Purchase Order Reported',
      `Teacher ${currentUser.displayName} reported campus purchase order submitted for funded items.`
    );

    try {
      await updateDoc(doc(db, 'applications', appId), {
        poSubmittedAt: now,
        updatedAt: now,
      });
    } catch {
      // local state updated
    }

    const adminEmail = programSettings.notifications?.adminEmailRecipient || 'director@nefgrants.org';
    if (programSettings.notifications?.notifyTeacherPoSubmitted !== false) {
      await recordAuditLog({
        action: 'TEACHER_PO_SUBMITTED',
        category: 'System',
        details: `Teacher reported PO submission for ${app.grantCode || appId} ("${app.title}"). Admin notification dispatched to ${adminEmail}.`,
        metadata: { grantCode: app.grantCode, applicationId: appId, teacher: currentUser.email },
      });
    }

    setActiveNotification({
      title: 'Purchase Order Reported',
      message: `Purchase order status recorded for ${app.grantCode || 'your grant'}. The grants committee has been notified.`,
      type: 'success',
    });
  };

  const reportEventDate = async (appId: string, eventDate: string) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;
    const now = new Date().toISOString();
    const updated: Application = {
      ...app,
      eventDate,
      updatedAt: now,
    };
    setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));

    await addTimelineEvent(
      appId,
      app.status,
      'Project Showcase Event Date Scheduled',
      `Teacher scheduled project demonstration / classroom showcase on: ${eventDate}.`
    );

    try {
      await updateDoc(doc(db, 'applications', appId), {
        eventDate,
        updatedAt: now,
      });
    } catch {
      // local state updated
    }

    const adminEmail = programSettings.notifications?.adminEmailRecipient || 'director@nefgrants.org';
    if (programSettings.notifications?.notifyTeacherEventDate !== false) {
      await recordAuditLog({
        action: 'TEACHER_EVENT_DATE_SHARED',
        category: 'System',
        details: `Teacher shared project event date (${eventDate}) for ${app.grantCode || appId} ("${app.title}"). Admin notification dispatched to ${adminEmail}.`,
        metadata: { grantCode: app.grantCode, applicationId: appId, eventDate, teacher: currentUser.email },
      });
    }

    setActiveNotification({
      title: 'Event Date Shared!',
      message: `Project showcase date (${eventDate}) recorded. Foundation directors love attending student showcases!`,
      type: 'success',
    });
  };

  const submitFinalReport = async (appId: string, report: FinalReportData) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    const updated: Application = {
      ...app,
      status: 'Complete',
      finalReport: report,
      statusReason: 'Final project report and student outcomes submitted.',
      updatedAt: new Date().toISOString(),
    };

    setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));

    await addTimelineEvent(
      appId,
      'Complete',
      'Final Grant Report Completed',
      `Report submitted by ${currentUser.displayName}. Impacted ${report.actualStudentImpact} students.`
    );

    try {
      await updateDoc(doc(db, 'applications', appId), {
        status: 'Complete',
        finalReport: report,
        statusReason: updated.statusReason,
        updatedAt: updated.updatedAt,
      });
    } catch {
      // local state updated
    }

    const adminEmail = programSettings.notifications?.adminEmailRecipient || 'director@nefgrants.org';
    if (programSettings.notifications?.notifyFinalReportSubmitted !== false) {
      await recordAuditLog({
        action: 'FINAL_REPORT_SUBMITTED_NOTIFICATION',
        category: 'System',
        details: `Final project report submitted for ${app.grantCode || appId} ("${app.title}"). Actual student impact: ${report.actualStudentImpact}. Notification dispatched to ${adminEmail}.`,
        metadata: { grantCode: app.grantCode, applicationId: appId, studentImpact: report.actualStudentImpact },
      });
    }

    setActiveNotification({
      title: 'Final Report Submitted!',
      message: 'Thank you for sharing your innovative teaching project outcomes with NEF. You are now eligible to apply in future cycles!',
      type: 'success',
    });
  };

  const simulatePrincipalApproval = async (
    appId: string,
    approved: boolean,
    comment?: string
  ) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    const now = new Date().toISOString();
    const updated: Application = {
      ...app,
      principalApproved: approved,
      principalApprovedAt: now,
      principalComment: comment || (approved ? 'Principal endorsed proposal.' : 'Needs revision.'),
      status: approved ? 'Under Review' : 'Draft',
      statusReason: approved
        ? 'Campus Principal approved proposal. Advanced to committee review.'
        : 'Principal suggested modifications before resubmitting.',
      updatedAt: now,
    };

    setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));

    await addTimelineEvent(
      appId,
      approved ? 'Under Review' : 'Draft',
      approved ? 'Principal Endorsement Approved' : 'Principal Modification Request',
      comment || (approved ? 'Principal signed off on proposal.' : 'Feedback provided.')
    );
  };

  const toggleRecusal = async (appId: string, recused: boolean, reason?: string) => {
    // Record recusal on reviewer's review record
    const existing = reviews.find(
      (r) => r.applicationId === appId && r.reviewerEmail === currentUser.email
    );

    const reviewRecord: Review = existing || {
      id: `rev-${appId}-${currentUser.id}`,
      applicationId: appId,
      reviewerEmail: currentUser.email,
      reviewerName: currentUser.displayName,
      isVoting: currentUser.role === 'Reviewer',
      scores: {},
      comments: {},
      totalScore: 0,
      maxPossibleScore: 40,
      percentageScore: 0,
      eligibilityChecklist: {
        eligibleApplicant: true,
        withinCategoryCap: true,
        acknowledgementsYes: true,
        noProhibitedCosts: true,
        priorReportSubmitted: true,
      },
      generalFeedback: '',
      shareWithApplicant: false,
      recused,
      recusalReason: reason,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    reviewRecord.recused = recused;
    reviewRecord.recusalReason = reason;

    await saveReview(reviewRecord);

    setActiveNotification({
      title: recused ? 'Recusal Recorded' : 'Recusal Cleared',
      message: recused
        ? `You have recused yourself from reviewing application ${appId}.`
        : 'You may now score this application.',
      type: 'info',
    });
  };

  const inviteReviewer = async (reviewerInput: {
    name: string;
    email: string;
    role: 'Reviewer' | 'NonVotingReviewer';
    cyclesServed?: number;
    mailingAddress?: string;
    shirtSize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';
  }) => {
    const token = `mag-${Math.random().toString(36).substring(2, 10)}`;
    const id = `rev-prof-${Date.now()}`;
    const newReviewer: ReviewerProfile = {
      id,
      name: reviewerInput.name.trim(),
      email: reviewerInput.email.trim().toLowerCase(),
      role: reviewerInput.role,
      cyclesServed: reviewerInput.cyclesServed ?? 1,
      mailingAddress: reviewerInput.mailingAddress || '',
      shirtSize: reviewerInput.shirtSize || 'L',
      invitedAt: new Date().toISOString(),
      magicLinkToken: token,
      reminderSent3Day: false,
      reminderSent1Day: false,
      thankYouSent: false,
    };

    setReviewers((prev) => [newReviewer, ...prev.filter((r) => r.email.toLowerCase() !== newReviewer.email)]);

    try {
      await setDoc(doc(db, 'reviewers', id), newReviewer);
    } catch {}

    const magicLink = `${window.location.origin}?reviewerToken=${token}&email=${encodeURIComponent(newReviewer.email)}`;

    await recordAuditLog({
      action: 'REVIEWER_INVITED',
      category: 'System',
      details: `Invited reviewer ${newReviewer.name} (${newReviewer.email}) as ${
        newReviewer.role === 'NonVotingReviewer' ? 'Non-Voting Observer' : 'Voting Committee Member'
      }. Magic sign-in link generated with scoring deadline ${programSettings.reviewClosesDate || 'Nov 16, 2026'}.`,
      metadata: {
        reviewerId: id,
        name: newReviewer.name,
        email: newReviewer.email,
        role: newReviewer.role,
      },
    });

    setActiveNotification({
      title: 'Reviewer Invited!',
      message: `Magic sign-in link generated for ${newReviewer.name}. Welcome invitation ready with rubric & deadline.`,
      type: 'success',
    });

    return { reviewer: newReviewer, magicLink };
  };

  const updateReviewerProfile = async (rev: ReviewerProfile) => {
    setReviewers((prev) => prev.map((r) => (r.id === rev.id ? rev : r)));
    try {
      await setDoc(doc(db, 'reviewers', rev.id), rev);
    } catch {}
    await recordAuditLog({
      action: 'REVIEWER_PROFILE_UPDATED',
      category: 'System',
      details: `Updated reviewer profile for ${rev.name} (${rev.email}): address/shirt size (${rev.shirtSize || 'N/A'}), or cycles served (${rev.cyclesServed}).`,
      metadata: { reviewerId: rev.id, name: rev.name, email: rev.email },
    });
  };

  const deleteReviewerProfile = async (reviewerId: string) => {
    const rev = reviewers.find((r) => r.id === reviewerId);
    setReviewers((prev) => prev.filter((r) => r.id !== reviewerId));
    try {
      await setDoc(doc(db, 'reviewers', reviewerId), { deleted: true });
    } catch {}
    if (rev) {
      await recordAuditLog({
        action: 'REVIEWER_REMOVED',
        category: 'System',
        details: `Removed reviewer ${rev.name} (${rev.email}) from committee roster.`,
        metadata: { reviewerId, email: rev.email },
      });
    }
  };

  const sendReviewerReminder = async (reviewerId: string, reminderType: '3-day' | '1-day') => {
    const rev = reviewers.find((r) => r.id === reviewerId);
    if (!rev) return;
    const updated: ReviewerProfile = {
      ...rev,
      reminderSent3Day: reminderType === '3-day' ? true : rev.reminderSent3Day,
      reminderSent1Day: reminderType === '1-day' ? true : rev.reminderSent1Day,
    };
    setReviewers((prev) => prev.map((r) => (r.id === reviewerId ? updated : r)));
    try {
      await setDoc(doc(db, 'reviewers', reviewerId), updated);
    } catch {}

    await recordAuditLog({
      action: `REVIEWER_${reminderType.toUpperCase()}_REMINDER_SENT`,
      category: 'System',
      details: `Sent automated ${reminderType} review close reminder to ${rev.name} (${rev.email}). Deadline: ${programSettings.reviewClosesDate || 'Nov 16, 2026'} at 11:59 PM.`,
      metadata: { reviewerId, email: rev.email, reminderType },
    });

    setActiveNotification({
      title: `${reminderType === '3-day' ? '3-Day' : '1-Day'} Reminder Dispatched!`,
      message: `Automated scoring deadline notice dispatched to ${rev.name} (${rev.email}).`,
      type: 'info',
    });
  };

  const sendReviewerThankYou = async (reviewerId: string) => {
    const rev = reviewers.find((r) => r.id === reviewerId);
    if (!rev) return;
    const updated: ReviewerProfile = { ...rev, thankYouSent: true };
    setReviewers((prev) => prev.map((r) => (r.id === reviewerId ? updated : r)));
    try {
      await setDoc(doc(db, 'reviewers', reviewerId), updated);
    } catch {}

    await recordAuditLog({
      action: 'REVIEWER_THANK_YOU_DISPATCHED',
      category: 'System',
      details: `Dispatched official foundation thank-you recognition notice to reviewer ${rev.name} (${rev.email}) for evaluating grant proposals this cycle.`,
      metadata: { reviewerId, email: rev.email, cyclesServed: rev.cyclesServed },
    });

    setActiveNotification({
      title: 'Thank-You Recognition Sent!',
      message: `Foundation thank-you appreciation dispatched to ${rev.name}.`,
      type: 'success',
    });
  };

  const loginWithMagicLink = (tokenOrEmail: string): boolean => {
    const match = reviewers.find(
      (r) =>
        r.magicLinkToken === tokenOrEmail ||
        r.email.toLowerCase() === tokenOrEmail.toLowerCase().trim()
    );
    if (match) {
      switchUser(match.role, match.email, match.name);
      setActiveNotification({
        title: `Welcome, ${match.name}!`,
        message: `Signed in via magic link (${match.role === 'NonVotingReviewer' ? 'Observer' : 'Voting Member'}). Scoring closes ${programSettings.reviewClosesDate || 'Nov 16, 2026'}.`,
        type: 'success',
      });
      return true;
    }
    return false;
  };

  return (
    <GrantContext.Provider
      value={{
        currentUser,
        switchUser,
        applications,
        programSettings,
        updateProgramSettings,
        vendors,
        addVendor,
        updateVendor,
        deleteVendor,
        uploadVendorCsv,
        rubric,
        updateRubricCriterion,
        resetRubricToDefaults,
        reviews,
        saveReview,
        saveApplicationDraft,
        submitApplication,
        updateApplicationStatus,
        sendMoreInfoRequest,
        respondToMoreInfo,
        saveAdminEligibility,
        assignReviewersToApplication,
        markCheckSent,
        reportPoSubmitted,
        reportEventDate,
        submitFinalReport,
        simulatePrincipalApproval,
        toggleRecusal,
        timelineEvents,
        auditLogs,
        recordAuditLog,
        clearAuditLogs,
        isSyncing,
        activeNotification,
        dismissNotification,
        userPendingFinalReport,
        reviewers,
        inviteReviewer,
        updateReviewerProfile,
        deleteReviewerProfile,
        sendReviewerReminder,
        sendReviewerThankYou,
        loginWithMagicLink,
        resetToGoogleSheetData,
      }}
    >
      {children}
    </GrantContext.Provider>
  );
};

export const useGrant = () => {
  const context = useContext(GrantContext);
  if (!context) {
    throw new Error('useGrant must be used within a GrantProvider');
  }
  return context;
};
