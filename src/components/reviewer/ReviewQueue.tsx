import React, { useState, useMemo } from 'react';
import { useGrant } from '../../context/GrantContext';
import { Application } from '../../types/grant';
import {
  CheckSquare,
  Clock,
  Eye,
  AlertTriangle,
  Award,
  DollarSign,
  Shield,
  EyeOff,
  Sparkles,
  Printer,
  ArrowRight,
  Heart,
  CheckCircle2,
} from 'lucide-react';
import { isReviewWindowClosed } from '../../utils/cycleDates';
import { ReviewPacketPrintView } from './ReviewPacketPrintView';
import { ReviewerThankYouModal } from './ReviewerThankYouModal';

interface ReviewQueueProps {
  onSelectApplication: (appId: string) => void;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ onSelectApplication }) => {
  const {
    currentUser,
    applications,
    reviews,
    programSettings,
    rubric,
    toggleRecusal,
  } = useGrant();

  const [showPrintPacket, setShowPrintPacket] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);

  const isReviewClosed = isReviewWindowClosed(
    programSettings.reviewClosesDate || 'November 16, 2026'
  );

  // Reviewable apps filtered by assigned reviewers (default: all reviewers see every application)
  const reviewableApps = useMemo(
    () =>
      applications.filter((a) => {
        const isReviewableStatus =
          a.status === 'Under Review' ||
          a.status === 'Submitted' ||
          a.status === 'More Info Needed' ||
          a.status === 'Funded' ||
          a.status === 'Partially Funded' ||
          a.status === 'Not Funded';

        if (!isReviewableStatus) return false;

        // Default: every reviewer sees every application
        if (
          !a.assignedReviewerIds ||
          a.assignedReviewerIds.length === 0 ||
          a.assignedReviewerIds.includes('all')
        ) {
          return true;
        }

        // Specific assignment check
        return (
          a.assignedReviewerIds.includes(currentUser.id) ||
          a.assignedReviewerIds.includes(currentUser.email.toLowerCase())
        );
      }),
    [applications, currentUser.id, currentUser.email]
  );

  // My reviews & scoring progress
  const criteriaCount = rubric.length;

  const myReviewStats = useMemo(() => {
    let scoredCount = 0;
    let totalFundsEvaluated = 0;
    let totalStudentsImpacted = 0;
    const unscoredList: Application[] = [];

    reviewableApps.forEach((app) => {
      const rev = reviews.find(
        (r) => r.applicationId === app.id && r.reviewerEmail.toLowerCase() === currentUser.email.toLowerCase()
      );
      const isScored = rev && Object.keys(rev.scores || {}).length >= criteriaCount;
      const isRecused = rev?.recused;

      if (isScored) {
        scoredCount++;
        totalFundsEvaluated += app.amountRequested || 0;
        totalStudentsImpacted += app.studentsImpacted || 0;
      } else if (!isRecused) {
        unscoredList.push(app);
      }
    });

    const isAllFinished = reviewableApps.length > 0 && unscoredList.length === 0;
    const nextUnscoredApp = unscoredList[0] || null;
    const progressPercent = reviewableApps.length > 0
      ? Math.round((scoredCount / reviewableApps.length) * 100)
      : 0;

    return {
      scoredCount,
      totalCount: reviewableApps.length,
      unscoredCount: unscoredList.length,
      nextUnscoredApp,
      isAllFinished,
      progressPercent,
      totalFundsEvaluated,
      totalStudentsImpacted,
    };
  }, [reviewableApps, reviews, currentUser.email, criteriaCount]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header and Blind Review Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#062A3D]">Grant Review Queue</h1>
            {currentUser.role === 'NonVotingReviewer' ? (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                Non-Voting Observer
              </span>
            ) : (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                Voting Committee Member
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Score proposals against the official 8-criterion NEF rubric.
            {programSettings.blindReviewEnabled &&
              ' Blind review is active — applicant identities are masked.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowPrintPacket(true)}
            className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-[#062A3D] font-bold hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs"
            title="Print or save PDF packet of all assigned proposals with blank rubrics"
          >
            <Printer className="w-4 h-4 text-[#062A3D]" />
            <span>Print Packet</span>
          </button>

          {myReviewStats.scoredCount > 0 && (
            <button
              onClick={() => setShowThankYouModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-bold hover:bg-rose-100 transition flex items-center gap-1.5 shadow-2xs"
              title="View foundation thank-you and recognition details"
            >
              <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
              <span>Thank-You Screen</span>
            </button>
          )}

          {isReviewClosed ? (
            <div className="px-3.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-1.5 font-bold">
              <Clock className="w-4 h-4 text-rose-600" />
              <span>Review Closed at 11:59 PM ({programSettings.reviewClosesDate || 'Nov 16'})</span>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-1.5 font-semibold">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Scoring Closes 11:59 PM ({programSettings.reviewClosesDate || 'Nov 16'})</span>
            </div>
          )}

          {programSettings.blindReviewEnabled && (
            <div className="px-3.5 py-1.5 rounded-lg bg-[#062A3D]/5 border border-[#062A3D]/15 text-xs text-[#062A3D] flex items-center gap-1.5 font-medium">
              <EyeOff className="w-4 h-4 text-[#8CC8E8]" />
              <span>Blind Review Protocol Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Reviewer Home Progress Banner: "You've scored 6 of 14", progress bar, review-close date, and one-tap to next unscored */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">
              Your Review Progress
            </div>
            <div className="text-2xl font-extrabold text-[#062A3D] mt-0.5 flex items-center gap-2">
              <span>You've scored {myReviewStats.scoredCount} of {myReviewStats.totalCount}</span>
              {myReviewStats.isAllFinished && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Complete!
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Scoring deadline: <strong>11:59 PM ({programSettings.reviewClosesDate || 'November 16, 2026'})</strong>
              </span>
              <span>•</span>
              <span>{myReviewStats.unscoredCount} proposals remaining</span>
            </div>
          </div>

          {/* One-tap to next unscored application button or celebratory modal trigger */}
          <div className="flex items-center gap-3">
            {myReviewStats.nextUnscoredApp ? (
              <button
                onClick={() => onSelectApplication(myReviewStats.nextUnscoredApp!.id)}
                className="w-full md:w-auto px-5 py-3 rounded-xl bg-[#062A3D] text-white hover:bg-[#0A3D59] font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg group"
              >
                <span>One Tap to Next Unscored:</span>
                <span className="bg-[#8CC8E8] text-[#062A3D] font-mono text-xs px-2 py-0.5 rounded font-extrabold">
                  {myReviewStats.nextUnscoredApp.grantCode || myReviewStats.nextUnscoredApp.id}
                </span>
                <ArrowRight className="w-4 h-4 text-[#8CC8E8] group-hover:translate-x-0.5 transition" />
              </button>
            ) : myReviewStats.isAllFinished ? (
              <button
                onClick={() => setShowThankYouModal(true)}
                className="w-full md:w-auto px-5 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>All Done! View Foundation Thank-You</span>
                <Heart className="w-4 h-4 text-rose-200 fill-rose-200" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Progress towards committee deadline</span>
            <span className="font-bold text-[#062A3D]">{myReviewStats.progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#8CC8E8] to-emerald-500 transition-all duration-500"
              style={{ width: `${myReviewStats.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {isReviewClosed && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>
            <strong>Scoring Window Concluded:</strong> Review committee scoring closed automatically at 11:59 PM on {programSettings.reviewClosesDate || 'November 16, 2026'}. Evaluators can inspect completed reviews below; score edits are now locked for committee deliberation.
          </span>
        </div>
      )}

      {/* Review Queue Cards */}
      <div className="space-y-4">
        {reviewableApps.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <CheckSquare className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-[#062A3D]">No applications currently awaiting review.</p>
            <p className="text-xs text-slate-500 mt-1">Submitted teacher proposals will appear here automatically.</p>
          </div>
        ) : (
          reviewableApps.map((app) => {
            const myReview = reviews.find(
              (r) => r.applicationId === app.id && r.reviewerEmail === currentUser.email
            );
            const isScored = myReview && Object.keys(myReview.scores).length > 0;
            const isRecused = myReview?.recused;

            return (
              <div
                key={app.id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-sm transition hover:shadow-md ${
                  isRecused
                    ? 'border-slate-200 bg-slate-50/70 opacity-75'
                    : isScored
                    ? 'border-emerald-200'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {app.grantCode && (
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#062A3D] text-[#8CC8E8] shadow-2xs">
                          {app.grantCode}
                        </span>
                      )}
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 text-[#062A3D]">
                        {app.category}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {app.areaOfFocus}
                      </span>
                      {programSettings.blindReviewEnabled ? (
                        <span className="text-[11px] text-slate-400 italic">
                          [Campus Masked for Blind Review]
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium">
                          {app.campus}
                        </span>
                      )}

                      {app.adminEligibility?.passed ? (
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Admin Eligibility Passed</span>
                        </span>
                      ) : app.adminEligibility && !app.adminEligibility.passed ? (
                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Eligibility Fixes Needed</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          Admin Eligibility Check Pending
                        </span>
                      )}

                      {app.assignedReviewerIds && app.assignedReviewerIds.length > 0 && !app.assignedReviewerIds.includes('all') && (
                        <span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                          Assigned to You
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-[#062A3D]">
                      {app.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="font-bold text-[#062A3D]">
                        ${(app.amountRequested || 0).toFixed(2)} requested
                      </span>
                      <span>•</span>
                      <span>{app.studentsImpacted} students</span>
                      <span>•</span>
                      <span>Status: {app.status}</span>
                    </div>
                  </div>

                  {/* Review Actions */}
                  <div className="flex items-center space-x-3 self-end md:self-center">
                    {isRecused ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                          Recused (Conflict of Interest)
                        </span>
                        <button
                          onClick={() => toggleRecusal(app.id, false)}
                          className="text-xs text-slate-500 hover:text-slate-800 underline"
                        >
                          Undo
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            toggleRecusal(
                              app.id,
                              true,
                              'Reviewer declared conflict of interest'
                            )
                          }
                          className="px-3 py-1.5 text-xs text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                          title="Recuse self if you work closely with this applicant"
                        >
                          Recuse
                        </button>

                        <button
                          onClick={() => onSelectApplication(app.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                            isScored
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-[#8CC8E8] hover:bg-[#a0d4ef] text-[#062A3D]'
                          }`}
                        >
                          <CheckSquare className="w-4 h-4" />
                          <span>
                            {isScored
                              ? `Edit Score (${myReview?.totalScore || 0} pts)`
                              : 'Score Proposal'}
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Print Packet View for Paper Reviewers */}
      {showPrintPacket && (
        <ReviewPacketPrintView
          applications={reviewableApps}
          programSettings={programSettings}
          rubric={rubric}
          onClose={() => setShowPrintPacket(false)}
        />
      )}

      {/* Warm Celebratory Thank-You Modal */}
      {showThankYouModal && (
        <ReviewerThankYouModal
          reviewerName={currentUser.displayName}
          reviewerEmail={currentUser.email}
          scoredCount={myReviewStats.scoredCount}
          totalFundsEvaluated={myReviewStats.totalFundsEvaluated}
          studentsImpacted={myReviewStats.totalStudentsImpacted}
          programSettings={programSettings}
          onClose={() => setShowThankYouModal(false)}
        />
      )}
    </div>
  );
};
