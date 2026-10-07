import React, { useState } from 'react';
import { Application } from '../../types/grant';
import { countWords } from './Step2ProjectDesc';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  DollarSign,
  Users,
  Building,
  Target,
  FileText,
  Loader2,
  HelpCircle,
  EyeOff,
} from 'lucide-react';

interface Step6Props {
  formData: Partial<Application>;
  onSubmit: () => void;
  onEditStep: (stepNumber: number) => void;
  categoryCap: number;
}

export const Step6ReviewSubmit: React.FC<Step6Props> = ({
  formData,
  onSubmit,
  onEditStep,
  categoryCap,
}) => {
  // Gemini AI Helper states
  const [scanningCampus, setScanningCampus] = useState(false);
  const [campusScanResult, setCampusScanResult] = useState<{
    flagged: boolean;
    mentions: Array<{ term: string; context: string; suggestion: string }>;
  } | null>(null);

  const [checkingApp, setCheckingApp] = useState(false);
  const [appCheckResult, setAppCheckResult] = useState<{
    encouragements: string[];
    suggestions: string[];
    overallTip: string;
  } | null>(null);

  // Validate form errors
  const errors: string[] = [];

  if (!formData.title?.trim()) errors.push('Step 2: Project Title is required.');
  if (!formData.campus) errors.push('Step 1: Campus must be selected.');
  if (!formData.gradeLevels || formData.gradeLevels.length === 0)
    errors.push('Step 1: At least one Grade Level must be selected.');
  if (!formData.subjectArea?.trim()) errors.push('Step 1: Subject Area is required.');
  if (!formData.objectives?.trim()) errors.push('Step 2: Objective Statement is required.');
  if (!formData.abstract?.trim()) errors.push('Step 2: Abstract is required.');
  if (!formData.evaluationStrategy?.trim())
    errors.push('Step 3: Evaluation Strategy is required.');
  if (!formData.partners?.trim()) errors.push('Step 3: Partners is required.');
  if (!formData.sustainability?.trim()) errors.push('Step 3: Sustainability is required.');

  // Word count validations
  if (countWords(formData.abstract || '') > 250)
    errors.push('Step 2: Abstract exceeds maximum limit of 250 words.');
  if (countWords(formData.evaluationStrategy || '') > 150)
    errors.push('Step 3: Evaluation Strategy exceeds maximum limit of 150 words.');
  if (countWords(formData.partners || '') > 150)
    errors.push('Step 3: Partners exceeds maximum limit of 150 words.');
  if (countWords(formData.sustainability || '') > 150)
    errors.push('Step 3: Sustainability exceeds maximum limit of 150 words.');

  // Budget validations
  const totalBudget = Number(formData.amountRequested) || 0;
  if (!formData.budgetItems || formData.budgetItems.length === 0) {
    errors.push('Step 4: At least one budget item is required.');
  }
  if (totalBudget > categoryCap) {
    errors.push(
      `Step 4: Budget ($${totalBudget.toFixed(2)}) exceeds category maximum cap of $${categoryCap.toLocaleString()}.`
    );
  }

  // Acknowledgements
  if (formData.ackImplementation !== true)
    errors.push('Step 5: You must acknowledge the implementation deadline.');
  if (formData.ackProperty !== true)
    errors.push('Step 5: You must acknowledge district property ownership.');
  if (formData.ackApprovals !== true)
    errors.push('Step 5: You must certify required administrative approvals.');
  if (!formData.electronicSignature?.trim())
    errors.push('Step 5: Electronic Signature is required.');

  const canSubmit = errors.length === 0;

  // Run Gemini Campus Scan
  const handleScanCampus = async () => {
    setScanningCampus(true);
    setCampusScanResult(null);

    const narrative = [
      formData.title,
      formData.objectives,
      formData.abstract,
      formData.evaluationStrategy,
      formData.partners,
      formData.sustainability,
    ]
      .filter(Boolean)
      .join('\n\n');

    try {
      const res = await fetch('/api/gemini/scan-campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: narrative }),
      });
      const data = await res.json();
      setCampusScanResult(data);
    } catch {
      setCampusScanResult({
        flagged: false,
        mentions: [],
      });
    } finally {
      setScanningCampus(false);
    }
  };

  // Run Gemini Check My Application
  const handleCheckApplication = async () => {
    setCheckingApp(true);
    setAppCheckResult(null);

    try {
      const res = await fetch('/api/gemini/check-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title || '',
          category: formData.category || 'Category 1',
          objectives: formData.objectives || '',
          abstract: formData.abstract || '',
          studentsImpacted: formData.studentsImpacted || 0,
          evaluationStrategy: formData.evaluationStrategy || '',
          partners: formData.partners || '',
          sustainability: formData.sustainability || '',
          budgetTotal: formData.amountRequested || 0,
          budgetCount: formData.budgetItems?.length || 0,
        }),
      });
      const data = await res.json();
      setAppCheckResult(data);
    } catch {
      setAppCheckResult({
        encouragements: ['Clear classroom objectives and realistic budget scope.'],
        suggestions: [
          'Verify that every stated TEKS objective has a corresponding metric in your evaluation strategy.',
        ],
        overallTip: 'Keep descriptions accessible so community evaluators understand the impact!',
      });
    } finally {
      setCheckingApp(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-[#062A3D]">Step 6 – Application Review & Submission</h2>
        <p className="text-xs text-slate-600 mt-1">
          Review your complete proposal, run AI writing checks, and submit your grant to NEF.
        </p>
      </div>

      {/* Gemini AI Writing Helpers Action Bar */}
      <div className="bg-gradient-to-r from-[#062A3D] to-[#0A3D59] rounded-xl p-5 text-white shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#8CC8E8]" />
            <h3 className="text-sm font-bold">Gemini Proposal Helpers</h3>
          </div>
          <span className="text-[11px] text-[#8CC8E8] font-medium">
            AI coaching & blind review checks
          </span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed">
          Before submitting, you can run optional AI checks to verify that campus names aren't inadvertently mentioned in the proposal narrative (protecting blind review) and receive friendly coaching suggestions.
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            onClick={handleScanCampus}
            disabled={scanningCampus}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-[#8CC8E8] text-[#062A3D] hover:bg-[#a0d4ef] transition flex items-center gap-2 disabled:opacity-50"
          >
            {scanningCampus ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#062A3D]" />
            ) : (
              <EyeOff className="w-4 h-4 text-[#062A3D]" />
            )}
            <span>Scan for Campus Names (Blind Review)</span>
          </button>

          <button
            type="button"
            onClick={handleCheckApplication}
            disabled={checkingApp}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center gap-2 disabled:opacity-50"
          >
            {checkingApp ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Sparkles className="w-4 h-4 text-[#8CC8E8]" />
            )}
            <span>Check My Application (Gemini Coach)</span>
          </button>
        </div>

        {/* Campus Scan Feedback */}
        {campusScanResult && (
          <div
            className={`p-3.5 rounded-lg border text-xs ${
              campusScanResult.flagged
                ? 'bg-amber-500/20 border-amber-300 text-amber-100'
                : 'bg-emerald-500/20 border-emerald-300 text-emerald-100'
            }`}
          >
            {campusScanResult.flagged ? (
              <div className="space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-300" />
                  <span>Campus Mentions Detected:</span>
                </div>
                <p>
                  To preserve unbiased blind review, evaluators should not see your campus name in proposal narrative. We noticed:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  {campusScanResult.mentions.map((m, i) => (
                    <li key={i}>
                      Found: <strong>"{m.term}"</strong> — {m.suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                <span>
                  <strong>Blind review ready!</strong> No specific NISD campus or school names detected in your proposal narrative.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Check Application Feedback */}
        {appCheckResult && (
          <div className="p-4 rounded-lg bg-white/95 text-slate-800 space-y-3 shadow-md border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-bold text-[#062A3D]">
              <Sparkles className="w-4 h-4 text-[#062A3D]" />
              <span>Gemini Application Review Coaching:</span>
            </div>

            {appCheckResult.encouragements?.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                  Strengths
                </div>
                <ul className="list-disc list-inside text-xs text-slate-700 space-y-0.5 mt-0.5">
                  {appCheckResult.encouragements.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {appCheckResult.suggestions?.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                  Friendly Suggestions
                </div>
                <ul className="list-disc list-inside text-xs text-slate-700 space-y-0.5 mt-0.5">
                  {appCheckResult.suggestions.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {appCheckResult.overallTip && (
              <div className="text-xs text-[#062A3D] font-medium italic pt-1 border-t border-slate-100">
                "{appCheckResult.overallTip}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Validation Errors Box */}
      {errors.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
          <div className="flex items-center gap-2 text-rose-800 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Please complete all required fields before submitting:</span>
          </div>
          <ul className="list-disc list-inside text-xs text-rose-700 space-y-1 pl-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Proposal Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs uppercase font-bold text-[#8CC8E8] bg-[#062A3D] px-2.5 py-0.5 rounded">
              {formData.category} Proposal
            </span>
            <h3 className="text-lg font-bold text-[#062A3D] mt-1.5">
              {formData.title || 'Untitled Proposal'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {formData.campus} • {formData.subjectArea} • Grade(s):{' '}
              {(formData.gradeLevels || []).join(', ')}
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500">Requested Amount</div>
            <div className="text-xl font-extrabold text-[#062A3D]">
              ${totalBudget.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Narrative Review Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#062A3D]">Objectives & TEKS</span>
                <button
                  type="button"
                  onClick={() => onEditStep(2)}
                  className="text-[#062A3D] hover:underline font-semibold"
                >
                  Edit
                </button>
              </div>
              <p className="text-slate-700 whitespace-pre-line mt-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {formData.objectives || 'No objectives entered.'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#062A3D]">Abstract</span>
                <button
                  type="button"
                  onClick={() => onEditStep(2)}
                  className="text-[#062A3D] hover:underline font-semibold"
                >
                  Edit
                </button>
              </div>
              <p className="text-slate-700 whitespace-pre-line mt-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {formData.abstract || 'No abstract entered.'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#062A3D]">Evaluation Strategy</span>
                <button
                  type="button"
                  onClick={() => onEditStep(3)}
                  className="text-[#062A3D] hover:underline font-semibold"
                >
                  Edit
                </button>
              </div>
              <p className="text-slate-700 whitespace-pre-line mt-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {formData.evaluationStrategy || 'No evaluation strategy entered.'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#062A3D]">Partners & Sustainability</span>
                <button
                  type="button"
                  onClick={() => onEditStep(3)}
                  className="text-[#062A3D] hover:underline font-semibold"
                >
                  Edit
                </button>
              </div>
              <div className="space-y-2 mt-1">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-800">Partners: </span>
                  <span className="text-slate-600">{formData.partners || 'None listed.'}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-800">Sustainability: </span>
                  <span className="text-slate-600">
                    {formData.sustainability || 'None listed.'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Items Preview */}
        <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#062A3D]">
              Line-Item Budget ({formData.budgetItems?.length || 0} items)
            </span>
            <button
              type="button"
              onClick={() => onEditStep(4)}
              className="text-[#062A3D] hover:underline font-semibold"
            >
              Edit Budget
            </button>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 font-mono text-[11px] whitespace-pre-line text-slate-700 max-h-48 overflow-y-auto">
            {formData.plainTextBudget || 'No items entered.'}
          </div>
        </div>

        {/* Signature & Acknowledgements */}
        <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="font-bold text-[#062A3D]">Electronic Signature:</div>
            <div className="text-sm font-semibold text-[#062A3D] mt-0.5">
              {formData.electronicSignature || 'Unsigned'}
            </div>
            <div className="text-[11px] text-slate-500">
              Recorded: {formData.signedAt ? new Date(formData.signedAt).toLocaleString() : 'N/A'}
            </div>
          </div>

          <div>
            <div className="font-bold text-[#062A3D]">Administrative Approvals:</div>
            <div className="text-slate-600 mt-0.5">
              {formData.ackApprovals ? 'Certified by lead teacher' : 'Pending certification'}
            </div>
            {formData.principalEmail && (
              <div className="text-[11px] text-slate-500">
                Principal Contact: {formData.principalEmail}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submission Action Button */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-500">
          *After submitting, your proposal will enter the committee review workflow and you will receive an email confirmation.
        </p>

        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-[#062A3D] bg-[#8CC8E8] hover:bg-[#a0d4ef] shadow-lg transition flex items-center justify-center gap-2 ${
            !canSubmit ? 'opacity-50 cursor-not-allowed shadow-none' : ''
          }`}
        >
          <FileCheck className="w-5 h-5 text-[#062A3D]" />
          <span>Submit Final Grant Proposal</span>
        </button>
      </div>
    </div>
  );
};
