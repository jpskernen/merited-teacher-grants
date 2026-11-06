import React, { useState, useEffect, useRef } from 'react';
import { useGrant } from '../../context/GrantContext';
import { Application, EligibilityChecklist, Review } from '../../types/grant';
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Save,
  Loader2,
  DollarSign,
  Users,
  EyeOff,
  Building,
  Target,
  FileText,
  ShieldAlert,
  HelpCircle,
  Scale,
  Compass,
  CheckSquare,
  AlertCircle,
  ExternalLink,
  BookOpen,
  Lock,
} from 'lucide-react';
import { isReviewWindowClosed } from '../../utils/cycleDates';

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
    saveReview,
    programSettings,
    toggleRecusal,
    sendMoreInfoRequest,
  } = useGrant();

  const isReviewClosed = isReviewWindowClosed(
    programSettings.reviewClosesDate || 'November 16, 2026'
  );

  const application = applications.find((a) => a.id === applicationId);

  // Existing review or initial template
  const existingReview = reviews.find(
    (r) => r.applicationId === applicationId && r.reviewerEmail === currentUser.email
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
  const [shareWithApplicant, setShareWithApplicant] = useState<boolean>(
    existingReview?.shareWithApplicant ?? false
  );

  const [checklist, setChecklist] = useState<EligibilityChecklist>(
    existingReview?.eligibilityChecklist || {
      eligibleApplicant: true,
      withinCategoryCap: true,
      acknowledgementsYes: true,
      noProhibitedCosts: true,
      priorReportSubmitted: true,
    }
  );

  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryQuestion, setInquiryQuestion] = useState('');

  // Active highlighted question to assist reviewers
  const [activeHighlightSource, setActiveHighlightSource] = useState<string | null>(null);

  // Gemini Neutral Summary states
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // 100-Point Scoring Matrix calculation: (score / 5) * weight
  const totalScore = Math.round(
    Object.entries(scores).reduce((sum, [critId, val]) => {
      const crit = rubric.find((c) => c.id === critId);
      const weight = crit?.weight || 0;
      return sum + ((val || 0) / 5) * weight;
    }, 0) * 10
  ) / 10;

  const maxPossible = rubric.reduce((sum, c) => sum + (c.weight || 0), 100 > 0 ? 0 : 100) || 100;
  const percentageScore = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;

  // Auto-save logic
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performAutoSave = async () => {
    if (!application) return;
    setIsSaving(true);

    const reviewData: Review = {
      id: existingReview?.id || `rev-${applicationId}-${currentUser.id}`,
      applicationId,
      reviewerEmail: currentUser.email,
      reviewerName: currentUser.displayName,
      isVoting: currentUser.role === 'Reviewer',
      scores,
      comments,
      totalScore,
      maxPossibleScore: maxPossible,
      percentageScore,
      eligibilityChecklist: checklist,
      generalFeedback,
      shareWithApplicant,
      recused: false,
      submittedAt: existingReview?.submittedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveReview(reviewData);
      setLastSaved(new Date().toLocaleTimeString());
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [scores, comments, checklist, generalFeedback, shareWithApplicant]);

  // Request neutral 3-sentence summary from Gemini
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
        `This proposal requests $${application.amountRequested} for ${application.studentsImpacted} students under ${application.category}. It focuses on hands-on activities to achieve targeted learning objectives. Grant funds will provide dedicated materials for classroom implementation.`
      );
    } finally {
      setLoadingSummary(false);
    }
  };

  // Eligibility check calculations
  const categoryCap =
    application?.category === 'Category 2'
      ? programSettings.category2Cap
      : programSettings.category1Cap;

  const withinCap = (application?.amountRequested || 0) <= categoryCap;
  const acksAllYes =
    application?.ackImplementation === true &&
    application?.ackProperty === true &&
    application?.ackApprovals === true &&
    Boolean(application?.electronicSignature);

  const allEligibilityPassed =
    checklist.eligibleApplicant &&
    checklist.withinCategoryCap &&
    checklist.acknowledgementsYes &&
    checklist.noProhibitedCosts &&
    checklist.priorReportSubmitted;

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

  const isBlind = programSettings.blindReviewEnabled;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {application.grantCode && (
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#062A3D] text-[#8CC8E8] shadow-2xs">
                  {application.grantCode}
                </span>
              )}
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#062A3D] text-[#8CC8E8]">
                {application.category} (Cap: ${categoryCap.toLocaleString()})
              </span>
              {isBlind ? (
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                  <EyeOff className="w-3 h-3" />
                  <span>Blind Review Protocol</span>
                </span>
              ) : (
                <span className="text-xs text-slate-500">{application.campus}</span>
              )}
              {allEligibilityPassed ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Eligibility: PASSED
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  Eligibility: Gate Flagged
                </span>
              )}
            </div>
            <h1 className="text-lg font-bold text-[#062A3D] mt-0.5 truncate max-w-xl">
              {application.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right text-xs">
            {isSaving ? (
              <span className="text-[#8CC8E8] font-semibold flex items-center gap-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Autosaving scores...
              </span>
            ) : lastSaved ? (
              <span className="text-emerald-700 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Saved ({lastSaved})
              </span>
            ) : (
              <span className="text-slate-500">Autosaving enabled</span>
            )}
          </div>

          <button
            onClick={() => setShowInquiryModal(true)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            title="Send back for clarification if only paperwork items need fixing"
          >
            Ask Clarification
          </button>

          <button
            onClick={() => {
              toggleRecusal(application.id, true, 'Reviewer recused self from scoring');
              onBack();
            }}
            className="px-3 py-1.5 rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-50 text-xs font-semibold"
          >
            Declare Conflict / Recuse
          </button>
        </div>
      </div>

      {/* Two-Pane Layout: Application on Left, Rubric on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Proposal Narrative & Budget Details (5 cols) */}
        <div className="lg:col-span-5 space-y-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm max-h-[85vh] overflow-y-auto">
          {/* AI Neutral Summary Button */}
          <div className="bg-[#062A3D] text-white p-4 rounded-xl space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#8CC8E8]">
                <Sparkles className="w-4 h-4 text-[#8CC8E8]" />
                <span>Gemini 3-Sentence Neutral Summary</span>
              </div>
              <button
                type="button"
                onClick={handleGenerateSummary}
                disabled={loadingSummary}
                className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-[#8CC8E8] text-[#062A3D] hover:bg-[#a0d4ef] disabled:opacity-50"
              >
                {loadingSummary ? 'Generating...' : 'Summarize'}
              </button>
            </div>

            {aiSummary ? (
              <p className="text-xs text-slate-200 italic leading-relaxed pt-1 border-t border-white/10">
                "{aiSummary}"
              </p>
            ) : (
              <p className="text-[11px] text-slate-300">
                Generate an objective, neutral 3-sentence overview of this grant proposal that never suggests a score.
              </p>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-[#F4F7F9] p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 font-medium">Requested Amount:</span>
              <div className="font-extrabold text-[#062A3D] text-sm">
                ${(application.amountRequested || 0).toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400">
                Category Cap: ${categoryCap.toLocaleString()} {withinCap ? '✅' : '⚠️ Over Cap'}
              </div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Students Impacted:</span>
              <div className="font-extrabold text-[#062A3D] text-sm">
                {application.studentsImpacted}
              </div>
              <div className="text-[10px] text-slate-400">
                ${((application.amountRequested || 0) / Math.max(1, application.studentsImpacted || 1)).toFixed(2)} / student
              </div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Area of Focus:</span>
              <div className="font-semibold text-slate-800">
                {application.areaOfFocus}
              </div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Grades:</span>
              <div className="font-semibold text-slate-800">
                {(application.gradeLevels || []).join(', ')}
              </div>
            </div>
          </div>

          {/* Blind Identity Check */}
          <div className="text-xs space-y-1 p-3 rounded-lg border border-slate-200">
            <span className="font-bold text-[#062A3D]">Applicant & Campus:</span>
            {isBlind ? (
              <div className="text-slate-500 italic">
                Applicant Name(s), Email, and Campus masked under Blind Review rules.
              </div>
            ) : (
              <div className="text-slate-700">
                {application.applicantNames.map((n) => n.name).join(', ')} • {application.campus}
              </div>
            )}
          </div>

          {/* Evidence Question 7: Objectives & TEKS */}
          <div
            id="source-q7"
            className={`space-y-1 text-xs p-3 rounded-xl border transition ${
              activeHighlightSource?.includes('Q7')
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#062A3D] flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[#8CC8E8]" />
                <span>Q7. Objective Statement & TEKS (Objectives Source):</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#062A3D]/10 text-[#062A3D] font-bold">
                Q7
              </span>
            </div>
            <div className="whitespace-pre-line text-slate-700 leading-relaxed pt-1">
              {application.objectives || 'None provided.'}
            </div>
          </div>

          {/* Evidence Question 8: Area of Focus */}
          <div
            id="source-q8"
            className={`space-y-1 text-xs p-3 rounded-xl border transition ${
              activeHighlightSource?.includes('Q8')
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#062A3D] flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[#8CC8E8]" />
                <span>Q8. Area of Focus & Strategy:</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#062A3D]/10 text-[#062A3D] font-bold">
                Q8
              </span>
            </div>
            <div className="text-slate-700 pt-1 font-semibold">
              {application.areaOfFocus} {application.areaOfFocusOther ? `(${application.areaOfFocusOther})` : ''}
            </div>
          </div>

          {/* Evidence Question 9: Abstract */}
          <div
            id="source-q9"
            className={`space-y-1 text-xs p-3 rounded-xl border transition ${
              activeHighlightSource?.includes('Q9')
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#062A3D] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#8CC8E8]" />
                <span>Q9. Abstract (Need & Innovation Source):</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#062A3D]/10 text-[#062A3D] font-bold">
                Q9
              </span>
            </div>
            <div className="whitespace-pre-line text-slate-700 leading-relaxed pt-1">
              {application.abstract || 'None provided.'}
            </div>
          </div>

          {/* Evidence Question 10 & 11: Student Impact */}
          <div
            id="source-q10"
            className={`space-y-1 text-xs p-3 rounded-xl border transition ${
              activeHighlightSource?.includes('Q10') || activeHighlightSource?.includes('Q11')
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#062A3D] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#8CC8E8]" />
                <span>Q10 & Q11. Student Impact & Grade Levels:</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#062A3D]/10 text-[#062A3D] font-bold">
                Q10, Q11
              </span>
            </div>
            <div className="text-slate-700 pt-1">
              <strong>{application.studentsImpacted}</strong> students impacted across grades{' '}
              <strong>{(application.gradeLevels || []).join(', ')}</strong> in subject area{' '}
              <strong>{application.subjectArea || 'General Education'}</strong>.
            </div>
          </div>

          {/* Evidence Question 12: Evaluation Strategy */}
          <div
            id="source-q12"
            className={`space-y-1 text-xs p-3 rounded-xl border transition ${
              activeHighlightSource?.includes('Q12')
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#062A3D] flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-[#8CC8E8]" />
                <span>Q12. Evaluation Strategy:</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#062A3D]/10 text-[#062A3D] font-bold">
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
            className={`space-y-1 text-xs p-3 rounded-xl border transition ${
              activeHighlightSource?.includes('Q13')
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#062A3D] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#8CC8E8]" />
                <span>Q13. Partners & Defined Roles:</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#062A3D]/10 text-[#062A3D] font-bold">
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
            className={`space-y-1 text-xs p-3 rounded-xl border transition ${
              activeHighlightSource?.includes('Q14')
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#062A3D] flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-[#8CC8E8]" />
                <span>Q14. Sustainability Beyond Grant:</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#062A3D]/10 text-[#062A3D] font-bold">
                Q14
              </span>
            </div>
            <div className="text-slate-700 pt-1 leading-relaxed">
              {application.sustainability || 'None listed.'}
            </div>
          </div>

          {/* Evidence Question 15: Budget Items */}
          <div
            id="source-q15"
            className={`space-y-2 text-xs border-t border-slate-200 pt-3 p-3 rounded-xl border transition ${
              activeHighlightSource?.includes('Q15')
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#062A3D]">Q15. Line-Item Budget:</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#062A3D]/10 text-[#062A3D] font-bold">
                  Q15
                </span>
                <span className="font-bold text-[#062A3D]">
                  Total: ${(application.amountRequested || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {application.budgetItems?.map((it, idx) => (
                <div
                  key={it.id || idx}
                  className="p-2.5 rounded-lg border border-slate-200 bg-white text-[11px] space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-[#062A3D]">
                    <span>
                      {it.quantity}x {it.name}
                    </span>
                    <span>${((it.quantity * it.unitCost) + (it.shipping || 0)).toFixed(2)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <span>Vendor: {it.vendor}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        it.isApprovedVendor
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {it.isApprovedVendor ? 'Approved Vendor' : 'Unapproved Vendor'}
                    </span>
                    <span>{it.consumable ? '[Consumable]' : '[Non-consumable]'}</span>
                  </div>

                  {it.justification && (
                    <div className="text-[10px] text-amber-800 italic bg-amber-50 p-1.5 rounded border border-amber-200">
                      Teacher Rationale: "{it.justification}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Pane: Scoring Rubric & Checklist (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Review Closed Notification */}
          {isReviewClosed && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Review Window Closed:</strong> Scoring closed automatically at 11:59 PM on {programSettings.reviewClosesDate || 'November 16, 2026'}. You are viewing this evaluation in read-only mode for committee deliberation.
              </div>
            </div>
          )}

          {/* Non-voting banner */}
          {currentUser.role === 'NonVotingReviewer' && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900">
              <strong>Non-Voting Reviewer Mode:</strong> You are serving as an instructional observer (Executive Director). You can comment and score, but your scores do not count towards the official weighted ranking.
            </div>
          )}

          {/* Running Rubric Score Header (100 Points Scale) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Official 100-Point Score
              </span>
              <div className="text-2xl font-extrabold text-[#062A3D] mt-0.5">
                {totalScore} / {maxPossible} pts ({percentageScore}%)
              </div>
            </div>

            <div className="text-right text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{rubric.length} Matrix Criteria</span>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Conversion: (Score ÷ 5) × Criterion Weight
              </div>
            </div>
          </div>

          {/* Step 1: Pass/Fail Eligibility Checklist */}
          <div className="bg-white rounded-xl border-2 border-emerald-200 p-5 shadow-sm space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
              <h3 className="font-bold text-[#062A3D] uppercase tracking-wider text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Step 1: Eligibility Gate (Pass / Fail — Not Scored)</span>
              </h3>
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Screened before scoring
              </span>
            </div>

            <p className="text-[11px] text-slate-600">
              Screened before scoring so reviewers aren't marking down good ideas for paperwork problems.
            </p>

            {application?.adminEligibility?.passed ? (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    <strong>Admin Pre-Screening Passed:</strong> All 5 paperwork gates were certified by {application.adminEligibility.checkedBy} on {new Date(application.adminEligibility.checkedAt).toLocaleDateString()}. Proceed with academic scoring below.
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  VERIFIED
                </span>
              </div>
            ) : application?.adminEligibility && !application.adminEligibility.passed ? (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  <strong>Admin Flagged Paperwork:</strong> {application.adminEligibility.notes || 'Inquiry pending'}.
                </span>
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={checklist.eligibleApplicant}
                  onChange={(e) =>
                    setChecklist((p) => ({ ...p, eligibleApplicant: e.target.checked }))
                  }
                  className="rounded text-[#062A3D] focus:ring-[#8CC8E8]"
                />
                <span>Applicant is NISD teacher/team in instruction or support</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={checklist.withinCategoryCap}
                  onChange={(e) =>
                    setChecklist((p) => ({ ...p, withinCategoryCap: e.target.checked }))
                  }
                  className="rounded text-[#062A3D] focus:ring-[#8CC8E8]"
                />
                <span>Amount within category cap (${categoryCap.toLocaleString()})</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={checklist.acknowledgementsYes}
                  onChange={(e) =>
                    setChecklist((p) => ({ ...p, acknowledgementsYes: e.target.checked }))
                  }
                  className="rounded text-[#062A3D] focus:ring-[#8CC8E8]"
                />
                <span>All 3 acknowledgements "Yes" (Q16–18) & e-signature present</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={checklist.noProhibitedCosts}
                  onChange={(e) =>
                    setChecklist((p) => ({ ...p, noProhibitedCosts: e.target.checked }))
                  }
                  className="rounded text-[#062A3D] focus:ring-[#8CC8E8]"
                />
                <span>No prohibited costs (unaligned travel/routine district items)</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={checklist.priorReportSubmitted}
                  onChange={(e) =>
                    setChecklist((p) => ({ ...p, priorReportSubmitted: e.target.checked }))
                  }
                  className="rounded text-[#062A3D] focus:ring-[#8CC8E8]"
                />
                <span>Any past recipient turned in completed final report</span>
              </label>
            </div>
          </div>

          {/* Step 2: Rubric Criteria 1 through 8 (100 Points) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#062A3D] uppercase tracking-wider text-xs">
                Step 2: Evidence-Based Scoring Matrix
              </h3>
              <span className="text-[11px] text-slate-500">
                Read only matching questions in form source column
              </span>
            </div>

            {rubric.map((crit, idx) => {
              const currentVal = scores[crit.id] || 0;
              const currentComment = comments[crit.id] || '';
              const weightedPts = currentVal > 0 ? ((currentVal / 5) * crit.weight).toFixed(1) : '0';

              return (
                <div
                  key={crit.id}
                  onMouseEnter={() => setActiveHighlightSource(crit.formSource)}
                  onMouseLeave={() => setActiveHighlightSource(null)}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 transition hover:border-[#8CC8E8]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#062A3D]">
                          {idx + 1}. {crit.title}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#062A3D]/5 text-[#062A3D] border border-[#062A3D]/10">
                          Source: {crit.formSource}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#062A3D] text-[#8CC8E8]">
                          {crit.weight} pts max
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{crit.helper}</div>
                    </div>

                    {/* 1 to 5 Score Buttons & Converted Points */}
                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            disabled={isReviewClosed}
                            onClick={() =>
                              setScores((prev) => ({ ...prev, [crit.id]: num }))
                            }
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                              currentVal === num
                                ? 'bg-[#062A3D] text-[#8CC8E8] shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            } ${isReviewClosed ? 'cursor-not-allowed opacity-80' : ''}`}
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
                  <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="space-y-0.5">
                      <strong className="text-rose-700 font-bold">1 = Missing/unclear:</strong>
                      <p className="text-slate-600">{crit.levelDescriptors.level1}</p>
                    </div>
                    <div className="space-y-0.5">
                      <strong className="text-sky-700 font-bold">3 = Adequate:</strong>
                      <p className="text-slate-600">{crit.levelDescriptors.level3}</p>
                    </div>
                    <div className="space-y-0.5">
                      <strong className="text-emerald-700 font-bold">5 = Exceptional:</strong>
                      <p className="text-slate-600">{crit.levelDescriptors.level5}</p>
                    </div>
                  </div>

                  {/* Required Comment */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>
                        Required Observation & Evidence Rationale <span className="text-rose-500">*</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Points to evidence in {crit.formSource}
                      </span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      disabled={isReviewClosed}
                      placeholder={`Explain why you awarded ${currentVal || 'this'} score based on ${crit.formSource}...`}
                      value={currentComment}
                      onChange={(e) =>
                        setComments((prev) => ({ ...prev, [crit.id]: e.target.value }))
                      }
                      className={`w-full text-xs rounded-lg border border-slate-200 p-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8] ${
                        isReviewClosed ? 'bg-slate-50 cursor-not-allowed opacity-80' : ''
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* General Feedback & Applicant Sharing */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-[#062A3D]">Overall Committee Evaluation Notes</h3>
            <p className="text-slate-500 text-[11px]">
              Reviewer comments are private to the committee by default. You may check the box below if this feedback is constructive to share directly with the teacher.
            </p>
            <textarea
              rows={3}
              placeholder="General constructive feedback or committee discussion points..."
              value={generalFeedback}
              onChange={(e) => setGeneralFeedback(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
            />

            <label className="flex items-center space-x-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={shareWithApplicant}
                onChange={(e) => setShareWithApplicant(e.target.checked)}
                className="rounded text-[#062A3D] focus:ring-[#8CC8E8]"
              />
              <span className="font-semibold text-slate-700">
                Mark feedback as suitable to share with applicant (Admin review gate applies)
              </span>
            </label>
          </div>

          {/* Bottom Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={onBack}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-[#062A3D] text-white hover:bg-[#0A3D59] shadow-sm"
            >
              Done Scoring — Return to Queue
            </button>
          </div>
        </div>
      </div>

      {/* Inquiry Modal for Fixable Eligibility Items */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#062A3D]">
                Request Fixable Clarification from Teacher
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Application: "{application.title}"
              </p>
            </div>

            <p className="text-xs text-slate-600">
              If the proposal is missing a fixable item (such as an unapproved vendor justification, missing acknowledgment confirmation, or unresolved receipt from a prior grant), send it back as <strong>"More Info Needed"</strong> instead of rejecting it.
            </p>

            <textarea
              rows={4}
              value={inquiryQuestion}
              onChange={(e) => setInquiryQuestion(e.target.value)}
              placeholder="e.g. Please clarify vendor quote line items and verify non-consumable tag registration..."
              className="w-full text-xs rounded-lg border border-slate-200 p-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
            />

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowInquiryModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!inquiryQuestion.trim()}
                onClick={async () => {
                  await sendMoreInfoRequest(application.id, inquiryQuestion.trim());
                  setShowInquiryModal(false);
                  onBack();
                }}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-[#062A3D] text-white hover:bg-[#0A3D59] disabled:opacity-50"
              >
                Send as More Info Needed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
