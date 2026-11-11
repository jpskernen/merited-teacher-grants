import React, { useState, useMemo } from 'react';
import { useGrants } from '../../context/GrantContext';
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
  Search,
  FileSpreadsheet,
  Copy,
  Check,
  Hash,
  Presentation,
  ClipboardCheck,
  ShieldCheck,
  Upload,
  User,
  Mail,
  Flag,
  Loader2,
} from 'lucide-react';
import { GoogleFormImportModal } from './GoogleFormImportModal';
import {
  buildCycleSheetRows,
  exportCycleSheetCsv,
  exportDetailedReviewerAnswersCsv,
  SheetRowData,
} from '../../utils/grantCodeUtils';
import { InPersonMeetingMode } from './InPersonMeetingMode';
import { AdminEligibilityModal } from './AdminEligibilityModal';
import { AdminAssignReviewersModal } from './AdminAssignReviewersModal';
import { BulkDecisionReport } from '../../context/GrantContext';

export const AdminRankingsView: React.FC = () => {
  const {
    applications,
    applicantIdentities,
    reviews,
    rubric,
    programSettings,
    updateApplicationAward,
    executeBulkDecisions,
  } = useGrants();

  const [showGoogleFormImport, setShowGoogleFormImport] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFocus, setSelectedFocus] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'amount' | 'students'>('score');

  // Modals state
  const [eligibilityScreeningApp, setEligibilityScreeningApp] = useState<Application | null>(null);
  const [assigningApp, setAssigningApp] = useState<Application | null>(null);
  const [showInPersonMeeting, setShowInPersonMeeting] = useState(false);
  const [showGoogleSheetSync, setShowGoogleSheetSync] = useState(false);
  const [copiedSheetData, setCopiedSheetData] = useState(false);

  // Decision modal state
  const [decisionApp, setDecisionApp] = useState<Application | null>(null);
  const [decisionStatus, setDecisionStatus] = useState<ApplicationStatus>('Funded');
  const [customAwardAmount, setCustomAwardAmount] = useState<number>(0);
  const [committeeFeedbackText, setCommitteeFeedbackText] = useState<string>('');

  // Detailed review inspection modal
  const [inspectApp, setInspectApp] = useState<Application | null>(null);

  // Bulk Decision Release Modal states
  const [showBulkDecisionsModal, setShowBulkDecisionsModal] = useState(false);
  const [selectedAppIdsForBulk, setSelectedAppIdsForBulk] = useState<string[]>([]);
  const [isDispatchingBulk, setIsDispatchingBulk] = useState(false);
  const [bulkReport, setBulkReport] = useState<BulkDecisionReport | null>(null);

  // Compute aggregate stats and reviews per application
  // Non-voting reviewers' scores are EXCLUDED from averages
  const appStats = useMemo(() => {
    return applications.map((app) => {
      const appReviews = reviews.filter((r) => r.applicationId === app.id);
      // Voting reviews only (non-voting reviewers excluded from score calculation)
      const votingReviews = appReviews.filter((r) => r.isVoting && !r.recused);

      const reviewCount = votingReviews.length;
      const scoresList = votingReviews.map((r) => r.totalScore || 0);

      const avgScore =
        reviewCount > 0
          ? Number((scoresList.reduce((a, b) => a + b, 0) / reviewCount).toFixed(1))
          : 0;

      // Discussion flags count
      const flaggedCount = appReviews.filter((r) => Boolean(r.flaggedForDiscussion)).length;

      // Disagreement check: If any individual criterion has reviewers 2 or more points apart
      let hasDisagreement = false;
      const criterionGaps: Record<string, number> = {};

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
            const diff = maxC - minC;
            criterionGaps[cId] = diff;
            if (diff >= 2) {
              hasDisagreement = true;
            }
          }
        }
      }

      // Tie-breaker: Sustainability score average
      const sustainabilityScores = votingReviews
        .map((r) => r.scores?.['crit-sustainability'] ?? 3)
        .filter((v): v is number => typeof v === 'number');
      const avgSustainability =
        sustainabilityScores.length > 0
          ? sustainabilityScores.reduce((a, b) => a + b, 0) / sustainabilityScores.length
          : 0;

      return {
        app,
        votingReviews,
        allReviews: appReviews,
        reviewCount,
        avgScore,
        hasDisagreement,
        criterionGaps,
        avgSustainability,
        flaggedCount,
      };
    });
  }, [applications, reviews]);

  // Funds Running Totals: Requested, Awarded, and Remaining Funds ($52,000 pool)
  const totalRequestedFunds = useMemo(() => {
    return applications.reduce((sum, a) => sum + (a.amountRequested || 0), 0);
  }, [applications]);

  const totalFundsAwarded = useMemo(() => {
    return applications.reduce((sum, a) => {
      if (a.status === 'Funded' || a.status === 'Partially Funded') {
        return sum + (a.awardedAmount || a.amountRequested || 0);
      }
      return sum;
    }, 0);
  }, [applications]);

  const remainingFunds = programSettings.availableFunds - totalFundsAwarded;

  const avgScoresMap = useMemo(() => {
    const map: Record<string, number> = {};
    appStats.forEach(({ app, avgScore }) => {
      map[app.id] = avgScore;
    });
    return map;
  }, [appStats]);

  const cycleSheetRows: SheetRowData[] = useMemo(() => {
    return buildCycleSheetRows(applications, avgScoresMap, applicantIdentities);
  }, [applications, avgScoresMap, applicantIdentities]);

  // Filter and sort applications with tie-breakers:
  // 1. Total Weighted Score
  // Tie-breaker 1: Student Impact (studentsImpacted)
  // Tie-breaker 2: Sustainability Score
  const filteredRankings = useMemo(() => {
    return appStats
      .filter(({ app }) => {
        const identity = applicantIdentities[app.id];
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchCode = app.grantCode?.toLowerCase().includes(q);
          const matchTitle = app.title.toLowerCase().includes(q);
          const matchCampus = identity?.campus.toLowerCase().includes(q);
          const matchApplicant =
            identity?.applicantNames.some((n) => n.name.toLowerCase().includes(q)) ||
            identity?.applicantEmail.toLowerCase().includes(q);

          if (!matchCode && !matchTitle && !matchCampus && !matchApplicant) {
            return false;
          }
        }
        if (selectedCategory !== 'all' && app.category !== selectedCategory) return false;
        if (selectedFocus !== 'all' && app.areaOfFocus !== selectedFocus) return false;
        if (selectedStatus !== 'all' && app.status !== selectedStatus) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score') {
          if (b.avgScore !== a.avgScore) {
            return b.avgScore - a.avgScore;
          }
          if (b.app.studentsImpacted !== a.app.studentsImpacted) {
            return b.app.studentsImpacted - a.app.studentsImpacted;
          }
          return b.avgSustainability - a.avgSustainability;
        }
        if (sortBy === 'amount') return b.app.amountRequested - a.app.amountRequested;
        if (sortBy === 'students') return b.app.studentsImpacted - a.app.studentsImpacted;
        return 0;
      });
  }, [appStats, searchQuery, selectedCategory, selectedFocus, selectedStatus, sortBy, applicantIdentities]);

  // Export applications and final grant scores to CSV
  const handleExportCSV = () => {
    const headers = [
      'Rank',
      'Grant Code',
      'Application ID',
      'Title',
      'Campus (Admin Only)',
      'Lead Applicant (Admin Only)',
      'Co-Applicants (Admin Only)',
      'Applicant Email (Admin Only)',
      'Category',
      'Area of Focus',
      'Amount Requested',
      'Amount Awarded',
      'Students Impacted',
      'Eligibility Gate',
      'Status',
      'Reviewers Count',
      'Average Score (out of 100)',
      'Disagreement Flag',
      'Committee Feedback',
    ];

    const rows = filteredRankings.map((stat, idx) => {
      const { app, avgScore, reviewCount, hasDisagreement } = stat;
      const identity = applicantIdentities[app.id];
      const leadName = identity?.applicantNames[0]?.name || 'Confidential';
      const coApplicants = (identity?.applicantNames || []).slice(1).map((n) => n.name).join('; ');
      const applicantEmail = identity?.applicantEmail || 'Confidential';
      const campus = identity?.campus || 'Confidential';

      const eligibilityStatus = app.adminEligibility?.passed
        ? 'PASSED'
        : app.adminEligibility && !app.adminEligibility.passed
        ? 'FIXES NEEDED'
        : 'PENDING';

      return [
        idx + 1,
        `"${app.grantCode || ''}"`,
        `"${app.id}"`,
        `"${app.title.replace(/"/g, '""')}"`,
        `"${campus.replace(/"/g, '""')}"`,
        `"${leadName.replace(/"/g, '""')}"`,
        `"${coApplicants.replace(/"/g, '""')}"`,
        `"${applicantEmail}"`,
        `"${app.category}"`,
        `"${(app.areaOfFocus + (app.areaOfFocusOther ? ` (${app.areaOfFocusOther})` : '')).replace(/"/g, '""')}"`,
        (app.amountRequested || 0).toFixed(2),
        (app.awardedAmount || 0).toFixed(2),
        app.studentsImpacted || 0,
        `"${eligibilityStatus}"`,
        `"${app.status}"`,
        reviewCount,
        avgScore > 0 ? avgScore.toFixed(1) : '—',
        hasDisagreement ? 'FLAGGED (≥2pt gap)' : 'CONSENSUS',
        `"${(app.committeeFeedback || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NEF_Grant_Scores_Rankings_${new Date().toISOString().slice(0, 10)}.csv`);
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
        'The NEF Review Committee congratulates the project team on their approved grant award!'
    );
  };

  const handleSaveDecision = async () => {
    if (!decisionApp) return;
    const finalAmount = decisionStatus === 'Not Funded' ? 0 : customAwardAmount;

    await updateApplicationAward(
      decisionApp.id,
      decisionStatus,
      finalAmount,
      committeeFeedbackText
    );
    setDecisionApp(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#062A3D]">Grant Rankings & Committee Decisions</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              100-Pt Matrix
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Weighted averages calculated from voting reviewers (non-voting reviewers excluded). Flagged when reviewers differ by ≥2 pts on any criterion.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              const unnotified = applications
                .filter(
                  (a) =>
                    ['Funded', 'Partially Funded', 'Not Funded'].includes(a.status) &&
                    !a.decisionEmailSentAt
                )
                .map((a) => a.id);
              setSelectedAppIdsForBulk(unnotified);
              setShowBulkDecisionsModal(true);
            }}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-2 shadow-xs"
            title="Dispatch official branded decision notices to teacher applicants"
          >
            <Mail className="w-4 h-4 text-emerald-200" />
            <span>Release Decisions in Bulk</span>
          </button>

          <button
            onClick={() => setShowGoogleFormImport(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#062A3D] text-[#8CC8E8] hover:bg-[#0A3D59] transition flex items-center gap-2 shadow-xs border border-[#8CC8E8]/40"
            title="Import responses CSV exported from Google Form"
          >
            <Upload className="w-4 h-4 text-[#8CC8E8]" />
            <span>Import from Google Form CSV</span>
          </button>

          <button
            onClick={() => setShowInPersonMeeting(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-purple-700 text-white hover:bg-purple-800 transition flex items-center gap-2 shadow-xs"
            title="Launch projector-friendly ranking screen for committee deliberations"
          >
            <Presentation className="w-4 h-4 text-purple-200" />
            <span>In-Person Meeting Mode</span>
          </button>

          <button
            onClick={() => setShowGoogleSheetSync(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-700 text-white hover:bg-emerald-800 transition flex items-center gap-2 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Google Sheet Sync</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#062A3D] text-white hover:bg-[#0A3D59] transition flex items-center gap-2 shadow-xs"
            title="Download CSV containing final grant scores and application details"
          >
            <Download className="w-4 h-4 text-[#8CC8E8]" />
            <span>Export Rankings CSV</span>
          </button>

          <button
            onClick={() =>
              exportDetailedReviewerAnswersCsv(
                applications,
                reviews,
                rubric,
                programSettings.schoolYear
              )
            }
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-700 text-white hover:bg-indigo-800 transition flex items-center gap-2 shadow-xs"
            title="Download complete line-by-line reviewer answers, scores 1-5, and written comments"
          >
            <ClipboardCheck className="w-4 h-4 text-indigo-200" />
            <span>Export Reviewer Answers</span>
          </button>
        </div>
      </div>

      {/* Funds Running Total: Available ($52,000), Requested, Awarded, Remaining */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">
              Cycle Grant Pool Tracker ({programSettings.schoolYear})
            </div>
            <div className="text-xl font-extrabold text-[#062A3D] mt-0.5">
              ${programSettings.availableFunds.toLocaleString()} Available Funds
            </div>
          </div>

          <div className="text-right">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                remainingFunds >= 0
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}
            >
              ${Math.abs(remainingFunds).toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
              {remainingFunds >= 0 ? 'Remaining Funds' : 'Over Budget'}
            </span>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              Total Funds Requested
            </span>
            <div className="text-lg font-bold text-[#062A3D] mt-1">
              ${totalRequestedFunds.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Across {applications.length} submitted proposals
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100">
            <span className="text-sky-900 font-semibold uppercase tracking-wider text-[10px]">
              Total Funds Awarded
            </span>
            <div className="text-lg font-bold text-[#062A3D] mt-1">
              ${totalFundsAwarded.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Funded & Partially Funded decisions
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border ${
              remainingFunds >= 0
                ? 'bg-emerald-50/70 border-emerald-100'
                : 'bg-rose-50/70 border-rose-100'
            }`}
          >
            <span
              className={`font-semibold uppercase tracking-wider text-[10px] ${
                remainingFunds >= 0 ? 'text-emerald-900' : 'text-rose-900'
              }`}
            >
              Remaining Available Pool
            </span>
            <div
              className={`text-lg font-bold mt-1 ${
                remainingFunds >= 0 ? 'text-emerald-800' : 'text-rose-800'
              }`}
            >
              ${remainingFunds.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {remainingFunds >= 0 ? 'Remaining to allocate' : 'Exceeds foundation cycle pool'}
            </div>
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
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search code (e.g. IGF2601), title, applicant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filters:</span>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 text-slate-700"
          >
            <option value="all">All Categories</option>
            <option value="Category 1">Category 1</option>
            <option value="Category 2">Category 2</option>
          </select>

          <select
            value={selectedFocus}
            onChange={(e) => setSelectedFocus(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 text-slate-700"
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
            className="rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="Under Review">Under Review</option>
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
            className="rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 text-slate-700 font-semibold"
          >
            <option value="score">Weighted Score (High to Low)</option>
            <option value="amount">Requested Amount</option>
            <option value="students">Students Impacted</option>
          </select>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#062A3D] text-white uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-bold">Rank / Grant Code</th>
                <th className="py-3.5 px-4 font-bold">Proposal Title & Details</th>
                <th className="py-3.5 px-4 font-bold">Applicant & Campus (Admin Only)</th>
                <th className="py-3.5 px-4 font-bold">Requested</th>
                <th className="py-3.5 px-4 font-bold">Avg Score</th>
                <th className="py-3.5 px-4 font-bold">Reviews</th>
                <th className="py-3.5 px-4 font-bold">Eligibility</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRankings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No grant proposals found. Use "Import from Google Form CSV" to add proposals.
                  </td>
                </tr>
              ) : (
                filteredRankings.map((stat, idx) => {
                  const { app, avgScore, reviewCount, hasDisagreement, flaggedCount } = stat;
                  const identity = applicantIdentities[app.id];

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                      onClick={() => setInspectApp(app)}
                    >
                      <td className="py-4 px-4 font-bold text-[#062A3D]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm">#{idx + 1}</span>
                          {app.grantCode && (
                            <span className="px-2 py-0.5 rounded-lg bg-[#062A3D] text-[#8CC8E8] font-mono font-bold text-xs tracking-wide">
                              {app.grantCode}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 max-w-xs">
                        <div className="font-bold text-[#062A3D] text-sm truncate">{app.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {app.category} • {app.areaOfFocus} • {app.studentsImpacted} students
                        </div>
                      </td>

                      {/* Admin-only view of applicant identity */}
                      <td className="py-4 px-4 text-slate-700">
                        {identity ? (
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-[#062A3D]" />
                              <span>{identity.applicantNames.map((n) => n.name).join(', ')}</span>
                            </div>
                            <div className="text-[11px] text-slate-500">{identity.campus}</div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Identity in admin collection</span>
                        )}
                      </td>

                      <td className="py-4 px-4 font-semibold text-[#062A3D] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>${(app.amountRequested || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          {(app.amountRequested || 0) >= (programSettings.notificationThreshold || 6000) && (
                            <span
                              title={`Large request alert: meets/exceeds notification threshold ($${(programSettings.notificationThreshold || 6000).toLocaleString()})`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>≥$6k</span>
                            </span>
                          )}
                        </div>
                        {app.awardedAmount !== undefined && app.awardedAmount > 0 && (
                          <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                            Awarded: ${app.awardedAmount.toFixed(2)}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-base font-extrabold text-[#062A3D]">
                            {avgScore > 0 ? avgScore : '—'}
                          </span>
                          <span className="text-[10px] text-slate-400">/100</span>

                          {hasDisagreement && (
                            <span
                              title="Reviewers are 2 or more points apart on at least one criterion. Discuss as committee before deciding."
                              className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 flex items-center gap-1 text-[10px] font-bold"
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>≥2pt gap</span>
                            </span>
                          )}

                          {flaggedCount > 0 && (
                            <span
                              title={`${flaggedCount} reviewer(s) flagged this proposal for committee discussion`}
                              className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5 text-[10px] font-bold"
                            >
                              <Flag className="w-2.5 h-2.5 fill-amber-600 text-amber-600" />
                              <span>{flaggedCount}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                        <span className="font-semibold text-slate-900">{reviewCount}</span> voting
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {app.adminEligibility?.passed ? (
                          <button
                            onClick={() => setEligibilityScreeningApp(app)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200 transition"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Passed</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setEligibilityScreeningApp(app)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition"
                          >
                            <ClipboardCheck className="w-3 h-3 text-slate-500" />
                            <span>Screen Gate</span>
                          </button>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            app.status === 'Funded'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'Partially Funded'
                              ? 'bg-teal-100 text-teal-800'
                              : app.status === 'Not Funded'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {app.status}
                        </span>
                        {app.decisionEmailSentAt && (
                          <div className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Email Dispatched</span>
                          </div>
                        )}
                      </td>

                      <td
                        className="py-4 px-4 text-right whitespace-nowrap space-x-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setEligibilityScreeningApp(app)}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition"
                        >
                          Check
                        </button>

                        <button
                          onClick={() => setAssigningApp(app)}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        >
                          Assign
                        </button>

                        <button
                          onClick={() => handleOpenDecision(app)}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#8CC8E8] hover:bg-[#a0d4ef] text-[#062A3D] transition shadow-xs"
                        >
                          Record Award
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Decision Modal */}
      {decisionApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#062A3D]">
                  Record Decision: {decisionApp.grantCode}
                </h3>
                <p className="text-xs text-slate-500 truncate max-w-sm">{decisionApp.title}</p>
              </div>
              <button onClick={() => setDecisionApp(null)} className="p-1 text-slate-400 hover:text-slate-700">
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
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
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
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Committee Feedback / Commendations
                </label>
                <textarea
                  rows={4}
                  placeholder="Suggestions or congratulations..."
                  value={committeeFeedbackText}
                  onChange={(e) => setCommitteeFeedbackText(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setDecisionApp(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDecision}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-[#8CC8E8] text-[#062A3D] hover:bg-[#a0d4ef]"
              >
                Save Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect All Reviews Modal */}
      {inspectApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs uppercase font-bold text-[#8CC8E8] bg-[#062A3D] px-2.5 py-0.5 rounded-full">
                  {inspectApp.grantCode} • Committee Review Inspection
                </span>
                <h2 className="text-xl font-bold text-[#062A3D] mt-1">{inspectApp.title}</h2>
                <p className="text-xs text-slate-500">
                  {inspectApp.category} • Requested: ${(inspectApp.amountRequested || 0).toFixed(2)}
                </p>
              </div>
              <button onClick={() => setInspectApp(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Individual Reviews Breakdown */}
            <div className="space-y-4 text-xs">
              <h4 className="font-bold text-[#062A3D] uppercase tracking-wider text-xs">
                Committee Member Evaluations:
              </h4>

              {reviews.filter((r) => r.applicationId === inspectApp.id).length === 0 ? (
                <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 text-center text-slate-500">
                  <p className="font-semibold">No reviewers have recorded scores for this proposal yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Scores and comments autosave continuously as reviewers complete their evaluation.</p>
                </div>
              ) : (
                reviews
                  .filter((r) => r.applicationId === inspectApp.id)
                  .map((rev) => (
                    <div
                      key={rev.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4 shadow-2xs"
                    >
                      {/* Reviewer Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-[#062A3D] text-sm">{rev.reviewerName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">({rev.reviewerEmail})</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {!rev.isVoting ? (
                              <span className="text-[10px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-semibold">
                                Non-Voting Observer
                              </span>
                            ) : (
                              <span className="text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full font-semibold">
                                Voting Reviewer
                              </span>
                            )}

                            {rev.recused ? (
                              <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-semibold">
                                Recused {rev.recusalReason ? `(${rev.recusalReason})` : ''}
                              </span>
                            ) : rev.isSubmitted ? (
                              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Officially Submitted & Locked
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full font-semibold">
                                Draft Saved (In Progress)
                              </span>
                            )}

                            {rev.flaggedForDiscussion && (
                              <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <Flag className="w-3 h-3 text-amber-600" /> Flagged for Committee Discussion
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-black text-[#062A3D]">
                            {rev.totalScore}
                          </span>
                          <span className="text-xs text-slate-400 font-bold"> / 100 pts</span>
                        </div>
                      </div>

                      {/* Criteria Scores & Comments Breakdown */}
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Rubric Criteria Answers & Justifications:
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {rubric.map((crit, idx) => {
                            const critScore = rev.scores?.[crit.id];
                            const critComment = rev.comments?.[crit.id];
                            return (
                              <div
                                key={crit.id}
                                className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1.5"
                              >
                                <div className="flex items-center justify-between font-bold text-[#062A3D]">
                                  <span>
                                    {idx + 1}. {crit.title}{' '}
                                    <span className="text-[10px] text-slate-400 font-normal">
                                      (Weight: {crit.weight}%)
                                    </span>
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-md font-extrabold ${
                                    critScore !== undefined
                                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                      : 'bg-slate-100 text-slate-400'
                                  }`}>
                                    {critScore !== undefined ? `${critScore} / 5` : 'Not Scored'}
                                  </span>
                                </div>
                                <div className="text-slate-600 bg-slate-50/70 p-2 rounded-lg border border-slate-100 text-[11px]">
                                  <span className="font-semibold text-slate-500">Written Comment: </span>
                                  {critComment ? (
                                    <span className="italic">"{critComment}"</span>
                                  ) : (
                                    <span className="italic text-slate-400">No comment entered yet</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {rev.generalFeedback && (
                        <div className="text-[11px] text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                          <span className="font-bold text-[#062A3D] block mb-1">General Reviewer Feedback:</span>
                          <span className="italic">"{rev.generalFeedback}"</span>
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectApp(null)}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Sheet Sync Modal */}
      {showGoogleSheetSync && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-emerald-100 text-emerald-800">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#062A3D] flex items-center gap-2">
                    <span>Google Sheet Sync — Cycle {programSettings.schoolYear}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Live
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Row order strictly follows sequential grant codes IGF2601, IGF2602…
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowGoogleSheetSync(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="font-semibold">Sheet Rows:</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-[#062A3D] font-bold">
                  {cycleSheetRows.length} applications
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const headers = [
                      'Grant Code',
                      'Applicant(s)',
                      'Campus',
                      'Title',
                      'Category',
                      'Area of Focus',
                      'Amount Requested',
                      'Amount Awarded',
                      'Status',
                      'Average Score',
                    ];
                    const tsv = [
                      headers.join('\t'),
                      ...cycleSheetRows.map((r) =>
                        [
                          r.grantCode,
                          r.applicants,
                          r.campus,
                          r.title,
                          r.category,
                          r.areaOfFocus,
                          r.amountRequested.toFixed(2),
                          r.amountAwarded.toFixed(2),
                          r.status,
                          typeof r.averageScore === 'number' ? r.averageScore.toFixed(1) : r.averageScore,
                        ].join('\t')
                      ),
                    ].join('\n');
                    navigator.clipboard.writeText(tsv);
                    setCopiedSheetData(true);
                    setTimeout(() => setCopiedSheetData(false), 2500);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 font-semibold text-slate-700 transition flex items-center gap-1.5 shadow-2xs"
                >
                  {copiedSheetData ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy for Google Sheet</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() =>
                    exportCycleSheetCsv(applications, avgScoresMap, applicantIdentities, programSettings.schoolYear)
                  }
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Download Sheet CSV</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 sticky top-0 border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-slate-200 w-12 text-center text-slate-400 font-mono">Row</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 font-bold text-[#062A3D]">Grant Code</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 font-bold text-[#062A3D]">Applicant</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 font-bold text-[#062A3D]">Campus</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 font-bold text-[#062A3D]">Title</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 font-bold text-[#062A3D]">Category</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 font-bold text-[#062A3D] text-right">Requested</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 font-bold text-[#062A3D] text-right">Awarded</th>
                    <th className="py-2.5 px-3 font-bold text-[#062A3D] text-center">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {cycleSheetRows.map((row, idx) => (
                    <tr key={row.grantCode} className="hover:bg-emerald-50/40">
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-400 text-[10px]">{idx + 1}</td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-[#062A3D] whitespace-nowrap">{row.grantCode}</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-800 whitespace-nowrap">{row.applicants}</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-700 whitespace-nowrap">{row.campus}</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-[#062A3D] font-medium max-w-xs truncate">{row.title}</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-600 whitespace-nowrap">{row.category}</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-semibold text-[#062A3D]">${row.amountRequested.toFixed(2)}</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-semibold text-emerald-700">${row.amountAwarded.toFixed(2)}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-[#062A3D]">{typeof row.averageScore === 'number' ? row.averageScore.toFixed(1) : row.averageScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowGoogleSheetSync(false)}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-Person Committee Meeting Mode */}
      {showInPersonMeeting && (
        <InPersonMeetingMode onClose={() => setShowInPersonMeeting(false)} />
      )}

      {/* Admin Eligibility Modal */}
      {eligibilityScreeningApp && (
        <AdminEligibilityModal
          application={eligibilityScreeningApp}
          onClose={() => setEligibilityScreeningApp(null)}
        />
      )}

      {/* Admin Assign Reviewers Modal */}
      {assigningApp && (
        <AdminAssignReviewersModal
          application={assigningApp}
          onClose={() => setAssigningApp(null)}
        />
      )}

      {/* Google Form Import Modal */}
      <GoogleFormImportModal
        isOpen={showGoogleFormImport}
        onClose={() => setShowGoogleFormImport(false)}
      />

      {/* Bulk Decisions Release Modal */}
      {showBulkDecisionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800">
                  <Mail className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#062A3D]">
                    Release Committee Decisions in Bulk
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dispatches official branded email notices with grant codes, awarded amounts, and committee feedback.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkDecisionsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Decision Summary & Selection Controls */}
            {(() => {
              const decidedApps = applications.filter((a) =>
                ['Funded', 'Partially Funded', 'Not Funded'].includes(a.status)
              );
              const unreleasedCount = decidedApps.filter((a) => !a.decisionEmailSentAt).length;

              return (
                <div className="space-y-4 flex-1 overflow-hidden flex flex-col text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-slate-500 font-semibold">Decisions Recorded:</span>
                        <div className="text-base font-bold text-[#062A3D]">{decidedApps.length}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold">Unreleased Notices:</span>
                        <div className="text-base font-bold text-amber-700">{unreleasedCount}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold">Selected for Dispatch:</span>
                        <div className="text-base font-bold text-emerald-700">
                          {selectedAppIdsForBulk.length}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const unnotified = decidedApps
                            .filter((a) => !a.decisionEmailSentAt)
                            .map((a) => a.id);
                          setSelectedAppIdsForBulk(unnotified);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 font-semibold text-slate-700"
                      >
                        Select Unreleased ({unreleasedCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedAppIdsForBulk.length === decidedApps.length) {
                            setSelectedAppIdsForBulk([]);
                          } else {
                            setSelectedAppIdsForBulk(decidedApps.map((a) => a.id));
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 font-semibold text-slate-700"
                      >
                        {selectedAppIdsForBulk.length === decidedApps.length
                          ? 'Deselect All'
                          : 'Select All'}
                      </button>
                    </div>
                  </div>

                  {/* List of Applications with Decisions */}
                  <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100">
                    {decidedApps.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        No applications currently have a decision recorded. Record awards first.
                      </div>
                    ) : (
                      decidedApps.map((app) => {
                        const identity = applicantIdentities[app.id];
                        const email = identity?.applicantEmail || 'No email on file';
                        const isSelected = selectedAppIdsForBulk.includes(app.id);
                        const alreadySent = Boolean(app.decisionEmailSentAt);

                        return (
                          <div
                            key={app.id}
                            className={`p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition cursor-pointer select-none ${
                              isSelected ? 'bg-emerald-50/40' : ''
                            }`}
                            onClick={() => {
                              setSelectedAppIdsForBulk((prev) =>
                                isSelected ? prev.filter((id) => id !== app.id) : [...prev, app.id]
                              );
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}} // handled by row click
                                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-[#062A3D] text-xs">
                                    {app.grantCode}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                      app.status === 'Funded'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : app.status === 'Partially Funded'
                                        ? 'bg-teal-100 text-teal-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {app.status}
                                  </span>
                                  {alreadySent && (
                                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                      <CheckCircle2 className="w-2.5 h-2.5" />
                                      <span>Already Dispatched</span>
                                    </span>
                                  )}
                                </div>
                                <div className="font-semibold text-slate-900 truncate max-w-md mt-0.5">
                                  {app.title}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Recipient: {email} • {identity?.campus || 'District Campus'}
                                </div>
                              </div>
                            </div>

                            <div className="text-right whitespace-nowrap">
                              <div className="font-bold text-[#062A3D]">
                                ${((app.status === 'Not Funded' ? 0 : app.awardedAmount) || app.amountRequested || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </div>
                              <div className="text-[10px] text-slate-400">Awarded</div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
                    <span className="text-[11px] text-slate-500">
                      Dispatches official branded email template. Deduplicated automatically (never sends twice).
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowBulkDecisionsModal(false)}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        disabled={selectedAppIdsForBulk.length === 0 || isDispatchingBulk}
                        onClick={async () => {
                          setIsDispatchingBulk(true);
                          try {
                            const decisionsPayload = selectedAppIdsForBulk.map((id) => {
                              const a = applications.find((app) => app.id === id)!;
                              const identity = applicantIdentities[id];
                              return {
                                applicationId: a.id,
                                grantCode: a.grantCode,
                                title: a.title,
                                applicantEmail: identity?.applicantEmail || '',
                                applicantName:
                                  identity?.applicantNames?.[0]?.name ||
                                  'Applicant',
                                decision: a.status,
                                amountRequested: a.amountRequested || 0,
                                amountAwarded: a.awardedAmount || 0,
                                feedback: a.committeeFeedback || '',
                              };
                            });

                            const report = await executeBulkDecisions(decisionsPayload);
                            setShowBulkDecisionsModal(false);
                            setBulkReport(report);
                          } catch (err: any) {
                            alert(err?.message || 'Error releasing bulk decisions.');
                          } finally {
                            setIsDispatchingBulk(false);
                          }
                        }}
                        className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isDispatchingBulk ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Dispatching Notices...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 text-emerald-200" />
                            <span>Dispatch {selectedAppIdsForBulk.length} Decision Emails</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Bulk Decisions Results Report Modal */}
      {bulkReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#062A3D]">
                    Bulk Decision Dispatch Report
                  </h3>
                  <p className="text-xs text-slate-500">
                    Execution summary and delivery logging audit
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBulkReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs text-center">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Delivered</span>
                <span className="text-xl font-extrabold text-emerald-700">{bulkReport.sent}</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Skipped</span>
                <span className="text-xl font-extrabold text-amber-700">
                  {bulkReport.skipped.length}
                </span>
              </div>
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Failed</span>
                <span className="text-xl font-extrabold text-rose-700">{bulkReport.failed}</span>
              </div>
            </div>

            {bulkReport.skipped.length > 0 && (
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-slate-800">Skipped Proposals (Deduplicated):</h4>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {bulkReport.skipped.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between gap-2 text-[11px]">
                      <div>
                        <span className="font-mono font-bold text-[#062A3D]">{item.grantCode}:</span>{' '}
                        <span className="text-slate-700">{item.title}</span>
                      </div>
                      <span className="text-slate-500 italic whitespace-nowrap text-[10px]">
                        {item.reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
              Every dispatched email is logged to <strong className="text-[#062A3D]">sent_emails</strong> with recipient, subject, and delivery confirmation.
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setBulkReport(null)}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-[#062A3D] text-white hover:bg-[#0A3D59]"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
