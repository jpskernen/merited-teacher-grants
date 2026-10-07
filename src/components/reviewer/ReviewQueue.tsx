import React from 'react';
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
} from 'lucide-react';

interface ReviewQueueProps {
  onSelectApplication: (appId: string) => void;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ onSelectApplication }) => {
  const {
    currentUser,
    applications,
    reviews,
    programSettings,
    toggleRecusal,
  } = useGrant();

  // Reviewable apps are those Submitted, Under Review, or More Info Needed
  const reviewableApps = applications.filter(
    (a) =>
      a.status === 'Under Review' ||
      a.status === 'Submitted' ||
      a.status === 'More Info Needed' ||
      a.status === 'Funded' ||
      a.status === 'Partially Funded' ||
      a.status === 'Not Funded'
  );

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

        {programSettings.blindReviewEnabled && (
          <div className="px-3.5 py-1.5 rounded-lg bg-[#062A3D]/5 border border-[#062A3D]/15 text-xs text-[#062A3D] flex items-center gap-1.5 font-medium">
            <EyeOff className="w-4 h-4 text-[#8CC8E8]" />
            <span>Blind Review Protocol Active</span>
          </div>
        )}
      </div>

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
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#062A3D] text-[#8CC8E8]">
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
    </div>
  );
};
