import React from 'react';
import { Application, ProgramSettings, RubricCriterion } from '../../types/grant';
import { Printer, X, FileText, CheckSquare, Award } from 'lucide-react';

interface ReviewPacketPrintViewProps {
  applications: Application[];
  programSettings: ProgramSettings;
  rubric: RubricCriterion[];
  onClose: () => void;
}

export const ReviewPacketPrintView: React.FC<ReviewPacketPrintViewProps> = ({
  applications,
  programSettings,
  rubric,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const isBlind = programSettings.blindReviewEnabled;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs p-2 sm:p-6 print:p-0 print:bg-white print:overflow-visible">
      {/* On-screen control bar (hidden when printing) */}
      <div className="max-w-5xl mx-auto mb-4 bg-white rounded-xl shadow-lg border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#062A3D] text-[#8CC8E8]">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#062A3D]">
              Print-Ready Reviewer Packet ({applications.length} Proposals)
            </h2>
            <p className="text-xs text-slate-500">
              Clean 8.5x11 layout with page breaks. Each proposal is followed by a blank rubric scoring sheet.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-[#062A3D] hover:bg-[#0A3D59] text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <Printer className="w-4 h-4 text-[#8CC8E8]" />
            <span>Print / Save as PDF</span>
          </button>
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>Exit Preview</span>
          </button>
        </div>
      </div>

      {/* Printable Document Container */}
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl print:shadow-none print:rounded-none border border-slate-200 print:border-none p-6 sm:p-10 print:p-0 space-y-12 print:space-y-0 text-slate-900">
        {/* Cover / Instructions Sheet */}
        <div className="border-b-2 border-[#062A3D] pb-6 mb-8 print:break-after-page print:mb-0 print:min-h-screen print:flex print:flex-col print:justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h1 className="text-xl font-bold uppercase tracking-wider text-[#062A3D]">
                  Nacogdoches ISD Education Foundation
                </h1>
                <p className="text-sm font-semibold text-slate-600">
                  Innovative Teaching Grants • Committee Reviewer Packet ({programSettings.schoolYear})
                </p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <div>Scoring Deadline:</div>
                <div className="font-bold text-[#062A3D]">
                  {programSettings.reviewClosesDate || 'November 16, 2026'} at 11:59 PM
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
              <h3 className="font-bold text-[#062A3D] uppercase tracking-wide">
                Paper Scoring Instructions:
              </h3>
              <p>
                1. <strong>Evidence-Based Scoring:</strong> Read each application's stated need, objectives, plan, and budget. Score each of the 8 criteria on a 1 to 5 scale using the blank rubric sheet following each application.
              </p>
              <p>
                2. <strong>100-Point Formula:</strong> Criteria weights convert your 1–5 score using <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">(Score ÷ 5) × Weight</code>.
              </p>
              <p>
                3. <strong>Notes & Feedback:</strong> Please write concise comments for any criterion scored 1, 2, or 5 to assist the committee during deliberation and feedback sharing.
              </p>
              {isBlind && (
                <p className="text-purple-800 font-semibold">
                  4. <strong>Blind Review Protocol Active:</strong> Applicant names and campuses are masked throughout this packet.
                </p>
              )}
            </div>

            <div className="pt-2">
              <h4 className="text-xs font-bold text-[#062A3D] uppercase tracking-wide mb-2">
                Table of Contents ({applications.length} Assigned Proposals):
              </h4>
              <div className="divide-y divide-slate-100 text-xs">
                {applications.map((app, idx) => (
                  <div key={app.id} className="py-1.5 flex justify-between items-center">
                    <span className="font-medium text-slate-800">
                      {idx + 1}. <span className="font-mono font-bold">{app.grantCode || app.id}</span> — {app.title}
                    </span>
                    <span className="font-mono text-slate-500">
                      {app.category} • ${(app.amountRequested || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 pt-8 border-t border-slate-200">
            Nacogdoches ISD Education Foundation • PO Box 631521, Nacogdoches, TX 75963 • grants@nefgrants.org
          </div>
        </div>

        {/* Individual Applications and Blank Rubrics */}
        {applications.map((app, idx) => (
          <React.Fragment key={app.id}>
            {/* Page A: Application Details */}
            <div className="print:break-after-page print:min-h-screen print:pt-6 space-y-5 border-t-2 sm:border-t-0 print:border-t-0 border-slate-200 pt-8 sm:pt-0">
              <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#062A3D] text-white font-mono font-bold text-xs">
                      {app.grantCode || app.id}
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      Application #{idx + 1} of {applications.length}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-[#062A3D] mt-1">{app.title}</h2>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {app.category} • {app.areaOfFocus}
                    {!isBlind && ` • Campus: ${app.campus}`}
                    {isBlind && ` • Campus: [Masked for Blind Review]`}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-500">Amount Requested:</div>
                  <div className="text-base font-extrabold text-[#062A3D]">
                    ${(app.amountRequested || 0).toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {app.studentsImpacted || 0} Students Impacted
                  </div>
                </div>
              </div>

              {/* Proposal Content */}
              <div className="space-y-4 text-xs">
                <div>
                  <h3 className="font-bold text-[#062A3D] uppercase tracking-wide text-[11px] border-b border-slate-200 pb-1 mb-1">
                    Abstract & Statement of Need (Q9)
                  </h3>
                  <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                    {app.abstract || 'No abstract provided.'}
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-[#062A3D] uppercase tracking-wide text-[11px] border-b border-slate-200 pb-1 mb-1">
                    Instructional Objectives & TEKS Alignment (Q7)
                  </h3>
                  <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                    {app.objectives || 'No objectives provided.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-bold text-[#062A3D] uppercase tracking-wide text-[11px] border-b border-slate-200 pb-1 mb-1">
                      Evaluation Strategy (Q12)
                    </h3>
                    <p className="text-slate-700 leading-relaxed">
                      {app.evaluationStrategy || 'Standard pre/post assessments and classroom rubric.'}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-[#062A3D] uppercase tracking-wide text-[11px] border-b border-slate-200 pb-1 mb-1">
                      Sustainability & Future Cohorts (Q14)
                    </h3>
                    <p className="text-slate-700 leading-relaxed">
                      {app.sustainability || 'Non-consumable materials will serve future student classes.'}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-[#062A3D] uppercase tracking-wide text-[11px] border-b border-slate-200 pb-1 mb-1">
                    Budget Summary & Line Items (Q15)
                  </h3>
                  {app.budgetItems && app.budgetItems.length > 0 ? (
                    <table className="w-full text-left border border-slate-200 mt-1">
                      <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-700">
                        <tr>
                          <th className="p-1.5 border-b border-r border-slate-200">Item</th>
                          <th className="p-1.5 border-b border-r border-slate-200">Vendor</th>
                          <th className="p-1.5 border-b border-r border-slate-200 text-center">Qty</th>
                          <th className="p-1.5 border-b border-r border-slate-200 text-right">Cost</th>
                          <th className="p-1.5 border-b border-slate-200 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {app.budgetItems.map((b) => (
                          <tr key={b.id}>
                            <td className="p-1.5 border-r border-slate-100 font-medium">{b.name}</td>
                            <td className="p-1.5 border-r border-slate-100 text-slate-600">{b.vendor}</td>
                            <td className="p-1.5 border-r border-slate-100 text-center">{b.quantity}</td>
                            <td className="p-1.5 border-r border-slate-100 text-right">${b.unitCost.toFixed(2)}</td>
                            <td className="p-1.5 text-right font-semibold">
                              ${(b.quantity * b.unitCost + (b.shipping || 0)).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-slate-600 font-mono text-[11px]">
                      {app.plainTextBudget || `Total: $${(app.amountRequested || 0).toFixed(2)}`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Page B: Blank Rubric Scoring Sheet */}
            <div className="print:break-after-page print:min-h-screen print:pt-6 space-y-4 border-t-2 sm:border-t-0 print:border-t-0 border-dashed border-slate-300 pt-8 sm:pt-0">
              <div className="flex items-center justify-between border-b-2 border-[#062A3D] pb-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Official Rubric Scoring Sheet
                  </span>
                  <h3 className="text-base font-bold text-[#062A3D]">
                    Evaluation for <span className="font-mono">{app.grantCode || app.id}</span> — {app.title}
                  </h3>
                </div>
                <div className="text-right text-xs">
                  <div className="text-slate-500">Reviewer Name:</div>
                  <div className="w-36 border-b border-slate-400 mt-1">&nbsp;</div>
                </div>
              </div>

              {/* 8 Criteria Scoring Rows */}
              <div className="space-y-3 text-xs">
                {rubric.map((crit, cIdx) => (
                  <div key={crit.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <div className="font-bold text-[#062A3D]">
                        {cIdx + 1}. {crit.title} <span className="text-slate-500 font-normal">({crit.weight} pts • {crit.formSource})</span>
                      </div>
                      {/* 1-5 Score Boxes */}
                      <div className="flex items-center gap-1 font-mono text-xs">
                        <span className="text-slate-500 text-[10px] mr-1">Circle score:</span>
                        {[1, 2, 3, 4, 5].map((val) => (
                          <span
                            key={val}
                            className="inline-block w-6 h-6 border border-slate-300 rounded text-center leading-6 font-bold bg-white"
                          >
                            {val}
                          </span>
                        ))}
                        <span className="ml-2 font-bold text-slate-600">
                          = (Score ÷ 5) × {crit.weight} = _____ pts
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 italic mb-1.5">{crit.helper}</div>
                    <div className="border-b border-dotted border-slate-300 h-6">&nbsp;</div>
                  </div>
                ))}
              </div>

              {/* Composite Score and Recommendation */}
              <div className="p-4 rounded-xl border-2 border-slate-800 bg-slate-50 mt-4 text-xs space-y-3">
                <div className="flex items-center justify-between font-bold text-sm text-[#062A3D]">
                  <span>FINAL COMPOSITE SCORE (Sum of Weighted Points):</span>
                  <span className="font-mono text-base underline decoration-2">
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / 100 PTS
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-2 space-y-1">
                  <div className="font-bold text-slate-800">Committee Recommendation:</div>
                  <div className="flex flex-wrap items-center gap-6 text-slate-700">
                    <label className="flex items-center gap-1.5">
                      <span className="w-4 h-4 border border-slate-400 rounded inline-block">&nbsp;</span>
                      <span>Recommend Full Funding (${(app.amountRequested || 0).toFixed(2)})</span>
                    </label>
                    <label className="flex items-center gap-1.5">
                      <span className="w-4 h-4 border border-slate-400 rounded inline-block">&nbsp;</span>
                      <span>Recommend Partial Funding ($________)</span>
                    </label>
                    <label className="flex items-center gap-1.5">
                      <span className="w-4 h-4 border border-slate-400 rounded inline-block">&nbsp;</span>
                      <span>Do Not Recommend</span>
                    </label>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-2">
                  <div className="font-semibold text-slate-700 mb-1">
                    Reviewer General Comments / Commendations:
                  </div>
                  <div className="border-b border-dotted border-slate-300 h-6 mb-1">&nbsp;</div>
                  <div className="border-b border-dotted border-slate-300 h-6">&nbsp;</div>
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
