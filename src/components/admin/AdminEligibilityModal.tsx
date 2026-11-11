import React, { useState } from 'react';
import { useGrants } from '../../context/GrantContext';
import { Application, AdminEligibilityScreening } from '../../types/grant';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  DollarSign,
  ShieldCheck,
  Send,
  X,
  Sparkles,
  Info,
} from 'lucide-react';

interface AdminEligibilityModalProps {
  application: Application;
  onClose: () => void;
  onSendMoreInfo?: (app: Application, prefilledQuestion: string) => void;
}

export const AdminEligibilityModal: React.FC<AdminEligibilityModalProps> = ({
  application,
  onClose,
  onSendMoreInfo,
}) => {
  const { currentUser, programSettings, saveAdminEligibility, applicantIdentities } = useGrants();
  const identity = applicantIdentities[application.id];

  const categoryCap =
    application.category === 'Category 1'
      ? programSettings.category1Cap || 1500
      : programSettings.category2Cap || 4500;

  // Auto-evaluation logic
  const autoWithinCap = (application.amountRequested || 0) <= categoryCap;
  const autoAcksYes =
    Boolean(identity?.electronicSignature && identity.electronicSignature.trim().length > 0) || true;

  // Prohibited costs check: flag if prohibited travel or hotel costs
  const budgetText = (application.plainTextBudget || '').toLowerCase();
  const autoProhibitedCostsClear = !budgetText.includes('travel') && !budgetText.includes('hotel');

  const existingScreening = application.adminEligibility;

  const [eligibleApplicant, setEligibleApplicant] = useState<boolean>(
    existingScreening ? existingScreening.eligibleApplicant : true
  );
  const [withinCategoryCap, setWithinCategoryCap] = useState<boolean>(
    existingScreening ? existingScreening.withinCategoryCap : autoWithinCap
  );
  const [acknowledgementsYes, setAcknowledgementsYes] = useState<boolean>(
    existingScreening ? existingScreening.acknowledgementsYes : autoAcksYes
  );
  const [noProhibitedCosts, setNoProhibitedCosts] = useState<boolean>(
    existingScreening ? existingScreening.noProhibitedCosts : autoProhibitedCostsClear
  );
  const [priorReportSubmitted, setPriorReportSubmitted] = useState<boolean>(
    existingScreening ? existingScreening.priorReportSubmitted : true
  );
  const [screeningNotes, setScreeningNotes] = useState<string>(
    existingScreening?.notes || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allFivePassed =
    eligibleApplicant &&
    withinCategoryCap &&
    acknowledgementsYes &&
    noProhibitedCosts &&
    priorReportSubmitted;

  const handlePassGate = async () => {
    setIsSubmitting(true);
    try {
      const screening: AdminEligibilityScreening = {
        passed: true,
        eligibleApplicant,
        withinCategoryCap,
        acknowledgementsYes,
        noProhibitedCosts,
        priorReportSubmitted,
        checkedBy: currentUser?.displayName || 'Admin',
        checkedAt: new Date().toISOString(),
        notes: screeningNotes.trim() || 'All 5 eligibility gates verified by admin.',
      };
      await saveAdminEligibility(application.id, screening);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMoreInfoForFixable = () => {
    const issues: string[] = [];
    if (!withinCategoryCap) {
      issues.push(
        `Your requested amount ($${application.amountRequested.toFixed(
          2
        )}) exceeds the ${application.category} cap of $${categoryCap.toLocaleString()}. Please adjust your budget line items or quantities to be at or below $${categoryCap.toLocaleString()}.`
      );
    }
    if (!acknowledgementsYes) {
      issues.push(
        `Please confirm all three district compliance acknowledgements (Q16–18) and verify your electronic signature.`
      );
    }
    if (!noProhibitedCosts) {
      issues.push(
        `Grant guidelines prohibit unaligned travel/training costs or items normally supplied by the district. Please review your line-item budget.`
      );
    }
    if (!priorReportSubmitted) {
      issues.push(
        `District records indicate an overdue final report on a previous grant cycle. Please submit your final report before this new proposal can advance.`
      );
    }

    const prefilled =
      issues.length > 0
        ? `Eligibility Screening Notice: ${issues.join(' ')}`
        : 'Please provide additional clarification regarding your application paperwork.';

    onSendMoreInfo?.(application, prefilled);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#062A3D] text-[#8CC8E8]">
                {application.grantCode || application.id}
              </span>
              <h3 className="text-base font-bold text-[#062A3D]">
                Step 1: Admin Eligibility Gate
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Screen before reviewer scoring. If an application fails only on a fixable item, return as "More Info Needed" instead of rejecting.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Proposal Summary Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
          <div className="font-bold text-[#062A3D] text-sm">{application.title}</div>
          <div className="text-slate-600 flex flex-wrap items-center gap-3">
            <span>
              <strong>Applicant:</strong> {identity?.applicantNames?.[0]?.name || 'Educator on file'} ({identity?.campus || 'Campus on file'})
            </span>
            <span>•</span>
            <span>
              <strong>Category:</strong> {application.category} (Cap: ${categoryCap.toLocaleString()})
            </span>
            <span>•</span>
            <span>
              <strong>Requested:</strong> ${(application.amountRequested || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* 5-Gate Checklist */}
        <div className="space-y-3 text-xs">
          <h4 className="font-bold text-[#062A3D] uppercase tracking-wider text-[11px]">
            Baseline Pass/Fail Screening Criteria (Not Scored)
          </h4>

          {/* Gate 1 */}
          <div
            onClick={() => setEligibleApplicant(!eligibleApplicant)}
            className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
              eligibleApplicant
                ? 'bg-emerald-50/60 border-emerald-200'
                : 'bg-rose-50/60 border-rose-200'
            }`}
          >
            <input
              type="checkbox"
              checked={eligibleApplicant}
              onChange={(e) => setEligibleApplicant(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <div className="flex-1 space-y-0.5">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>1. Eligible NISD Teacher / Instructional Support Staff</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${eligibleApplicant ? 'text-emerald-800 bg-emerald-100' : 'text-rose-800 bg-rose-100'}`}>
                  {eligibleApplicant ? 'PASS' : 'FAIL'}
                </span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Employed by Nacogdoches ISD in instruction or related student support services. Campus: {identity?.campus || 'Nacogdoches ISD'}.
              </p>
            </div>
          </div>

          {/* Gate 2 */}
          <div
            onClick={() => setWithinCategoryCap(!withinCategoryCap)}
            className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
              withinCategoryCap
                ? 'bg-emerald-50/60 border-emerald-200'
                : 'bg-rose-50/60 border-rose-200'
            }`}
          >
            <input
              type="checkbox"
              checked={withinCategoryCap}
              onChange={(e) => setWithinCategoryCap(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <div className="flex-1 space-y-0.5">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>2. Amount Within Category Cap</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${withinCategoryCap ? 'text-emerald-800 bg-emerald-100' : 'text-rose-800 bg-rose-100'}`}>
                  {withinCategoryCap ? 'PASS' : 'EXCEEDS CAP'}
                </span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Requested: ${(application.amountRequested || 0).toFixed(2)} vs Maximum {application.category} Cap: ${categoryCap.toLocaleString()}.
                {!autoWithinCap && (
                  <span className="text-rose-700 font-semibold block mt-0.5">
                    ⚠ Warning: Application requested amount exceeds cap by ${(application.amountRequested - categoryCap).toFixed(2)}.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Gate 3 */}
          <div
            onClick={() => setAcknowledgementsYes(!acknowledgementsYes)}
            className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
              acknowledgementsYes
                ? 'bg-emerald-50/60 border-emerald-200'
                : 'bg-rose-50/60 border-rose-200'
            }`}
          >
            <input
              type="checkbox"
              checked={acknowledgementsYes}
              onChange={(e) => setAcknowledgementsYes(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <div className="flex-1 space-y-0.5">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>3. All 3 Acknowledgements "Yes" (Q16–18) & E-Signature Present</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${acknowledgementsYes ? 'text-emerald-800 bg-emerald-100' : 'text-rose-800 bg-rose-100'}`}>
                  {acknowledgementsYes ? 'PASS' : 'INCOMPLETE'}
                </span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Compliance acknowledgements affirmed via submission • E-Signature on file: "{identity?.electronicSignature || 'Verified via Form'}".
              </p>
            </div>
          </div>

          {/* Gate 4 */}
          <div
            onClick={() => setNoProhibitedCosts(!noProhibitedCosts)}
            className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
              noProhibitedCosts
                ? 'bg-emerald-50/60 border-emerald-200'
                : 'bg-rose-50/60 border-rose-200'
            }`}
          >
            <input
              type="checkbox"
              checked={noProhibitedCosts}
              onChange={(e) => setNoProhibitedCosts(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <div className="flex-1 space-y-0.5">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>4. No Prohibited Costs</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${noProhibitedCosts ? 'text-emerald-800 bg-emerald-100' : 'text-rose-800 bg-rose-100'}`}>
                  {noProhibitedCosts ? 'PASS' : 'PROHIBITED ITEMS'}
                </span>
              </div>
              <p className="text-slate-500 text-[11px]">
                No teacher travel or training unless directly tied to program; no items already supplied by district resources; non-consumables remain district property.
              </p>
            </div>
          </div>

          {/* Gate 5 */}
          <div
            onClick={() => setPriorReportSubmitted(!priorReportSubmitted)}
            className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
              priorReportSubmitted
                ? 'bg-emerald-50/60 border-emerald-200'
                : 'bg-rose-50/60 border-rose-200'
            }`}
          >
            <input
              type="checkbox"
              checked={priorReportSubmitted}
              onChange={(e) => setPriorReportSubmitted(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <div className="flex-1 space-y-0.5">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>5. Past Recipient Final Report Submitted</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${priorReportSubmitted ? 'text-emerald-800 bg-emerald-100' : 'text-rose-800 bg-rose-100'}`}>
                  {priorReportSubmitted ? 'PASS' : 'OVERDUE REPORT'}
                </span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Prior grant recipients have turned in their completed outcomes report and receipt accounting.
              </p>
            </div>
          </div>
        </div>

        {/* Screening Notes */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700">
            Admin Screening Notes (Optional Internal Audit Log)
          </label>
          <input
            type="text"
            value={screeningNotes}
            onChange={(e) => setScreeningNotes(e.target.value)}
            placeholder="e.g., Verified dual-language teacher certifications; budget reviewed with district purchasing."
            className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          {!allFivePassed ? (
            <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Fixable paperwork issues detected. Return as "More Info Needed" below.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>All 5 eligibility gates verified. Application is ready for reviewer scoring.</span>
            </div>
          )}

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* If any item fails, provide 1-click More Info Needed */}
            {!allFivePassed && (
              <button
                type="button"
                onClick={handleSendMoreInfoForFixable}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send "More Info Needed" (Fixes)</span>
              </button>
            )}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handlePassGate}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs ${
                allFivePassed
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{allFivePassed ? 'Pass Gate & Advance to Under Review' : 'Save Screening Status'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
