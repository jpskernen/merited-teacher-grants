import React from 'react';
import { Application, ProgramSettings } from '../../types/grant';
import {
  CheckCircle2,
  Calendar,
  Mail,
  FileText,
  ArrowRight,
  Sparkles,
  Download,
} from 'lucide-react';

interface ConfirmationModalProps {
  application: Application;
  programSettings: ProgramSettings;
  onGoToDashboard: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  application,
  programSettings,
  onGoToDashboard,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-scale-up">
        {/* Header Icon */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#062A3D]">
            Proposal Received with Gratitude!
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Thank you for investing your time and heart into this innovative project for Nacogdoches ISD students.
          </p>
        </div>

        {/* Details Card */}
        <div className="bg-[#F4F7F9] rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Application ID:</span>
            <span className="font-mono font-bold text-[#062A3D]">{application.id}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Project Title:</span>
            <span className="font-bold text-[#062A3D] truncate max-w-xs">{application.title}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Category & Amount:</span>
            <span className="font-bold text-[#062A3D]">
              {application.category} • ${(application.amountRequested || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Confirmation Email:</span>
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              <span>Copy sent to {application.applicantEmail}</span>
            </span>
          </div>
        </div>

        {/* What Happens Next Timeline */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            What Happens Next?
          </h4>
          <div className="space-y-2 text-xs text-slate-700">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#062A3D] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <strong>Blind Review Evaluation:</strong> Your proposal is now in the queue for the NEF grant committee. Evaluators review scoring rubrics anonymously.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#062A3D] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <strong>Committee Discussion:</strong> Reviewers aggregate scores and compile constructive feedback. If clarification is needed, an inquiry will appear in your dashboard.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <strong>Award Announcement:</strong> Decisions and surprise grant patrol visits take place around <strong>{programSettings.awardsAnnouncedDate}</strong>.
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onGoToDashboard}
            className="w-full py-3.5 rounded-xl font-bold text-xs text-[#062A3D] bg-[#8CC8E8] hover:bg-[#a0d4ef] shadow-md transition flex items-center justify-center gap-2"
          >
            <span>Go to My Grants Dashboard</span>
            <ArrowRight className="w-4 h-4 text-[#062A3D]" />
          </button>
        </div>
      </div>
    </div>
  );
};
