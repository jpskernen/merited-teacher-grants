import React from 'react';
import { Application } from '../../types/grant';
import { Target, Compass, Sparkles, DollarSign, Users, AlertCircle } from 'lucide-react';

interface Step2Props {
  formData: Partial<Application>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Application>>>;
}

export const countWords = (str: string): number => {
  if (!str) return 0;
  return str
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
};

export const Step2ProjectDesc: React.FC<Step2Props> = ({ formData, setFormData }) => {
  const abstractWords = countWords(formData.abstract || '');
  const abstractLimit = 250;
  const isAbstractOver = abstractWords > abstractLimit;

  const focusOptions = [
    'STEM',
    'Early Literacy/Numeracy',
    'Workforce/Career-Connected Learning',
    'Fine Arts',
    'Other',
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-[#062A3D]">Step 2 – Project Description</h2>
        <p className="text-xs text-slate-600 mt-1">
          Define your proposal's vision, curriculum objectives, and instructional innovation.
        </p>
      </div>

      {/* Question 6: Project Title */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
        <label className="block text-sm font-bold text-[#062A3D]">
          6. Project Title <span className="text-rose-500">*</span>
        </label>
        <p className="text-xs text-slate-500">
          Give your project an engaging, memorable title describing what students will experience.
        </p>
        <input
          type="text"
          required
          placeholder="e.g. Sensory Coding & Micro-Ecology Discovery Lab"
          value={formData.title || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
        />
      </div>

      {/* Question 7: Objective Statement and TEKS */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-[#8CC8E8]" />
          <label className="block text-sm font-bold text-[#062A3D]">
            7. Objective Statement and TEKS (or measurable objectives){' '}
            <span className="text-rose-500">*</span>
          </label>
        </div>

        <div className="p-3 bg-[#F4F7F9] rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
          <p>
            <strong>Helper:</strong> State specific, measurable objectives and reference TEKS where applicable.
          </p>
          <p className="text-slate-500">
            <strong>Tips:</strong> Limit the number of objectives/TEKS; be specific. Focus on tangible student learning outcomes.
          </p>
        </div>

        <textarea
          rows={4}
          required
          placeholder="1. Students will measure and graph soil moisture variables... (TEKS 4.9A)&#10;2. 85% of participating students will demonstrate proficiency..."
          value={formData.objectives || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, objectives: e.target.value }))}
          className="w-full text-xs rounded-lg border border-slate-200 p-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
        />
      </div>

      {/* Question 8: Area of Focus */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <Compass className="w-5 h-5 text-[#8CC8E8]" />
          <label className="block text-sm font-bold text-[#062A3D]">
            8. Area of Focus <span className="text-rose-500">*</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {focusOptions.map((opt) => (
            <label
              key={opt}
              className={`p-3 rounded-lg border-2 cursor-pointer transition flex items-center space-x-2.5 text-xs font-semibold ${
                formData.areaOfFocus === opt
                  ? 'border-[#062A3D] bg-[#062A3D]/5 text-[#062A3D]'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="areaOfFocus"
                checked={formData.areaOfFocus === opt}
                onChange={() => setFormData((prev) => ({ ...prev, areaOfFocus: opt as any }))}
                className="text-[#062A3D] focus:ring-[#8CC8E8]"
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>

        {formData.areaOfFocus === 'Other' && (
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Please specify your area of focus:
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Social-Emotional Sensory Regulation, Life Skills & Adaptive PE"
              value={formData.areaOfFocusOther || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, areaOfFocusOther: e.target.value }))
              }
              className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
            />
          </div>
        )}
      </div>

      {/* Question 9: Abstract: Description of Proposal (<=250 words) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#8CC8E8]" />
            <label className="block text-sm font-bold text-[#062A3D]">
              9. Abstract: Description of Proposal (≤250 words){' '}
              <span className="text-rose-500">*</span>
            </label>
          </div>

          <span
            className={`text-xs font-bold px-2 py-0.5 rounded ${
              isAbstractOver
                ? 'bg-rose-100 text-rose-700'
                : abstractWords > 220
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {abstractWords} / {abstractLimit} words
          </span>
        </div>

        <div className="p-3 bg-[#F4F7F9] rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
          <p>
            <strong>Helper:</strong> What you will do, activities/timeline, and why it is innovative? Evaluators may not all be educators, so avoid jargon and acronyms.
          </p>
          <p className="text-slate-500">
            <strong>Tips:</strong> Describe the problem addressed, show how the project supports the purpose, list implementation steps, include data that supports the need and how it addresses campus and district goals.
          </p>
        </div>

        <textarea
          rows={6}
          required
          placeholder="Describe your classroom proposal, student activities, timeline, and innovative impact..."
          value={formData.abstract || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, abstract: e.target.value }))}
          className={`w-full text-xs rounded-lg border p-3 bg-white focus:outline-none focus:ring-2 ${
            isAbstractOver
              ? 'border-rose-400 focus:ring-rose-400'
              : 'border-slate-200 focus:ring-[#8CC8E8]'
          }`}
        />

        {isAbstractOver && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>
              <strong>Word count exceeded!</strong> Please trim your abstract to 250 words or fewer before submitting.
            </span>
          </div>
        )}
      </div>

      {/* Question 10 & 11: Amount Requested (read-only) & Students Impacted */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Question 10 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <label className="block text-sm font-bold text-[#062A3D]">
              10. Amount Requested <span className="text-rose-500">*</span>
            </label>
          </div>
          <p className="text-xs text-slate-500">
            Auto-calculated from your itemized Budget Builder in Step 4 (read-only).
          </p>
          <div className="text-xl font-extrabold text-[#062A3D] bg-slate-100 p-3 rounded-lg border border-slate-200">
            ${(formData.amountRequested || 0).toFixed(2)}
          </div>
        </div>

        {/* Question 11 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#8CC8E8]" />
            <label className="block text-sm font-bold text-[#062A3D]">
              11. Number of Students Impacted <span className="text-rose-500">*</span>
            </label>
          </div>
          <p className="text-xs text-slate-500">
            Whole number estimate of students directly benefiting during the grant cycle.
          </p>
          <input
            type="number"
            min="1"
            required
            placeholder="e.g. 120"
            value={formData.studentsImpacted || ''}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                studentsImpacted: parseInt(e.target.value) || 0,
              }))
            }
            className="w-full text-base font-bold rounded-lg border border-slate-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
          />
        </div>
      </div>
    </div>
  );
};
