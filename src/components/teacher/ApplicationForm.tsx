import React, { useState, useEffect, useRef } from 'react';
import { useGrant } from '../../context/GrantContext';
import { Application, BudgetItem } from '../../types/grant';
import { Step1AboutYou } from './Step1AboutYou';
import { Step2ProjectDesc } from './Step2ProjectDesc';
import { Step3ImpactPartners } from './Step3ImpactPartners';
import { BudgetBuilder } from './BudgetBuilder';
import { Step5Acknowledgements } from './Step5Acknowledgements';
import { Step6ReviewSubmit } from './Step6ReviewSubmit';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle,
  FileCheck,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface ApplicationFormProps {
  initialAppId?: string;
  onSubmitted: (appId: string) => void;
  onCancel: () => void;
}

export const ApplicationForm: React.FC<ApplicationFormProps> = ({
  initialAppId,
  onSubmitted,
  onCancel,
}) => {
  const {
    currentUser,
    applications,
    programSettings,
    vendors,
    saveApplicationDraft,
    submitApplication,
    userPendingFinalReport,
  } = useGrant();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load existing application if editing draft
  const existingApp = applications.find((a) => a.id === initialAppId);

  const [formData, setFormData] = useState<Partial<Application>>(() => {
    if (existingApp) return { ...existingApp };
    return {
      applicantEmail: currentUser.email,
      applicantNames: [{ name: currentUser.displayName, email: currentUser.email }],
      campus: currentUser.campus || 'Raguet Elementary',
      gradeLevels: ['3rd'],
      subjectArea: '',
      category: 'Category 1',
      title: '',
      objectives: '',
      areaOfFocus: 'STEM',
      abstract: '',
      amountRequested: 0,
      studentsImpacted: 0,
      evaluationStrategy: '',
      partners: '',
      sustainability: '',
      budgetItems: [],
      plainTextBudget: '',
      involvesTech: false,
      involvesFacilities: false,
      ackImplementation: false,
      ackProperty: false,
      ackApprovals: false,
      electronicSignature: '',
      status: 'Draft',
    };
  });

  const categoryCap =
    formData.category === 'Category 2'
      ? programSettings.category2Cap
      : programSettings.category1Cap;

  // Auto-save debounced timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const performSave = async () => {
    setIsSaving(true);
    try {
      const savedId = await saveApplicationDraft(formData);
      if (!formData.id) {
        setFormData((prev) => ({ ...prev, id: savedId }));
      }
      setLastSavedTime(new Date().toLocaleTimeString());
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      performSave();
    }, 2500);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [formData]);

  const handleBudgetChange = (
    items: BudgetItem[],
    plainText: string,
    total: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      budgetItems: items,
      plainTextBudget: plainText,
      amountRequested: total,
    }));
  };

  const handleFinalSubmit = async () => {
    // Save latest
    const savedId = await saveApplicationDraft({
      ...formData,
      status: 'Submitted',
    });
    await submitApplication(savedId);
    onSubmitted(savedId);
  };

  const steps = [
    { number: 1, label: 'About You' },
    { number: 2, label: 'Project' },
    { number: 3, label: 'Impact' },
    { number: 4, label: 'Budget' },
    { number: 5, label: 'Acknowledgements' },
    { number: 6, label: 'Review & Submit' },
  ];

  if (userPendingFinalReport) {
    return (
      <div className="max-w-3xl mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 shadow-md text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[#062A3D]">Final Report Required</h2>
        <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
          According to NEF guidelines, a past grant recipient must submit their final project report before applying for a new grant. Please open your teacher dashboard to complete your report.
        </p>
        <button
          onClick={onCancel}
          className="px-6 py-2.5 rounded-xl font-semibold bg-[#062A3D] text-white text-xs hover:bg-[#0A3D59]"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header and Auto-save Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-xs uppercase font-bold tracking-wider text-[#8CC8E8] bg-[#062A3D] inline-block px-2 py-0.5 rounded">
            NEF Innovative Teaching Grant
          </div>
          <h1 className="text-2xl font-bold text-[#062A3D] mt-1">
            {formData.title || 'New Grant Proposal'}
          </h1>
        </div>

        <div className="flex items-center space-x-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            {isSaving ? (
              <span className="text-[#8CC8E8] font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#8CC8E8] animate-ping" />
                Auto-saving...
              </span>
            ) : lastSavedTime ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Draft saved ({lastSavedTime})
              </span>
            ) : (
              <span>Draft auto-saves automatically</span>
            )}
          </div>

          <button
            type="button"
            onClick={performSave}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1 transition"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>Save Draft</span>
          </button>
        </div>
      </div>

      {/* Multi-Step Progress Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          {steps.map((st, idx) => {
            const isCompleted = currentStep > st.number;
            const isCurrent = currentStep === st.number;
            return (
              <React.Fragment key={st.number}>
                <div
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => setCurrentStep(st.number)}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition shadow-xs ${
                      isCurrent
                        ? 'bg-[#062A3D] text-[#8CC8E8] ring-4 ring-[#8CC8E8]/30'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : st.number}
                  </div>
                  <span
                    className={`text-[11px] font-semibold mt-1 hidden md:block ${
                      isCurrent
                        ? 'text-[#062A3D]'
                        : isCompleted
                        ? 'text-emerald-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded transition ${
                      currentStep > st.number ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step View Switcher */}
      <div className="space-y-6">
        {currentStep === 1 && (
          <Step1AboutYou formData={formData} setFormData={setFormData} />
        )}

        {currentStep === 2 && (
          <Step2ProjectDesc formData={formData} setFormData={setFormData} />
        )}

        {currentStep === 3 && (
          <Step3ImpactPartners formData={formData} setFormData={setFormData} />
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-xl font-bold text-[#062A3D]">Step 4 – Budget Builder</h2>
              <p className="text-xs text-slate-600 mt-1">
                Build your itemized proposal budget with real-time approved vendor checking and AI alternatives.
              </p>
            </div>
            <BudgetBuilder
              items={formData.budgetItems || []}
              onChange={handleBudgetChange}
              category={formData.category || 'Category 1'}
              categoryCap={categoryCap}
              approvedVendors={vendors}
            />
          </div>
        )}

        {currentStep === 5 && (
          <Step5Acknowledgements formData={formData} setFormData={setFormData} />
        )}

        {currentStep === 6 && (
          <Step6ReviewSubmit
            formData={formData}
            onSubmit={handleFinalSubmit}
            onEditStep={(stepNum) => setCurrentStep(stepNum)}
            categoryCap={categoryCap}
          />
        )}
      </div>

      {/* Navigation Footer */}
      <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (currentStep > 1) {
              setCurrentStep(currentStep - 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              onCancel();
            }
          }}
          className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>{currentStep === 1 ? 'Cancel & Return' : 'Back'}</span>
        </button>

        {currentStep < 6 && (
          <button
            type="button"
            onClick={() => {
              setCurrentStep(currentStep + 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-6 py-2.5 rounded-xl bg-[#062A3D] text-white hover:bg-[#0A3D59] text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <span>Continue to Next Step</span>
            <ArrowRight className="w-4 h-4 text-[#8CC8E8]" />
          </button>
        )}
      </div>
    </div>
  );
};
