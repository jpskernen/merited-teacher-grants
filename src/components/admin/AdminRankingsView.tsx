import React, { useState, useMemo } from 'react';
import { useGrant } from '../../context/GrantContext';
import { Application, ApplicationStatus, Review } from '../../types/grant';
import {
  Download,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  Award,
  MessageSquare,
  Eye,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  X,
  Send,
  Building,
  Users,
} from 'lucide-react';

export const AdminRankingsView: React.FC = () => {
  const {
    applications,
    reviews,
    programSettings,
    updateApplicationStatus,
    sendMoreInfoRequest,
  } = useGrant();

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFocus, setSelectedFocus] = useState<string>('all');
  const [selectedCampus, setSelectedCampus] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'amount' | 'students'>('score');

  // Decision modal state
  const [decisionApp, setDecisionApp] = useState<Application | null>(null);
  const [decisionStatus, setDecisionStatus] = useState<ApplicationStatus>('Funded');
  const [customAwardAmount, setCustomAwardAmount] = useState<number>(0);
  const [committeeFeedbackText, setCommitteeFeedbackText] = useState<string>('');

  // Inquiry modal state
  const [inquiryApp, setInquiryApp] = useState<Application | null>(null);
  const [inquiryQuestion, setInquiryQuestion] = useState<string>('');

  // Detailed review inspection modal
  const [inspectApp, setInspectApp] = useState<Application | null>(null);

  // Compute aggregate stats and reviews per application
  const appStats = useMemo(() => {
    return applications.map((app) => {
      // Filter for voting reviews only (non-voting reviewers excluded from score calculation)
      const appReviews = reviews.filter((r) => r.applicationId === app.id);
      const votingReviews = appReviews.filter((r) => r.isVoting && !r.recused);

      const reviewCount = votingReviews.length;
      const scoresList = votingReviews.map((r) => r.totalScore || 0);

      const avgScore =
        reviewCount > 0
          ? Number((scoresList.reduce((a, b) => a + b, 0) / reviewCount).toFixed(1))
          : 0;

      // Disagreement check: difference between max and min score >= 4 points
      const minScore = scoresList.length > 0 ? Math.min(...scoresList) : 0;
      const maxScore = scoresList.length > 0 ? Math.max(...scoresList) : 0;
      const scoreDiff = maxScore - minScore;
      const hasDisagreement = votingReviews.length >= 2 && scoreDiff >= 4;

      return {
        app,
        votingReviews,
        allReviews: appReviews,
        reviewCount,
        avgScore,
        minScore,
        maxScore,
        hasDisagreement,
      };
    });
  }, [applications, reviews]);

  // Funds awarded running total
  const totalFundsAwarded = useMemo(() => {
    return applications.reduce((sum, a) => {
      if (a.status === 'Funded' || a.status === 'Partially Funded') {
        return sum + (a.awardedAmount || a.amountRequested || 0);
      }
      return sum;
    }, 0);
  }, [applications]);

  const remainingFunds = programSettings.availableFunds - totalFundsAwarded;

  // Filter and sort applications
  const filteredRankings = useMemo(() => {
    return appStats
      .filter(({ app }) => {
        if (selectedCategory !== 'all' && app.category !== selectedCategory) return false;
        if (selectedFocus !== 'all' && app.areaOfFocus !== selectedFocus) return false;
        if (selectedCampus !== 'all' && app.campus !== selectedCampus) return false;
        if (selectedStatus !== 'all' && app.status !== selectedStatus) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score') return b.avgScore - a.avgScore;
        if (sortBy === 'amount') return b.app.amountRequested - a.app.amountRequested;
        if (sortBy === 'students') return b.app.studentsImpacted - a.app.studentsImpacted;
        return 0;
      });
  }, [appStats, selectedCategory, selectedFocus, selectedCampus, selectedStatus, sortBy]);

  // Export applications and scores to CSV
  const handleExportCSV = () => {
    const headers = [
      'Application ID',
      'Title',
      'Campus',
      'Category',
      'Focus',
      'Lead Applicant',
      'Email',
      'Amount Requested',
      'Amount Awarded',
      'Students Impacted',
      'Status',
      'Voting Reviewers Count',
      'Average Score',
      'Disagreement Flag',
    ];

    const rows = appStats.map(({ app, avgScore, reviewCount, hasDisagreement }) => [
      `"${app.id}"`,
      `"${app.title.replace(/"/g, '""')}"`,
      `"${app.campus}"`,
      `"${app.category}"`,
      `"${app.areaOfFocus}"`,
      `"${app.applicantNames[0]?.name || ''}"`,
      `"${app.applicantEmail}"`,
      app.amountRequested,
      app.awardedAmount || 0,
      app.studentsImpacted,
      `"${app.status}"`,
      reviewCount,
      avgScore,
      hasDisagreement ? 'FLAGGED' : 'CONSENSUS',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NEF_Grants_Rankings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenDecision = (app: Application) => {
    setDecisionApp(app);
    setDecisionStatus(app.status === 'Partially Funded' ? 'Partially Funded' : 'Funded');
    setCustomAwardAmount(app.awardedAmount || app.amountRequested);
    setCommitteeFeedbackText(
      app.committeeFeedback ||
        'The NEF Review Committee commendably praises this innovative initiative! We look forward to your student outcomes.'
    );
  };

  const handleSaveDecision = async () => {
    if (!decisionApp) return;
    const finalAmount =
      decisionStatus === 'Not Funded' ? 0 : customAwardAmount;

    await updateApplicationStatus(
      decisionApp.id,
      decisionStatus,
      `Committee recorded decision: ${decisionStatus} ($${finalAmount})`,
      committeeFeedbackText,
      finalAmount
    );
    setDecisionApp(null);
  };

  const handleSendInquiry = async () => {
    if (!inquiryApp || !inquiryQuestion.trim()) return;
    await sendMoreInfoRequest(inquiryApp.id, inquiryQuestion.trim());
    setInquiryApp(null);
    setInquiryQuestion('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#062A3D]">Grant Rankings & Committee Decisions</h1>
          <p className="text-xs text-slate-600 mt-1">
            Weighted scores across voting reviewers, committee disagreement flags, and funding allocations.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#062A3D] text-white hover:bg-[#0A3D59] transition flex items-center gap-2 shadow-xs"
        >
          <Download className="w-4 h-4 text-[#8CC8E8]" />
          <span>Export All Data to CSV</span>
        </button>
      </div>

      {/* Funds Awarded vs Available Running Budget Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">
              Grant Allocation Budget Tracker ({programSettings.schoolYear})
            </div>
            <div className="text-xl font-extrabold text-[#062A3D] mt-0.5">
              ${totalFundsAwarded.toLocaleString(undefined, { minimumFractionDigits: 2 })} awarded of ${programSettings.availableFunds.toLocaleString()} available
            </div>
          </div>

          <div className="text-right">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                remainingFunds >= 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              ${Math.abs(remainingFunds).toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
              {remainingFunds >= 0 ? 'Remaining' : 'Over Budget'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              totalFundsAwarded > programSettings.availableFunds
                ? 'bg-rose-500'
                : 'bg-gradient-to-r from-[#062A3D] to-[#8CC8E8]'
            }`}
            style={{
              width: `${Math.min(
                100,
                (totalFundsAwarded / programSettings.availableFunds) * 100
              )}%`,
            }}
          />
        </div>
      </div>

      {/* Filters and Sorting Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filters:</span>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 bg-slate-50 text-slate-700"
          >
            <option value="all">All Categories</option>
            <option value="Category 1">Category 1</option>
            <option value="Category 2">Category 2</option>
          </select>

          <select
            value={selectedFocus}
            onChange={(e) => setSelectedFocus(e.target.value)}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 bg-slate-50 text-slate-700"
          >
            <option value="all">All Focus Areas</option>
            <option value="STEM">STEM</option>
            <option value="Early Literacy/Numeracy">Early Literacy/Numeracy</option>
            <option value="Fine Arts">Fine Arts</option>
            <option value="Workforce/Career-Connected Learning">Workforce</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 bg-slate-50 text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="Under Review">Under Review</option>
            <option value="More Info Needed">More Info Needed</option>
            <option value="Funded">Funded</option>
            <option value="Partially Funded">Partially Funded</option>
            <option value="Not Funded">Not Funded</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-700">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 bg-slate-50 text-slate-700 font-semibold"
          >
            <option value="score">Weighted Score (High to Low)</option>
            <option value="amount">Requested Amount</option>
            <option value="students">Students Impacted</option>
          </select>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#062A3D] text-white uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-bold">Rank / ID</th>
                <th className="py-3.5 px-4 font-bold">Proposal Title & Details</th>
                <th className="py-3.5 px-4 font-bold">Campus</th>
                <th className="py-3.5 px-4 font-bold">Requested</th>
                <th className="py-3.5 px-4 font-bold">Avg Score</th>
                <th className="py-3.5 px-4 font-bold">Reviews</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold text-right">Committee Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRankings.map((stat, idx) => {
                const { app, avgScore, reviewCount, hasDisagreement } = stat;
                return (
                  <tr
                    key={app.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => setInspectApp(app)}
                  >
                    <td className="py-4 px-4 font-bold text-[#062A3D]">
                      <span className="text-sm">#{idx + 1}</span>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {app.id}
                      </div>
                    </td>

                    <td className="py-4 px-4 max-w-xs">
                      <div className="font-bold text-[#062A3D] truncate">{app.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {app.category} • {app.areaOfFocus} • {app.studentsImpacted} students
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-700 whitespace-nowrap">
                      {app.campus}
                    </td>

                    <td className="py-4 px-4 font-semibold text-[#062A3D] whitespace-nowrap">
                      ${(app.amountRequested || 0).toFixed(2)}
                      {app.awardedAmount !== undefined && app.awardedAmount > 0 && (
                        <div className="text-[10px] text-emerald-700 font-bold">
                          Awarded: ${app.awardedAmount.toFixed(2)}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold text-[#062A3D]">
                          {avgScore > 0 ? avgScore : '—'}
                        </span>
                        <span className="text-[10px] text-slate-400">/40</span>

                        {hasDisagreement && (
                          <span
                            title="Significant score variance (4+ pts) between reviewers. Recommend for committee calibration discussion."
                            className="p-1 rounded bg-amber-100 text-amber-800"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                      <span className="font-semibold">{reviewCount}</span> voting
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          app.status === 'Funded'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.status === 'Partially Funded'
                            ? 'bg-teal-100 text-teal-800'
                            : app.status === 'More Info Needed'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>

                    <td
                      className="py-4 px-4 text-right whitespace-nowrap space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setInquiryApp(app);
                          setInquiryQuestion(
                            app.moreInfoQuestion ||
                              'Please provide clarification regarding your budget line item pricing and warranty.'
                          );
                        }}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      >
                        Ask Info
                      </button>

                      <button
                        onClick={() => handleOpenDecision(app)}
                        className="px-3 py-1 rounded-md text-xs font-bold bg-[#8CC8E8] hover:bg-[#a0d4ef] text-[#062A3D] transition shadow-xs"
                      >
                        Record Award
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Decision & Award Modal */}
      {decisionApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#062A3D]">
                  Record Decision: {decisionApp.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Requested: ${(decisionApp.amountRequested || 0).toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => setDecisionApp(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Committee Decision Status *
                </label>
                <select
                  value={decisionStatus}
                  onChange={(e) => setDecisionStatus(e.target.value as any)}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white font-semibold"
                >
                  <option value="Funded">Funded (Full Award)</option>
                  <option value="Partially Funded">Partially Funded</option>
                  <option value="Not Funded">Not Funded this Cycle</option>
                </select>
              </div>

              {decisionStatus !== 'Not Funded' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Awarded Amount ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={customAwardAmount}
                    onChange={(e) => setCustomAwardAmount(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Official Written Feedback to Teacher *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide warm, encouraging suggestions or congratulations..."
                  value={committeeFeedbackText}
                  onChange={(e) => setCommitteeFeedbackText(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setDecisionApp(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDecision}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-[#8CC8E8] text-[#062A3D] hover:bg-[#a0d4ef]"
              >
                Save Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send More Info Request Modal */}
      {inquiryApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#062A3D]">
                  Request Clarification from Teacher
                </h3>
                <p className="text-xs text-slate-500">{inquiryApp.title}</p>
              </div>
              <button
                onClick={() => setInquiryApp(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-semibold text-slate-700">
                Inquiry Question to Applicant:
              </label>
              <textarea
                rows={4}
                required
                placeholder="What specific clarification does the review committee need?"
                value={inquiryQuestion}
                onChange={(e) => setInquiryQuestion(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
              />
              <p className="text-[11px] text-slate-500 italic">
                *The application status will become "More Info Needed". Once the teacher replies, it will automatically return to "Under Review".
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setInquiryApp(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInquiry}
                disabled={!inquiryQuestion.trim()}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-[#062A3D] text-white hover:bg-[#0A3D59]"
              >
                Send Inquiry to Teacher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect All Reviews Modal */}
      {inspectApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs uppercase font-bold text-[#8CC8E8] bg-[#062A3D] px-2 py-0.5 rounded">
                  Committee Review Inspection
                </span>
                <h2 className="text-xl font-bold text-[#062A3D] mt-1">{inspectApp.title}</h2>
                <p className="text-xs text-slate-500">
                  {inspectApp.campus} • {inspectApp.category} • Requested: ${(inspectApp.amountRequested || 0).toFixed(2)}
                </p>
              </div>
              <button onClick={() => setInspectApp(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Individual Reviews Breakdown */}
            <div className="space-y-4 text-xs">
              <h4 className="font-bold text-[#062A3D] uppercase tracking-wider text-xs">
                Submitted Reviewer Evaluations:
              </h4>

              {reviews.filter((r) => r.applicationId === inspectApp.id).length === 0 ? (
                <p className="text-slate-500 italic">No reviewers have scored this proposal yet.</p>
              ) : (
                reviews
                  .filter((r) => r.applicationId === inspectApp.id)
                  .map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2"
                    >
                      <div className="flex items-center justify-between font-bold text-[#062A3D]">
                        <div>
                          <span>{rev.reviewerName}</span>
                          {!rev.isVoting && (
                            <span className="ml-2 text-[10px] text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded font-normal">
                              Non-Voting Observer
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-extrabold text-[#062A3D]">
                          {rev.totalScore} / 40 pts ({rev.percentageScore}%)
                        </span>
                      </div>

                      {rev.generalFeedback && (
                        <div className="text-[11px] text-slate-600 italic bg-white p-2 rounded border border-slate-200">
                          Feedback: "{rev.generalFeedback}"
                        </div>
                      )}

                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>Submitted {new Date(rev.submittedAt).toLocaleDateString()}</span>
                        <span>
                          {rev.shareWithApplicant
                            ? '✅ Marked suitable for applicant'
                            : '🔒 Private committee comment'}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectApp(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
