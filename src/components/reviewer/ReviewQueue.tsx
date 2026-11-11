import React, { useState, useMemo } from 'react';
import { useGrants, normalizeRole } from '../../context/GrantContext';
import { Application } from '../../types/grant';
import {
  CheckSquare,
  Clock,
  EyeOff,
  Sparkles,
  Printer,
  ArrowRight,
  Heart,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Shuffle,
  Flag,
  Filter,
  Pencil,
  Eye,
  FileText,
} from 'lucide-react';
import { ReviewPacketPrintView } from './ReviewPacketPrintView';
import { ReviewerThankYouModal } from './ReviewerThankYouModal';

interface ReviewQueueProps {
  onSelectApplication: (appId: string) => void;
}

type QueueFilter = 'all' | 'not_started' | 'drafts' | 'completed' | 'flagged' | 'recused';

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ onSelectApplication }) => {
  const {
    currentUser,
    applications,
    reviews,
    programSettings,
    rubric,
    toggleRecusal,
    isReviewClosed,
    reviewDeadlineInfo,
  } = useGrants();

  const [showPrintPacket, setShowPrintPacket] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<QueueFilter>('all');
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(1);

  const userRole = normalizeRole(currentUser?.role);
  const criteriaCount = rubric.length;

  // Reviewable apps filtered by assigned reviewers (default: all reviewers see every application)
  // Exclude drafts from reviewer view
  const reviewableApps = useMemo(() => {
    return applications
      .filter((a) => {
        const normStatus = (a.status || '').toLowerCase();
        if (normStatus === 'draft') return false;
        if (currentUser?.role === 'admin' || currentUser?.role === 'Admin') return true;

        if (
          !a.assignedReviewerIds ||
          a.assignedReviewerIds.length === 0 ||
          a.assignedReviewerIds.includes('all')
        ) {
          return true;
        }
        return (
          currentUser &&
          (a.assignedReviewerIds.includes(currentUser.id) ||
            a.assignedReviewerIds.includes(currentUser.email.toLowerCase()))
        );
      });
  }, [applications, currentUser]);

  // My reviews & scoring progress
  const myReviewStats = useMemo(() => {
    let completedCount = 0;
    let draftCount = 0;
    let notStartedCount = 0;
    let recusedCount = 0;
    let flaggedCount = 0;
    let totalFundsEvaluated = 0;
    let totalStudentsImpacted = 0;
    const unscoredList: Application[] = [];

    reviewableApps.forEach((app) => {
      const rev = reviews.find(
        (r) =>
          r.applicationId === app.id &&
          currentUser &&
          (r.reviewerId === currentUser.id ||
            r.reviewerEmail.toLowerCase() === currentUser.email.toLowerCase())
      );

      const isSubmitted = Boolean(rev?.isSubmitted);
      const isRecused = Boolean(rev?.recused);
      const isFlagged = Boolean(rev?.flaggedForDiscussion);
      const scoredCriteriaCount = Object.keys(rev?.scores || {}).filter(
        (k) => (rev?.scores?.[k] || 0) > 0
      ).length;
      const isDraft = !isSubmitted && !isRecused && (scoredCriteriaCount > 0 || rev?.updatedAt);

      if (isFlagged) {
        flaggedCount++;
      }

      if (isRecused) {
        recusedCount++;
      } else if (isSubmitted) {
        completedCount++;
        totalFundsEvaluated += app.amountRequested || 0;
        totalStudentsImpacted += app.studentsImpacted || 0;
      } else if (isDraft) {
        draftCount++;
        unscoredList.push(app);
      } else {
        notStartedCount++;
        unscoredList.push(app);
      }
    });

    const isAllFinished = reviewableApps.length > 0 && unscoredList.length === 0;
    const nextUnscoredApp = unscoredList[0] || null;
    const progressPercent =
      reviewableApps.length > 0 ? Math.round((completedCount / reviewableApps.length) * 100) : 0;

    return {
      totalCount: reviewableApps.length,
      completedCount,
      scoredCount: completedCount,
      draftCount,
      notStartedCount,
      recusedCount,
      flaggedCount,
      nextUnscoredApp,
      isAllFinished,
      progressPercent,
      totalFundsEvaluated,
      totalStudentsImpacted,
    };
  }, [reviewableApps, reviews, currentUser, criteriaCount]);

  // Filtered and optionally shuffled application list
  const displayedApps = useMemo(() => {
    let list = reviewableApps.filter((app) => {
      const myRev = reviews.find(
        (r) =>
          r.applicationId === app.id &&
          currentUser &&
          (r.reviewerId === currentUser.id ||
            r.reviewerEmail.toLowerCase() === currentUser.email.toLowerCase())
      );
      const isSubmitted = Boolean(myRev?.isSubmitted);
      const isRecused = Boolean(myRev?.recused);
      const isFlagged = Boolean(myRev?.flaggedForDiscussion);
      const scoredCriteriaCount = Object.keys(myRev?.scores || {}).filter(
        (k) => (myRev?.scores?.[k] || 0) > 0
      ).length;
      const isDraft = !isSubmitted && !isRecused && (scoredCriteriaCount > 0 || myRev?.updatedAt);

      if (activeFilter === 'not_started') {
        return !isSubmitted && !isRecused && !isDraft;
      }
      if (activeFilter === 'drafts') {
        return isDraft;
      }
      if (activeFilter === 'completed') {
        return isSubmitted;
      }
      if (activeFilter === 'flagged') {
        return isFlagged;
      }
      if (activeFilter === 'recused') {
        return isRecused;
      }
      return true;
    });

    if (isShuffled) {
      // Deterministic shuffle with seed
      list = [...list].sort((a, b) => {
        const hashA = (a.id + shuffleSeed).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hashB = (b.id + shuffleSeed).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return hashA % 100 - hashB % 100;
      });
    }

    return list;
  }, [reviewableApps, reviews, currentUser, activeFilter, isShuffled, shuffleSeed, criteriaCount]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header and Blind Review Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#062A3D]">Grant Review Queue</h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
              Reviewer
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Score proposals against the official 8-criterion NEF rubric. Blind review protocol is enforced: applicant identities and campus affiliations are strictly protected in admin-only storage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowPrintPacket(true)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-[#062A3D] font-bold hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs"
            title="Print or save PDF packet of all assigned proposals with blank rubrics"
          >
            <Printer className="w-4 h-4 text-[#062A3D]" />
            <span>Print Packet</span>
          </button>

          {myReviewStats.scoredCount > 0 && (
            <button
              onClick={() => setShowThankYouModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-bold hover:bg-rose-100 transition flex items-center gap-1.5 shadow-2xs"
              title="View foundation thank-you and recognition details"
            >
              <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
              <span>Thank-You Screen</span>
            </button>
          )}

          <div
            className={`px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 font-semibold border ${
              isReviewClosed
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>
              {isReviewClosed ? 'Scoring Locked: ' : 'Closes: '}
              <strong>{reviewDeadlineInfo.formattedCutoff}</strong>
            </span>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-[#062A3D]/5 border border-[#062A3D]/15 text-xs text-[#062A3D] flex items-center gap-1.5 font-medium">
            <EyeOff className="w-4 h-4 text-[#8CC8E8]" />
            <span>Blind Review Protocol Active</span>
          </div>
        </div>
      </div>

      {/* Reviewer Dashboard Progress Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">
              My Assigned Reviews Dashboard
            </div>
            <div className="text-2xl font-extrabold text-[#062A3D] mt-0.5 flex items-center gap-2">
              <span>{myReviewStats.completedCount} of {myReviewStats.totalCount} Applications Completed</span>
              {myReviewStats.isAllFinished && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  All Complete!
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Scoring window deadline: <strong>{reviewDeadlineInfo.formattedCutoff}</strong>
              </span>
              <span>•</span>
              <span className="font-semibold text-slate-700">
                {myReviewStats.notStartedCount + myReviewStats.draftCount} proposals pending evaluation
              </span>
            </div>
          </div>

          {/* One-tap to next unscored application button */}
          <div className="flex items-center gap-3">
            {myReviewStats.nextUnscoredApp ? (
              <button
                onClick={() => onSelectApplication(myReviewStats.nextUnscoredApp!.id)}
                className="w-full md:w-auto px-5 py-3 rounded-2xl bg-[#062A3D] text-white hover:bg-[#0A3D59] font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg group"
              >
                <span>Score Next:</span>
                <span className="bg-[#8CC8E8] text-[#062A3D] font-mono text-xs px-2 py-0.5 rounded-lg font-extrabold">
                  {myReviewStats.nextUnscoredApp.grantCode}
                </span>
                <ArrowRight className="w-4 h-4 text-[#8CC8E8] group-hover:translate-x-0.5 transition" />
              </button>
            ) : myReviewStats.isAllFinished ? (
              <button
                onClick={() => setShowThankYouModal(true)}
                className="w-full md:w-auto px-5 py-3 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>All Done! View Foundation Thank-You</span>
                <Heart className="w-4 h-4 text-rose-200 fill-rose-200" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Quick Status KPI Pill Counter */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[11px] font-semibold">Not Started</span>
            <span className="text-lg font-black text-slate-700">{myReviewStats.notStartedCount}</span>
          </div>
          <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200">
            <span className="text-sky-700 block text-[11px] font-semibold">Drafts in Progress</span>
            <span className="text-lg font-black text-sky-900">{myReviewStats.draftCount}</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
            <span className="text-emerald-700 block text-[11px] font-semibold">Submitted & Locked</span>
            <span className="text-lg font-black text-emerald-900">{myReviewStats.completedCount}</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
            <span className="text-amber-700 block text-[11px] font-semibold">Discussion Flags</span>
            <span className="text-lg font-black text-amber-900">{myReviewStats.flaggedCount}</span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Overall completion progress</span>
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
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>
            <strong>Scoring Window Concluded:</strong> Review scoring closed at 11:59 PM America/Chicago on {reviewDeadlineInfo.formattedCutoff}. Evaluators can view submitted scores below; score editing is locked for committee deliberations.
          </span>
        </div>
      )}

      {/* Queue Filter Tabs and Shuffle Order Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-[#062A3D] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Assigned ({myReviewStats.totalCount})
          </button>

          <button
            onClick={() => setActiveFilter('not_started')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeFilter === 'not_started'
                ? 'bg-[#062A3D] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Not Started ({myReviewStats.notStartedCount})
          </button>

          <button
            onClick={() => setActiveFilter('drafts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeFilter === 'drafts'
                ? 'bg-sky-700 text-white shadow-2xs'
                : 'text-sky-800 hover:bg-sky-50'
            }`}
          >
            Drafts in Progress ({myReviewStats.draftCount})
          </button>

          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeFilter === 'completed'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            Completed ({myReviewStats.completedCount})
          </button>

          <button
            onClick={() => setActiveFilter('flagged')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              activeFilter === 'flagged'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Discussion Flags ({myReviewStats.flaggedCount})</span>
          </button>

          {myReviewStats.recusedCount > 0 && (
            <button
              onClick={() => setActiveFilter('recused')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeFilter === 'recused'
                  ? 'bg-amber-700 text-white shadow-2xs'
                  : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              Recused ({myReviewStats.recusedCount})
            </button>
          )}
        </div>

        {/* Shuffle Order Toggle */}
        <button
          onClick={() => {
            setIsShuffled(!isShuffled);
            if (!isShuffled) {
              setShuffleSeed((prev) => prev + 1);
            }
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border self-start sm:self-auto ${
            isShuffled
              ? 'bg-[#8CC8E8]/20 border-[#8CC8E8] text-[#062A3D]'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
          title="Randomize review sequence to prevent order/fatigue bias"
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span>{isShuffled ? 'Order: Shuffled' : 'Shuffle Review Order'}</span>
        </button>
      </div>

      {/* Review Queue Cards */}
      <div className="space-y-4">
        {displayedApps.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <CheckSquare className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-[#062A3D]">No applications match this filter.</p>
            <p className="text-xs text-slate-500 mt-1">Switch to another tab to view other proposals.</p>
          </div>
        ) : (
          displayedApps.map((app) => {
            const myReview = reviews.find(
              (r) =>
                r.applicationId === app.id &&
                currentUser &&
                (r.reviewerId === currentUser.id ||
                  r.reviewerEmail.toLowerCase() === currentUser.email.toLowerCase())
            );
            const scoredCriteriaCount = Object.keys(myReview?.scores || {}).filter(
              (k) => (myReview?.scores?.[k] || 0) > 0
            ).length;
            const isSubmittedLocked = Boolean(myReview?.isSubmitted);
            const isRecused = Boolean(myReview?.recused);
            const isFlagged = Boolean(myReview?.flaggedForDiscussion);
            const isDraft = !isSubmittedLocked && !isRecused && (scoredCriteriaCount > 0 || myReview?.updatedAt);
            const draftSavedTime = myReview?.updatedAt
              ? new Date(myReview.updatedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : null;
            const submittedTime = myReview?.submittedAt
              ? new Date(myReview.submittedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : null;

            return (
              <div
                key={app.id}
                className={`bg-white rounded-3xl border p-5 sm:p-6 shadow-sm transition hover:shadow-md ${
                  isRecused
                    ? 'border-slate-200 bg-slate-50/70 opacity-75'
                    : isSubmittedLocked
                    ? 'border-emerald-300 bg-emerald-50/15'
                    : isDraft
                    ? 'border-sky-300 bg-sky-50/15'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-[#062A3D] text-[#8CC8E8] shadow-2xs">
                        {app.grantCode}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-[#062A3D]">
                        {app.category}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {app.areaOfFocus}
                      </span>
                      <span className="text-[11px] text-slate-400 italic">
                        [Campus Masked for Blind Review]
                      </span>
                      {isFlagged && (
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Flag className="w-3 h-3 text-amber-600 fill-amber-600" />
                          <span>Flagged for Discussion</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-[#062A3D]">{app.title}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="font-bold text-[#062A3D]">
                        ${(app.amountRequested || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} requested
                      </span>
                      <span>•</span>
                      <span>{app.studentsImpacted} students impacted</span>
                    </div>

                    {/* Explicit Evaluation Status Pill with Draft saved timestamp */}
                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      {isRecused ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Recused (Conflict of Interest declared)</span>
                        </span>
                      ) : isSubmittedLocked ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Completed & Submitted • Score: {myReview?.totalScore || 0}/100 pts</span>
                          {submittedTime && (
                            <span className="text-[11px] text-emerald-700 font-normal">
                              (Submitted at {submittedTime})
                            </span>
                          )}
                        </span>
                      ) : isDraft ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl bg-sky-50 text-sky-900 border border-sky-300 shadow-2xs">
                          <Pencil className="w-3.5 h-3.5 text-sky-600" />
                          <span>Draft in Progress ({scoredCriteriaCount}/8 criteria scored)</span>
                          {draftSavedTime && (
                            <span className="text-[11px] text-sky-800 font-semibold bg-white/90 px-2 py-0.5 rounded-lg border border-sky-200">
                              Draft saved at {draftSavedTime}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Not Started (0/8 criteria evaluated)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-3 self-end md:self-center">
                    {isRecused ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                          Recused
                        </span>
                        {!isReviewClosed && (
                          <button
                            onClick={() => toggleRecusal(app.id, false)}
                            className="text-xs text-slate-500 hover:text-slate-800 underline"
                          >
                            Undo
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        {!isReviewClosed && !isSubmittedLocked && (
                          <button
                            onClick={() =>
                              toggleRecusal(
                                app.id,
                                true,
                                'Reviewer declared conflict of interest'
                              )
                            }
                            className="px-3 py-1.5 text-xs text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition"
                            title="Recuse self if you work closely with this applicant"
                          >
                            Recuse
                          </button>
                        )}

                        <button
                          onClick={() => onSelectApplication(app.id)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                            isSubmittedLocked
                              ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                              : isDraft
                              ? 'bg-sky-700 hover:bg-sky-800 text-white'
                              : 'bg-[#062A3D] hover:bg-[#0A3D59] text-white'
                          }`}
                        >
                          {isSubmittedLocked ? (
                            <>
                              <Eye className="w-4 h-4 text-emerald-200" />
                              <span>View Submitted Review</span>
                            </>
                          ) : isDraft ? (
                            <>
                              <Pencil className="w-4 h-4 text-sky-200" />
                              <span>Continue Draft</span>
                            </>
                          ) : (
                            <>
                              <CheckSquare className="w-4 h-4 text-[#8CC8E8]" />
                              <span>Start Review</span>
                            </>
                          )}
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

      {/* Celebratory Thank-You Modal */}
      {showThankYouModal && currentUser && (
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
