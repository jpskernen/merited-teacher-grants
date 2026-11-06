import React from 'react';
import { useGrant } from '../../context/GrantContext';
import { UserRole } from '../../types/grant';
import {
  FileText,
  LayoutDashboard,
  CheckSquare,
  ShieldCheck,
  Settings,
  Sparkles,
  ChevronDown,
  Building2,
  Users,
  History,
  RotateCcw,
  FileSpreadsheet,
  GraduationCap,
} from 'lucide-react';
import { isApplicationWindowClosed } from '../../utils/cycleDates';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewApplication?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onNewApplication,
}) => {
  const {
    currentUser,
    switchUser,
    userPendingFinalReport,
    programSettings,
    applications,
    reviewers,
    resetToGoogleSheetData,
  } = useGrant();
  const [roleMenuOpen, setRoleMenuOpen] = React.useState(false);
  const [switcherTab, setSwitcherTab] = React.useState<'roles' | 'sheet-teachers' | 'committee'>('roles');

  const roles: { role: UserRole; title: string; subtitle: string }[] = [
    {
      role: 'Teacher',
      title: 'Teacher (Applicant)',
      subtitle:
        currentUser.role === 'Teacher'
          ? `${currentUser.displayName} • ${currentUser.campus || 'Brooks Quinn Jones Elementary'}`
          : 'Jessica May • Brooks Quinn Jones Elementary',
    },
    {
      role: 'Reviewer',
      title: 'Reviewer (Voting Member)',
      subtitle: 'Dr. Arthur Campbell • NEF Director',
    },
    {
      role: 'NonVotingReviewer',
      title: 'Non-Voting Reviewer',
      subtitle: 'Dr. Karen Myers • Exec. Dir. Teaching & Learning',
    },
    {
      role: 'Admin',
      title: 'Admin (NEF Grants Team)',
      subtitle: 'Sarah Holcomb • Foundation Director',
    },
    {
      role: 'Owner',
      title: 'Owner (NEF Board Level)',
      subtitle: 'Marcus Sterling • Board President',
    },
  ];

  return (
    <header className="bg-[#062A3D] text-white border-b border-[#062A3D]/40 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Program Title */}
          <div className="flex items-center space-x-4 cursor-pointer" onClick={() => setActiveTab(currentUser.role === 'Teacher' ? 'dashboard' : 'reviewer-queue')}>
            {/* Merited SVG Feather Logo */}
            <div className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-[#8CC8E8]/40 transition">
              <svg
                width="36"
                height="36"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-sm"
              >
                {/* Thin-line feather quill shaft */}
                <path
                  d="M24 6 C28 14, 34 22, 34 32 C34 36, 31 39, 27 40 L24 41 L21 40 C17 39, 14 36, 14 32 C14 22, 20 14, 24 6 Z"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Feather vane ribs */}
                <path d="M24 14 Q30 18 32 24" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
                <path d="M24 20 Q31 23 33 29" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
                <path d="M24 16 Q18 20 16 26" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
                <path d="M24 22 Q17 25 15 31" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
                {/* Central spine */}
                <path d="M24 8 L24 38" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                {/* Sky blue nib at bottom */}
                <path
                  d="M22 38 L24 42 L26 38 Z"
                  fill="#8CC8E8"
                  stroke="#8CC8E8"
                  strokeWidth="1"
                />
                {/* Two gentle wave lines beneath */}
                <path
                  d="M15 44 C19 42.5, 21 45.5, 25 44 C29 42.5, 31 45.5, 35 44"
                  stroke="#8CC8E8"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <path
                  d="M17 46.5 C20 45.5, 22 47.5, 25 46.5 C28 45.5, 30 47.5, 33 46.5"
                  stroke="#8CC8E8"
                  strokeWidth="0.9"
                  strokeLinecap="round"
                  opacity="0.7"
                />
              </svg>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-light tracking-[0.28em] text-lg text-white font-sans">
                  MERITED
                </span>
                <span className="text-[11px] font-semibold tracking-wider text-[#8CC8E8] uppercase px-1.5 py-0.5 rounded bg-[#8CC8E8]/15 border border-[#8CC8E8]/30">
                  SCHOLARSHIP & GRANTS
                </span>
              </div>
              <div className="text-xs text-[#8CC8E8] font-medium tracking-wide flex items-center gap-1.5">
                <span>Nacogdoches ISD Education Foundation</span>
                <span className="text-white/40">•</span>
                <span className="text-white/80">Innovative Teaching Grants ({programSettings.schoolYear})</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {currentUser.role === 'Teacher' && (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                    activeTab === 'dashboard'
                      ? 'bg-white/15 text-white border-b-2 border-[#8CC8E8]'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-[#8CC8E8]" />
                  <span>My Grants</span>
                </button>
                <button
                  onClick={() => {
                    if (onNewApplication) onNewApplication();
                    setActiveTab('application');
                  }}
                  disabled={userPendingFinalReport || isApplicationWindowClosed(programSettings.applicationsDueDate)}
                  title={
                    userPendingFinalReport
                      ? 'Submit final report on prior grant before applying'
                      : isApplicationWindowClosed(programSettings.applicationsDueDate)
                      ? `Application window closed at 11:59 PM on ${programSettings.applicationsDueDate}`
                      : 'Start a new grant proposal'
                  }
                  className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                    activeTab === 'application'
                      ? 'bg-[#8CC8E8] text-[#062A3D] font-semibold'
                      : 'bg-[#8CC8E8]/20 text-white hover:bg-[#8CC8E8]/30 border border-[#8CC8E8]/40'
                  } ${
                    userPendingFinalReport || isApplicationWindowClosed(programSettings.applicationsDueDate)
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  <FileText className="w-4 h-4 text-[#062A3D]" />
                  <span>
                    {isApplicationWindowClosed(programSettings.applicationsDueDate)
                      ? 'Applications Closed'
                      : 'Start New Application'}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('program-info')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                    activeTab === 'program-info'
                      ? 'bg-white/15 text-white border-b-2 border-[#8CC8E8]'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-[#8CC8E8]" />
                  <span>Tips & Rules</span>
                </button>
              </>
            )}

            {(currentUser.role === 'Reviewer' || currentUser.role === 'NonVotingReviewer') && (
              <>
                <button
                  onClick={() => setActiveTab('reviewer-queue')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                    activeTab === 'reviewer-queue' || activeTab === 'reviewer-score'
                      ? 'bg-white/15 text-white border-b-2 border-[#8CC8E8]'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <CheckSquare className="w-4 h-4 text-[#8CC8E8]" />
                  <span>Review Queue</span>
                </button>
                <button
                  onClick={() => setActiveTab('rubric-guide')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                    activeTab === 'rubric-guide'
                      ? 'bg-white/15 text-white border-b-2 border-[#8CC8E8]'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-[#8CC8E8]" />
                  <span>Scoring Rubric</span>
                </button>
              </>
            )}

            {(currentUser.role === 'Admin' || currentUser.role === 'Owner') && (
              <>
                <button
                  onClick={() => setActiveTab('admin-rankings')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                    activeTab === 'admin-rankings'
                      ? 'bg-white/15 text-white border-b-2 border-[#8CC8E8]'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-[#8CC8E8]" />
                  <span>Rankings & Awards</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin-reviewers')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                    activeTab === 'admin-reviewers'
                      ? 'bg-white/15 text-white border-b-2 border-[#8CC8E8]'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Users className="w-4 h-4 text-[#8CC8E8]" />
                  <span>Reviewers & Swag</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin-vendors')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                    activeTab === 'admin-vendors'
                      ? 'bg-white/15 text-white border-b-2 border-[#8CC8E8]'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-[#8CC8E8]" />
                  <span>Approved Vendors</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin-settings')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                    activeTab === 'admin-settings'
                      ? 'bg-white/15 text-white border-b-2 border-[#8CC8E8]'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Settings className="w-4 h-4 text-[#8CC8E8]" />
                  <span>Cycles & Rubric</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin-audit')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                    activeTab === 'admin-audit'
                      ? 'bg-white/15 text-white border-b-2 border-[#8CC8E8]'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <History className="w-4 h-4 text-[#8CC8E8]" />
                  <span>Audit Log</span>
                </button>
              </>
            )}
          </nav>

          {/* User Profile & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center space-x-3 bg-white/10 hover:bg-white/15 px-3 py-2 rounded-lg border border-white/15 transition text-left focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
              aria-label="Role Switcher"
            >
              <div className="w-8 h-8 rounded-full bg-[#8CC8E8] text-[#062A3D] font-bold flex items-center justify-center text-sm shadow-inner">
                {currentUser.displayName.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-white leading-tight flex items-center gap-1">
                  <span>{currentUser.displayName}</span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-[#8CC8E8]/20 text-[#8CC8E8] border border-[#8CC8E8]/30">
                    {currentUser.role}
                  </span>
                </div>
                <div className="text-[11px] text-[#8CC8E8]/90 truncate max-w-[150px]">
                  {currentUser.email}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-white/70" />
            </button>

            {/* Role Switcher Menu */}
            {roleMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setRoleMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-96 bg-white text-[#1E2A33] rounded-2xl shadow-2xl py-2 z-50 border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
                  <div className="px-4 py-2.5 border-b border-slate-100 bg-[#F4F7F9]">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#062A3D]">
                        Switch Active User
                      </p>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                        Google Sheet Synced
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Test any applicant, reviewer, or administrator from the cycle sheet
                    </p>

                    {/* Sub tabs */}
                    <div className="grid grid-cols-3 gap-1 mt-2.5 bg-slate-200/70 p-0.5 rounded-lg text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setSwitcherTab('roles')}
                        className={`py-1 rounded-md transition ${
                          switcherTab === 'roles'
                            ? 'bg-white text-[#062A3D] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Roles (5)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSwitcherTab('sheet-teachers')}
                        className={`py-1 rounded-md transition ${
                          switcherTab === 'sheet-teachers'
                            ? 'bg-white text-[#062A3D] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Teachers ({applications.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSwitcherTab('committee')}
                        className={`py-1 rounded-md transition ${
                          switcherTab === 'committee'
                            ? 'bg-white text-[#062A3D] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Reviewers ({reviewers.length})
                      </button>
                    </div>
                  </div>

                  <div className="p-2 space-y-1 overflow-y-auto max-h-[360px]">
                    {switcherTab === 'roles' && (
                      <div className="space-y-1">
                        {roles.map((r) => {
                          const isSelected = currentUser.role === r.role;
                          return (
                            <button
                              key={r.role}
                              onClick={() => {
                                switchUser(r.role);
                                setRoleMenuOpen(false);
                                if (r.role === 'Teacher') setActiveTab('dashboard');
                                else if (r.role === 'Reviewer' || r.role === 'NonVotingReviewer')
                                  setActiveTab('reviewer-queue');
                                else setActiveTab('admin-rankings');
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl transition flex items-start space-x-2.5 ${
                                isSelected
                                  ? 'bg-[#062A3D] text-white'
                                  : 'hover:bg-[#F4F7F9] text-slate-800'
                              }`}
                            >
                              <div
                                className={`p-1.5 rounded-lg mt-0.5 ${
                                  isSelected
                                    ? 'bg-[#8CC8E8] text-[#062A3D]'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                <Users className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold leading-snug">{r.title}</div>
                                <div
                                  className={`text-[11px] truncate leading-tight ${
                                    isSelected ? 'text-[#8CC8E8]' : 'text-slate-500'
                                  }`}
                                >
                                  {r.subtitle}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {switcherTab === 'sheet-teachers' && (
                      <div className="space-y-1">
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          11 Google Sheet Applicants (Submission Order)
                        </div>
                        {applications.map((app) => {
                          const isSelected =
                            currentUser.role === 'Teacher' &&
                            currentUser.email.toLowerCase() === app.applicantEmail.toLowerCase();
                          return (
                            <button
                              key={app.id}
                              onClick={() => {
                                switchUser('Teacher', app.applicantEmail, app.applicantNames[0]?.name);
                                setRoleMenuOpen(false);
                                setActiveTab('dashboard');
                              }}
                              className={`w-full text-left p-2 rounded-xl transition flex items-start gap-2.5 border ${
                                isSelected
                                  ? 'bg-[#062A3D] text-white border-[#062A3D]'
                                  : 'hover:bg-slate-50 text-slate-800 border-slate-100'
                              }`}
                            >
                              <div
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold mt-0.5 ${
                                  isSelected
                                    ? 'bg-[#8CC8E8] text-[#062A3D]'
                                    : 'bg-slate-100 text-[#062A3D]'
                                }`}
                              >
                                {app.grantCode || 'APP'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-xs font-bold truncate">
                                    {app.applicantNames.map((n) => n.name).join(', ')}
                                  </span>
                                  <span
                                    className={`text-[10px] font-semibold shrink-0 ${
                                      isSelected ? 'text-[#8CC8E8]' : 'text-slate-500'
                                    }`}
                                  >
                                    ${app.amountRequested.toLocaleString()}
                                  </span>
                                </div>
                                <p
                                  className={`text-[11px] truncate italic ${
                                    isSelected ? 'text-white/80' : 'text-slate-600'
                                  }`}
                                >
                                  "{app.title}"
                                </p>
                                <p
                                  className={`text-[10px] ${
                                    isSelected ? 'text-[#8CC8E8]' : 'text-slate-400'
                                  }`}
                                >
                                  {app.campus} • {app.category}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {switcherTab === 'committee' && (
                      <div className="space-y-1">
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Scoring Committee & Advisory Members
                        </div>
                        {reviewers.map((rev) => {
                          const isSelected =
                            currentUser.email.toLowerCase() === rev.email.toLowerCase();
                          return (
                            <button
                              key={rev.id}
                              onClick={() => {
                                switchUser(rev.role, rev.email, rev.name);
                                setRoleMenuOpen(false);
                                setActiveTab('reviewer-queue');
                              }}
                              className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-2.5 border ${
                                isSelected
                                  ? 'bg-[#062A3D] text-white border-[#062A3D]'
                                  : 'hover:bg-slate-50 text-slate-800 border-slate-100'
                              }`}
                            >
                              <div
                                className={`p-1.5 rounded-lg mt-0.5 ${
                                  isSelected
                                    ? 'bg-[#8CC8E8] text-[#062A3D]'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                <Users className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold truncate">{rev.name}</span>
                                  <span
                                    className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                      rev.role === 'NonVotingReviewer'
                                        ? isSelected
                                          ? 'bg-amber-400 text-slate-900'
                                          : 'bg-amber-50 text-amber-700'
                                        : isSelected
                                        ? 'bg-[#8CC8E8] text-[#062A3D]'
                                        : 'bg-blue-50 text-blue-700'
                                    }`}
                                  >
                                    {rev.role === 'NonVotingReviewer' ? 'Non-Voting' : 'Voting'}
                                  </span>
                                </div>
                                <div
                                  className={`text-[11px] truncate ${
                                    isSelected ? 'text-[#8CC8E8]' : 'text-slate-500'
                                  }`}
                                >
                                  {rev.email}
                                </div>
                                {rev.notes && (
                                  <div
                                    className={`text-[10px] truncate mt-0.5 ${
                                      isSelected ? 'text-white/70' : 'text-slate-400'
                                    }`}
                                  >
                                    {rev.notes}
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Footer with Reset to Google Sheet Data */}
                  <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={async () => {
                        await resetToGoogleSheetData();
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100/70 transition flex items-center justify-between border border-emerald-200/60 bg-emerald-50/50"
                      title="Reset and reload all 11 applications and people directly from the Google Sheet"
                    >
                      <span className="flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Reload Google Sheet Dataset</span>
                      </span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.2 rounded">
                        11 Apps
                      </span>
                    </button>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 px-0.5">
                      <span>Nacogdoches ISD Education Foundation</span>
                      <span className="font-semibold text-[#062A3D]">NEF Grants 2026</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation Sub-bar */}
        <div className="md:hidden border-t border-white/10 py-2 overflow-x-auto flex items-center space-x-1.5 scrollbar-none text-xs">
          {currentUser.role === 'Teacher' && (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'dashboard'
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[#8CC8E8]" />
                <span>My Grants</span>
              </button>
              <button
                onClick={() => {
                  if (onNewApplication) onNewApplication();
                  setActiveTab('application');
                }}
                disabled={userPendingFinalReport}
                className={`px-2.5 py-1.5 rounded-md font-semibold whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'application'
                    ? 'bg-[#8CC8E8] text-[#062A3D]'
                    : 'bg-[#8CC8E8]/20 text-white'
                } ${userPendingFinalReport ? 'opacity-50' : ''}`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>New App</span>
              </button>
              <button
                onClick={() => setActiveTab('program-info')}
                className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'program-info'
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#8CC8E8]" />
                <span>Rules & Tips</span>
              </button>
            </>
          )}

          {(currentUser.role === 'Reviewer' || currentUser.role === 'NonVotingReviewer') && (
            <>
              <button
                onClick={() => setActiveTab('reviewer-queue')}
                className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'reviewer-queue' || activeTab === 'reviewer-score'
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 text-[#8CC8E8]" />
                <span>Review Queue</span>
              </button>
              <button
                onClick={() => setActiveTab('rubric-guide')}
                className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'rubric-guide'
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#8CC8E8]" />
                <span>Rubric Guide</span>
              </button>
            </>
          )}

          {(currentUser.role === 'Admin' || currentUser.role === 'Owner') && (
            <>
              <button
                onClick={() => setActiveTab('admin-rankings')}
                className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'admin-rankings'
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#8CC8E8]" />
                <span>Rankings</span>
              </button>
              <button
                onClick={() => setActiveTab('admin-reviewers')}
                className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'admin-reviewers'
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-[#8CC8E8]" />
                <span>Reviewers</span>
              </button>
              <button
                onClick={() => setActiveTab('admin-vendors')}
                className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'admin-vendors'
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-[#8CC8E8]" />
                <span>Vendors</span>
              </button>
              <button
                onClick={() => setActiveTab('admin-settings')}
                className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'admin-settings'
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-[#8CC8E8]" />
                <span>Settings</span>
              </button>
              <button
                onClick={() => setActiveTab('admin-audit')}
                className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'admin-audit'
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <History className="w-3.5 h-3.5 text-[#8CC8E8]" />
                <span>Audit Log</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
