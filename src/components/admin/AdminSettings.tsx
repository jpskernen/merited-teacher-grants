import React, { useState } from 'react';
import { useGrant } from '../../context/GrantContext';
import { RubricCriterion } from '../../types/grant';
import {
  Calendar,
  DollarSign,
  Shield,
  EyeOff,
  Sliders,
  Save,
  CheckCircle2,
  Edit2,
  Clock,
  Sparkles,
  History,
  RotateCcw,
} from 'lucide-react';

interface AdminSettingsProps {
  onNavigateAuditLog?: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ onNavigateAuditLog }) => {
  const {
    programSettings,
    updateProgramSettings,
    rubric,
    updateRubricCriterion,
    resetRubricToDefaults,
  } = useGrant();

  const [formSettings, setFormSettings] = useState({ ...programSettings });
  const [editingCriterion, setEditingCriterion] = useState<RubricCriterion | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmResetRubric, setConfirmResetRubric] = useState(false);

  const handleSaveProgramSettings = async () => {
    await updateProgramSettings(formSettings);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleSaveCriterion = async () => {
    if (!editingCriterion) return;
    await updateRubricCriterion(editingCriterion);
    setEditingCriterion(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#062A3D]">Program Cycle & Rubric Configuration</h1>
          <p className="text-xs text-slate-600 mt-1">
            Administer cycle timeline dates, funding caps, blind review protocols, and scoring criteria. Changes are recorded in the system Audit Log.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedNotice && (
            <div className="px-3.5 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Settings saved & logged to audit trail!</span>
            </div>
          )}

          {onNavigateAuditLog && (
            <button
              onClick={onNavigateAuditLog}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 hover:bg-slate-100 transition flex items-center gap-1.5 text-slate-700 shadow-xs"
            >
              <History className="w-4 h-4 text-[#8CC8E8]" />
              <span>View Audit Trail</span>
            </button>
          )}
        </div>
      </div>

      {/* Cycle Dates & Budget Caps */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-[#062A3D] flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#8CC8E8]" />
          <span>Grant Cycle Dates & Funding Limits</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Call for Grants Date
            </label>
            <input
              type="text"
              value={formSettings.callForGrantsDate}
              onChange={(e) =>
                setFormSettings((p) => ({ ...p, callForGrantsDate: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 p-2 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Applications Due Date
            </label>
            <input
              type="text"
              value={formSettings.applicationsDueDate}
              onChange={(e) =>
                setFormSettings((p) => ({ ...p, applicationsDueDate: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 p-2 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Awards Announced Window
            </label>
            <input
              type="text"
              value={formSettings.awardsAnnouncedDate}
              onChange={(e) =>
                setFormSettings((p) => ({ ...p, awardsAnnouncedDate: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 p-2 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs border-t border-slate-100 pt-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Category 1 Cap ($)
            </label>
            <input
              type="number"
              step="50"
              value={formSettings.category1Cap}
              onChange={(e) =>
                setFormSettings((p) => ({
                  ...p,
                  category1Cap: parseFloat(e.target.value) || 0,
                }))
              }
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-bold"
            />
            <span className="text-[10px] text-slate-500">Individual proposals</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Category 2 Cap ($)
            </label>
            <input
              type="number"
              step="50"
              value={formSettings.category2Cap}
              onChange={(e) =>
                setFormSettings((p) => ({
                  ...p,
                  category2Cap: parseFloat(e.target.value) || 0,
                }))
              }
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-bold"
            />
            <span className="text-[10px] text-slate-500">Teams of 3+ teachers</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Total Foundation Allocation ($)
            </label>
            <input
              type="number"
              step="500"
              value={formSettings.availableFunds}
              onChange={(e) =>
                setFormSettings((p) => ({
                  ...p,
                  availableFunds: parseFloat(e.target.value) || 0,
                }))
              }
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-bold"
            />
            <span className="text-[10px] text-slate-500">Total grant pool available</span>
          </div>
        </div>

        {/* Blind Review Protocol Toggle */}
        <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
          <div>
            <div className="font-bold text-xs text-[#062A3D] flex items-center gap-1.5">
              <EyeOff className="w-4 h-4 text-[#8CC8E8]" />
              <span>Blind Review Protocol</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              When enabled, reviewer screens automatically mask teacher names, email addresses, and campus identities.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formSettings.blindReviewEnabled}
              onChange={(e) =>
                setFormSettings((p) => ({ ...p, blindReviewEnabled: e.target.checked }))
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#062A3D]"></div>
          </label>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSaveProgramSettings}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#062A3D] text-white hover:bg-[#0A3D59] flex items-center gap-1.5"
          >
            <Save className="w-4 h-4 text-[#8CC8E8]" />
            <span>Save Program Parameters</span>
          </button>
        </div>
      </div>

      {/* Editable Rubric Criteria */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-[#062A3D] flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#8CC8E8]" />
              <span>Official Scoring Rubric Criteria (1 to 5 Scale)</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Admins can edit criteria titles, weights, and level descriptors. All updates are logged.
            </p>
          </div>
          <button
            onClick={() => setConfirmResetRubric(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 self-start sm:self-center transition"
            title="Reset scoring rubric to standard NISD NEF defaults"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Restore Defaults</span>
          </button>
        </div>

        <div className="space-y-3">
          {rubric.map((crit, idx) => (
            <div
              key={crit.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="font-bold text-[#062A3D] flex items-center gap-2">
                  <span>
                    {idx + 1}. {crit.title}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded">
                    Weight: {crit.weight}x
                  </span>
                </div>
                <div className="text-slate-600 text-[11px]">{crit.helper}</div>
                <div className="text-[10px] text-slate-400 italic">
                  Descriptor 1: "{crit.levelDescriptors.level1.slice(0, 50)}..." • Descriptor 5: "{crit.levelDescriptors.level5.slice(0, 50)}..."
                </div>
              </div>

              <button
                onClick={() => setEditingCriterion(crit)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center gap-1 self-end sm:self-center"
              >
                <Edit2 className="w-3 h-3 text-slate-500" />
                <span>Edit Criteria</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Criterion Modal */}
      {editingCriterion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-[#062A3D]">
              Edit Rubric Criterion: {editingCriterion.title}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Criterion Title
                </label>
                <input
                  type="text"
                  value={editingCriterion.title}
                  onChange={(e) =>
                    setEditingCriterion((p) => (p ? { ...p, title: e.target.value } : null))
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Evaluation Guidance / Helper
                </label>
                <textarea
                  rows={2}
                  value={editingCriterion.helper}
                  onChange={(e) =>
                    setEditingCriterion((p) => (p ? { ...p, helper: e.target.value } : null))
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Weight Multiplier (1–5)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={editingCriterion.weight}
                  onChange={(e) =>
                    setEditingCriterion((p) =>
                      p ? { ...p, weight: parseInt(e.target.value) || 1 } : null
                    )
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 p-2 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Level 1 Descriptor (Missing or Unclear)
                </label>
                <textarea
                  rows={2}
                  value={editingCriterion.levelDescriptors.level1}
                  onChange={(e) =>
                    setEditingCriterion((p) =>
                      p
                        ? {
                            ...p,
                            levelDescriptors: {
                              ...p.levelDescriptors,
                              level1: e.target.value,
                            },
                          }
                        : null
                    )
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Level 3 Descriptor (Adequate)
                </label>
                <textarea
                  rows={2}
                  value={editingCriterion.levelDescriptors.level3}
                  onChange={(e) =>
                    setEditingCriterion((p) =>
                      p
                        ? {
                            ...p,
                            levelDescriptors: {
                              ...p.levelDescriptors,
                              level3: e.target.value,
                            },
                          }
                        : null
                    )
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Level 5 Descriptor (Exceptional)
                </label>
                <textarea
                  rows={2}
                  value={editingCriterion.levelDescriptors.level5}
                  onChange={(e) =>
                    setEditingCriterion((p) =>
                      p
                        ? {
                            ...p,
                            levelDescriptors: {
                              ...p.levelDescriptors,
                              level5: e.target.value,
                            },
                          }
                        : null
                    )
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 p-2"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setEditingCriterion(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCriterion}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-[#8CC8E8] text-[#062A3D]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Reset Rubric Modal */}
      {confirmResetRubric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-[#062A3D]">Restore Default Rubric?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will restore the standard Nacogdoches ISD Education Foundation 8-criterion rubric weights and descriptors. This configuration action will be permanently logged in the Admin Audit Log with your credentials and timestamp.
            </p>
            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setConfirmResetRubric(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await resetRubricToDefaults();
                  setConfirmResetRubric(false);
                }}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-[#062A3D] text-white hover:bg-[#0A3D59]"
              >
                Confirm Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
