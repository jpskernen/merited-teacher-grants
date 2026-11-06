import React, { useState } from 'react';
import { useGrant } from '../../context/GrantContext';
import {
  Sliders,
  CheckCircle2,
  Shield,
  Info,
  HelpCircle,
  Scale,
  Award,
  AlertTriangle,
  UserCheck,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const RubricGuide: React.FC = () => {
  const { rubric, programSettings } = useGrant();
  const [showSafeguards, setShowSafeguards] = useState(true);
  const [showRationals, setShowRationals] = useState(true);

  const totalPoints = rubric.reduce((sum, c) => sum + (c.weight || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#062A3D] text-[#8CC8E8] flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[#062A3D]">
                  NISD Education Foundation Scoring Matrix
                </h1>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  100-Point Standard
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Built directly from the questions on the teacher application form. Reviewers score evidence-based answers.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-slate-500">Total Available Points:</span>
            <div className="text-xl font-extrabold text-[#062A3D]">{totalPoints} Points</div>
          </div>
        </div>
      </div>

      {/* Step 1: Eligibility Gate (Pass / Fail) */}
      <div className="bg-white rounded-2xl border-2 border-emerald-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider">
              Step 1
            </span>
            <h2 className="text-base font-bold text-[#062A3D]">
              Eligibility Gate (Pass / Fail — Not Scored)
            </h2>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Screened before anyone scores
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Screen these 5 threshold requirements before committee members begin scoring, so evaluators are never marking down good teaching ideas for paperwork or technical oversights:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-[#062A3D] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>1. Eligible NISD Educator or Instructional Team</span>
            </div>
            <p className="text-slate-600 pl-5 text-[11px]">
              Applicant is an NISD teacher or team in classroom instruction or student support.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-[#062A3D] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>2. Category Funding Cap Adherence</span>
            </div>
            <p className="text-slate-600 pl-5 text-[11px]">
              Amount is strictly within cap: up to $1,500 for Category 1, up to $4,500 for Category 2 team grants.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-[#062A3D] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>3. All Three Acknowledgements (Q16–Q18) & E-Signature</span>
            </div>
            <p className="text-slate-600 pl-5 text-[11px]">
              Q16 (Timeline), Q17 (NISD Property), and Q18 (Administrative approvals) are all "Yes", and electronic signature is signed.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-[#062A3D] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>4. No Prohibited Costs</span>
            </div>
            <p className="text-slate-600 pl-5 text-[11px]">
              No standalone training or travel not tied to the project, and zero items the district already provides through local budgets.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 md:col-span-2">
            <div className="font-bold text-[#062A3D] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>5. Past Recipient Accountability Gate</span>
            </div>
            <p className="text-slate-600 pl-5 text-[11px]">
              Any applicant who received an NEF grant in prior cycles must have turned in their completed final report and receipt reconciliation.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Fixable Items Protocol:</strong> If an application fails only on a fixable paperwork item (e.g. clarification on vendor pricing, missing e-signature, or unresolved prior report receipt), the administrator sends it back as <strong>"More Info Needed"</strong> instead of rejecting it.
          </span>
        </div>
      </div>

      {/* Step 2: Scoring Matrix (100 Points) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-[#062A3D] text-[#8CC8E8] text-xs font-bold uppercase tracking-wider">
              Step 2
            </span>
            <h2 className="text-base font-bold text-[#062A3D]">
              Scoring Matrix (100 Total Points)
            </h2>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Formula: <strong>(score ÷ 5) × weight</strong> (Each criterion scored 1 to 5)
          </div>
        </div>

        <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200 text-xs text-sky-950 flex items-start gap-2">
          <BookOpen className="w-4 h-4 text-sky-700 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Evidence-Based Reading Rule:</strong> Before scoring each criterion, reviewers should read <em>only</em> the matching question(s) in the "Form source" column. This keeps the scoring strictly grounded in evidence rather than general impressions.
          </p>
        </div>

        {/* Matrix Table & Cards */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#062A3D] text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-bold">Criterion</th>
                  <th className="py-3 px-3 font-bold">Form Source</th>
                  <th className="py-3 px-3 font-bold text-center">Weight</th>
                  <th className="py-3 px-4 font-bold text-rose-300">1 = Missing/Unclear</th>
                  <th className="py-3 px-4 font-bold text-sky-300">3 = Adequate</th>
                  <th className="py-3 px-4 font-bold text-emerald-300">5 = Exceptional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rubric.map((crit, idx) => (
                  <tr key={crit.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-[#062A3D] align-top">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-mono text-[10px]">{idx + 1}.</span>
                        <span>{crit.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5 max-w-xs">
                        {crit.helper}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 align-top whitespace-nowrap">
                      <span className="px-2 py-1 rounded bg-[#062A3D]/5 text-[#062A3D] font-bold text-[11px] border border-[#062A3D]/15 font-mono">
                        {crit.formSource}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 align-top text-center whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full bg-[#062A3D] text-[#8CC8E8] font-extrabold text-xs">
                        {crit.weight} pts
                      </span>
                    </td>

                    <td className="py-3.5 px-4 align-top text-slate-700 bg-rose-50/30 text-[11px] max-w-xs">
                      {crit.levelDescriptors.level1}
                    </td>

                    <td className="py-3.5 px-4 align-top text-slate-700 bg-sky-50/30 text-[11px] max-w-xs">
                      {crit.levelDescriptors.level3}
                    </td>

                    <td className="py-3.5 px-4 align-top text-slate-700 bg-emerald-50/30 text-[11px] max-w-xs">
                      {crit.levelDescriptors.level5}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Why These Weights Are Fair */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <button
          onClick={() => setShowRationals(!showRationals)}
          className="w-full flex items-center justify-between text-left text-base font-bold text-[#062A3D]"
        >
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#8CC8E8]" />
            <span>Why These Weights Are Fair</span>
          </div>
          {showRationals ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {showRationals && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <h4 className="font-bold text-[#062A3D]">Innovation, Need, and Objectives Carry Half the Points (50 pts)</h4>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Innovation & design (20 pts), Need & alignment (15 pts), and Objectives (15 pts) together make up 50 of the 100 points. That is the fundamental reason the grant exists: to fund innovative ideas that solve real classroom needs.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <h4 className="font-bold text-[#062A3D]">Partners Are Worth Only 5 Points</h4>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                The application form does not require partners, and some campuses naturally have fewer external partnerships. A heavier weight would penalize dedicated teachers for their geographic or campus circumstances, rather than the intrinsic merit of their pedagogical idea.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <h4 className="font-bold text-[#062A3D]">Student Impact Judged Relative to Category (15 pts)</h4>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                A $1,500 Category 1 project that deeply changes learning for one classroom of 22 students can earn a full 5. Otherwise Category 1 solo teachers would lose to large campus-wide team grants on raw headcount alone. A useful guide is cost per student plus how intensive the experience is, without turning it into a rigid mechanical formula.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <h4 className="font-bold text-[#062A3D]">Writing Polish Is NOT a Criterion</h4>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Review committee evaluators include non-educators and community members, and the form explicitly instructs teachers to avoid jargon and explain projects in plain language. Evaluators must score the quality of the teaching idea, not the literary prose.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Process Safeguards */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <button
          onClick={() => setShowSafeguards(!showSafeguards)}
          className="w-full flex items-center justify-between text-left text-base font-bold text-[#062A3D]"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#8CC8E8]" />
            <span>Process Safeguards & Committee Protocols</span>
          </div>
          {showSafeguards ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {showSafeguards && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs pt-2">
            <div className="p-3.5 rounded-xl bg-[#F4F7F9] border border-slate-200 space-y-1">
              <div className="font-bold text-[#062A3D] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8CC8E8]"></span>
                <span>Blind Review</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Hide applicant names and campus. The form already asks applicants not to name their campus in the narrative to prevent subconscious bias.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F4F7F9] border border-slate-200 space-y-1">
              <div className="font-bold text-[#062A3D] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8CC8E8]"></span>
                <span>Calibration Round</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Before the real round, all reviewers score the same one or two sample applications and talk through any gaps of 2 or more points to align expectations.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F4F7F9] border border-slate-200 space-y-1">
              <div className="font-bold text-[#062A3D] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8CC8E8]"></span>
                <span>Required Written Comments</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Mandatory one-line comment on every score. It forces reviewers to point to evidence and provides constructive feedback for un-funded proposals.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F4F7F9] border border-slate-200 space-y-1">
              <div className="font-bold text-[#062A3D] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8CC8E8]"></span>
                <span>Conflicts & Voting</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Reviewers recuse themselves from their own campus or any colleague's proposal. Non-voting reviewers (e.g. ED) can comment, but scores do not count.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F4F7F9] border border-slate-200 space-y-1">
              <div className="font-bold text-[#062A3D] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8CC8E8]"></span>
                <span>Disagreements (≥2 Point Gap)</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Average the voting reviewers. If any individual criterion has reviewers 2 or more points apart, the committee discusses it before deciding.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F4F7F9] border border-slate-200 space-y-1">
              <div className="font-bold text-[#062A3D] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8CC8E8]"></span>
                <span>Tie-Breakers Order</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                In case of ties: <strong>1. Student impact</strong>, then <strong>2. Sustainability</strong>, then <strong>3. Spreading awards across NISD campuses</strong>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
