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
    saveReview,
    programSettings,
    toggleRecusal,
  } = useGrant();

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

  // Gemini Neutral Summary states
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // Compute weighted score
  const totalScore = Object.entries(scores).reduce((sum, [critId, val]) => {
    const crit = rubric.find((c) => c.id === critId);
    const weight = crit?.weight || 1;
    return sum + (val || 0) * weight;
  }, 0);

  const maxPossible = rubric.reduce((sum, c) => sum + 5 * (c.weight || 1), 0);
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
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#062A3D] text-[#8CC8E8]">
                {application.category}
              </span>
              {isBlind ? (
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                  <EyeOff className="w-3 h-3" />
                  <span>Blind Review Protocol</span>
                </span>
              ) : (
                <span className="text-xs text-slate-500">{application.campus}</span>
              )}
            </div>
            <h1 className="text-lg font-bold text-[#062A3D] mt-0.5 truncate max-w-xl">
              {application.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right text-xs">
            {isSaving ? (
              <span className="text-[#8CC8E8] font-semibold flex items-center gap-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Autosaving scores...
              </span>
            ) : lastSaved ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Score saved ({lastSaved})
              </span>
            ) : (
              <span className="text-slate-500">Autosaving enabled</span>
            )}
          </div>

          <button
            onClick={() => {
              toggleRecusal(application.id, true, 'Reviewer recused self');
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
              <span className="text-slate-500">Requested Amount:</span>
              <div className="font-extrabold text-[#062A3D] text-sm">
                ${(application.amountRequested || 0).toFixed(2)}
              </div>
            </div>
            <div>
              <span className="text-slate-500">Students Impacted:</span>
              <div className="font-extrabold text-[#062A3D] text-sm">
                {application.studentsImpacted}
              </div>
            </div>
            <div>
              <span className="text-slate-500">Area of Focus:</span>
              <div className="font-semibold text-slate-800">
                {application.areaOfFocus}
              </div>
            </div>
            <div>
              <span className="text-slate-500">Grades:</span>
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

          {/* Objectives */}
          <div className="space-y-1 text-xs">
            <span className="font-bold text-[#062A3D]">Objective Statement & TEKS:</span>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-line text-slate-700 leading-relaxed">
              {application.objectives}
            </div>
          </div>

          {/* Abstract */}
          <div className="space-y-1 text-xs">
            <span className="font-bold text-[#062A3D]">Proposal Abstract:</span>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-line text-slate-700 leading-relaxed">
              {application.abstract}
            </div>
          </div>

          {/* Evaluation Strategy */}
          <div className="space-y-1 text-xs">
            <span className="font-bold text-[#062A3D]">Evaluation Strategy:</span>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-line text-slate-700 leading-relaxed">
              {application.evaluationStrategy}
            </div>
          </div>

          {/* Partners & Sustainability */}
          <div className="space-y-3 text-xs">
            <div>
              <span className="font-bold text-[#062A3D]">Partners:</span>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700 mt-1">
                {application.partners || 'None listed.'}
              </div>
            </div>

            <div>
              <span className="font-bold text-[#062A3D]">Sustainability:</span>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700 mt-1">
                {application.sustainability || 'None listed.'}
              </div>
            </div>
          </div>

          {/* Line-Item Budget & Vendor Review */}
          <div className="space-y-2 text-xs border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#062A3D]">Line-Item Budget:</span>
              <span className="font-bold text-[#062A3D]">
                Total: ${(application.amountRequested || 0).toFixed(2)}
              </span>
            </div>

            <div className="space-y-2">
              {application.budgetItems?.map((it, idx) => (
                <div
                  key={it.id || idx}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] space-y-1"
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
          {/* Non-voting banner */}
          {currentUser.role === 'NonVotingReviewer' && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900">
              <strong>Non-Voting Reviewer Mode:</strong> You are serving as an instructional observer (Executive Director). You can comment and score, but your scores do not count towards the official weighted ranking.
            </div>
          )}

          {/* Running Rubric Score Header */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Total Score
              </span>
              <div className="text-2xl font-extrabold text-[#062A3D] mt-0.5">
                {totalScore} / {maxPossible} pts ({percentageScore}%)
              </div>
            </div>

            <div className="text-right text-xs text-slate-500">
              <span>{rubric.length} Criteria • Scale 1 to 5</span>
              <div className="text-[11px] text-slate-400 mt-0.5">
                1 = Missing • 3 = Adequate • 5 = Exceptional
              </div>
            </div>
          </div>

          {/* Pass/Fail Eligibility Checklist */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-[#062A3D] uppercase tracking-wider text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Eligibility Checklist (Pass / Fail — Not Scored)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.eligibleApplicant}
                  onChange={(e) =>
                    setChecklist((p) => ({ ...p, eligibleApplicant: e.target.checked }))
                  }
                  className="rounded text-[#062A3D] focus:ring-[#8CC8E8]"
                />
                <span>Eligible NISD instructional applicant</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.withinCategoryCap}
                  onChange={(e) =>
                    setChecklist((p) => ({ ...p, withinCategoryCap: e.target.checked }))
                  }
                  className="rounded text-[#062A3D] focus:ring-[#8CC8E8]"
                />
                <span>Within category budget cap</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.acknowledgementsYes}
                  onChange={(e) =>
                    setChecklist((p) => ({ ...p, acknowledgementsYes: e.target.checked }))
                  }
                  className="rounded text-[#062A3D] focus:ring-[#8CC8E8]"
                />
                <span>Acknowledgements all "Yes"</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.noProhibitedCosts}
                  onChange={(e) =>
                    setChecklist((p) => ({ ...p, noProhibitedCosts: e.target.checked }))
                  }
                  className="rounded text-[#062A3D] focus:ring-[#8CC8E8]"
                />
                <span>No prohibited costs (travel/routine PD)</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.priorReportSubmitted}
                  onChange={(e) =>
                    setChecklist((p) => ({ ...p, priorReportSubmitted: e.target.checked }))
                  }
                  className="rounded text-[#062A3D] focus:ring-[#8CC8E8]"
                />
                <span>Prior cycle final report submitted</span>
              </label>
            </div>
          </div>

          {/* Rubric Criteria 1 through 8 */}
          <div className="space-y-4">
            {rubric.map((crit, idx) => {
              const currentVal = scores[crit.id] || 0;
              const currentComment = comments[crit.id] || '';

              return (
                <div
                  key={crit.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <div className="text-xs font-bold text-[#062A3D]">
                        {idx + 1}. {crit.title}
                      </div>
                      <div className="text-[11px] text-slate-500">{crit.helper}</div>
                    </div>

                    {/* 1 to 5 Score Buttons */}
                    <div className="flex items-center space-x-1.5 self-end sm:self-center">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() =>
                            setScores((prev) => ({ ...prev, [crit.id]: num }))
                          }
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                            currentVal === num
                              ? 'bg-[#062A3D] text-[#8CC8E8] shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Level Descriptors Guide */}
                  <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div>
                      <strong className="text-slate-700">1:</strong>{' '}
                      {crit.levelDescriptors.level1}
                    </div>
                    <div>
                      <strong className="text-slate-700">3:</strong>{' '}
                      {crit.levelDescriptors.level3}
                    </div>
                    <div>
                      <strong className="text-slate-700">5:</strong>{' '}
                      {crit.levelDescriptors.level5}
                    </div>
                  </div>

                  {/* Required Comment */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Criterion Observation & Rationale <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder={`Explain why you awarded ${currentVal || 'this'} score...`}
                      value={currentComment}
                      onChange={(e) =>
                        setComments((prev) => ({ ...prev, [crit.id]: e.target.value }))
                      }
                      className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
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
    </div>
  );
};
