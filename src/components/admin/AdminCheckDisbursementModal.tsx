import React, { useState } from 'react';
import { useGrant } from '../../context/GrantContext';
import { Application } from '../../types/grant';
import {
  DollarSign,
  CheckCircle2,
  X,
  CreditCard,
  Building,
  Calendar,
  FileText,
} from 'lucide-react';

interface AdminCheckDisbursementModalProps {
  application: Application;
  onClose: () => void;
}

export const AdminCheckDisbursementModal: React.FC<AdminCheckDisbursementModalProps> = ({
  application,
  onClose,
}) => {
  const { markCheckSent } = useGrant();

  const defaultAmount = application.awardedAmount || application.amountRequested || 0;

  const [checkNumber, setCheckNumber] = useState(
    application.checkNumber || `NEF-${Math.floor(10000 + Math.random() * 90000)}`
  );
  const [checkSentAt, setCheckSentAt] = useState(
    application.checkSentAt ? application.checkSentAt.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [checkAmount, setCheckAmount] = useState(
    application.checkAmount || defaultAmount
  );
  const [checkNotes, setCheckNotes] = useState(
    application.checkNotes ||
      `Delivered to ${application.campus} financial secretary for campus activity fund deposit.`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkNumber.trim()) return;

    setIsSubmitting(true);
    try {
      await markCheckSent(application.id, {
        checkNumber: checkNumber.trim(),
        checkSentAt: new Date(checkSentAt).toISOString(),
        checkAmount: Number(checkAmount),
        checkNotes: checkNotes.trim(),
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-800 text-emerald-100">
                {application.grantCode || application.id}
              </span>
              <h3 className="text-base font-bold text-[#062A3D]">
                Mark Grant Check Disbursed
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Record check disbursement to the campus activity fund.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grant Summary */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
          <div className="font-bold text-[#062A3D]">{application.title}</div>
          <div className="text-slate-500 flex flex-wrap items-center gap-2">
            <span>Teacher: {application.applicantNames[0]?.name}</span>
            <span>•</span>
            <span>Campus: {application.campus}</span>
          </div>
          <div className="text-emerald-700 font-bold pt-0.5">
            Awarded Grant Funds: ${defaultAmount.toFixed(2)}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Check Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={checkNumber}
                onChange={(e) => setCheckNumber(e.target.value)}
                placeholder="e.g. NEF-58291 or #10492"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#8CC8E8] text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Disbursement Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  value={checkSentAt}
                  onChange={(e) => setCheckSentAt(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#8CC8E8] text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Check Amount ($)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={checkAmount}
                  onChange={(e) => setCheckAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#8CC8E8] text-xs font-bold text-[#062A3D]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Accounting Notes / Deposit Location
            </label>
            <textarea
              rows={2}
              value={checkNotes}
              onChange={(e) => setCheckNotes(e.target.value)}
              placeholder="e.g. Hand delivered to campus secretary for campus activity fund deposit."
              className="w-full rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#8CC8E8] text-xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white transition flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : 'Mark Check Disbursed'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
