import React, { useState, useMemo } from 'react';
import { useGrant } from '../../context/GrantContext';
import { Application, ApplicationStatus } from '../../types/grant';
import {
  Presentation,
  Maximize2,
  Minimize2,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  Award,
  DollarSign,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface InPersonMeetingModeProps {
  onClose: () => void;
}

export const InPersonMeetingMode: React.FC<InPersonMeetingModeProps> = ({ onClose }) => {
  const { applications, reviews, programSettings, updateApplicationStatus } = useGrant();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [unmaskBlindReview, setUnmaskBlindReview] = useState(false);

  // Quick Decision state
  const [decisionApp, setDecisionApp] = useState<Application | null>(null);
  const [decisionStatus, setDecisionStatus] = useState<ApplicationStatus>('Funded');
  const [awardAmount, setAwardAmount] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Compute scoring stats and disagreement flags
  const appStats = useMemo(() => {
    return applications
      .filter((a) => a.status !== 'Draft')
      .map((app) => {
        const appReviews = reviews.filter((r) => r.applicationId === app.id);
        const votingReviews = appReviews.filter((r) => r.isVoting && !r.recused);
        const reviewCount = votingReviews.length;
        const scoresList = votingReviews.map((r) => r.totalScore || 0);

        const avgScore =
          reviewCount > 0
            ? Number((scoresList.reduce((a, b) => a + b, 0) / reviewCount).toFixed(1))
            : 0;

        // Disagreement detection (≥2pt gap on any criterion)
        let hasDisagreement = false;
        let disagreementCriteria: string[] = [];

        if (votingReviews.length >= 2) {
          const allCritIds = new Set<string>();
          votingReviews.forEach((r) => Object.keys(r.scores || {}).forEach((id) => allCritIds.add(id)));

          for (const cId of allCritIds) {
            const critScores = votingReviews
              .map((r) => r.scores?.[cId])
              .filter((v): v is number => typeof v === 'number');

            if (critScores.length >= 2) {
              const minC = Math.min(...critScores);
              const maxC = Math.max(...critScores);
              if (maxC - minC >= 2) {
                hasDisagreement = true;
                disagreementCriteria.push(cId);
              }
            }
          }
        }

        return {
          app,
          votingReviews,
          reviewCount,
          avgScore,
          hasDisagreement,
          disagreementCriteria,
        };
      })
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [applications, reviews]);

  const totalFundsAwarded = useMemo(() => {
    return applications.reduce((sum, a) => {
      if (a.status === 'Funded' || a.status === 'Partially Funded') {
        return sum + (a.awardedAmount || a.amountRequested || 0);
      }
      return sum;
    }, 0);
  }, [applications]);

  const remainingFunds = programSettings.availableFunds - totalFundsAwarded;

  const handleOpenDecision = (app: Application, initialStatus: ApplicationStatus = 'Funded') => {
    setDecisionApp(app);
    setDecisionStatus(initialStatus);
    setAwardAmount(app.awardedAmount || app.amountRequested || 0);
    setFeedback(
      app.committeeFeedback ||
        'The NEF Grants Committee enthusiastically approves this innovative proposal for campus implementation!'
    );
  };

  const handleSaveDecision = async () => {
    if (!decisionApp) return;
    const finalAmount = decisionStatus === 'Not Funded' ? 0 : awardAmount;

    await updateApplicationStatus(
      decisionApp.id,
      decisionStatus,
      `In-person committee decision: ${decisionStatus} ($${finalAmount.toFixed(2)})`,
      feedback,
      finalAmount
    );
    setDecisionApp(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 text-white flex flex-col font-sans">
      {/* Top Projector Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#8CC8E8] text-[#062A3D] font-black">
            <Presentation className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white uppercase">
                NEF Grants Deliberation Board
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                In-Person Committee Mode
              </span>
            </div>
            <p className="text-xs text-slate-400">
              High-contrast projector display • Sorted by consensus weighted scores (100-pt matrix)
            </p>
          </div>
        </div>

        {/* Live Pool Tracker */}
        <div className="flex items-center gap-6 bg-slate-950/80 px-5 py-2.5 rounded-2xl border border-slate-800 text-xs">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Cycle Pool</div>
            <div className="text-base font-black text-white">
              ${programSettings.availableFunds.toLocaleString()}
            </div>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <div className="text-[10px] uppercase font-bold text-slate-400">Awarded</div>
            <div className="text-base font-black text-[#8CC8E8]">
              ${totalFundsAwarded.toLocaleString()}
            </div>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <div className="text-[10px] uppercase font-bold text-slate-400">Remaining</div>
            <div
              className={`text-base font-black ${
                remainingFunds >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              ${remainingFunds.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Blind Mode Toggle */}
          <button
            onClick={() => setUnmaskBlindReview(!unmaskBlindReview)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              unmaskBlindReview
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            {unmaskBlindReview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{unmaskBlindReview ? 'Campuses: Revealed' : 'Blind Review: Active'}</span>
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Toggle fullscreen projection"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <X className="w-4 h-4" />
            <span>Exit Meeting Mode</span>
          </button>
        </div>
      </header>

      {/* Main Table for Projection */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-4 px-5 font-extrabold w-20">Rank</th>
                <th className="py-4 px-5 font-extrabold">Grant Code & Proposal Title</th>
                <th className="py-4 px-5 font-extrabold">Campus / Educator</th>
                <th className="py-4 px-5 font-extrabold text-right">Requested</th>
                <th className="py-4 px-5 font-extrabold text-center">Avg Score</th>
                <th className="py-4 px-5 font-extrabold text-center">Consensus</th>
                <th className="py-4 px-5 font-extrabold text-center">Decision Status</th>
                <th className="py-4 px-5 font-extrabold text-right">Deliberate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {appStats.map((stat, idx) => {
                const { app, avgScore, reviewCount, hasDisagreement } = stat;
                const isFunded = app.status === 'Funded' || app.status === 'Partially Funded';

                return (
                  <tr
                    key={app.id}
                    className={`transition hover:bg-slate-800/60 ${
                      isFunded ? 'bg-emerald-950/20' : hasDisagreement ? 'bg-amber-950/15' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-5 px-5 font-black text-2xl text-slate-400">
                      #{idx + 1}
                    </td>

                    {/* Grant Code & Title */}
                    <td className="py-5 px-5 max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-lg bg-[#8CC8E8] text-[#062A3D]">
                          {app.grantCode || app.id}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 uppercase">
                          {app.category} • {app.areaOfFocus}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-white mt-1 leading-snug">
                        {app.title}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {app.studentsImpacted} students impacted
                      </div>
                    </td>

                    {/* Campus & Educator */}
                    <td className="py-5 px-5">
                      {unmaskBlindReview ? (
                        <div>
                          <div className="font-bold text-white text-base">{app.campus}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {app.applicantNames.map((n) => n.name).join(', ') || app.applicantEmail}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs italic bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800/60">
                          <EyeOff className="w-3.5 h-3.5 text-[#8CC8E8]" />
                          <span>Campus & Educator Masked</span>
                        </div>
                      )}
                    </td>

                    {/* Requested / Awarded */}
                    <td className="py-5 px-5 text-right font-mono whitespace-nowrap">
                      <div className="text-lg font-black text-white">
                        ${(app.amountRequested || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      {app.awardedAmount !== undefined && app.awardedAmount > 0 && (
                        <div className="text-xs font-bold text-emerald-400 mt-0.5">
                          Awarded: ${app.awardedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </td>

                    {/* Average Score */}
                    <td className="py-5 px-5 text-center whitespace-nowrap">
                      <div className="inline-flex items-baseline gap-1 bg-slate-950 px-3.5 py-1 rounded-2xl border border-slate-800">
                        <span className="text-2xl font-black text-[#8CC8E8]">{avgScore}</span>
                        <span className="text-xs font-bold text-slate-500">/100</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {reviewCount} voting review{reviewCount !== 1 ? 's' : ''}
                      </div>
                    </td>

                    {/* Consensus / Disagreement Alert */}
                    <td className="py-5 px-5 text-center whitespace-nowrap">
                      {hasDisagreement ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          <span>≥2pt Gap (Deliberate)</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Consensus</span>
                        </div>
                      )}
                    </td>

                    {/* Decision Status Badge */}
                    <td className="py-5 px-5 text-center whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          app.status === 'Funded'
                            ? 'bg-emerald-500 text-slate-950'
                            : app.status === 'Partially Funded'
                            ? 'bg-teal-400 text-slate-950'
                            : app.status === 'More Info Needed'
                            ? 'bg-amber-400 text-slate-950'
                            : app.status === 'Not Funded'
                            ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>

                    {/* Quick Deliberation Decision Button */}
                    <td className="py-5 px-5 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDecision(app, 'Funded')}
                        className="px-4 py-2 rounded-xl bg-[#8CC8E8] hover:bg-[#a6d7f0] text-[#062A3D] text-xs font-black transition shadow-md"
                      >
                        Record Vote
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* Decision Recording Modal in Meeting Mode */}
      {decisionApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm text-slate-900">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-mono font-bold bg-[#062A3D] text-white px-2.5 py-0.5 rounded">
                  {decisionApp.grantCode || decisionApp.id}
                </span>
                <h3 className="text-lg font-bold text-[#062A3D] mt-1">{decisionApp.title}</h3>
                <p className="text-xs text-slate-500">
                  Requested: ${(decisionApp.amountRequested || 0).toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => setDecisionApp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Decision Status Options */}
            <div className="space-y-3 text-xs">
              <label className="block font-bold text-[#062A3D]">Committee Decision:</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Funded', 'Partially Funded', 'More Info Needed', 'Not Funded'] as ApplicationStatus[]).map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setDecisionStatus(st)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition text-left flex items-center justify-between ${
                        decisionStatus === st
                          ? 'border-[#062A3D] bg-[#062A3D] text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{st}</span>
                      {decisionStatus === st && <CheckCircle2 className="w-4 h-4 text-[#8CC8E8]" />}
                    </button>
                  )
                )}
              </div>

              {/* Award Amount (if Funded or Partially Funded) */}
              {(decisionStatus === 'Funded' || decisionStatus === 'Partially Funded') && (
                <div className="space-y-1 pt-2">
                  <label className="block font-bold text-[#062A3D]">
                    Approved Award Amount ($)
                  </label>
                  <input
                    type="number"
                    step="50"
                    value={awardAmount}
                    onChange={(e) => setAwardAmount(parseFloat(e.target.value) || 0)}
                    className="w-full text-sm font-bold text-[#062A3D] rounded-xl border border-slate-300 p-2.5 bg-white"
                  />
                  <div className="text-[11px] text-slate-500">
                    Category Cap: ${decisionApp.category === 'Category 2' ? '4,500.00' : '1,500.00'}
                  </div>
                </div>
              )}

              {/* Committee Commendation or Feedback */}
              <div className="space-y-1">
                <label className="block font-bold text-[#062A3D]">
                  Committee Feedback / Deliberation Notes:
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setDecisionApp(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDecision}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-[#062A3D] text-white hover:bg-[#0A3D59]"
              >
                Confirm Committee Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
