/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GrantProvider, useGrants } from './context/GrantContext';
import { Header } from './components/common/Header';
import { NotificationToast } from './components/common/NotificationToast';
import { SignInModal } from './components/common/SignInModal';
import { ReviewQueue } from './components/reviewer/ReviewQueue';
import { ReviewerScoreScreen } from './components/reviewer/ReviewerScoreScreen';
import { RubricGuide } from './components/reviewer/RubricGuide';
import { AdminRankingsView } from './components/admin/AdminRankingsView';
import { AdminSubmissionsListView } from './components/admin/AdminSubmissionsListView';
import { AdminSettings } from './components/admin/AdminSettings';
import { AdminAuditLogView } from './components/admin/audit/AdminAuditLogView';
import { ReviewerAppreciationView } from './components/admin/ReviewerAppreciationView';
import { AdminSentEmailsModal } from './components/admin/AdminSentEmailsModal';
import { TermsPrivacyModal } from './components/common/TermsPrivacyModal';
import { ShieldCheck, CheckSquare, Sparkles, LogIn, ArrowRight } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentUser, loginWithMagicLink, acceptInviteByToken, programSettings } = useGrants();

  const [activeTab, setActiveTab] = useState<string>('reviewer-queue');
  const [scoringAppId, setScoringAppId] = useState<string | null>(null);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSentEmailsOpen, setIsSentEmailsOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [termsTab, setTermsTab] = useState<'terms' | 'privacy'>('terms');

  // Sync active tab when user changes or logs in
  useEffect(() => {
    if (currentUser?.role === 'Admin') {
      if (activeTab === 'reviewer-queue' || activeTab === 'reviewer-score') {
        setActiveTab('admin-rankings');
      }
    } else if (currentUser?.role === 'Reviewer' || currentUser?.role === 'NonVotingReviewer') {
      if (activeTab.startsWith('admin-')) {
        setActiveTab('reviewer-queue');
      }
    }
  }, [currentUser?.role]);

  // Magic link login auto-detection via query string (?invite=xxx or ?reviewerToken=xxx or ?token=xxx)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const inviteToken = params.get('invite');
      if (inviteToken) {
        acceptInviteByToken(inviteToken).then((res) => {
          if (res.success) {
            setActiveTab('reviewer-queue');
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        });
        return;
      }

      const token = params.get('reviewerToken') || params.get('token');
      if (token) {
        const success = loginWithMagicLink(token);
        if (success) {
          setActiveTab('reviewer-queue');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, [loginWithMagicLink, acceptInviteByToken]);

  const handleSelectAppForScoring = (appId: string) => {
    setScoringAppId(appId);
    setActiveTab('reviewer-score');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7F9] text-[#1E2A33]">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSignIn={() => setIsSignInOpen(true)}
        onOpenSentEmails={() => setIsSentEmailsOpen(true)}
        onOpenTermsPrivacy={() => {
          setTermsTab('terms');
          setIsTermsOpen(true);
        }}
      />

      <main className="flex-1 pb-16">
        {/* Unauthenticated Landing State */}
        {!currentUser ? (
          <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-[#062A3D] text-[#8CC8E8] mx-auto flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#062A3D]/70 bg-[#8CC8E8]/20 px-3 py-1 rounded-full border border-[#8CC8E8]/40">
                Nacogdoches ISD Education Foundation
              </span>
              <h1 className="text-3xl font-extrabold text-[#062A3D] mt-3">
                Innovative Teaching Grants Review Portal
              </h1>
              <p className="text-sm text-slate-600 max-w-xl mx-auto mt-2">
                Secure evaluation portal for committee reviewers and grant administrators.
                Blind scoring and encrypted applicant identities active for cycle {programSettings.schoolYear}.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setIsSignInOpen(true)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-[#062A3D] text-white hover:bg-[#093e5a] transition shadow-md flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4 text-[#8CC8E8]" />
                <span>Sign In with District Magic Link</span>
                <ArrowRight className="w-4 h-4 text-[#8CC8E8]" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Reviewer Views */}
            {activeTab === 'reviewer-queue' && (
              <ReviewQueue onSelectApplication={handleSelectAppForScoring} />
            )}

            {activeTab === 'reviewer-score' && scoringAppId && (
              <ReviewerScoreScreen
                applicationId={scoringAppId}
                onBack={() => setActiveTab('reviewer-queue')}
              />
            )}

            {activeTab === 'rubric-guide' && <RubricGuide />}

            {/* Admin Views */}
            {activeTab === 'admin-rankings' && <AdminRankingsView />}

            {activeTab === 'admin-submissions' && <AdminSubmissionsListView />}

            {activeTab === 'admin-reviewers' && <ReviewerAppreciationView />}

            {activeTab === 'admin-settings' && (
              <AdminSettings onNavigateAuditLog={() => setActiveTab('admin-audit')} />
            )}

            {activeTab === 'admin-audit' && <AdminAuditLogView />}
          </>
        )}
      </main>

      {/* Passwordless Sign-In Modal */}
      <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />

      {/* Admin Sent Emails Audit Log Modal */}
      <AdminSentEmailsModal
        isOpen={isSentEmailsOpen}
        onClose={() => setIsSentEmailsOpen(false)}
      />

      {/* Terms of Service & Privacy Policy Modal */}
      <TermsPrivacyModal
        isOpen={isTermsOpen}
        initialTab={termsTab}
        onClose={() => setIsTermsOpen(false)}
      />

      {/* Floating System Notification Toast */}
      <NotificationToast />

      {/* Footer */}
      <footer className="bg-[#062A3D] text-white/70 text-xs py-6 border-t border-white/10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <div className="font-semibold text-white tracking-wide">
              Nacogdoches ISD Education Foundation (NEF)
            </div>
            <div className="text-[11px] text-[#8CC8E8]">
              Empowering Teachers • Inspiring Students • Driving Classroom Innovation
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 text-[11px] text-slate-300">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setTermsTab('terms');
                  setIsTermsOpen(true);
                }}
                className="hover:text-white underline transition"
              >
                Terms of Service
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  setTermsTab('privacy');
                  setIsTermsOpen(true);
                }}
                className="hover:text-white underline transition"
              >
                Privacy Policy
              </button>
            </div>
            <span className="hidden sm:inline text-white/30">|</span>
            <span>Merited Grants System • Protected by Blind Review & Persistence</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <GrantProvider>
      <MainAppContent />
    </GrantProvider>
  );
}
