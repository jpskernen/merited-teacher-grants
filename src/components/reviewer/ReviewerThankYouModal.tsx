import React from 'react';
import { Award, Heart, CheckCircle2, Mail, Gift, Sparkles, X } from 'lucide-react';
import { ProgramSettings } from '../../types/grant';

interface ReviewerThankYouModalProps {
  reviewerName: string;
  reviewerEmail: string;
  scoredCount: number;
  totalFundsEvaluated: number;
  studentsImpacted: number;
  programSettings: ProgramSettings;
  onClose: () => void;
}

export const ReviewerThankYouModal: React.FC<ReviewerThankYouModalProps> = ({
  reviewerName,
  reviewerEmail,
  scoredCount,
  totalFundsEvaluated,
  studentsImpacted,
  programSettings,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-6 relative overflow-hidden">
        {/* Background festive flourish */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#062A3D] via-[#8CC8E8] to-emerald-500" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebratory Icon */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#062A3D] to-[#0A3D59] text-[#8CC8E8] flex items-center justify-center shadow-lg">
          <Heart className="w-9 h-9 fill-[#8CC8E8]" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold ring-2 ring-white">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Scoring Completed 100%</span>
          </span>
          <h2 className="text-2xl font-extrabold text-[#062A3D]">
            Thank You, {reviewerName}!
          </h2>
          <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
            The <strong>Nacogdoches ISD Education Foundation</strong> extends our sincere gratitude for dedicating your time, insight, and care to evaluate classroom grant proposals for {programSettings.schoolYear}.
          </p>
        </div>

        {/* Impact Numbers */}
        <div className="grid grid-cols-3 gap-2 text-center bg-[#F4F7F9] p-3.5 rounded-2xl border border-slate-200 text-xs">
          <div>
            <div className="text-xl font-black text-[#062A3D]">{scoredCount}</div>
            <div className="text-[10px] text-slate-500 font-medium">Proposals Scored</div>
          </div>
          <div className="border-x border-slate-200">
            <div className="text-xl font-black text-emerald-700">
              ${Math.round(totalFundsEvaluated).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Funds Evaluated</div>
          </div>
          <div>
            <div className="text-xl font-black text-[#062A3D]">{studentsImpacted}</div>
            <div className="text-[10px] text-slate-500 font-medium">Students Impacted</div>
          </div>
        </div>

        {/* Foundation Recognition & Swag Note */}
        <div className="space-y-2.5 text-left text-xs bg-amber-50/70 border border-amber-200/80 p-4 rounded-xl text-amber-950">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <Mail className="w-4 h-4 text-amber-700" />
            <span>Automatic Foundation Confirmation Sent</span>
          </div>
          <p className="text-[11px] text-amber-900/90 leading-snug">
            An official thank-you note from Foundation Director Sarah Holcomb and Board President Marcus Sterling has been recorded and dispatched to <code className="font-semibold text-amber-950">{reviewerEmail}</code>.
          </p>

          <div className="flex items-center gap-2 font-bold text-amber-900 pt-1 border-t border-amber-200/60">
            <Gift className="w-4 h-4 text-amber-700" />
            <span>Reviewer Swag & Gift Notice</span>
          </div>
          <p className="text-[11px] text-amber-900/90 leading-snug">
            Our committee appreciation coordinator will use your address and shirt size on file to send your custom NEF evaluator gift package.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#062A3D] text-white hover:bg-[#0A3D59] transition shadow-md"
        >
          Return to Review Queue
        </button>
      </div>
    </div>
  );
};
