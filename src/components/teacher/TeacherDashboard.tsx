import React, { useState } from 'react';
import { useGrant } from '../../context/GrantContext';
import { Application, ApplicationStatus, FinalReportData } from '../../types/grant';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Building,
  DollarSign,
  Calendar,
  MessageSquare,
  Award,
  Eye,
  Check,
  Upload,
} from 'lucide-react';

interface TeacherDashboardProps {
  onStartNewApplication: () => void;
  onEditApplication: (appId: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onStartNewApplication,
  onEditApplication,
}) => {
  const {
    currentUser,
    applications,
    programSettings,
    respondToMoreInfo,
    submitFinalReport,
    simulatePrincipalApproval,
    timelineEvents,
    userPendingFinalReport,
  } = useGrant();

  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  // Inquiry response state
  const [inquiryText, setInquiryText] = useState<{ [appId: string]: string }>({});
  const [submittingInquiry, setSubmittingInquiry] = useState<{ [appId: string]: boolean }>({});

  // Final report modal state
  const [activeReportApp, setActiveReportApp] = useState<Application | null>(null);
  const [reportData, setReportData] = useState<FinalReportData>({
    outcomesVsObjectives: '',
    actualStudentImpact: 0,
    summaryOfLearnings: '',
    receiptNotes: '',
    photoDescription: '',
    submittedAt: '',
  });

  // Filter applications for current teacher
  const myApplications = applications.filter(
    (a) =>
      a.applicantEmail.toLowerCase() === currentUser.email.toLowerCase() ||
      a.applicantNames.some(
        (m) => m.email.toLowerCase() === currentUser.email.toLowerCase()
      )
  );

  const statusOrder: ApplicationStatus[] = [
    'Draft',
    'Submitted',
    'Principal Approval',
    'Under Review',
    'More Info Needed',
    'Funded',
    'Final Report Due',
    'Complete',
  ];

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'Funded':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Partially Funded':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Not Funded':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'More Info Needed':
        return 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse';
      case 'Under Review':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Principal Approval':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Complete':
        return 'bg-emerald-200 text-emerald-900 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleInquiryReply = async (appId: string) => {
    const text = inquiryText[appId]?.trim();
    if (!text) return;

    setSubmittingInquiry((prev) => ({ ...prev, [appId]: true }));
    try {
      await respondToMoreInfo(appId, text);
      setInquiryText((prev) => ({ ...prev, [appId]: '' }));
    } finally {
      setSubmittingInquiry((prev) => ({ ...prev, [appId]: false }));
    }
  };

  const handleOpenFinalReport = (app: Application) => {
    setActiveReportApp(app);
    setReportData({
      outcomesVsObjectives: app.finalReport?.outcomesVsObjectives || '',
      actualStudentImpact: app.finalReport?.actualStudentImpact || app.studentsImpacted || 0,
      summaryOfLearnings: app.finalReport?.summaryOfLearnings || '',
      receiptNotes: app.finalReport?.receiptNotes || 'All items purchased via NISD purchase orders.',
      photoDescription: app.finalReport?.photoDescription || 'Student photos documented on classroom bulletin.',
      submittedAt: new Date().toISOString(),
    });
  };

  const handleSubmitReport = async () => {
    if (!activeReportApp) return;
    await submitFinalReport(activeReportApp.id, reportData);
    setActiveReportApp(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header and Program Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#062A3D]">Teacher Grant Dashboard</h1>
          <p className="text-xs text-slate-600 mt-1">
            Track your proposals, review feedback, and submit final reports for Nacogdoches ISD Education Foundation grants.
          </p>
        </div>

        <button
          onClick={onStartNewApplication}
          disabled={userPendingFinalReport}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs text-[#062A3D] bg-[#8CC8E8] hover:bg-[#a0d4ef] shadow-sm transition flex items-center gap-2 ${
            userPendingFinalReport ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <FileText className="w-4 h-4 text-[#062A3D]" />
          <span>{userPendingFinalReport ? 'Submit Final Report First' : 'Start New Application'}</span>
        </button>
      </div>

      {/* Pending Final Report Alert */}
      {userPendingFinalReport && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm text-amber-900">
              Prior Grant Final Report Required Before New Cycle
            </div>
            <p className="leading-relaxed">
              Foundation guidelines require past grant recipients to submit a project outcome report before applying for new grants. Click "Submit Final Report" on your funded grant below to unlock new submissions.
            </p>
          </div>
        </div>
      )}

      {/* Applications List */}
      <div className="space-y-4">
        {myApplications.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
            <FileText className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-[#062A3D]">No Applications on File</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't submitted or drafted any proposals yet for {programSettings.schoolYear}.
            </p>
            <button
              onClick={onStartNewApplication}
              className="mt-2 px-5 py-2.5 rounded-xl text-xs font-bold text-[#062A3D] bg-[#8CC8E8] hover:bg-[#a0d4ef]"
            >
              Start Your First Grant Proposal
            </button>
          </div>
        ) : (
          myApplications.map((app) => {
            const isExpanded = expandedAppId === app.id;
            const appTimeline = timelineEvents.filter((e) => e.applicationId === app.id);

            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition hover:border-slate-300"
              >
                {/* Main Card Header */}
                <div
                  className="p-5 sm:p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                  onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                          app.status
                        )}`}
                      >
                        {app.status}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {app.category}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500">{app.campus}</span>
                    </div>

                    <h3 className="text-base font-bold text-[#062A3D]">
                      {app.title || 'Untitled Proposal'}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="font-semibold text-[#062A3D]">
                        ${(app.amountRequested || 0).toFixed(2)} requested
                        {app.awardedAmount && (
                          <span className="text-emerald-700 font-bold ml-1">
                            (Awarded: ${app.awardedAmount.toFixed(2)})
                          </span>
                        )}
                      </span>
                      <span>•</span>
                      <span>{app.studentsImpacted || 0} students</span>
                      <span>•</span>
                      <span>Updated {new Date(app.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions & Chevron */}
                  <div className="flex items-center space-x-3 self-end md:self-center">
                    {app.status === 'Draft' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditApplication(app.id);
                        }}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#062A3D] text-white hover:bg-[#0A3D59]"
                      >
                        Resume Draft
                      </button>
                    )}

                    {app.status === 'Funded' && !app.finalReport && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFinalReport(app);
                        }}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#8CC8E8] text-[#062A3D] hover:bg-[#a0d4ef] shadow-xs"
                      >
                        Submit Final Report
                      </button>
                    )}

                    <div className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-slate-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-[#F4F7F9]/40 p-5 sm:p-6 space-y-6">
                    {/* Status Timeline */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#062A3D] flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#8CC8E8]" />
                        <span>Application Status Timeline</span>
                      </h4>

                      <div className="relative pl-6 space-y-4 border-l-2 border-[#8CC8E8]/40 ml-2">
                        {appTimeline.length > 0 ? (
                          appTimeline.map((ev) => (
                            <div key={ev.id} className="relative">
                              <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-[#062A3D] ring-4 ring-white" />
                              <div className="text-xs font-bold text-[#062A3D]">
                                {ev.title}
                              </div>
                              <div className="text-[11px] text-slate-600 mt-0.5">
                                {ev.description}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {new Date(ev.timestamp).toLocaleString()} • {ev.actorRole}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-500">
                            Proposal submitted and queued for review.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Interactive "More Info Needed" Reply Box */}
                    {app.status === 'More Info Needed' && (
                      <div className="p-5 rounded-xl bg-amber-50 border-2 border-amber-300 space-y-3">
                        <div className="flex items-center space-x-2 text-amber-900">
                          <MessageSquare className="w-5 h-5 text-amber-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider">
                            Committee Inquiry Question
                          </h4>
                        </div>

                        <p className="text-xs text-amber-950 font-medium bg-white/80 p-3 rounded-lg border border-amber-200">
                          "{app.moreInfoQuestion || 'Please provide clarification regarding budget line items.'}"
                        </p>

                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700">
                            Your Teacher Response to Committee:
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Type your response here. Once submitted, your proposal will immediately return to 'Under Review' status..."
                            value={inquiryText[app.id] || ''}
                            onChange={(e) =>
                              setInquiryText((prev) => ({
                                ...prev,
                                [app.id]: e.target.value,
                              }))
                            }
                            className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
                          />
                          <button
                            type="button"
                            onClick={() => handleInquiryReply(app.id)}
                            disabled={
                              submittingInquiry[app.id] ||
                              !inquiryText[app.id]?.trim()
                            }
                            className="px-4 py-2 rounded-lg text-xs font-bold bg-[#062A3D] text-white hover:bg-[#0A3D59] transition flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5 text-[#8CC8E8]" />
                            <span>
                              {submittingInquiry[app.id]
                                ? 'Submitting...'
                                : 'Submit Clarification'}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Committee Decision & Encouraging Feedback */}
                    {app.committeeFeedback && (
                      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                        <div className="flex items-center space-x-2 text-[#062A3D]">
                          <Award className="w-5 h-5 text-[#8CC8E8]" />
                          <h4 className="text-xs font-bold uppercase tracking-wider">
                            Official Committee Written Feedback
                          </h4>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed italic bg-[#F4F7F9] p-3 rounded-lg border border-slate-200">
                          "{app.committeeFeedback}"
                        </p>
                      </div>
                    )}

                    {/* Principal Approval Simulation for testing */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-[#062A3D] flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-[#8CC8E8]" />
                          <span>Campus Principal Endorsement</span>
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          Status:{' '}
                          <span
                            className={`font-semibold ${
                              app.principalApproved ? 'text-emerald-700' : 'text-slate-600'
                            }`}
                          >
                            {app.principalApproved
                              ? `Approved (${new Date(
                                  app.principalApprovedAt || ''
                                ).toLocaleDateString()})`
                              : 'Pending or Optional'}
                          </span>
                          {app.principalComment && ` — "${app.principalComment}"`}
                        </div>
                      </div>

                      {!app.principalApproved && (
                        <button
                          type="button"
                          onClick={() =>
                            simulatePrincipalApproval(
                              app.id,
                              true,
                              'Principal approved via district email sign-off.'
                            )
                          }
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
                        >
                          Simulate Principal Endorsement
                        </button>
                      )}
                    </div>

                    {/* Final Report Status Banner for Funded Projects */}
                    {app.status === 'Funded' && app.finalReport && (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Final Project Report Completed</span>
                        </div>
                        <p>
                          Submitted on{' '}
                          {new Date(app.finalReport.submittedAt).toLocaleDateString()} for{' '}
                          {app.finalReport.actualStudentImpact} students. You are fully eligible
                          for future grant cycles.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Final Report Modal */}
      {activeReportApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs uppercase font-bold text-[#8CC8E8] bg-[#062A3D] px-2.5 py-0.5 rounded">
                Final Report Submission
              </span>
              <h2 className="text-xl font-bold text-[#062A3D] mt-1">
                {activeReportApp.title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Spending Deadline: {programSettings.spendingDeadlineDate}
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Outcomes vs. Objectives *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe actual student outcomes compared to your stated TEKS objectives..."
                  value={reportData.outcomesVsObjectives}
                  onChange={(e) =>
                    setReportData((p) => ({ ...p, outcomesVsObjectives: e.target.value }))
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Actual Students Impacted *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={reportData.actualStudentImpact || ''}
                  onChange={(e) =>
                    setReportData((p) => ({
                      ...p,
                      actualStudentImpact: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Summary of Learnings & Teacher Reflections
                </label>
                <textarea
                  rows={3}
                  placeholder="Key instructional successes, challenges overcome, and advice for fellow NISD educators..."
                  value={reportData.summaryOfLearnings}
                  onChange={(e) =>
                    setReportData((p) => ({ ...p, summaryOfLearnings: e.target.value }))
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Receipts & Purchasing Verification Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Invoiced via NISD Purchasing PO# 88412; all materials on campus"
                  value={reportData.receiptNotes}
                  onChange={(e) =>
                    setReportData((p) => ({ ...p, receiptNotes: e.target.value }))
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Classroom Photos & Student Artifacts Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shared Google Drive photo folder sent to foundation director"
                  value={reportData.photoDescription || ''}
                  onChange={(e) =>
                    setReportData((p) => ({ ...p, photoDescription: e.target.value }))
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveReportApp(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={!reportData.outcomesVsObjectives.trim()}
                className="px-5 py-2.5 rounded-lg text-xs font-bold bg-[#8CC8E8] text-[#062A3D] hover:bg-[#a0d4ef] shadow-sm disabled:opacity-50"
              >
                Submit Complete Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
