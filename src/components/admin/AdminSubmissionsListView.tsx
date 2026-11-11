import React, { useState, useMemo } from 'react';
import { useGrants } from '../../context/GrantContext';
import { Application, ApplicantIdentity, ApplicationStatus } from '../../types/grant';
import {
  FileText,
  Search,
  Filter,
  Download,
  PlusCircle,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  Building,
  User,
  DollarSign,
  Users,
  X,
  Send,
  Loader2,
  ShieldCheck,
  Check,
  Tag,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { generateNextGrantCode } from '../../utils/grantCodeUtils';

const NACISD_CAMPUSES = [
  'Nacogdoches High School',
  'McMichael Middle School',
  'Mike Moses Middle School',
  'Brooks-Quinn-Jones Elementary',
  'Raguet Elementary',
  'Thomas J. Rusk Elementary',
  'Carpenter Elementary',
  'Fredonia Early Childhood Center',
  'Malcolm Rector High School',
  'Special Education Department',
  'District-wide / Other',
];

export const AdminSubmissionsListView: React.FC = () => {
  const {
    applications,
    applicantIdentities,
    programSettings,
    saveSubmittedApplicationToFirestore,
    syncAllApplicationsToFirestore,
    updateApplicationStatus,
  } = useGrants();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [inspectApp, setInspectApp] = useState<Application | null>(null);
  const [showNewAppModal, setShowNewAppModal] = useState(false);
  const [isSyncingFirestore, setIsSyncingFirestore] = useState(false);

  // New Application Submission Form state
  const [formApplicantName, setFormApplicantName] = useState('');
  const [formApplicantEmail, setFormApplicantEmail] = useState('');
  const [formCampus, setFormCampus] = useState(NACISD_CAMPUSES[0]);
  const [formCoApplicants, setFormCoApplicants] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<'Category 1' | 'Category 2'>('Category 1');
  const [formAreaOfFocus, setFormAreaOfFocus] = useState<
    'STEM' | 'Early Literacy/Numeracy' | 'Workforce/Career-Connected Learning' | 'Fine Arts' | 'Other'
  >('STEM');
  const [formSubjectArea, setFormSubjectArea] = useState('');
  const [formGradeLevels, setFormGradeLevels] = useState('K-5');
  const [formAmountRequested, setFormAmountRequested] = useState<number>(1500);
  const [formStudentsImpacted, setFormStudentsImpacted] = useState<number>(120);
  const [formAbstract, setFormAbstract] = useState('');
  const [formObjectives, setFormObjectives] = useState('');
  const [formEvaluationStrategy, setFormEvaluationStrategy] = useState('');
  const [formSustainability, setFormSustainability] = useState('');
  const [formPlainTextBudget, setFormPlainTextBudget] = useState('');
  const [formSignature, setFormSignature] = useState('');
  const [isSubmittingNewApp, setIsSubmittingNewApp] = useState(false);

  // Confirmation receipt modal state after submitting new application
  const [appSubmissionReceipt, setAppSubmissionReceipt] = useState<{
    applicantName: string;
    campus: string;
    grantCode: string;
    title: string;
    amountRequested: number;
    submittedAt: string;
  } | null>(null);

  // Filtered submissions
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const identity = applicantIdentities[app.id];
      const leadName = identity?.applicantNames?.[0]?.name || '';
      const campus = identity?.campus || '';
      const email = identity?.applicantEmail || '';

      const matchesSearch =
        searchQuery === '' ||
        app.grantCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campus.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCampus =
        selectedCampus === 'all' || campus.toLowerCase().includes(selectedCampus.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || app.category === selectedCategory;

      const matchesStatus =
        selectedStatus === 'all' ||
        app.status.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesCampus && matchesCategory && matchesStatus;
    });
  }, [applications, applicantIdentities, searchQuery, selectedCampus, selectedCategory, selectedStatus]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalApps = applications.length;
    const totalRequested = applications.reduce((sum, a) => sum + (a.amountRequested || 0), 0);
    const totalStudents = applications.reduce((sum, a) => sum + (a.studentsImpacted || 0), 0);

    const campusesSet = new Set<string>();
    Object.values(applicantIdentities).forEach((id) => {
      if (id.campus) campusesSet.add(id.campus);
    });

    return {
      totalApps,
      totalRequested,
      totalStudents,
      uniqueCampuses: campusesSet.size || NACISD_CAMPUSES.length,
    };
  }, [applications, applicantIdentities]);

  // Export submissions list to CSV
  const handleExportSubmissionsCsv = () => {
    const headers = [
      'Grant Code',
      'Sequence #',
      'Lead Applicant',
      'Co-Applicants',
      'Applicant Email',
      'Campus',
      'Project Title',
      'Category',
      'Area of Focus',
      'Amount Requested',
      'Students Impacted',
      'Submission Timestamp',
      'Status',
      'Electronic Signature',
    ];

    const rows = filteredApps.map((app) => {
      const identity = applicantIdentities[app.id];
      const leadName = identity?.applicantNames?.[0]?.name || '';
      const coApplicants = (identity?.applicantNames || []).slice(1).map((n) => n.name).join('; ');
      const email = identity?.applicantEmail || '';
      const campus = identity?.campus || '';
      const timestamp = identity?.importedTimestamp || app.rowTimestamp || app.createdAt || '';
      const signature = identity?.electronicSignature || leadName;

      return [
        `"${app.grantCode}"`,
        app.sequenceNumber || '',
        `"${leadName.replace(/"/g, '""')}"`,
        `"${coApplicants.replace(/"/g, '""')}"`,
        `"${email}"`,
        `"${campus.replace(/"/g, '""')}"`,
        `"${app.title.replace(/"/g, '""')}"`,
        `"${app.category}"`,
        `"${app.areaOfFocus}"`,
        (app.amountRequested || 0).toFixed(2),
        app.studentsImpacted || 0,
        `"${timestamp}"`,
        `"${app.status}"`,
        `"${signature.replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NEF_Submitted_Applications_${programSettings.schoolYear.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sync all applications to Firestore
  const handleSyncAllToFirestore = async () => {
    setIsSyncingFirestore(true);
    try {
      await syncAllApplicationsToFirestore();
    } finally {
      setIsSyncingFirestore(false);
    }
  };

  // Handle submitting new application
  const handleSubmitNewApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formApplicantName.trim() || !formApplicantEmail.trim() || !formTitle.trim()) {
      alert('Please fill in applicant name, email, and project title.');
      return;
    }

    setIsSubmittingNewApp(true);
    try {
      const { grantCode, sequenceNumber } = generateNextGrantCode(
        programSettings,
        applications,
        applications.length
      );

      const appId = `app-${grantCode.toLowerCase()}`;
      const now = new Date().toISOString();
      const formattedSubmissionTime = new Date().toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      const coAppList = formCoApplicants
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name) => ({ name, email: '' }));

      const newIdentity: ApplicantIdentity = {
        id: appId,
        applicationId: appId,
        grantCode,
        applicantEmail: formApplicantEmail.trim().toLowerCase(),
        applicantNames: [{ name: formApplicantName.trim(), email: formApplicantEmail.trim().toLowerCase() }, ...coAppList],
        campus: formCampus,
        electronicSignature: formSignature.trim() || formApplicantName.trim(),
        signedAt: formattedSubmissionTime,
        importedTimestamp: formattedSubmissionTime,
        createdAt: now,
      };

      const newApp: Application = {
        id: appId,
        grantCode,
        sequenceNumber,
        title: formTitle.trim(),
        category: formCategory,
        gradeLevels: [formGradeLevels],
        subjectArea: formSubjectArea.trim() || 'General Education',
        areaOfFocus: formAreaOfFocus,
        abstract: formAbstract.trim() || 'Instructional innovation project proposal.',
        objectives: formObjectives.trim() || 'Measurable student learning objectives.',
        amountRequested: Number(formAmountRequested) || 1000,
        studentsImpacted: Number(formStudentsImpacted) || 50,
        evaluationStrategy: formEvaluationStrategy.trim() || 'Assessment and student growth measurement.',
        partners: 'N/A',
        sustainability: formSustainability.trim() || 'Materials integrated into ongoing instructional cycle.',
        plainTextBudget: formPlainTextBudget.trim() || `Itemized request: $${formAmountRequested}`,
        involvesTech: false,
        involvesFacilities: false,
        status: 'submitted',
        statusReason: 'Officially submitted to NEF grant cycle.',
        createdAt: now,
        updatedAt: now,
        rowTimestamp: formattedSubmissionTime,
        assignedReviewerIds: ['all'],
      };

      // Save to Firestore collections /applications and /applicantIdentities
      await saveSubmittedApplicationToFirestore(newApp, newIdentity);

      setShowNewAppModal(false);
      setAppSubmissionReceipt({
        applicantName: formApplicantName.trim(),
        campus: formCampus,
        grantCode,
        title: formTitle.trim(),
        amountRequested: Number(formAmountRequested) || 1000,
        submittedAt: formattedSubmissionTime,
      });

      // Reset form
      setFormApplicantName('');
      setFormApplicantEmail('');
      setFormCoApplicants('');
      setFormTitle('');
      setFormAbstract('');
      setFormObjectives('');
      setFormPlainTextBudget('');
      setFormSignature('');
    } catch (err: any) {
      alert(`Failed to submit application: ${err.message}`);
    } finally {
      setIsSubmittingNewApp(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#062A3D]">Submitted Grant Applications</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              Firestore DB Verified
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Official teacher applications repository stored in Firestore collection <code className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px]">/applications</code> with segregated applicant identities in <code className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px]">/applicantIdentities</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSyncAllToFirestore}
            disabled={isSyncingFirestore}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition flex items-center gap-2 shadow-2xs"
            title="Batch write all 21 applications to Firestore database"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isSyncingFirestore ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isSyncingFirestore ? 'Syncing Firestore...' : 'Sync to Firestore'}</span>
          </button>

          <button
            onClick={() => setShowNewAppModal(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#062A3D] text-[#8CC8E8] hover:bg-[#0A3D59] transition flex items-center gap-2 shadow-xs border border-[#8CC8E8]/40"
          >
            <PlusCircle className="w-4 h-4 text-[#8CC8E8]" />
            <span>Submit New Application</span>
          </button>

          <button
            onClick={handleExportSubmissionsCsv}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-700 hover:bg-emerald-800 text-white transition flex items-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-200" />
            <span>Export Submissions (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-800">
            <FileText className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <div className="text-xs uppercase font-bold text-slate-500">Submissions Logged</div>
            <div className="text-2xl font-black text-[#062A3D]">{metrics.totalApps} Proposals</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800">
            <DollarSign className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <div className="text-xs uppercase font-bold text-slate-500">Total Requested</div>
            <div className="text-2xl font-black text-[#062A3D]">
              ${metrics.totalRequested.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-800">
            <Building className="w-6 h-6 text-purple-700" />
          </div>
          <div>
            <div className="text-xs uppercase font-bold text-slate-500">Campuses Reached</div>
            <div className="text-2xl font-black text-[#062A3D]">{metrics.uniqueCampuses} Campuses</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-800">
            <Users className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <div className="text-xs uppercase font-bold text-slate-500">Students Impacted</div>
            <div className="text-2xl font-black text-[#062A3D]">{metrics.totalStudents.toLocaleString()} Students</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search submissions by grant code, applicant name, campus, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#062A3D]/20 text-[#062A3D]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/70 text-[#062A3D] font-medium"
            >
              <option value="all">All Campuses</option>
              {NACISD_CAMPUSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/70 text-[#062A3D] font-medium"
            >
              <option value="all">All Categories</option>
              <option value="Category 1">Category 1 (≤$2,000)</option>
              <option value="Category 2">Category 2 (≤$6,000)</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/70 text-[#062A3D] font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="funded">Funded</option>
              <option value="partially_funded">Partially Funded</option>
              <option value="not_funded">Not Funded</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between border-t border-slate-100 pt-2.5">
          <span>
            Showing <strong>{filteredApps.length}</strong> of {applications.length} submitted proposals
          </span>
          <span className="flex items-center gap-1.5 text-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            Applicant names and campuses unmasked for Admin review
          </span>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#062A3D] text-white uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-bold">Grant Code</th>
                <th className="py-3.5 px-4 font-bold">Applicant(s)</th>
                <th className="py-3.5 px-4 font-bold">Campus</th>
                <th className="py-3.5 px-4 font-bold">Project Title</th>
                <th className="py-3.5 px-4 font-bold">Category</th>
                <th className="py-3.5 px-4 font-bold text-right">Requested</th>
                <th className="py-3.5 px-4 font-bold">Submitted Date</th>
                <th className="py-3.5 px-4 font-bold text-center">Status</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No submitted applications match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const identity = applicantIdentities[app.id];
                  const leadName = identity?.applicantNames?.[0]?.name || 'Confidential';
                  const coCount = (identity?.applicantNames?.length || 1) - 1;
                  const campus = identity?.campus || 'Confidential';
                  const submissionTime = identity?.importedTimestamp || app.rowTimestamp || app.createdAt || 'N/A';

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#062A3D] whitespace-nowrap">
                        <span className="bg-[#062A3D]/10 text-[#062A3D] px-2 py-0.5 rounded-md">
                          {app.grantCode}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-[#062A3D] whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{leadName}</span>
                          {coCount > 0 && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              +{coCount} co-applicant{coCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap font-medium">
                        {campus}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs truncate text-[#062A3D] font-medium" title={app.title}>
                        {app.title}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {app.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-extrabold text-[#062A3D] text-right whitespace-nowrap">
                        ${(app.amountRequested || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px] font-mono">
                        {submissionTime}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            app.status === 'Funded'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : app.status === 'Partially Funded'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : app.status === 'Not Funded'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : app.status === 'Under Review' || app.status === 'under_review'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setInspectApp(app)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#062A3D] hover:text-white font-bold text-xs text-slate-700 transition flex items-center gap-1.5 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
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

      {/* Inspect Proposal Modal */}
      {inspectApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold bg-[#062A3D] text-[#8CC8E8] px-2.5 py-0.5 rounded-md text-xs">
                    {inspectApp.grantCode}
                  </span>
                  <span className="text-xs uppercase font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    {inspectApp.category}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    {inspectApp.areaOfFocus}
                  </span>
                </div>
                <h2 className="text-xl font-black text-[#062A3D] mt-1.5">{inspectApp.title}</h2>
              </div>
              <button
                onClick={() => setInspectApp(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Applicant Identity Card (Admin Only) */}
            {applicantIdentities[inspectApp.id] && (
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-2 text-xs">
                <div className="font-bold uppercase tracking-wider text-blue-900 text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  <span>Applicant Information (Segregated Collection)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700 pt-1">
                  <div>
                    <span className="font-semibold block text-slate-500">Lead Applicant:</span>
                    <span className="font-bold text-[#062A3D]">
                      {applicantIdentities[inspectApp.id].applicantNames[0]?.name}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      {applicantIdentities[inspectApp.id].applicantEmail}
                    </span>
                  </div>

                  <div>
                    <span className="font-semibold block text-slate-500">Campus:</span>
                    <span className="font-bold text-[#062A3D]">
                      {applicantIdentities[inspectApp.id].campus}
                    </span>
                  </div>

                  <div>
                    <span className="font-semibold block text-slate-500">Electronic Signature:</span>
                    <span className="font-mono font-bold text-[#062A3D]">
                      {applicantIdentities[inspectApp.id].electronicSignature ||
                        applicantIdentities[inspectApp.id].applicantNames[0]?.name}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      Signed: {applicantIdentities[inspectApp.id].signedAt || 'Verified at submission'}
                    </span>
                  </div>
                </div>

                {applicantIdentities[inspectApp.id].applicantNames.length > 1 && (
                  <div className="pt-2 border-t border-blue-200/60 text-[11px]">
                    <span className="font-semibold text-slate-500">Co-Applicants: </span>
                    <span className="font-medium text-slate-800">
                      {applicantIdentities[inspectApp.id].applicantNames
                        .slice(1)
                        .map((n) => n.name)
                        .join(', ')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Proposal Details Grid */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px] font-semibold">Amount Requested</span>
                  <span className="text-base font-extrabold text-[#062A3D]">
                    ${(inspectApp.amountRequested || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-semibold">Students Impacted</span>
                  <span className="text-base font-extrabold text-[#062A3D]">
                    {inspectApp.studentsImpacted}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-semibold">Subject Area</span>
                  <span className="text-base font-bold text-[#062A3D]">
                    {inspectApp.subjectArea || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-semibold">Current Status</span>
                  <span className="text-base font-bold text-[#062A3D]">
                    {inspectApp.status}
                  </span>
                </div>
              </div>

              {/* Proposal Abstract */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-[#062A3D] uppercase tracking-wider text-[11px]">
                  Project Summary / Abstract:
                </h4>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {inspectApp.abstract}
                </div>
              </div>

              {/* Objectives & TEKS */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-[#062A3D] uppercase tracking-wider text-[11px]">
                  Objectives & TEKS Alignment:
                </h4>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {inspectApp.objectives}
                </div>
              </div>

              {/* Evaluation Strategy */}
              {inspectApp.evaluationStrategy && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-[#062A3D] uppercase tracking-wider text-[11px]">
                    Evaluation Strategy & Measurement:
                  </h4>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {inspectApp.evaluationStrategy}
                  </div>
                </div>
              )}

              {/* Sustainability */}
              {inspectApp.sustainability && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-[#062A3D] uppercase tracking-wider text-[11px]">
                    Sustainability & Continuity Plan:
                  </h4>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {inspectApp.sustainability}
                  </div>
                </div>
              )}

              {/* Itemized Budget */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-[#062A3D] uppercase tracking-wider text-[11px]">
                  Itemized Budget Narrative:
                </h4>
                <div className="p-4 rounded-2xl bg-slate-900 text-emerald-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                  {inspectApp.plainTextBudget || 'No budget breakdown provided.'}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="text-[11px] text-slate-400 font-mono">
                Firestore doc ID: /applications/{inspectApp.id}
              </span>
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

      {/* Submit New Application Modal */}
      {showNewAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#062A3D]">Submit Grant Proposal</h3>
                <p className="text-xs text-slate-500">
                  Save directly to Firestore with automated grant code assignment and encrypted identity segregation.
                </p>
              </div>
              <button
                onClick={() => setShowNewAppModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewApplication} className="space-y-4 text-xs">
              {/* Applicant Info */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-bold uppercase tracking-wider text-[11px] text-slate-700 block">
                  1. Applicant & Campus Information (Restricted Storage)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Lead Applicant Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maria Gonzalez"
                      value={formApplicantName}
                      onChange={(e) => setFormApplicantName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Applicant Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. mgonzalez@nacisd.org"
                      value={formApplicantEmail}
                      onChange={(e) => setFormApplicantEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Campus *</label>
                    <select
                      value={formCampus}
                      onChange={(e) => setFormCampus(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    >
                      {NACISD_CAMPUSES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Co-Applicants (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. John Smith; Jane Doe"
                      value={formCoApplicants}
                      onChange={(e) => setFormCoApplicants(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Proposal Info */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-bold uppercase tracking-wider text-[11px] text-slate-700 block">
                  2. Proposal Content (Blind Committee Review)
                </span>

                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Project Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Robotic Problem Solving in the STEM Classroom"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Category</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      >
                        <option value="Category 1">Category 1 (≤$2,000)</option>
                        <option value="Category 2">Category 2 (≤$6,000)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Area of Focus</label>
                      <select
                        value={formAreaOfFocus}
                        onChange={(e) => setFormAreaOfFocus(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      >
                        <option value="STEM">STEM</option>
                        <option value="Early Literacy/Numeracy">Early Literacy/Numeracy</option>
                        <option value="Workforce/Career-Connected Learning">Workforce/Career-Connected</option>
                        <option value="Fine Arts">Fine Arts</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Amount Requested ($)</label>
                      <input
                        type="number"
                        min={100}
                        max={formCategory === 'Category 1' ? 2000 : 6000}
                        value={formAmountRequested}
                        onChange={(e) => setFormAmountRequested(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Grade Levels</label>
                      <input
                        type="text"
                        placeholder="e.g. 6-8 or 9-12"
                        value={formGradeLevels}
                        onChange={(e) => setFormGradeLevels(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Students Impacted</label>
                      <input
                        type="number"
                        min={1}
                        value={formStudentsImpacted}
                        onChange={(e) => setFormStudentsImpacted(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Project Abstract *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Describe the classroom challenge, target audience, and planned instructional activities..."
                      value={formAbstract}
                      onChange={(e) => setFormAbstract(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Objectives & TEKS Alignment</label>
                    <textarea
                      rows={2}
                      placeholder="List measurable objectives and cite applicable TEKS standards..."
                      value={formObjectives}
                      onChange={(e) => setFormObjectives(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Budget Breakdown Narrative</label>
                    <textarea
                      rows={2}
                      placeholder="Itemized list of items with unit costs and total..."
                      value={formPlainTextBudget}
                      onChange={(e) => setFormPlainTextBudget(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Electronic Signature *</label>
                    <input
                      type="text"
                      required
                      placeholder="Type full legal name to verify submission"
                      value={formSignature}
                      onChange={(e) => setFormSignature(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewAppModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewApp}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#062A3D] text-white hover:bg-[#0A3D59] flex items-center gap-1.5"
                >
                  {isSubmittingNewApp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#8CC8E8]" />
                      <span>Saving to Firestore...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-[#8CC8E8]" />
                      <span>Submit to Firestore</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Screen After Submitting New Application Showing Applicant Name & Time */}
      {appSubmissionReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Firestore Persistence Confirmed
              </span>
              <h2 className="text-2xl font-extrabold text-[#062A3D]">
                Application Submitted Successfully
              </h2>
              <p className="text-xs text-slate-500">
                The proposal has been saved to Firestore collection /applications.
              </p>
            </div>

            {/* Receipt Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">Grant Code Assigned</span>
                <span className="font-mono font-bold bg-[#062A3D] text-[#8CC8E8] px-2 py-0.5 rounded-md">
                  {appSubmissionReceipt.grantCode}
                </span>
              </div>

              <div className="font-bold text-[#062A3D] text-sm leading-snug">
                {appSubmissionReceipt.title}
              </div>

              <div className="border-t border-slate-200/80 pt-2.5 space-y-2">
                <div className="flex items-start justify-between">
                  <span className="text-slate-500 font-semibold">Applicant Name:</span>
                  <span className="font-bold text-[#062A3D] text-right">
                    {appSubmissionReceipt.applicantName}
                  </span>
                </div>

                <div className="flex items-start justify-between">
                  <span className="text-slate-500 font-semibold">Campus:</span>
                  <span className="font-semibold text-slate-700 text-right">
                    {appSubmissionReceipt.campus}
                  </span>
                </div>

                <div className="flex items-start justify-between">
                  <span className="text-slate-500 font-semibold">Submission Time:</span>
                  <span className="font-bold text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200 text-right font-mono text-[11px]">
                    {appSubmissionReceipt.submittedAt}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Amount Requested:</span>
                  <span className="font-black text-sm text-[#062A3D]">
                    ${appSubmissionReceipt.amountRequested.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAppSubmissionReceipt(null)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs bg-[#062A3D] text-white hover:bg-[#0A3D59] transition shadow-md"
              >
                Close & View in Submissions Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
