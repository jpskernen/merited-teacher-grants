import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  Application,
  ApplicationStatus,
  BudgetItem,
  FinalReportData,
  ProgramSettings,
  Review,
  RubricCriterion,
  TimelineEvent,
  UserProfile,
  UserRole,
  Vendor,
} from '../types/grant';
import {
  INITIAL_APPLICATIONS,
  INITIAL_PROGRAM_SETTINGS,
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
  submitFinalReport: (appId: string, report: FinalReportData) => Promise<void>;
  simulatePrincipalApproval: (appId: string, approved: boolean, comment?: string) => Promise<void>;
  toggleRecusal: (appId: string, recused: boolean, reason?: string) => Promise<void>;
  timelineEvents: TimelineEvent[];
  isSyncing: boolean;
  activeNotification: { title: string; message: string; type?: 'info' | 'success' | 'warn' } | null;
  dismissNotification: () => void;
  userPendingFinalReport: boolean;
}

const GrantContext = createContext<GrantContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'merited_grants_cache_v1';

export const GrantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user state
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    return {
      id: 'usr-teacher-1',
      email: 'janekernen@gmail.com',
      displayName: 'Jane Kernen',
      role: 'Teacher',
      campus: 'Raguet Elementary',
      recusedAppIds: [],
    };
  });

  // State collections initialized from seed data or local cache
  const [programSettings, setProgramSettings] = useState<ProgramSettings>(() => {
    const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY}_settings`);
    return cached ? JSON.parse(cached) : INITIAL_PROGRAM_SETTINGS;
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY}_vendors`);
    return cached ? JSON.parse(cached) : INITIAL_VENDORS;
  });

  const [rubric, setRubric] = useState<RubricCriterion[]>(() => {
    const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY}_rubric`);
    return cached ? JSON.parse(cached) : INITIAL_RUBRIC;
  });

  const [applications, setApplications] = useState<Application[]>(() => {
    const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY}_apps`);
    return cached ? JSON.parse(cached) : INITIAL_APPLICATIONS;
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY}_reviews`);
    return cached ? JSON.parse(cached) : INITIAL_REVIEWS;
  });

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
    } catch {
      // ignore quota errors
    }
  }, [programSettings, vendors, rubric, applications, reviews, timelineEvents]);

  // Initial Firestore synchronization with defensive error handling
  useEffect(() => {
    let unsubscribeSettings: (() => void) | undefined;
    let unsubscribeVendors: (() => void) | undefined;
    let unsubscribeApps: (() => void) | undefined;

    const setupFirestoreListeners = async () => {
      try {
        setIsSyncing(true);

        // Bootstrap initial records if Firestore is completely empty
        const appsRef = collection(db, 'applications');
        const snap = await getDocs(appsRef).catch((e) => {
          console.warn('Initial apps read note:', e);
          return null;
        });

        if (snap && snap.empty) {
          // Seed initial data to Firestore
          for (const app of INITIAL_APPLICATIONS) {
            await setDoc(doc(db, 'applications', app.id), app).catch(() => {});
          }
          for (const vendor of INITIAL_VENDORS) {
            await setDoc(doc(db, 'vendors', vendor.id), vendor).catch(() => {});
          }
          await setDoc(doc(db, 'programs', INITIAL_PROGRAM_SETTINGS.id), INITIAL_PROGRAM_SETTINGS).catch(() => {});
        }

        // Setup real-time listener for applications
        unsubscribeApps = onSnapshot(
          collection(db, 'applications'),
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded: Application[] = [];
              snapshot.forEach((d) => loaded.push(d.data() as Application));
              setApplications(loaded);
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
    let defaultCampus = 'Raguet Elementary';

    switch (role) {
      case 'Teacher':
        defaultEmail = email || 'janekernen@gmail.com';
        defaultName = name || 'Jane Kernen';
        defaultCampus = 'Raguet Elementary';
        break;
      case 'Reviewer':
        defaultEmail = email || 'arthur.campbell@nefcommittee.org';
        defaultName = name || 'Dr. Arthur Campbell (NEF Director)';
        break;
      case 'NonVotingReviewer':
        defaultEmail = email || 'ed.teaching@nacisd.org';
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

  const updateProgramSettings = async (settings: Partial<ProgramSettings>) => {
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
  };

  const updateVendor = async (vendor: Vendor) => {
    setVendors((prev) => prev.map((v) => (v.id === vendor.id ? vendor : v)));
    try {
      await updateDoc(doc(db, 'vendors', vendor.id), { ...vendor });
    } catch {
      // local state updated
    }
  };

  const deleteVendor = async (vendorId: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== vendorId));
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
    }
    return addedCount;
  };

  const updateRubricCriterion = async (criterion: RubricCriterion) => {
    setRubric((prev) => prev.map((c) => (c.id === criterion.id ? criterion : c)));
  };

  const saveReview = async (review: Review) => {
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

    const nextStatus: ApplicationStatus = app.principalEmail ? 'Submitted' : 'Under Review';

    const updated: Application = {
      ...app,
      status: nextStatus,
      statusReason: 'Application submitted successfully.',
      updatedAt: new Date().toISOString(),
    };

    setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));

    await addTimelineEvent(
      appId,
      'Submitted',
      'Application Submitted',
      `Submitted by ${currentUser.displayName}. Email copy sent to ${app.applicantEmail}.`
    );

    try {
      await updateDoc(doc(db, 'applications', appId), {
        status: nextStatus,
        statusReason: updated.statusReason,
        updatedAt: updated.updatedAt,
      });
    } catch {
      // local state updated
    }

    setActiveNotification({
      title: 'Proposal Submitted Successfully!',
      message: `Your grant proposal "${app.title}" has been received by NEF. A confirmation copy has been generated.`,
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
        reviews,
        saveReview,
        saveApplicationDraft,
        submitApplication,
        updateApplicationStatus,
        sendMoreInfoRequest,
        respondToMoreInfo,
        submitFinalReport,
        simulatePrincipalApproval,
        toggleRecusal,
        timelineEvents,
        isSyncing,
        activeNotification,
        dismissNotification,
        userPendingFinalReport,
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
