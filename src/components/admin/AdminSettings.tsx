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
  Bell,
  Hash,
  AlertTriangle,
  Mail,
  FileSpreadsheet,
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-bold text-[#062A3D] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#8CC8E8]" />
            <span>Program Cycle Dates & Automated Deadlines</span>
          </h2>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Automated 11:59 PM Cutoffs Active
          </span>
        </div>

        {/* 4 Editable Cycle Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Applications Open Date
            </label>
            <input
              type="text"
              value={formSettings.applicationsOpenDate || formSettings.callForGrantsDate || 'October 21, 2026'}
              onChange={(e) =>
                setFormSettings((p) => ({
                  ...p,
                  applicationsOpenDate: e.target.value,
                  callForGrantsDate: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-200 p-2 text-xs"
            />
            <span className="text-[10px] text-slate-400">Portal opens for teachers</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Applications Due Date
            </label>
            <input
              type="text"
              value={formSettings.applicationsDueDate || 'November 11, 2026'}
              onChange={(e) =>
                setFormSettings((p) => ({ ...p, applicationsDueDate: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-bold text-[#062A3D]"
            />
            <span className="text-[10px] text-amber-700 font-semibold">
              Closes form automatically at 11:59 PM
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Review Closes Date
            </label>
            <input
              type="text"
              value={formSettings.reviewClosesDate || 'November 16, 2026'}
              onChange={(e) =>
                setFormSettings((p) => ({ ...p, reviewClosesDate: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-bold text-[#062A3D]"
            />
            <span className="text-[10px] text-purple-700 font-semibold">
              Closes scoring automatically at 11:59 PM
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Awards Presented Date
            </label>
            <input
              type="text"
              value={formSettings.awardsPresentedDate || formSettings.awardsAnnouncedDate || 'November 18, 2026'}
              onChange={(e) =>
                setFormSettings((p) => ({
                  ...p,
                  awardsPresentedDate: e.target.value,
                  awardsAnnouncedDate: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-200 p-2 text-xs"
            />
            <span className="text-[10px] text-emerald-700 font-semibold">
              Before Thanksgiving announcement
            </span>
          </div>
        </div>

        {/* Funding Pool and Caps */}
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
            <span className="text-[10px] text-slate-500">Up to $1,500 for individual teacher proposals</span>
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
            <span className="text-[10px] text-slate-500">
              Up to $4,500 for campus teams (3+ teachers), departments & district programs
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Total Funds Available This Cycle ($)
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
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-extrabold text-[#062A3D]"
            />
            <span className="text-[10px] text-emerald-700 font-semibold">
              Cycle total pool: $52,000 (editable)
            </span>
          </div>
        </div>

        {/* Eligibility Description & Spending Deadlines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-t border-slate-100 pt-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Eligible Applicants Definition
            </label>
            <input
              type="text"
              value={formSettings.eligibilityDescription || 'Teachers or teams of teachers employed by Nacogdoches ISD involved in instruction or related student support services.'}
              onChange={(e) =>
                setFormSettings((p) => ({ ...p, eligibilityDescription: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 p-2 text-xs"
            />
            <span className="text-[10px] text-slate-400">
              Displayed on applicant guidelines and eligibility screening gates
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Project Implementation & Spending Deadline
            </label>
            <input
              type="text"
              value={formSettings.spendingDeadlineDate || 'End of following school year (May 26, 2028)'}
              onChange={(e) =>
                setFormSettings((p) => ({ ...p, spendingDeadlineDate: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 p-2 text-xs"
            />
            <span className="text-[10px] text-slate-400">
              Must be spent & fully implemented by end of following school year
            </span>
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

      {/* Grant Codes & Numbering Scheme */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-[#062A3D] flex items-center gap-2">
              <Hash className="w-5 h-5 text-[#8CC8E8]" />
              <span>Grant Code & Google Sheet Sequence Format</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Every submitted proposal receives an immutable code formatted as <code className="font-mono font-bold text-[#062A3D] bg-slate-100 px-1 py-0.5 rounded">[Program][Season][YY][Line]</code>.
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs flex items-center gap-2 self-start sm:self-center">
            <span className="text-slate-500 font-medium">Live Code Preview:</span>
            <span className="font-mono font-bold text-[#062A3D] bg-[#8CC8E8]/30 px-2 py-0.5 rounded">
              {(formSettings.cycleProgramCode || 'IG').toUpperCase()}
              {(formSettings.cycleSeasonCode || 'F').toUpperCase()}
              {formSettings.cycleTwoDigitYear || '26'}
              01
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Program Code
            </label>
            <select
              value={formSettings.cycleProgramCode || 'IG'}
              onChange={(e) =>
                setFormSettings((p) => ({
                  ...p,
                  cycleProgramCode: e.target.value as 'IG' | 'MG',
                }))
              }
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-bold text-[#062A3D]"
            >
              <option value="IG">IG — Innovative Grant (Current Cycle)</option>
              <option value="MG">MG — Mini Grant</option>
            </select>
            <span className="text-[10px] text-slate-400">Admin sets program for each cycle</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Season Code
            </label>
            <select
              value={formSettings.cycleSeasonCode || 'F'}
              onChange={(e) =>
                setFormSettings((p) => ({
                  ...p,
                  cycleSeasonCode: e.target.value as 'F' | 'S',
                }))
              }
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-bold text-[#062A3D]"
            >
              <option value="F">F — Fall (Current Cycle)</option>
              <option value="S">S — Spring</option>
            </select>
            <span className="text-[10px] text-slate-400">Admin sets season for each cycle</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Two-Digit Year (YY)
            </label>
            <input
              type="text"
              maxLength={2}
              value={formSettings.cycleTwoDigitYear || '26'}
              onChange={(e) =>
                setFormSettings((p) => ({
                  ...p,
                  cycleTwoDigitYear: e.target.value.replace(/\D/g, '').slice(0, 2),
                }))
              }
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-bold text-[#062A3D]"
            />
            <span className="text-[10px] text-slate-400">Two-digit year of the cycle (2026 → 26)</span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="font-semibold text-slate-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Integrity & Sheet Synchronization Rules</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            • Sequence number <code className="font-mono text-slate-700">[Line]</code> starts at <strong>01</strong> (expands to 3 digits if cycle passes 99) and matches the application's row number in the cycle's Google Sheet export.
          </p>
          <p className="text-[11px] leading-relaxed">
            • Codes are assigned on submit, never change, and are never reused even if an application is withdrawn.
          </p>
          <p className="text-[11px] leading-relaxed">
            • Displayed on teacher confirmation, teacher dashboard, all 17 email templates, reviewer screens, admin list, and all exports.
          </p>
        </div>

        <div className="pt-1 flex justify-end">
          <button
            onClick={handleSaveProgramSettings}
            className="px-5 py-2 rounded-xl font-bold text-xs bg-[#062A3D] text-white hover:bg-[#0A3D59] flex items-center gap-1.5"
          >
            <Save className="w-4 h-4 text-[#8CC8E8]" />
            <span>Save Grant Code Settings</span>
          </button>
        </div>
      </div>

      {/* Admin Notification Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-[#062A3D] flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#8CC8E8]" />
              <span>Admin Notification Settings</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Configure alert thresholds and automated email notifications for grant administrator.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
            Real-Time Notifications Active
          </span>
        </div>

        {/* Large Request Threshold & Admin Recipient */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
            <label className="block font-bold text-[#062A3D]">
              "Notify me when someone requests $___ or more"
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-600">$</span>
              <input
                type="number"
                step="500"
                min="500"
                value={formSettings.notifications?.largeRequestThreshold ?? 6000}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setFormSettings((p) => ({
                    ...p,
                    notifications: {
                      ...(p.notifications || {
                        largeRequestThreshold: 6000,
                        emailAdminOnLargeRequest: true,
                        notifyNewSubmission: true,
                        notifyThresholdExceeded: true,
                        notifyReviewerFinished: true,
                        notifyAllReviewsComplete: true,
                        notifyTeacherPoSubmitted: true,
                        notifyTeacherEventDate: true,
                        notifyFinalReportSubmitted: true,
                        adminEmailRecipient: 'director@nefgrants.org',
                      }),
                      largeRequestThreshold: val,
                    },
                  }));
                }}
                className="w-full rounded-lg border border-amber-300 bg-white p-2 text-xs font-bold text-[#062A3D]"
              />
            </div>
            <p className="text-[11px] text-amber-900 leading-snug">
              When a submitted application's amount meets or exceeds the threshold, email the admin right away and flag the application with a <strong>"Large request"</strong> badge in the admin list.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <label className="block font-bold text-[#062A3D]">
              Admin Notification Recipient Email
            </label>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="email"
                value={formSettings.notifications?.adminEmailRecipient || 'director@nefgrants.org'}
                onChange={(e) => {
                  const email = e.target.value;
                  setFormSettings((p) => ({
                    ...p,
                    notifications: {
                      ...(p.notifications || {
                        largeRequestThreshold: 6000,
                        emailAdminOnLargeRequest: true,
                        notifyNewSubmission: true,
                        notifyThresholdExceeded: true,
                        notifyReviewerFinished: true,
                        notifyAllReviewsComplete: true,
                        notifyTeacherPoSubmitted: true,
                        notifyTeacherEventDate: true,
                        notifyFinalReportSubmitted: true,
                        adminEmailRecipient: 'director@nefgrants.org',
                      }),
                      adminEmailRecipient: email,
                    },
                  }));
                }}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-medium text-slate-800"
              />
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Alerts and timeline milestones will be addressed to this grants committee administrator mailbox.
            </p>
          </div>
        </div>

        {/* 7 Notification Toggles */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-[#062A3D] uppercase tracking-wide">
            Toggle Email Notifications For:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              {
                key: 'notifyNewSubmission' as const,
                title: 'New submission',
                desc: 'Email admin whenever a teacher or team submits a new grant application',
              },
              {
                key: 'notifyThresholdExceeded' as const,
                title: 'Application over threshold',
                desc: `Email admin right away when a submission reaches or exceeds $${(formSettings.notifications?.largeRequestThreshold ?? 6000).toLocaleString()}`,
              },
              {
                key: 'notifyReviewerFinished' as const,
                title: 'Reviewer finished scoring',
                desc: 'Email admin as soon as a reviewer finishes scoring an application',
              },
              {
                key: 'notifyAllReviewsComplete' as const,
                title: 'All reviews complete',
                desc: 'Email admin when all assigned evaluations are complete and ready for awards determination',
              },
              {
                key: 'notifyTeacherPoSubmitted' as const,
                title: 'Teacher reports PO submitted',
                desc: 'Email admin when an awarded teacher reports their campus purchase order has been placed',
              },
              {
                key: 'notifyTeacherEventDate' as const,
                title: 'Teacher shares an event date',
                desc: 'Email admin when an awardee shares their project showcase or classroom event date',
              },
              {
                key: 'notifyFinalReportSubmitted' as const,
                title: 'Final report submitted',
                desc: 'Email admin when a past recipient submits their final outcomes and student impact report',
              },
            ].map((item) => {
              const isChecked = formSettings.notifications ? formSettings.notifications[item.key] !== false : true;
              return (
                <div
                  key={item.key}
                  className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/70 transition"
                >
                  <div className="pr-3">
                    <div className="font-semibold text-slate-800">{item.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormSettings((p) => ({
                          ...p,
                          notifications: {
                            ...(p.notifications || {
                              largeRequestThreshold: 6000,
                              emailAdminOnLargeRequest: true,
                              notifyNewSubmission: true,
                              notifyThresholdExceeded: true,
                              notifyReviewerFinished: true,
                              notifyAllReviewsComplete: true,
                              notifyTeacherPoSubmitted: true,
                              notifyTeacherEventDate: true,
                              notifyFinalReportSubmitted: true,
                              adminEmailRecipient: 'director@nefgrants.org',
                            }),
                            [item.key]: checked,
                          },
                        }));
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#062A3D]"></div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSaveProgramSettings}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#062A3D] text-white hover:bg-[#0A3D59] flex items-center gap-1.5"
          >
            <Save className="w-4 h-4 text-[#8CC8E8]" />
            <span>Save Notification Settings</span>
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
                  <span className="text-[10px] font-mono font-bold text-[#062A3D] bg-slate-200 px-1.5 py-0.2 rounded">
                    Source: {crit.formSource}
                  </span>
                  <span className="text-[10px] font-bold text-[#8CC8E8] bg-[#062A3D] px-1.5 py-0.2 rounded">
                    {crit.weight} pts
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
                  Form Source (e.g. Q9 Abstract, Q7, Q8, Q9)
                </label>
                <input
                  type="text"
                  value={editingCriterion.formSource || ''}
                  onChange={(e) =>
                    setEditingCriterion((p) =>
                      p ? { ...p, formSource: e.target.value } : null
                    )
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 p-2 font-mono"
                />
                <span className="text-[10px] text-slate-400">
                  Question(s) on the teacher application form that provide the evidence for this score.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Points Weight (Part of 100-Point Matrix)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
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
