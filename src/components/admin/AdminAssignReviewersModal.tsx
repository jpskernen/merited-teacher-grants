import React, { useState } from 'react';
import { useGrant } from '../../context/GrantContext';
import { Application } from '../../types/grant';
import {
  Users,
  CheckCircle2,
  X,
  UserCheck,
  Shield,
  Eye,
  Sliders,
} from 'lucide-react';

interface AdminAssignReviewersModalProps {
  application: Application;
  onClose: () => void;
}

export const AdminAssignReviewersModal: React.FC<AdminAssignReviewersModalProps> = ({
  application,
  onClose,
}) => {
  const { reviewers, assignReviewersToApplication } = useGrant();

  const currentAssignments = application.assignedReviewerIds || [];
  const isDefaultAll = currentAssignments.length === 0 || currentAssignments.includes('all');

  const [assignMode, setAssignMode] = useState<'all' | 'custom'>(
    isDefaultAll ? 'all' : 'custom'
  );

  const [selectedIds, setSelectedIds] = useState<string[]>(
    isDefaultAll ? reviewers.map((r) => r.id) : currentAssignments
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleToggleReviewer = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    setSelectedIds(reviewers.map((r) => r.id));
  };

  const handleClearAll = () => {
    setSelectedIds([]);
  };

  const handleSaveAssignments = async () => {
    setIsSaving(true);
    try {
      const finalIds = assignMode === 'all' ? ['all'] : selectedIds;
      await assignReviewersToApplication(application.id, finalIds);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#062A3D] text-[#8CC8E8]">
                {application.grantCode || application.id}
              </span>
              <h3 className="text-base font-bold text-[#062A3D]">
                Assign Reviewers
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configure which committee evaluators score this proposal.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Proposal Title Card */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div className="font-bold text-[#062A3D]">{application.title}</div>
          <div className="text-slate-500 mt-0.5">
            {application.category} • {application.campus} • ${(application.amountRequested || 0).toFixed(2)}
          </div>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <button
            type="button"
            onClick={() => {
              setAssignMode('all');
              setSelectedIds(reviewers.map((r) => r.id));
            }}
            className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
              assignMode === 'all'
                ? 'bg-[#062A3D] text-white border-[#062A3D] shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">All Reviewers</span>
              <Users className="w-4 h-4 text-[#8CC8E8]" />
            </div>
            <span className={`text-[11px] mt-1 ${assignMode === 'all' ? 'text-slate-300' : 'text-slate-400'}`}>
              Default: Every committee member sees and scores this proposal.
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAssignMode('custom')}
            className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
              assignMode === 'custom'
                ? 'bg-[#062A3D] text-white border-[#062A3D] shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">Custom Assignment</span>
              <Sliders className="w-4 h-4 text-[#8CC8E8]" />
            </div>
            <span className={`text-[11px] mt-1 ${assignMode === 'custom' ? 'text-slate-300' : 'text-slate-400'}`}>
              Select specific evaluators or split queues among sub-committees.
            </span>
          </button>
        </div>

        {/* Reviewer Checklist (if custom mode) */}
        {assignMode === 'custom' && (
          <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50 max-h-56 overflow-y-auto">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-200">
              <span className="font-semibold text-slate-600">
                Select Evaluators ({selectedIds.length} of {reviewers.length} selected)
              </span>
              <div className="space-x-2 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sky-700 font-semibold hover:underline"
                >
                  Select All
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-slate-500 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              {reviewers.map((rev) => {
                const isChecked = selectedIds.includes(rev.id);
                return (
                  <label
                    key={rev.id}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs ${
                      isChecked ? 'bg-white shadow-2xs border border-sky-200' : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleReviewer(rev.id)}
                        className="rounded text-[#062A3D] focus:ring-[#8CC8E8]"
                      />
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{rev.name}</span>
                          {rev.role === 'NonVotingReviewer' ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                              Observer
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800">
                              Voting
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{rev.email}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Cycle {rev.cyclesServed || 1}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

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
            type="button"
            disabled={isSaving}
            onClick={handleSaveAssignments}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#062A3D] hover:bg-[#0A3D59] text-white transition flex items-center gap-1.5 shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-[#8CC8E8]" />
            <span>{isSaving ? 'Saving...' : 'Save Assignments'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
