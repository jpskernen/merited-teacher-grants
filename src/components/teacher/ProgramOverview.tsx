import React from 'react';
import { useGrant } from '../../context/GrantContext';
import {
  Calendar,
  DollarSign,
  CheckCircle,
  HelpCircle,
  FileText,
  Lightbulb,
  Shield,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

interface ProgramOverviewProps {
  onStartApplication: () => void;
}

export const ProgramOverview: React.FC<ProgramOverviewProps> = ({
  onStartApplication,
}) => {
  const { programSettings, userPendingFinalReport } = useGrant();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-br from-[#062A3D] to-[#0A3D59] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#8CC8E8]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8CC8E8]/20 border border-[#8CC8E8]/40 text-[#8CC8E8] text-xs font-semibold uppercase tracking-wider">
            Nacogdoches ISD Education Foundation
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-sans">
            Innovative Teaching Grant Program
          </h1>
          <p className="text-slate-200 text-base sm:text-lg leading-relaxed">
            Welcome, Nacogdoches educators! The NEF Innovative Teaching Grants empower teachers
            to bring bold, creative, and transformative learning experiences to life in NISD classrooms.
            We encourage you to dream big for your students.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={onStartApplication}
              disabled={userPendingFinalReport}
              className={`px-6 py-3 rounded-xl font-bold text-[#062A3D] bg-[#8CC8E8] hover:bg-[#a0d4ef] shadow-lg transition flex items-center gap-2 ${
                userPendingFinalReport ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FileText className="w-5 h-5 text-[#062A3D]" />
              <span>{userPendingFinalReport ? 'Final Report Required Before Applying' : 'Begin Your Application'}</span>
              {!userPendingFinalReport && <ArrowRight className="w-4 h-4 ml-1" />}
            </button>
          </div>

          {userPendingFinalReport && (
            <div className="mt-4 p-3.5 rounded-lg bg-amber-500/20 border border-amber-400/50 flex items-start gap-2.5 text-xs text-amber-100">
              <AlertTriangle className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Notice:</strong> Program rules state that a past grant recipient must submit a final project report before applying for a new grant. Please submit your final report in your dashboard to unlock this cycle's application.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cycle Dates Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-3.5">
          <div className="p-2.5 rounded-lg bg-[#062A3D]/5 text-[#062A3D]">
            <Calendar className="w-5 h-5 text-[#062A3D]" />
          </div>
          <div>
            <div className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
              Call for Grants
            </div>
            <div className="text-base font-bold text-[#062A3D] mt-0.5">
              {programSettings.callForGrantsDate}
            </div>
            <div className="text-xs text-slate-500 mt-1">Application window opens</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-3.5">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700">
            <Calendar className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-xs uppercase font-semibold text-amber-700 tracking-wider">
              Applications Due
            </div>
            <div className="text-base font-bold text-[#062A3D] mt-0.5">
              {programSettings.applicationsDueDate}
            </div>
            <div className="text-xs text-slate-500 mt-1">Firm deadline at 11:59 PM CT</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-3.5">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs uppercase font-semibold text-emerald-700 tracking-wider">
              Awards Announced
            </div>
            <div className="text-base font-bold text-[#062A3D] mt-0.5">
              {programSettings.awardsAnnouncedDate}
            </div>
            <div className="text-xs text-slate-500 mt-1">Surprise grant patrol visits</div>
          </div>
        </div>
      </div>

      {/* Grant Categories */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[#062A3D]">Grant Categories & Funding Caps</h2>
          <p className="text-sm text-slate-600 mt-1">
            Choose the grant category that best fits your project scope.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl border-2 border-slate-200 bg-[#F4F7F9]/50 hover:border-[#8CC8E8] transition space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-[#062A3D] text-white">
                Category 1
              </span>
              <span className="text-xl font-extrabold text-[#062A3D]">
                Up to ${programSettings.category1Cap.toLocaleString()}
              </span>
            </div>
            <h3 className="text-base font-bold text-[#062A3D]">Individual Teacher Proposals</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Designed for single-classroom initiatives, pilot programs, or specialized instructional interventions led by an individual teacher.
            </p>
            <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Ideal for 1 educator testing innovative ideas</span>
            </div>
          </div>

          <div className="p-6 rounded-xl border-2 border-[#8CC8E8]/60 bg-[#8CC8E8]/5 hover:border-[#8CC8E8] transition space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-[#8CC8E8] text-[#062A3D]">
                Category 2
              </span>
              <span className="text-xl font-extrabold text-[#062A3D]">
                Up to ${programSettings.category2Cap.toLocaleString()}
              </span>
            </div>
            <h3 className="text-base font-bold text-[#062A3D]">Campus Teams, Departments & District Programs</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              For teams of 3 or more teachers, grade-level bands, academic departments, or collaborative initiatives serving broader student cohorts.
            </p>
            <div className="text-xs text-slate-700 flex items-center gap-1.5 pt-2 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Requires 3+ educators listed on proposal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Program Eligibility & Responsibilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center space-x-2 text-[#062A3D]">
            <Shield className="w-5 h-5 text-[#8CC8E8]" />
            <h3 className="text-base font-bold">Eligibility & Guidelines</h3>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>All NISD certified teachers and instructional support specialists are eligible.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>Grants <strong>cannot</strong> fund general teacher training, travel (unless tied directly to curriculum implementation), or items already supplied by NISD.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>All non-consumable equipment remains the permanent property of the campus/district.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>Funds must be fully spent and implemented by <strong>{programSettings.spendingDeadlineDate}</strong> (end of following school year).</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center space-x-2 text-[#062A3D]">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold">Tips for a Successful Application</h3>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-700">
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#062A3D]">•</span>
              <span><strong>Keep it plain-language:</strong> Community evaluators evaluate proposals alongside educators. Avoid acronyms and jargon.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#062A3D]">•</span>
              <span><strong>Respect blind review:</strong> Do not name your campus in narrative questions; focus on student learning needs.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#062A3D]">•</span>
              <span><strong>Tie evaluation to objectives:</strong> Make sure your metrics in Step 3 measure every goal listed in Step 2.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#062A3D]">•</span>
              <span><strong>Use approved vendors:</strong> Our built-in budget builder checks district vendors in real-time.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
