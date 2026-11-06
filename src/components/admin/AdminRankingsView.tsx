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
  Search,
  FileSpreadsheet,
  Copy,
  Check,
  Hash,
  Presentation,
  ClipboardCheck,
  CreditCard,
  UserCheck,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import {
  buildCycleSheetRows,
  exportCycleSheetCsv,
  SheetRowData,
} from '../../utils/grantCodeUtils';
import { InPersonMeetingMode } from './InPersonMeetingMode';
import { AdminEligibilityModal } from './AdminEligibilityModal';
import { AdminAssignReviewersModal } from './AdminAssignReviewersModal';
import { AdminPostAwardTracker } from './AdminPostAwardTracker';

export const AdminRankingsView: React.FC = () => {
  const {
    applications,
    reviews,
    programSettings,
    updateApplicationStatus,
    sendMoreInfoRequest,
    resetToGoogleSheetData,
  } = useGrant();

  // Sub-navigation: Rankings vs Post-Award Tracking
  const [adminActiveSubTab, setAdminActiveSubTab] = useState<'rankings' | 'post-award'>('rankings');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFocus, setSelectedFocus] = useState<string>('all');
  const [selectedCampus, setSelectedCampus] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'amount' | 'students'>('score');

  // Modals state: Eligibility screening, Assign reviewers, Meeting mode, Google Sheet Sync
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

      // Disagreement check: If any individual criterion has reviewers 2 or more points apart
      // (or overall score difference >= 10 pts)
      let hasDisagreement = false;
      const criterionGaps: Record<string, number> = {};

      if (votingReviews.length >= 2) {
        // Collect criterion IDs across reviews
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

      // Tie-breaker metrics: 1. Student impact, 2. Sustainability score average
      const sustainabilityScores = votingReviews
        .map((r) => r.scores?.['crit-sustainability'] ?? r.scores?.['crit-7'] ?? 3)
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
      };
    });
  }, [applications, reviews]);

  // Running totals: Requested, Awarded, and Remaining Funds ($52,000 pool)
  const totalRequestedFunds = useMemo(() => {
    return applications.reduce((sum, a) => {
      // Include all submitted, under review, and decided applications
      if (a.status !== 'Draft') {
        return sum + (a.amountRequested || 0);
      }
      return sum;
    }, 0);
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

  // Count awards per campus to assist with Tie-Breaker 3: Spreading awards across campuses
  const campusAwardCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach((a) => {
      if (a.status === 'Funded' || a.status === 'Partially Funded') {
        counts[a.campus] = (counts[a.campus] || 0) + 1;
      }
    });
    return counts;
  }, [applications]);

  const avgScoresMap = useMemo(() => {
    const map: Record<string, number> = {};
    appStats.forEach(({ app, avgScore }) => {
      map[app.id] = avgScore;
    });
    return map;
  }, [appStats]);

  const cycleSheetRows: SheetRowData[] = useMemo(() => {
    return buildCycleSheetRows(applications, avgScoresMap);
  }, [applications, avgScoresMap]);

  // Filter and sort applications with official tie-breakers:
  // 1. Total Weighted Score
  // Tie-breaker 1: Student Impact (studentsImpacted)
  // Tie-breaker 2: Sustainability Score
  // Tie-breaker 3: Spreading awards across campuses (campuses with fewer awards prioritized)
  const filteredRankings = useMemo(() => {
    return appStats
      .filter(({ app }) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchCode = app.grantCode?.toLowerCase().includes(q);
          const matchId = app.id.toLowerCase().includes(q);
          const matchTitle = app.title.toLowerCase().includes(q);
          const matchCampus = app.campus.toLowerCase().includes(q);
          const matchApplicant =
            app.applicantNames.some((n) => n.name.toLowerCase().includes(q)) ||
            app.applicantEmail.toLowerCase().includes(q);

          if (!matchCode && !matchId && !matchTitle && !matchCampus && !matchApplicant) {
            return false;
          }
        }
        if (selectedCategory !== 'all' && app.category !== selectedCategory) return false;
        if (selectedFocus !== 'all' && app.areaOfFocus !== selectedFocus) return false;
        if (selectedCampus !== 'all' && app.campus !== selectedCampus) return false;
        if (selectedStatus !== 'all' && app.status !== selectedStatus) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score') {
          if (b.avgScore !== a.avgScore) {
            return b.avgScore - a.avgScore;
          }
          // Tie-breaker 1: Student Impact
          if (b.app.studentsImpacted !== a.app.studentsImpacted) {
            return b.app.studentsImpacted - a.app.studentsImpacted;
          }
          // Tie-breaker 2: Sustainability score
          if (b.avgSustainability !== a.avgSustainability) {
            return b.avgSustainability - a.avgSustainability;
          }
          // Tie-breaker 3: Spreading awards across campuses
          const aCampusAwards = campusAwardCounts[a.app.campus] || 0;
          const bCampusAwards = campusAwardCounts[b.app.campus] || 0;
          return aCampusAwards - bCampusAwards;
        }
        if (sortBy === 'amount') return b.app.amountRequested - a.app.amountRequested;
        if (sortBy === 'students') return b.app.studentsImpacted - a.app.studentsImpacted;
        return 0;
      });
  }, [
    appStats,
    searchQuery,
    selectedCategory,
    selectedFocus,
    selectedCampus,
    selectedStatus,
    sortBy,
    campusAwardCounts,
  ]);

  // Export applications and final grant scores to CSV
  const handleExportCSV = () => {
    const headers = [
      'Rank',
      'Grant Code',
      'Application ID',
      'Title',
      'Campus',
      'Category',
      'Area of Focus',
      'Lead Applicant',
      'Co-Applicants',
      'Applicant Email',
      'Amount Requested',
      'Amount Awarded',
      'Students Impacted',
      'Eligibility Gate',
      'Status',
      'Voting Reviewers Count',
      'Average Score (out of 100)',
      'Disagreement Flag',
      'Sustainability Score',
      'Check Sent',
      'Check Number',
      'PO Reported',
      'Showcase Event Date',
      'Committee Feedback',
    ];

    const rows = filteredRankings.map((stat, idx) => {
      const { app, avgScore, reviewCount, hasDisagreement, avgSustainability } = stat;
      const coApplicants = (app.applicantNames || []).slice(1).map((n) => n.name).join('; ');
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
        `"${app.campus.replace(/"/g, '""')}"`,
        `"${app.category}"`,
        `"${(app.areaOfFocus + (app.areaOfFocusOther ? ` (${app.areaOfFocusOther})` : '')).replace(/"/g, '""')}"`,
        `"${(app.applicantNames[0]?.name || '').replace(/"/g, '""')}"`,
        `"${coApplicants.replace(/"/g, '""')}"`,
        `"${app.applicantEmail}"`,
        (app.amountRequested || 0).toFixed(2),
        (app.awardedAmount || 0).toFixed(2),
        app.studentsImpacted || 0,
        `"${eligibilityStatus}"`,
        `"${app.status}"`,
        reviewCount,
        avgScore > 0 ? avgScore.toFixed(1) : '—',
        hasDisagreement ? 'FLAGGED (≥2pt gap)' : 'CONSENSUS',
        avgSustainability > 0 ? avgSustainability.toFixed(1) : '—',
        app.checkSent ? 'YES' : 'NO',
        `"${app.checkNumber || ''}"`,
        app.poSubmittedAt ? 'YES' : 'NO',
        `"${app.eventDate || ''}"`,
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#062A3D]">Grant Rankings & Committee Decisions</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
              100-Pt Matrix
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Scores averaged from voting reviewers. Flagged when reviewers differ by ≥2 pts on any criterion.
            Tie-breakers applied in order: <strong>1. Student impact</strong>, <strong>2. Sustainability</strong>, <strong>3. Spreading awards across NISD campuses</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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
            <span>Export to CSV</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation: Rankings & Decisions vs Post-Award Tracking */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setAdminActiveSubTab('rankings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            adminActiveSubTab === 'rankings'
              ? 'bg-[#062A3D] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#8CC8E8]" />
          <span>Rankings & Committee Decisions</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminActiveSubTab('post-award')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            adminActiveSubTab === 'post-award'
              ? 'bg-[#062A3D] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-4 h-4 text-[#8CC8E8]" />
          <span>Post-Award Tracking (Checks, POs, Events & Reports)</span>
        </button>
      </div>

      {adminActiveSubTab === 'post-award' ? (
        <AdminPostAwardTracker />
      ) : (
        <>
          {/* Funds Running Total: Total Available ($52k), Total Requested, Total Awarded, Remaining */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">
              Cycle Grant Pool Tracker ({programSettings.schoolYear})
            </div>
            <div className="text-xl font-extrabold text-[#062A3D] mt-0.5">
              ${programSettings.availableFunds.toLocaleString()} Total Funds Available
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

        {/* 3 Running Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              Total Funds Requested
            </span>
            <div className="text-lg font-bold text-[#062A3D] mt-1">
              ${totalRequestedFunds.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Across all submitted teacher proposals
            </div>
          </div>

          <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-100">
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
            className={`p-4 rounded-xl border ${
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
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search by grant code, title, teacher, campus */}
          <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search code (e.g. IGF2601), title, teacher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#062A3D]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
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

          <button
            onClick={handleExportCSV}
            className="ml-2 px-3 py-1.5 rounded-lg font-bold text-xs bg-[#062A3D] text-white hover:bg-[#0A3D59] transition flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
            title="Download CSV of final grant scores and application details"
          >
            <Download className="w-3.5 h-3.5 text-[#8CC8E8]" />
            <span>Export to CSV</span>
          </button>
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
                <th className="py-3.5 px-4 font-bold">Eligibility Gate</th>
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm">#{idx + 1}</span>
                        {app.grantCode && (
                          <span className="px-1.5 py-0.5 rounded bg-[#062A3D] text-[#8CC8E8] font-mono font-bold text-[11px] tracking-wide">
                            {app.grantCode}
                          </span>
                        )}
                      </div>
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
                      <div className="flex items-center gap-1.5">
                        <span>${(app.amountRequested || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        {(app.amountRequested || 0) >= (programSettings.notifications?.largeRequestThreshold ?? 6000) && (
                          <span
                            title={`Large request alert: $${(app.amountRequested || 0).toLocaleString()} meets or exceeds large request threshold ($${(programSettings.notifications?.largeRequestThreshold ?? 6000).toLocaleString()})`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Large request</span>
                          </span>
                        )}
                      </div>
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
                        <span className="text-[10px] text-slate-400">/100</span>

                        {hasDisagreement && (
                          <span
                            title="Reviewers are 2 or more points apart on at least one criterion. Discuss as committee before deciding."
                            className="p-1 rounded bg-amber-100 text-amber-800 flex items-center gap-1 text-[10px] font-bold"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>≥2pt gap</span>
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                      <span className="font-semibold">{reviewCount}</span> voting
                    </td>

                    {/* Eligibility Gate status */}
                    <td className="py-4 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {app.adminEligibility?.passed ? (
                        <button
                          onClick={() => setEligibilityScreeningApp(app)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200 transition"
                          title="All 5 gates verified. Click to inspect or re-check."
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Passed</span>
                        </button>
                      ) : app.adminEligibility && !app.adminEligibility.passed ? (
                        <button
                          onClick={() => setEligibilityScreeningApp(app)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition"
                          title="Fixable paperwork issues flagged. Click to review or send More Info Needed."
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Fixes Needed</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setEligibilityScreeningApp(app)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition"
                          title="Screen 5 baseline eligibility criteria before reviewer scoring."
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
                            : app.status === 'More Info Needed'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>

                    <td
                      className="py-4 px-4 text-right whitespace-nowrap space-x-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setEligibilityScreeningApp(app)}
                        className="px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition"
                        title="Screen 5 eligibility criteria before reviewer scoring"
                      >
                        Eligibility
                      </button>

                      <button
                        onClick={() => setAssigningApp(app)}
                        className="px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        title="Assign specific reviewers or all committee members"
                      >
                        Assign
                      </button>

                      <button
                        onClick={() => {
                          setInquiryApp(app);
                          setInquiryQuestion(
                            app.moreInfoQuestion ||
                              'Please provide clarification regarding your budget line item pricing and warranty.'
                          );
                        }}
                        className="px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      >
                        Ask Info
                      </button>

                      <button
                        onClick={() => handleOpenDecision(app)}
                        className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#8CC8E8] hover:bg-[#a0d4ef] text-[#062A3D] transition shadow-xs"
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
        </>
      )}

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
                          {rev.totalScore} / 100 pts ({rev.percentageScore}%)
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

      {/* Google Sheet Sync Modal */}
      {showGoogleSheetSync && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#062A3D] flex items-center gap-2">
                    <span>Google Sheet Sync — Cycle {programSettings.schoolYear}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Live Synced
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    One row per submitted application in grant-code sequence order (Row 1 = first application below header).
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
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="font-semibold">Cycle Sheet Table:</span>
                <code className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-[#062A3D] font-bold">
                  NEF_Grants_{programSettings.cycleProgramCode || 'IG'}{programSettings.cycleSeasonCode || 'F'}{programSettings.cycleTwoDigitYear || '26'}
                </code>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600">{cycleSheetRows.length} applications in sequence</span>
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
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 font-semibold text-slate-700 transition flex items-center gap-1.5 shadow-2xs"
                >
                  {copiedSheetData ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied to Clipboard!</span>
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
                    exportCycleSheetCsv(applications, avgScoresMap, programSettings.schoolYear)
                  }
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Download Google Sheet CSV</span>
                </button>

                <button
                  onClick={async () => {
                    await resetToGoogleSheetData();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold transition flex items-center gap-1.5 shadow-2xs"
                  title="Reload authentic Google Sheet grant applications and committee records"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-blue-200" />
                  <span>Reload Sheet Data</span>
                </button>
              </div>
            </div>

            {/* Google Sheet Formatted Table View */}
            <div className="flex-1 overflow-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 sticky top-0 border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-slate-200 w-12 text-center text-slate-400 font-mono">
                      Row
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-200 font-bold text-[#062A3D]">
                      Grant Code
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-200 font-bold text-[#062A3D]">
                      Applicant(s)
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-200 font-bold text-[#062A3D]">
                      Campus
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-200 font-bold text-[#062A3D]">
                      Title
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-200 font-bold text-[#062A3D]">
                      Category
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-200 font-bold text-[#062A3D]">
                      Area of Focus
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-200 font-bold text-[#062A3D] text-right">
                      Amount Requested
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-200 font-bold text-[#062A3D] text-right">
                      Amount Awarded
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-200 font-bold text-[#062A3D]">
                      Status
                    </th>
                    <th className="py-2.5 px-3 font-bold text-[#062A3D] text-center">
                      Average Score
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {cycleSheetRows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">
                        No applications submitted yet for this cycle. Grant codes are automatically assigned on submit.
                      </td>
                    </tr>
                  ) : (
                    cycleSheetRows.map((row, idx) => (
                      <tr key={row.grantCode} className="hover:bg-emerald-50/40">
                        <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-400 text-[10px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-[#062A3D] whitespace-nowrap">
                          {row.grantCode}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-slate-800 whitespace-nowrap">
                          {row.applicants}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-slate-700 whitespace-nowrap">
                          {row.campus}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-[#062A3D] font-medium max-w-xs truncate">
                          {row.title}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-slate-600 whitespace-nowrap">
                          {row.category}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-slate-600 whitespace-nowrap">
                          {row.areaOfFocus}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-semibold text-[#062A3D]">
                          ${row.amountRequested.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-semibold text-emerald-700">
                          ${row.amountAwarded.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-[#062A3D]">
                          {typeof row.averageScore === 'number' ? row.averageScore.toFixed(1) : row.averageScore}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                Grant codes follow <code className="font-mono text-slate-700">[Program][Season][YY][Line]</code>. Assigned on submit, immutable, never reused.
              </span>
              <button
                onClick={() => setShowGoogleSheetSync(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-Person Committee Meeting Mode (Projector Screen) */}
      {showInPersonMeeting && (
        <InPersonMeetingMode onClose={() => setShowInPersonMeeting(false)} />
      )}

      {/* Admin Baseline Eligibility Screening Modal */}
      {eligibilityScreeningApp && (
        <AdminEligibilityModal
          application={eligibilityScreeningApp}
          onClose={() => setEligibilityScreeningApp(null)}
          onSendMoreInfo={(app, prefilled) => {
            setInquiryApp(app);
            setInquiryQuestion(prefilled);
          }}
        />
      )}

      {/* Reviewer Assignment Modal (Default: All Reviewers) */}
      {assigningApp && (
        <AdminAssignReviewersModal
          application={assigningApp}
          onClose={() => setAssigningApp(null)}
        />
      )}
    </div>
  );
};
