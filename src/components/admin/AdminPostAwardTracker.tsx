import React, { useState, useMemo } from 'react';
import { useGrant } from '../../context/GrantContext';
import { Application, FinalReportData } from '../../types/grant';
import {
  DollarSign,
  CheckCircle2,
  Clock,
  Calendar,
  FileCheck,
  AlertCircle,
  CreditCard,
  Download,
  Search,
  ExternalLink,
  X,
  FileText,
  Building,
  User,
  Sparkles,
} from 'lucide-react';
import { AdminCheckDisbursementModal } from './AdminCheckDisbursementModal';

export const AdminPostAwardTracker: React.FC = () => {
  const { applications, updateApplicationStatus, programSettings } = useGrant();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCheck, setFilterCheck] = useState<'all' | 'sent' | 'pending'>('all');
  const [filterPO, setFilterPO] = useState<'all' | 'submitted' | 'pending'>('all');
  const [filterReport, setFilterReport] = useState<'all' | 'submitted' | 'pending'>('all');

  // Modals
  const [disbursementApp, setDisbursementApp] = useState<Application | null>(null);
  const [inspectReportApp, setInspectReportApp] = useState<Application | null>(null);

  // Awarded applications (Funded or Partially Funded or Complete)
  const awardedApplications = useMemo(() => {
    return applications.filter(
      (a) =>
        a.status === 'Funded' ||
        a.status === 'Partially Funded' ||
        a.status === 'Final Report Due' ||
        a.status === 'Complete'
    );
  }, [applications]);

  const filteredApps = useMemo(() => {
    return awardedApplications.filter((a) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.campus.toLowerCase().includes(q) ||
        (a.grantCode && a.grantCode.toLowerCase().includes(q)) ||
        a.applicantNames.some((n) => n.name.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (filterCheck === 'sent' && !a.checkSent) return false;
      if (filterCheck === 'pending' && a.checkSent) return false;

      if (filterPO === 'submitted' && !a.poSubmittedAt) return false;
      if (filterPO === 'pending' && a.poSubmittedAt) return false;

      if (filterReport === 'submitted' && !a.finalReport) return false;
      if (filterReport === 'pending' && a.finalReport) return false;

      return true;
    });
  }, [awardedApplications, searchQuery, filterCheck, filterPO, filterReport]);

  // Aggregate metrics
  const totalAwarded = awardedApplications.reduce(
    (sum, a) => sum + (a.awardedAmount || a.amountRequested || 0),
    0
  );
  const totalDisbursed = awardedApplications.reduce(
    (sum, a) => sum + (a.checkSent ? a.checkAmount || a.awardedAmount || a.amountRequested || 0 : 0),
    0
  );
  const poReportedCount = awardedApplications.filter((a) => a.poSubmittedAt).length;
  const eventScheduledCount = awardedApplications.filter((a) => a.eventDate).length;
  const finalReportsCompleted = awardedApplications.filter((a) => a.finalReport || a.status === 'Complete').length;

  const handleApproveFinalReport = async (app: Application) => {
    await updateApplicationStatus(
      app.id,
      'Complete',
      `Admin approved final grant report and confirmed student outcomes.`
    );
    setInspectReportApp(null);
  };

  const handleExportPostAwardCsv = () => {
    const headers = [
      'Grant Code',
      'Title',
      'Teacher',
      'Campus',
      'Awarded Amount',
      'Check Sent',
      'Check Number',
      'Check Date',
      'PO Reported',
      'PO Date',
      'Event Date',
      'Final Report Status',
      'Actual Students Impacted',
    ];

    const rows = awardedApplications.map((a) => [
      `"${a.grantCode || a.id}"`,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.applicantNames[0]?.name || ''}"`,
      `"${a.campus}"`,
      a.awardedAmount || a.amountRequested || 0,
      a.checkSent ? 'YES' : 'NO',
      `"${a.checkNumber || ''}"`,
      `"${a.checkSentAt ? a.checkSentAt.slice(0, 10) : ''}"`,
      a.poSubmittedAt ? 'YES' : 'NO',
      `"${a.poSubmittedAt ? a.poSubmittedAt.slice(0, 10) : ''}"`,
      `"${a.eventDate || ''}"`,
      a.status === 'Complete' ? 'APPROVED' : a.finalReport ? 'SUBMITTED' : 'PENDING',
      a.finalReport?.actualStudentImpact || a.studentsImpacted || 0,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `NEF_PostAward_Tracking_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            Total Funds Awarded
          </div>
          <div className="text-xl font-extrabold text-[#062A3D] mt-1">
            ${totalAwarded.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Across {awardedApplications.length} approved educator proposals
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            Checks Disbursed
          </div>
          <div className="text-xl font-extrabold text-emerald-800 mt-1">
            ${totalDisbursed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
            {awardedApplications.filter((a) => a.checkSent).length} of {awardedApplications.length} checks sent to campuses
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            POs & Events Tracked
          </div>
          <div className="text-xl font-extrabold text-[#062A3D] mt-1">
            {poReportedCount} POs • {eventScheduledCount} Events
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Purchases & classroom showcase dates logged
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            Final Reports
          </div>
          <div className="text-xl font-extrabold text-[#062A3D] mt-1">
            {finalReportsCompleted} Completed
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Spending deadline: {programSettings.spendingDeadlineDate || 'May 26, 2028'}
          </div>
        </div>
      </div>

      {/* Filter and Export Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, teacher, title, campus..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
            />
          </div>

          <select
            value={filterCheck}
            onChange={(e) => setFilterCheck(e.target.value as any)}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 bg-slate-50 text-slate-700"
          >
            <option value="all">All Check Statuses</option>
            <option value="sent">Checks Sent Only</option>
            <option value="pending">Checks Pending Only</option>
          </select>

          <select
            value={filterPO}
            onChange={(e) => setFilterPO(e.target.value as any)}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 bg-slate-50 text-slate-700"
          >
            <option value="all">All PO Statuses</option>
            <option value="submitted">PO Reported</option>
            <option value="pending">Awaiting PO</option>
          </select>

          <select
            value={filterReport}
            onChange={(e) => setFilterReport(e.target.value as any)}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 bg-slate-50 text-slate-700"
          >
            <option value="all">All Final Reports</option>
            <option value="submitted">Report Submitted</option>
            <option value="pending">Report Pending</option>
          </select>
        </div>

        <button
          onClick={handleExportPostAwardCsv}
          className="px-3.5 py-2 rounded-xl font-bold text-xs bg-[#062A3D] text-white hover:bg-[#0A3D59] transition flex items-center gap-1.5 shadow-xs whitespace-nowrap self-end md:self-center"
        >
          <Download className="w-3.5 h-3.5 text-[#8CC8E8]" />
          <span>Export Post-Award CSV</span>
        </button>
      </div>

      {/* Post-Award Application Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#062A3D] text-white uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold">Grant Code</th>
                <th className="py-3 px-4 font-bold">Proposal & Educator</th>
                <th className="py-3 px-4 font-bold">Awarded Amount</th>
                <th className="py-3 px-4 font-bold">Check Disbursement</th>
                <th className="py-3 px-4 font-bold">PO Status</th>
                <th className="py-3 px-4 font-bold">Project Event</th>
                <th className="py-3 px-4 font-bold">Final Report</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No matching awarded applications found.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-[#062A3D] whitespace-nowrap">
                      <span className="font-mono px-2 py-0.5 rounded bg-[#062A3D] text-[#8CC8E8] text-[11px]">
                        {app.grantCode || app.id}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-[#062A3D] truncate">{app.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {app.applicantNames[0]?.name} • {app.campus}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-emerald-800 whitespace-nowrap">
                      ${(app.awardedAmount || app.amountRequested || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Check Sent */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {app.checkSent ? (
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Check #{app.checkNumber}</span>
                          </span>
                          <div className="text-[10px] text-slate-400">
                            {app.checkSentAt ? new Date(app.checkSentAt).toLocaleDateString() : 'Disbursed'}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDisbursementApp(app)}
                          className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1 shadow-2xs"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Mark Check Sent</span>
                        </button>
                      )}
                    </td>

                    {/* PO Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {app.poSubmittedAt ? (
                        <span className="text-[10px] font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-sky-600" />
                          <span>Reported {new Date(app.poSubmittedAt).toLocaleDateString()}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          Pending PO
                        </span>
                      )}
                    </td>

                    {/* Event Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {app.eventDate ? (
                        <span className="text-[10px] font-semibold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                          <Calendar className="w-3 h-3 text-purple-600" />
                          <span>{app.eventDate}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Not Scheduled</span>
                      )}
                    </td>

                    {/* Final Report */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {app.status === 'Complete' ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Report Approved</span>
                        </span>
                      ) : app.finalReport ? (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                          <FileCheck className="w-3 h-3 text-amber-600" />
                          <span>Needs Review</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          Due by {programSettings.spendingDeadlineDate || 'May 2028'}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                      {app.finalReport && (
                        <button
                          onClick={() => setInspectReportApp(app)}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition"
                        >
                          View Report
                        </button>
                      )}

                      {!app.checkSent && (
                        <button
                          onClick={() => setDisbursementApp(app)}
                          className="px-2 py-1 rounded-md text-[11px] text-slate-600 hover:text-slate-900 transition"
                        >
                          Disburse
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Check Disbursement Modal */}
      {disbursementApp && (
        <AdminCheckDisbursementModal
          application={disbursementApp}
          onClose={() => setDisbursementApp(null)}
        />
      )}

      {/* Inspect Final Report Modal */}
      {inspectReportApp && inspectReportApp.finalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-[#062A3D] text-[#8CC8E8] text-xs">
                    {inspectReportApp.grantCode || inspectReportApp.id}
                  </span>
                  <h3 className="text-base font-bold text-[#062A3D]">
                    Final Grant Outcomes Report
                  </h3>
                </div>
                <p className="text-slate-500 mt-0.5">
                  Submitted by {inspectReportApp.applicantNames[0]?.name} ({inspectReportApp.campus})
                </p>
              </div>
              <button
                onClick={() => setInspectReportApp(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
              <div className="font-bold text-emerald-900">
                Actual Student Impact: {inspectReportApp.finalReport.actualStudentImpact} students reached
              </div>
              <div className="text-[11px] text-emerald-800">
                Grant award: ${(inspectReportApp.awardedAmount || inspectReportApp.amountRequested || 0).toFixed(2)}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-slate-800">Outcomes vs Project Objectives:</h4>
                <p className="text-slate-600 mt-1 whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {inspectReportApp.finalReport.outcomesVsObjectives}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800">Summary of Key Learnings & Student Engagement:</h4>
                <p className="text-slate-600 mt-1 whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {inspectReportApp.finalReport.summaryOfLearnings}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800">Receipt Accounting & Spending Reconciliation:</h4>
                <p className="text-slate-600 mt-1 whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {inspectReportApp.finalReport.receiptNotes}
                </p>
              </div>

              {inspectReportApp.finalReport.photoDescription && (
                <div>
                  <h4 className="font-bold text-slate-800">Classroom Photos / Showcase Narrative:</h4>
                  <p className="text-slate-600 mt-1 whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {inspectReportApp.finalReport.photoDescription}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Submitted on {new Date(inspectReportApp.finalReport.submittedAt).toLocaleDateString()}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setInspectReportApp(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
                {inspectReportApp.status !== 'Complete' && (
                  <button
                    type="button"
                    onClick={() => handleApproveFinalReport(inspectReportApp)}
                    className="px-4 py-2 font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Report & Mark Complete</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
