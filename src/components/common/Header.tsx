import React, { useState } from 'react';
import { useGrants } from '../../context/GrantContext';
import { UserRole } from '../../types/grant';
import {
  CheckSquare,
  ShieldCheck,
  Settings,
  Sparkles,
  ChevronDown,
  Users,
  History,
  LogOut,
  Clock,
  Lock,
  Mail,
  FileText,
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSignIn?: () => void;
  onOpenSentEmails?: () => void;
  onOpenTermsPrivacy?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSignIn,
  onOpenSentEmails,
  onOpenTermsPrivacy,
}) => {
  const {
    currentUser,
    signInAsTestUser,
    logout,
    programSettings,
    reviewDeadlineInfo,
    isReviewClosed,
  } = useGrants();

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const testAccounts: { role: UserRole; name: string; email: string; label: string; desc: string }[] = [
    {
      role: 'Admin',
      name: 'Erin Windham',
      email: 'ewindham@nacisd.org',
      label: 'Admin (Nacogdoches ISD)',
      desc: 'Foundation Executive Director • Full access, identity records & import',
    },
    {
      role: 'Reviewer',
      name: 'Judy Abbott',
      email: 'Abottja021820@gmail.com',
      label: 'Judy Abbott (Reviewer)',
      desc: 'Reviewer • All 21 grants assigned',
    },
    {
      role: 'Reviewer',
      name: 'Sydney Kroll',
      email: 'sydneykr@gmail.com',
      label: 'Sydney Kroll (Reviewer)',
      desc: 'Reviewer • All 21 grants assigned',
    },
    {
      role: 'Reviewer',
      name: 'Monica Loa',
      email: 'mmloa@asp-inc.com',
      label: 'Monica Loa (Reviewer)',
      desc: 'Reviewer • All 21 grants assigned',
    },
  ];

  return (
    <header className="bg-[#062A3D] text-white border-b border-white/10 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Program Title */}
          <div
            className="flex items-center space-x-3.5 cursor-pointer"
            onClick={() => setActiveTab(currentUser?.role === 'Admin' ? 'admin-rankings' : 'reviewer-queue')}
          >
            {/* Merited SVG Feather Logo */}
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#8CC8E8]/40 transition">
              <svg
                width="34"
                height="34"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M24 6 C28 14, 34 22, 34 32 C34 36, 31 39, 27 40 L24 41 L21 40 C17 39, 14 36, 14 32 C14 22, 20 14, 24 6 Z"
                  stroke="white"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M24 14 Q30 18 32 24" stroke="white" strokeWidth="1.2" opacity="0.8" />
                <path d="M24 20 Q31 23 33 29" stroke="white" strokeWidth="1.2" opacity="0.8" />
                <path d="M24 16 Q18 20 16 26" stroke="white" strokeWidth="1.2" opacity="0.8" />
                <path d="M24 22 Q17 25 15 31" stroke="white" strokeWidth="1.2" opacity="0.8" />
                <path d="M24 8 L24 38" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M22 38 L24 42 L26 38 Z" fill="#8CC8E8" stroke="#8CC8E8" strokeWidth="1" />
                <path
                  d="M15 44 C19 42.5, 21 45.5, 25 44 C29 42.5, 31 45.5, 35 44"
                  stroke="#8CC8E8"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-light tracking-[0.25em] text-lg text-white font-sans">
                  MERITED
                </span>
                <span className="text-[10px] font-bold tracking-wider text-[#8CC8E8] uppercase px-1.5 py-0.5 rounded bg-[#8CC8E8]/15 border border-[#8CC8E8]/30">
                  REVIEW PORTAL
                </span>
              </div>
              <div className="text-xs text-[#8CC8E8] font-medium tracking-wide flex items-center gap-1.5">
                <span>Nacogdoches ISD Education Foundation</span>
                <span className="text-white/30">•</span>
                <span className="text-white/80">
                  Innovative Teaching Grants ({programSettings.schoolYear})
                </span>
              </div>
            </div>
          </div>

          {/* Central Deadline Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs">
            <Clock className="w-3.5 h-3.5 text-[#8CC8E8]" />
            <span className="text-white/70">Review Closes:</span>
            <span className="font-semibold text-white">{reviewDeadlineInfo.formattedCutoff}</span>
            {isReviewClosed ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                <Lock className="w-3 h-3" /> Locked
              </span>
            ) : (
              reviewDeadlineInfo.timeRemaining && (
                <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-400/20">
                  {reviewDeadlineInfo.timeRemaining}
                </span>
              )
            )}
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {currentUser && (currentUser.role === 'Reviewer' || currentUser.role === 'NonVotingReviewer') && (
              <>
                <button
                  onClick={() => setActiveTab('reviewer-queue')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                    activeTab === 'reviewer-queue' || activeTab === 'reviewer-score'
                      ? 'bg-white/15 text-white border-b-2 border-[#8CC8E8]'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <CheckSquare className="w-4 h-4 text-[#8CC8E8]" />
                  <span>My Reviews</span>
                </button>
                <button
                  onClick={() => setActiveTab('rubric-guide')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
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

            {currentUser && currentUser.role === 'Admin' && (
              <>
                <button
                  onClick={() => setActiveTab('admin-rankings')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                    activeTab === 'admin-rankings'
                      ? 'bg-white/15 text-white border-b-2 border-[#8CC8E8]'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-[#8CC8E8]" />
                  <span>Rankings & Awards</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin-submissions')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                    activeTab === 'admin-submissions'
                      ? 'bg-white/15 text-white border-b-2 border-[#8CC8E8]'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <FileText className="w-4 h-4 text-[#8CC8E8]" />
                  <span>Submissions</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin-reviewers')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                    activeTab === 'admin-reviewers'
                      ? 'bg-white/15 text-white border-b-2 border-[#8CC8E8]'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Users className="w-4 h-4 text-[#8CC8E8]" />
                  <span>Reviewers</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin-settings')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                    activeTab === 'admin-settings'
                      ? 'bg-white/15 text-white border-b-2 border-[#8CC8E8]'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Settings className="w-4 h-4 text-[#8CC8E8]" />
                  <span>Cycle & Rubric</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin-audit')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                    activeTab === 'admin-audit'
                      ? 'bg-white/15 text-white border-b-2 border-[#8CC8E8]'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <History className="w-4 h-4 text-[#8CC8E8]" />
                  <span>Audit Trail</span>
                </button>
                {onOpenSentEmails && (
                  <button
                    onClick={onOpenSentEmails}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 text-white/80 hover:text-white hover:bg-white/10"
                    title="View server-dispatched sent emails log"
                  >
                    <Mail className="w-4 h-4 text-[#8CC8E8]" />
                    <span>Email Logs</span>
                  </button>
                )}
              </>
            )}
          </nav>

          {/* User Profile / Auth Button */}
          <div className="relative">
            {currentUser ? (
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 bg-white/10 hover:bg-white/15 px-3 py-2 rounded-xl border border-white/15 transition text-left focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
                aria-label="User Account Menu"
              >
                <div className="w-8 h-8 rounded-full bg-[#8CC8E8] text-[#062A3D] font-bold flex items-center justify-center text-sm shadow-inner">
                  {currentUser.displayName.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-white leading-tight flex items-center gap-1.5">
                    <span>{currentUser.displayName}</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#8CC8E8]/20 text-[#8CC8E8] border border-[#8CC8E8]/30">
                      {currentUser.role === 'NonVotingReviewer' ? 'Non-Voting' : currentUser.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#8CC8E8]/90 truncate max-w-[150px]">
                    {currentUser.email}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-white/70" />
              </button>
            ) : (
              <button
                onClick={onOpenSignIn}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#8CC8E8] text-[#062A3D] hover:bg-white transition shadow-sm"
              >
                Sign In (Email Link)
              </button>
            )}

            {/* Account Switcher Dropdown */}
            {userMenuOpen && currentUser && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-96 bg-white text-slate-800 rounded-2xl shadow-2xl py-2 z-50 border border-slate-200 overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b border-slate-100 bg-[#F4F7F9]">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#062A3D]">
                        Active User
                      </p>
                      <span className="text-[10px] font-bold bg-[#8CC8E8]/20 text-[#062A3D] px-2 py-0.5 rounded-full border border-[#8CC8E8]/40">
                        {currentUser.role}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 mt-1">
                      {currentUser.displayName}
                    </p>
                    <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                  </div>

                  <div className="p-3 border-b border-slate-100">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Switch Role (Committee Test Accounts)
                    </p>
                    <div className="space-y-1.5">
                      {testAccounts.map((acc) => {
                        const isSelected = currentUser.email.toLowerCase() === acc.email.toLowerCase();
                        return (
                          <button
                            key={acc.email}
                            onClick={() => {
                              signInAsTestUser(acc.email, acc.role, acc.name);
                              setUserMenuOpen(false);
                              if (acc.role === 'Admin') setActiveTab('admin-rankings');
                              else setActiveTab('reviewer-queue');
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
                                <span className="text-xs font-bold truncate">{acc.name}</span>
                                <span
                                  className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                    acc.role === 'Admin'
                                      ? isSelected
                                        ? 'bg-[#8CC8E8] text-[#062A3D]'
                                        : 'bg-purple-100 text-purple-800'
                                      : acc.role === 'NonVotingReviewer'
                                      ? isSelected
                                        ? 'bg-amber-300 text-slate-900'
                                        : 'bg-amber-100 text-amber-800'
                                      : isSelected
                                      ? 'bg-sky-200 text-slate-900'
                                      : 'bg-sky-100 text-sky-800'
                                  }`}
                                >
                                  {acc.role === 'NonVotingReviewer' ? 'Non-Voting' : acc.role}
                                </span>
                              </div>
                              <p
                                className={`text-[11px] truncate ${
                                  isSelected ? 'text-[#8CC8E8]' : 'text-slate-500'
                                }`}
                              >
                                {acc.email}
                              </p>
                              <p
                                className={`text-[10px] mt-0.5 ${
                                  isSelected ? 'text-white/70' : 'text-slate-400'
                                }`}
                              >
                                {acc.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Passwordless Sign-In options & Logout */}
                  <div className="p-3 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onOpenSignIn?.();
                        }}
                        className="text-xs font-semibold text-[#062A3D] hover:underline"
                      >
                        Magic Link
                      </button>
                      {onOpenTermsPrivacy && (
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            onOpenTermsPrivacy();
                          }}
                          className="text-xs font-semibold text-slate-600 hover:text-[#062A3D]"
                        >
                          Terms & Privacy
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-100 flex items-center gap-1.5 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        {currentUser && (
          <div className="md:hidden border-t border-white/10 py-2 overflow-x-auto flex items-center space-x-1.5 scrollbar-none text-xs">
            {currentUser.role === 'Admin' ? (
              <>
                <button
                  onClick={() => setActiveTab('admin-rankings')}
                  className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap flex items-center gap-1 ${
                    activeTab === 'admin-rankings' ? 'bg-white/20 text-white' : 'text-white/80'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#8CC8E8]" />
                  <span>Rankings</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin-reviewers')}
                  className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap flex items-center gap-1 ${
                    activeTab === 'admin-reviewers' ? 'bg-white/20 text-white' : 'text-white/80'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-[#8CC8E8]" />
                  <span>Reviewers</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin-settings')}
                  className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap flex items-center gap-1 ${
                    activeTab === 'admin-settings' ? 'bg-white/20 text-white' : 'text-white/80'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5 text-[#8CC8E8]" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin-audit')}
                  className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap flex items-center gap-1 ${
                    activeTab === 'admin-audit' ? 'bg-white/20 text-white' : 'text-white/80'
                  }`}
                >
                  <History className="w-3.5 h-3.5 text-[#8CC8E8]" />
                  <span>Audit</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('reviewer-queue')}
                  className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap flex items-center gap-1 ${
                    activeTab === 'reviewer-queue' || activeTab === 'reviewer-score'
                      ? 'bg-white/20 text-white'
                      : 'text-white/80'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5 text-[#8CC8E8]" />
                  <span>Review Queue</span>
                </button>
                <button
                  onClick={() => setActiveTab('rubric-guide')}
                  className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap flex items-center gap-1 ${
                    activeTab === 'rubric-guide' ? 'bg-white/20 text-white' : 'text-white/80'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#8CC8E8]" />
                  <span>Rubric</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
