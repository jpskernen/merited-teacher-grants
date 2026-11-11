import React, { useState, useEffect, useRef } from 'react';
import { useGrants, normalizeRole } from '../../context/GrantContext';
import { Application, Review } from '../../types/grant';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Users,
  EyeOff,
  Target,
  FileText,
  Scale,
  CheckSquare,
  Lock,
  Flag,
  Save,
  Send,
  Info,
} from 'lucide-react';

interface ReviewerScoreScreenProps {
  applicationId: string;
  onBack: () => void;
}

export const ReviewerScoreScreen: React.FC<ReviewerScoreScreenProps> = ({
  applicationId,
  onBack,
}) => {
  const {
    currentUser,
    applications,
    rubric,
    reviews,
    saveReviewDraft,
    submitOfficialReview,
    openApplicationForReview,
    programSettings,
    toggleRecusal,
    isReviewClosed,
    reviewDeadlineInfo,
  } = useGrants();

  const application = applications.find((a) => a.id === applicationId);

  const existingReview = reviews.find(
    (r) =>
      r.applicationId === applicationId &&
      currentUser &&
      (r.reviewerId === currentUser.id ||
        r.reviewerEmail.toLowerCase() === currentUser.email.toLowerCase())
  );

  const [scores, setScores] = useState<Record<string, number>>(
    existingReview?.scores || {}
  );
  const [comments, setComments] = useState<Record<string, string>>(
    existingReview?.comments || {}
  );
  const [generalFeedback, setGeneralFeedback] = useState<string>(
    existingReview?.generalFeedback || ''
  );
  const [flaggedForDiscussion, setFlaggedForDiscussion] = useState<boolean>(
    Boolean(existingReview?.flaggedForDiscussion)
  );

  const [lastSaved, setLastSaved] = useState<string | null>(() => {
    if (existingReview?.updatedAt && !existingReview.isSubmitted) {
      try {
        return new Date(existingReview.updatedAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [submittedConfirmation, setSubmittedConfirmation] = useState<{
    submittedAt: string;
    grantCode: string;
    title: string;
    totalScore: number;
  } | null>(null);

  // Active highlighted question to assist reviewers
  const [activeHighlightSource, setActiveHighlightSource] = useState<string | null>(null);

  // Gemini Neutral Summary states
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const userRole = normalizeRole(currentUser?.role);
  const isLocked = Boolean(existingReview?.isSubmitted && userRole !== 'admin');
  const isReviewWindowClosed = isReviewClosed && userRole !== 'admin';

  // Automatically transition application from Submitted to Under Review on first open
  useEffect(() => {
    if (applicationId) {
      openApplicationForReview(applicationId).catch((err) => {
        console.warn('Note on openApplicationForReview:', err);
      });
    }
  }, [applicationId]);

  // Keep state synced with existingReview if loaded later
  useEffect(() => {
    if (existingReview) {
      setScores(existingReview.scores || {});
      setComments(existingReview.comments || {});
      setGeneralFeedback(existingReview.generalFeedback || '');
      setFlaggedForDiscussion(Boolean(existingReview.flaggedForDiscussion));
    }
  }, [existingReview?.id]);

  // 100-Point Scoring Matrix calculation: (score / 5) * weight
  const totalScore = Math.round(
    Object.entries(scores).reduce((sum, [critId, val]) => {
      const crit = rubric.find((c) => c.id === critId);
      const weight = crit?.weight || 0;
      return sum + ((val || 0) / 5) * weight;
    }, 0) * 10
  ) / 10;

  const maxPossible = rubric.reduce((sum, c) => sum + (c.weight || 0), 0) || 100;

  // Auto-save draft logic (only if not locked)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performAutoSave = async () => {
    if (!application || !currentUser || isLocked || isReviewWindowClosed) return;

    setIsSaving(true);
    setErrorMessage(null);

    const reviewData: Review = {
      id: existingReview?.id || `${applicationId}_${currentUser.id}`,
      applicationId,
      reviewerId: currentUser.id,
      reviewerEmail: currentUser.email,
      reviewerName: currentUser.displayName,
      isVoting: currentUser.isVoting ?? true,
      scores,
      comments,
      totalScore,
      generalFeedback,
      flaggedForDiscussion,
      recused: false,
      isSubmitted: false,
      submittedAt: existingReview?.submittedAt,
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveReviewDraft(reviewData);
      setLastSaved(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          'This application may have been decided, or your assignment may have changed. Please reload.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (isLocked || isReviewWindowClosed) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, 2500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [scores, comments, generalFeedback, flaggedForDiscussion]);

  // Manual save draft handler
  const handleManualSaveDraft = async () => {
    if (isLocked || isReviewWindowClosed) return;
    await performAutoSave();
  };

  // Validate all 8 criteria and one-line comments before submit
  const validateForSubmission = (): boolean => {
    const errors: string[] = [];
    rubric.forEach((crit, idx) => {
      const s = scores[crit.id];
      const c = comments[crit.id]?.trim();
      if (!s || s < 1 || s > 5) {
        errors.push(`Criterion ${idx + 1} (${crit.title}) requires a score from 1 to 5.`);
      }
      if (!c) {
        errors.push(`Criterion ${idx + 1} (${crit.title}) requires a written evidence justification.`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Submit official locked review
  const handleConfirmSubmit = async () => {
    if (!application || !currentUser) return;
    if (!validateForSubmission()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const reviewData: Review = {
      id: existingReview?.id || `${applicationId}_${currentUser.id}`,
      applicationId,
      reviewerId: currentUser.id,
      reviewerEmail: currentUser.email,
      reviewerName: currentUser.displayName,
      isVoting: currentUser.isVoting ?? true,
      scores,
      comments,
      totalScore,
      generalFeedback,
      flaggedForDiscussion,
      recused: false,
      isSubmitted: true,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await submitOfficialReview(reviewData);
      setShowConfirmSubmit(false);
      setSubmittedConfirmation({
        submittedAt: new Date().toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }),
        grantCode: application.grantCode,
        title: application.title,
        totalScore,
      });
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          'This application may have been decided, or your assignment may have changed. Please reload.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Request neutral 3-sentence summary
  const handleGenerateSummary = async () => {
    if (!application) return;
    setLoadingSummary(true);
    try {
      const res = await fetch('/api/gemini/summarize-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: application.title,
          category: application.category,
          amountRequested: application.amountRequested,
          studentsImpacted: application.studentsImpacted,
          objectives: application.objectives,
          abstract: application.abstract,
        }),
      });
      const data = await res.json();
      setAiSummary(data.summary);
    } catch {
      setAiSummary(
        `This proposal requests $${(application.amountRequested || 0).toLocaleString()} for ${application.studentsImpacted} students under ${application.category}. It focuses on hands-on activities to achieve targeted learning objectives. Grant funds will provide dedicated materials for classroom implementation.`
      );
    } finally {
      setLoadingSummary(false);
    }
  };

  const categoryCap =
    application?.category === 'Category 2'
      ? programSettings.category2Cap
      : programSettings.category1Cap;

  const withinCap = (application?.amountRequested || 0) <= categoryCap;

  if (!application) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-600">Application not found.</p>
        <button onClick={onBack} className="mt-2 text-xs text-[#062A3D] underline">
          Return to Queue
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition shadow-2xs"
            title="Return to Review Queue"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-[#062A3D] text-[#8CC8E8] shadow-2xs">
                {application.grantCode}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#062A3D] text-[#8CC8E8]">
                {application.category} (Cap: ${categoryCap.toLocaleString()})
              </span>
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                <EyeOff className="w-3 h-3 text-[#8CC8E8]" />
                <span>Blind Review Active</span>
              </span>
              {existingReview?.isSubmitted && (
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Submitted & Locked</span>
                </span>
              )}
              {flaggedForDiscussion && (
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Flag className="w-3 h-3 fill-amber-600 text-amber-600" />
                  <span>Flagged for Discussion</span>
                </span>
              )}
            </div>
            <h1 className="text-lg font-bold text-[#062A3D] mt-1 truncate max-w-xl">
              {application.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {!isLocked && !isReviewWindowClosed && (
            <div className="text-right text-xs">
              {isSaving ? (
                <span className="text-[#8CC8E8] bg-[#062A3D]/40 border border-white/10 px-3 py-1 rounded-xl font-semibold flex items-center gap-1.5 shadow-2xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Autosaving draft...
                </span>
              ) : lastSaved ? (
                <span className="text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-xl flex items-center gap-1.5 font-bold shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Draft saved at {lastSaved}
                </span>
              ) : (
                <span className="text-slate-500 bg-white/80 border border-slate-200 px-2.5 py-1 rounded-xl font-medium">
                  Draft autosave active
                </span>
              )}
            </div>
          )}

          {!isLocked && (
            <button
              onClick={() => {
                toggleRecusal(application.id, true, 'Reviewer declared conflict of interest');
                onBack();
              }}
              className="px-3.5 py-1.5 rounded-xl border border-amber-300 text-amber-800 hover:bg-amber-50 text-xs font-semibold"
            >
              Recuse Self
            </button>
          )}
        </div>
      </div>

      {/* Refusal / Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Notice:</span>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Locked Evaluation Notification */}
      {isLocked && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>
              <strong>Official Review Locked:</strong> Submitted on{' '}
              {existingReview?.submittedAt
                ? new Date(existingReview.submittedAt).toLocaleString()
                : 'file'}{' '}
              with a score of <strong>{existingReview?.totalScore} pts</strong>.
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
            Official Submission Record
          </span>
        </div>
      )}

      {/* Review Closed Notification */}
      {isReviewWindowClosed && !isLocked && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Scoring Window Concluded:</strong> Review scoring closed at 11:59 PM America/Chicago on {reviewDeadlineInfo.formattedCutoff}. Viewing in read-only mode.
          </div>
        </div>
      )}

      {/* Two-Pane Layout: Blind Proposal Content on Left, Rubric on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Proposal Narrative & Budget Details (5 cols) */}
        <div className="lg:col-span-5 space-y-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm max-h-[85vh] overflow-y-auto">
          {/* AI Neutral Summary */}
          <div className="bg-[#062A3D] text-white p-4 rounded-2xl space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#8CC8E8]">
                <Sparkles className="w-4 h-4 text-[#8CC8E8]" />
                <span>3-Sentence Objective Summary</span>
              </div>
              <button
                type="button"
                onClick={handleGenerateSummary}
                disabled={loadingSummary}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#8CC8E8] text-[#062A3D] hover:bg-[#a0d4ef] disabled:opacity-50"
              >
                {loadingSummary ? 'Summarizing...' : 'Generate'}
              </button>
            </div>

            {aiSummary ? (
              <p className="text-xs text-slate-200 italic leading-relaxed pt-1 border-t border-white/10">
                "{aiSummary}"
              </p>
            ) : (
              <p className="text-[11px] text-slate-300">
                Generate an objective, neutral 3-sentence summary of this proposal (never suggests a score).
              </p>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-[#F4F7F9] p-3.5 rounded-2xl border border-slate-200">
            <div>
              <span className="text-slate-500 font-medium">Requested Amount:</span>
              <div className="font-extrabold text-[#062A3D] text-sm mt-0.5">
                ${(application.amountRequested || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-400">
                Category Cap: ${categoryCap.toLocaleString()} {withinCap ? '✅' : '⚠️ Over Cap'}
              </div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Students Impacted:</span>
              <div className="font-extrabold text-[#062A3D] text-sm mt-0.5">
                {application.studentsImpacted} students
              </div>
              <div className="text-[10px] text-slate-400">
                ${((application.amountRequested || 0) / Math.max(1, application.studentsImpacted || 1)).toFixed(2)} / student
              </div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Area of Focus:</span>
              <div className="font-semibold text-slate-800 mt-0.5">
                {application.areaOfFocus}
              </div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Grades:</span>
              <div className="font-semibold text-slate-800 mt-0.5">
                {(application.gradeLevels || []).join(', ')}
              </div>
            </div>
          </div>

          {/* Blind Identity Mask */}
          <div className="text-xs space-y-1 p-3 rounded-xl border border-slate-200 bg-slate-50">
            <span className="font-bold text-[#062A3D]">Applicant & Campus:</span>
            <div className="text-slate-500 italic">
              [Protected under Blind Review protocol — stored in admin-only collection]
            </div>
          </div>

          {/* Evidence Question 7: Objectives & TEKS */}
          <div
            id="source-q7"
            className={`space-y-1 text-xs p-3.5 rounded-2xl border transition ${
              activeHighlightSource?.includes('Q7')
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#062A3D] flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[#8CC8E8]" />
                <span>Objectives & TEKS Alignment (Q7):</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#062A3D]/10 text-[#062A3D] font-bold">
                Q7
              </span>
            </div>
            <div className="whitespace-pre-line text-slate-700 leading-relaxed pt-1">
              {application.objectives || 'None provided.'}
            </div>
          </div>

          {/* Evidence Question 8 & 9: Abstract & Innovation */}
          <div
            id="source-q9"
            className={`space-y-1 text-xs p-3.5 rounded-2xl border transition ${
              activeHighlightSource?.includes('Q9') || activeHighlightSource?.includes('Q8')
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#062A3D] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#8CC8E8]" />
                <span>Project Abstract / Summary (Q8 & Q9):</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#062A3D]/10 text-[#062A3D] font-bold">
                Q8, Q9
              </span>
            </div>
            <div className="whitespace-pre-line text-slate-700 leading-relaxed pt-1">
              {application.abstract || 'None provided.'}
            </div>
          </div>

          {/* Evidence Question 10 & 11: Impact */}
          <div
            id="source-q10"
            className={`space-y-1 text-xs p-3.5 rounded-2xl border transition ${
              activeHighlightSource?.includes('Q10') || activeHighlightSource?.includes('Q11')
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#062A3D] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#8CC8E8]" />
                <span>Student Impact (Q10 & Q11):</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#062A3D]/10 text-[#062A3D] font-bold">
                Q10, Q11
              </span>
            </div>
            <div className="text-slate-700 pt-1">
              <strong>{application.studentsImpacted}</strong> students impacted in grade(s){' '}
              <strong>{(application.gradeLevels || []).join(', ')}</strong> ({application.subjectArea || 'Instructional'}).
            </div>
          </div>

          {/* Evidence Question 12: Evaluation Strategy */}
          <div
            id="source-q12"
            className={`space-y-1 text-xs p-3.5 rounded-2xl border transition ${
              activeHighlightSource?.includes('Q12')
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#062A3D] flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-[#8CC8E8]" />
                <span>Evaluation Strategy (Q12):</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#062A3D]/10 text-[#062A3D] font-bold">
                Q12
              </span>
            </div>
            <div className="whitespace-pre-line text-slate-700 leading-relaxed pt-1">
              {application.evaluationStrategy || 'None provided.'}
            </div>
          </div>

          {/* Evidence Question 13: Partners */}
          <div
            id="source-q13"
            className={`space-y-1 text-xs p-3.5 rounded-2xl border transition ${
              activeHighlightSource?.includes('Q13')
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#062A3D] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#8CC8E8]" />
                <span>Partners & Community Collaboration (Q13):</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#062A3D]/10 text-[#062A3D] font-bold">
                Q13
              </span>
            </div>
            <div className="text-slate-700 pt-1 leading-relaxed">
              {application.partners || 'None listed (Optional: Solo projects not penalized).'}
            </div>
          </div>

          {/* Evidence Question 14: Sustainability */}
          <div
            id="source-q14"
            className={`space-y-1 text-xs p-3.5 rounded-2xl border transition ${
              activeHighlightSource?.includes('Q14')
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#062A3D] flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-[#8CC8E8]" />
                <span>Sustainability & Continuation (Q14):</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#062A3D]/10 text-[#062A3D] font-bold">
                Q14
              </span>
            </div>
            <div className="text-slate-700 pt-1 leading-relaxed">
              {application.sustainability || 'None listed.'}
            </div>
          </div>

          {/* Evidence Question 15: Budget */}
          <div
            id="source-q15"
            className={`space-y-2 text-xs border-t border-slate-200 pt-3 p-3.5 rounded-2xl border transition ${
              activeHighlightSource?.includes('Q15')
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#062A3D]">Q15. Itemized Budget Text:</span>
              <span className="font-bold text-[#062A3D]">
                Total: ${(application.amountRequested || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 whitespace-pre-line text-slate-800 font-mono text-[11px] leading-relaxed">
              {application.plainTextBudget || 'No budget breakdown provided.'}
            </div>
          </div>
        </div>

        {/* Right Pane: Scoring Rubric (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Non-voting banner */}
          {currentUser?.role?.toLowerCase() === 'nonvotingreviewer' && (
            <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl text-xs text-purple-900">
              <strong>Non-Voting Reviewer Mode:</strong> You can score and comment for committee discussion, but your scores are excluded from the official weighted averages.
            </div>
          )}

          {/* Score Header & Discussion Flag Checkbox */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Official Weighted Score
              </span>
              <div className="text-3xl font-extrabold text-[#062A3D] mt-0.5">
                {totalScore} / {maxPossible} pts
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-2">
              <label
                className={`inline-flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition text-xs font-semibold select-none ${
                  flaggedForDiscussion
                    ? 'bg-amber-50 border-amber-300 text-amber-900 ring-1 ring-amber-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                } ${isLocked ? 'pointer-events-none opacity-80' : ''}`}
              >
                <input
                  type="checkbox"
                  disabled={isLocked || isReviewWindowClosed}
                  checked={flaggedForDiscussion}
                  onChange={(e) => setFlaggedForDiscussion(e.target.checked)}
                  className="rounded text-[#062A3D] focus:ring-[#8CC8E8]"
                />
                <Flag
                  className={`w-4 h-4 ${
                    flaggedForDiscussion ? 'text-amber-600 fill-amber-600' : 'text-slate-400'
                  }`}
                />
                <span>Flag for Committee Discussion</span>
              </label>

              <div className="text-right text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{rubric.length} Criteria Required</span>
                <span className="text-[11px] text-slate-400 ml-1">((Score ÷ 5) × Weight)</span>
              </div>
            </div>
          </div>

          {/* Rubric Criteria 1 to 8 */}
          <div className="space-y-4">
            {rubric.map((crit, idx) => {
              const currentVal = scores[crit.id] || 0;
              const currentComment = comments[crit.id] || '';
              const weightedPts = currentVal > 0 ? ((currentVal / 5) * crit.weight).toFixed(1) : '0';
              const hasError = validationErrors.some((e) => e.includes(`Criterion ${idx + 1}`));

              return (
                <div
                  key={crit.id}
                  onMouseEnter={() => setActiveHighlightSource(crit.formSource)}
                  onMouseLeave={() => setActiveHighlightSource(null)}
                  className={`bg-white rounded-3xl border p-5 shadow-sm space-y-3 transition ${
                    hasError
                      ? 'border-rose-300 bg-rose-50/20 ring-1 ring-rose-200'
                      : 'border-slate-200 hover:border-[#8CC8E8]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#062A3D]">
                          {idx + 1}. {crit.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#062A3D]/5 text-[#062A3D] border border-[#062A3D]/10">
                          {crit.formSource}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#062A3D] text-[#8CC8E8]">
                          {crit.weight} pts
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{crit.helper}</div>
                    </div>

                    {/* 1 to 5 Score Buttons */}
                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            disabled={isLocked || isReviewWindowClosed}
                            onClick={() =>
                              setScores((prev) => ({ ...prev, [crit.id]: num }))
                            }
                            className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                              currentVal === num
                                ? 'bg-[#062A3D] text-[#8CC8E8] shadow-xs'
                                : isLocked
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>

                      <div className="text-right pl-2 border-l border-slate-200 min-w-[50px]">
                        <span className="text-xs font-extrabold text-[#062A3D]">
                          {weightedPts}
                        </span>
                        <span className="text-[10px] text-slate-400">/{crit.weight}</span>
                      </div>
                    </div>
                  </div>

                  {/* Level Descriptors Guide */}
                  <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <strong className="text-rose-700 font-bold block">1 = Missing/unclear:</strong>
                      <span className="text-slate-600">{crit.levelDescriptors.level1}</span>
                    </div>
                    <div>
                      <strong className="text-sky-700 font-bold block">3 = Adequate:</strong>
                      <span className="text-slate-600">{crit.levelDescriptors.level3}</span>
                    </div>
                    <div>
                      <strong className="text-emerald-700 font-bold block">5 = Exceptional:</strong>
                      <span className="text-slate-600">{crit.levelDescriptors.level5}</span>
                    </div>
                  </div>

                  {/* Required One-Line Comment */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>
                        Required Evidence Observation <span className="text-rose-500">*</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        One line justifying score based on {crit.formSource}
                      </span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isLocked || isReviewWindowClosed}
                      placeholder={`Rationale based on ${crit.formSource}...`}
                      value={currentComment}
                      onChange={(e) =>
                        setComments((prev) => ({ ...prev, [crit.id]: e.target.value }))
                      }
                      className={`w-full text-xs rounded-xl border p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8] ${
                        !currentComment.trim() && validationErrors.length > 0
                          ? 'border-rose-400'
                          : 'border-slate-200'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* General Feedback */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-2 text-xs">
            <h3 className="font-bold text-[#062A3D]">Overall Reviewer Discussion Notes</h3>
            <textarea
              rows={3}
              disabled={isLocked || isReviewWindowClosed}
              placeholder="General constructive feedback or committee observations..."
              value={generalFeedback}
              onChange={(e) => setGeneralFeedback(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
            />
          </div>

          {/* Validation Warnings List if user attempted submit */}
          {validationErrors.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Complete all rubric items before submitting official evaluation:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                {validationErrors.slice(0, 4).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {validationErrors.length > 4 && (
                  <li>...and {validationErrors.length - 4} more missing criteria.</li>
                )}
              </ul>
            </div>
          )}

          {/* Bottom Action Buttons: Save Draft vs Submit Official Review */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <button
              onClick={onBack}
              className="px-4 py-2.5 rounded-2xl font-bold text-xs border border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Return to Queue
            </button>

            <div className="flex items-center gap-2.5">
              {!isLocked && !isReviewWindowClosed && (
                <>
                  <button
                    type="button"
                    onClick={handleManualSaveDraft}
                    disabled={isSaving}
                    className="px-4 py-2.5 rounded-2xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 transition flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4 text-slate-600" />
                    <span>Save Draft</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (validateForSubmission()) {
                        setShowConfirmSubmit(true);
                      }
                    }}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-2xl font-bold text-xs bg-[#062A3D] text-white hover:bg-[#0A3D59] shadow-sm transition flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4 text-[#8CC8E8]" />
                    <span>Submit Official Review</span>
                  </button>
                </>
              )}

              {isLocked && (
                <div className="text-xs text-emerald-800 font-bold flex items-center gap-1.5 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Official Submission Recorded</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Submitting Official Review */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#062A3D] text-[#8CC8E8]">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#062A3D]">Submit Official Review?</h3>
                <p className="text-xs text-slate-500">
                  Application {application.grantCode} • Weighted Score: {totalScore} pts
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Once submitted, your official evaluation is locked and sent to foundation administrators. You will no longer be able to edit these scores or comments.
            </p>

            {flaggedForDiscussion && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                <Flag className="w-4 h-4 text-amber-600 fill-amber-600 flex-shrink-0" />
                <span>This proposal is marked for live committee discussion.</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Continue Editing
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-[#062A3D] text-white hover:bg-[#0A3D59] flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#8CC8E8]" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Lock & Submit Official Review</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Screen After Official Submission showing applicant name and time */}
      {submittedConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Official Submission Recorded
              </span>
              <h2 className="text-2xl font-extrabold text-[#062A3D]">
                Review Submitted Successfully
              </h2>
              <p className="text-xs text-slate-500">
                Evaluation locked & securely registered in Firestore database.
              </p>
            </div>

            {/* Application & Submission Details Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">Grant Code</span>
                <span className="font-mono font-bold bg-[#062A3D] text-[#8CC8E8] px-2 py-0.5 rounded-md">
                  {submittedConfirmation.grantCode}
                </span>
              </div>
              <div className="font-bold text-[#062A3D] text-sm leading-snug">
                {submittedConfirmation.title}
              </div>

              <div className="border-t border-slate-200/80 pt-2.5 space-y-2">
                <div className="flex items-start justify-between">
                  <span className="text-slate-500 font-semibold">Submission Time:</span>
                  <span className="font-bold text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200 text-right font-mono text-[11px]">
                    {submittedConfirmation.submittedAt}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Awarded Score:</span>
                  <span className="font-black text-sm text-[#062A3D]">
                    {submittedConfirmation.totalScore} / 100 pts
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubmittedConfirmation(null);
                  onBack();
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs bg-[#062A3D] text-white hover:bg-[#0A3D59] transition shadow-md flex items-center justify-center gap-2"
              >
                <span>Return to My Reviews Dashboard</span>
                <ArrowRight className="w-4 h-4 text-[#8CC8E8]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
