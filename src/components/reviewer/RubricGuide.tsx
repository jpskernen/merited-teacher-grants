import React from 'react';
import { useGrant } from '../../context/GrantContext';
import { Sliders, CheckCircle2, Shield, Info, HelpCircle } from 'lucide-react';

export const RubricGuide: React.FC = () => {
  const { rubric, programSettings } = useGrant();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-6 h-6 text-[#8CC8E8]" />
          <h1 className="text-2xl font-bold text-[#062A3D]">NEF Official Scoring Rubric</h1>
        </div>
        <p className="text-xs text-slate-600 mt-1">
          Standardized 8-criterion evaluation rubric utilized by the Nacogdoches ISD Education Foundation review committee.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="font-bold text-[#062A3D]">Scale: 1 to 5 Points</div>
          <div className="text-slate-500">
            1 = Missing/Unclear • 3 = Adequate • 5 = Exceptional
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="font-bold text-[#062A3D]">Mandatory Observations</div>
          <div className="text-slate-500">
            Every scored criterion requires a written evaluator rationale.
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="font-bold text-[#062A3D]">Pass/Fail Eligibility</div>
          <div className="text-slate-500">
            Checklist items (certifications, caps, past reports) must all pass.
          </div>
        </div>
      </div>

      {/* Criteria Breakdown */}
      <div className="space-y-4">
        {rubric.map((crit, idx) => (
          <div
            key={crit.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-sm font-bold text-[#062A3D]">
                  Criterion {idx + 1}: {crit.title}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">{crit.helper}</p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-[#062A3D] text-[#8CC8E8]">
                Weight: {crit.weight}x
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                <span className="font-bold text-rose-800 text-[11px]">Level 1 (Missing / Unclear):</span>
                <p className="text-slate-700 mt-1">{crit.levelDescriptors.level1}</p>
              </div>

              <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-100">
                <span className="font-bold text-[#062A3D] text-[11px]">Level 3 (Adequate):</span>
                <p className="text-slate-700 mt-1">{crit.levelDescriptors.level3}</p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="font-bold text-emerald-800 text-[11px]">Level 5 (Exceptional):</span>
                <p className="text-slate-700 mt-1">{crit.levelDescriptors.level5}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
