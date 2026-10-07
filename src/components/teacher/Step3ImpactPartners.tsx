import React from 'react';
import { Application } from '../../types/grant';
import { countWords } from './Step2ProjectDesc';
import { CheckSquare, Users2, RefreshCw, AlertCircle } from 'lucide-react';

interface Step3Props {
  formData: Partial<Application>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Application>>>;
}

export const Step3ImpactPartners: React.FC<Step3Props> = ({ formData, setFormData }) => {
  const evalWords = countWords(formData.evaluationStrategy || '');
  const partnerWords = countWords(formData.partners || '');
  const sustainWords = countWords(formData.sustainability || '');

  const wordLimit = 150;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-[#062A3D]">Step 3 – Impact, Partners & Sustainability</h2>
        <p className="text-xs text-slate-600 mt-1">
          Demonstrate how you will measure student success, collaborate with stakeholders, and sustain the initiative.
        </p>
      </div>

      {/* Question 12: Evaluation Strategy (<=150 words) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-[#8CC8E8]" />
            <label className="block text-sm font-bold text-[#062A3D]">
              12. Evaluation Strategy (≤150 words) <span className="text-rose-500">*</span>
            </label>
          </div>

          <span
            className={`text-xs font-bold px-2 py-0.5 rounded ${
              evalWords > wordLimit
                ? 'bg-rose-100 text-rose-700'
                : evalWords > 130
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {evalWords} / {wordLimit} words
          </span>
        </div>

        <p className="text-xs text-slate-600">
          How you will measure success related to your stated objectives. (e.g. Pre/post tests, performance rubrics, portfolios, behavioral logs).
        </p>

        <textarea
          rows={4}
          required
          placeholder="Describe assessment tools and methods directly measuring each objective listed in Step 2..."
          value={formData.evaluationStrategy || ''}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, evaluationStrategy: e.target.value }))
          }
          className={`w-full text-xs rounded-lg border p-3 bg-white focus:outline-none focus:ring-2 ${
            evalWords > wordLimit
              ? 'border-rose-400 focus:ring-rose-400'
              : 'border-slate-200 focus:ring-[#8CC8E8]'
          }`}
        />

        {evalWords > wordLimit && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Word count exceeded! Please reduce to 150 words or fewer.</span>
          </div>
        )}
      </div>

      {/* Question 13: Partners (<=150 words) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users2 className="w-5 h-5 text-[#8CC8E8]" />
            <label className="block text-sm font-bold text-[#062A3D]">
              13. Partners (≤150 words) <span className="text-rose-500">*</span>
            </label>
          </div>

          <span
            className={`text-xs font-bold px-2 py-0.5 rounded ${
              partnerWords > wordLimit
                ? 'bg-rose-100 text-rose-700'
                : partnerWords > 130
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {partnerWords} / {wordLimit} words
          </span>
        </div>

        <p className="text-xs text-slate-600">
          List any school and/or community partners and their roles. (e.g. SFA faculty, local libraries, parent organizations, district curriculum specialists).
        </p>

        <textarea
          rows={4}
          required
          placeholder="List collaborating educators, community organizations, or university partners..."
          value={formData.partners || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, partners: e.target.value }))}
          className={`w-full text-xs rounded-lg border p-3 bg-white focus:outline-none focus:ring-2 ${
            partnerWords > wordLimit
              ? 'border-rose-400 focus:ring-rose-400'
              : 'border-slate-200 focus:ring-[#8CC8E8]'
          }`}
        />

        {partnerWords > wordLimit && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Word count exceeded! Please reduce to 150 words or fewer.</span>
          </div>
        )}
      </div>

      {/* Question 14: Sustainability (<=150 words) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 text-[#8CC8E8]" />
            <label className="block text-sm font-bold text-[#062A3D]">
              14. Sustainability (≤150 words) <span className="text-rose-500">*</span>
            </label>
          </div>

          <span
            className={`text-xs font-bold px-2 py-0.5 rounded ${
              sustainWords > wordLimit
                ? 'bg-rose-100 text-rose-700'
                : sustainWords > 130
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {sustainWords} / {wordLimit} words
          </span>
        </div>

        <div className="text-xs text-slate-600 space-y-1">
          <p>How will the program or project be sustained in future years?</p>
          <p className="text-slate-500 italic">
            Tip: Mention recurring costs in future years and plan for maintenance or reuse.
          </p>
        </div>

        <textarea
          rows={4}
          required
          placeholder="Explain how equipment will be preserved, recurring costs handled, and curriculum continued..."
          value={formData.sustainability || ''}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, sustainability: e.target.value }))
          }
          className={`w-full text-xs rounded-lg border p-3 bg-white focus:outline-none focus:ring-2 ${
            sustainWords > wordLimit
              ? 'border-rose-400 focus:ring-rose-400'
              : 'border-slate-200 focus:ring-[#8CC8E8]'
          }`}
        />

        {sustainWords > wordLimit && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Word count exceeded! Please reduce to 150 words or fewer.</span>
          </div>
        )}
      </div>
    </div>
  );
};
