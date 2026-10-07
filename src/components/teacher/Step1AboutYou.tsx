import React, { useEffect } from 'react';
import { Application } from '../../types/grant';
import { Plus, Trash2, Users, Building, GraduationCap, BookOpen, AlertCircle } from 'lucide-react';

interface Step1Props {
  formData: Partial<Application>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Application>>>;
}

export const NISD_CAMPUSES = [
  'Brooks Quinn Jones Elementary',
  'Carpenter Elementary',
  'Fredonia Early Childhood Center',
  'Mike Moses Elementary',
  'Raguet Elementary',
  'Thomas J Rusk Elementary',
  'McMichael Middle School',
  'Margie Chumbley',
  'Nacogdoches High School',
];

const GRADE_LEVELS = [
  'PK',
  'K',
  '1st',
  '2nd',
  '3rd',
  '4th',
  '5th',
  '6th',
  '7th',
  '8th',
  '9th',
  '10th',
  '11th',
  '12th',
  'Other',
];

export const Step1AboutYou: React.FC<Step1Props> = ({ formData, setFormData }) => {
  const applicantNames = formData.applicantNames || [
    { name: '', email: formData.applicantEmail || '' },
  ];

  // Auto-suggest Category 2 when 3+ team members are listed
  useEffect(() => {
    if (applicantNames.length >= 3 && formData.category !== 'Category 2') {
      setFormData((prev) => ({
        ...prev,
        category: 'Category 2',
      }));
    }
  }, [applicantNames.length, formData.category, setFormData]);

  const addTeamMember = () => {
    const updated = [...applicantNames, { name: '', email: '' }];
    setFormData((prev) => ({ ...prev, applicantNames: updated }));
  };

  const removeTeamMember = (index: number) => {
    if (applicantNames.length <= 1) return;
    const updated = applicantNames.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, applicantNames: updated }));
  };

  const updateTeamMember = (index: number, field: 'name' | 'email', value: string) => {
    const updated = [...applicantNames];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({
      ...prev,
      applicantNames: updated,
      applicantEmail: index === 0 && field === 'email' ? value : prev.applicantEmail,
    }));
  };

  const toggleGrade = (grade: string) => {
    const current = formData.gradeLevels || [];
    const exists = current.includes(grade);
    const updated = exists ? current.filter((g) => g !== grade) : [...current, grade];
    setFormData((prev) => ({ ...prev, gradeLevels: updated }));
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-[#062A3D]">Step 1 – About You & Your Team</h2>
        <p className="text-xs text-slate-600 mt-1">
          Tell us about yourself, your collaborators, and your campus within Nacogdoches ISD.
        </p>
      </div>

      {/* Question 1 & 2: Primary Applicant & Team Members */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#8CC8E8]" />
            <h3 className="text-sm font-bold text-[#062A3D]">
              1. Email & 2. Applicant Name(s) <span className="text-rose-500">*</span>
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {applicantNames.length} Team Member{applicantNames.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-3">
          {applicantNames.map((member, index) => (
            <div
              key={index}
              className="p-3 rounded-lg border border-slate-200 bg-[#F4F7F9]/50 flex flex-col sm:flex-row items-center gap-3"
            >
              <div className="w-full sm:w-1/2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {index === 0 ? 'Lead Applicant Full Name' : `Team Member #${index + 1} Name`}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Kernen"
                  value={member.name}
                  onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
                />
              </div>

              <div className="w-full sm:w-1/2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  NISD Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@nacisd.org"
                  value={member.email}
                  onChange={(e) => updateTeamMember(index, 'email', e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
                />
              </div>

              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeTeamMember(index)}
                  className="self-end sm:self-center p-2 text-slate-400 hover:text-rose-600 rounded-lg"
                  title="Remove team member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addTeamMember}
          className="text-xs font-semibold text-[#062A3D] hover:text-[#0A3D59] flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-100 transition"
        >
          <Plus className="w-4 h-4 text-[#8CC8E8]" />
          <span>Add Co-Applicant / Team Member</span>
        </button>

        {applicantNames.length >= 3 && (
          <div className="p-3 bg-[#8CC8E8]/15 border border-[#8CC8E8]/40 rounded-lg text-xs text-[#062A3D] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#062A3D] flex-shrink-0" />
            <span>
              <strong>Team proposal detected:</strong> You have 3 or more members listed. We have auto-selected <strong>Category 2</strong> (up to $4,500 budget cap).
            </span>
          </div>
        )}
      </div>

      {/* Question 3: Campus */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <Building className="w-5 h-5 text-[#8CC8E8]" />
          <h3 className="text-sm font-bold text-[#062A3D]">
            3. Campus <span className="text-rose-500">*</span>
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Select your primary instructional campus. (Note: Campus names are automatically masked for blind review).
        </p>
        <select
          required
          value={formData.campus || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, campus: e.target.value }))}
          className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
        >
          <option value="" disabled>
            Select your NISD campus...
          </option>
          {NISD_CAMPUSES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Question 4: Grade Level(s) - Chip Picker */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <GraduationCap className="w-5 h-5 text-[#8CC8E8]" />
          <h3 className="text-sm font-bold text-[#062A3D]">
            4. Grade Level(s) Impacted <span className="text-rose-500">*</span>
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Select all grade levels directly participating in this project.
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          {GRADE_LEVELS.map((grade) => {
            const isSelected = (formData.gradeLevels || []).includes(grade);
            return (
              <button
                type="button"
                key={grade}
                onClick={() => toggleGrade(grade)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-[#062A3D] text-[#8CC8E8] shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {grade}
              </button>
            );
          })}
        </div>
        {(formData.gradeLevels || []).length === 0 && (
          <span className="text-[11px] text-amber-600 block">
            Please pick at least one grade level.
          </span>
        )}
      </div>

      {/* Question 5: Subject Area / Department */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-[#8CC8E8]" />
          <h3 className="text-sm font-bold text-[#062A3D]">
            5. Subject Area / Department <span className="text-rose-500">*</span>
          </h3>
        </div>
        <input
          type="text"
          required
          placeholder="e.g. 4th Grade Science & Robotics, High School Visual Arts, PK Bilingual Literacy"
          value={formData.subjectArea || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, subjectArea: e.target.value }))}
          className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
        />
      </div>

      {/* NEW: Grant Category Picker */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#062A3D]">
            Grant Category <span className="text-rose-500">*</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Category determines your budget cap ($1,500 vs $4,500).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label
            className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
              formData.category === 'Category 1'
                ? 'border-[#062A3D] bg-[#062A3D]/5'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <input
                type="radio"
                name="grantCategory"
                checked={formData.category === 'Category 1'}
                onChange={() => setFormData((prev) => ({ ...prev, category: 'Category 1' }))}
                className="text-[#062A3D] focus:ring-[#8CC8E8]"
              />
              <span className="text-xs font-bold text-[#062A3D] bg-white px-2 py-0.5 rounded border border-slate-200">
                Up to $1,500
              </span>
            </div>
            <div className="mt-2">
              <div className="text-xs font-bold text-[#062A3D]">Category 1</div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                Individual teacher proposals and single classroom initiatives.
              </div>
            </div>
          </label>

          <label
            className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
              formData.category === 'Category 2'
                ? 'border-[#062A3D] bg-[#8CC8E8]/10'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <input
                type="radio"
                name="grantCategory"
                checked={formData.category === 'Category 2'}
                onChange={() => setFormData((prev) => ({ ...prev, category: 'Category 2' }))}
                className="text-[#062A3D] focus:ring-[#8CC8E8]"
              />
              <span className="text-xs font-bold text-[#062A3D] bg-white px-2 py-0.5 rounded border border-slate-200">
                Up to $4,500
              </span>
            </div>
            <div className="mt-2">
              <div className="text-xs font-bold text-[#062A3D]">Category 2</div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                Campus teams (3+ teachers), departments, and district-wide programs.
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
