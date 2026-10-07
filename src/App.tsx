/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GrantProvider, useGrant } from './context/GrantContext';
import { Header } from './components/common/Header';
import { NotificationToast } from './components/common/NotificationToast';
import { ProgramOverview } from './components/teacher/ProgramOverview';
import { ApplicationForm } from './components/teacher/ApplicationForm';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { ConfirmationModal } from './components/teacher/ConfirmationModal';
import { ReviewQueue } from './components/reviewer/ReviewQueue';
import { ReviewerScoreScreen } from './components/reviewer/ReviewerScoreScreen';
import { RubricGuide } from './components/reviewer/RubricGuide';
import { AdminRankingsView } from './components/admin/AdminRankingsView';
import { VendorManagement } from './components/admin/VendorManagement';
import { AdminSettings } from './components/admin/AdminSettings';
import { AdminAuditLogView } from './components/admin/audit/AdminAuditLogView';
import { Application } from './types/grant';

const MainAppContent: React.FC = () => {
  const { currentUser, applications, programSettings } = useGrant();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [editingAppId, setEditingAppId] = useState<string | undefined>(undefined);
  const [scoringAppId, setScoringAppId] = useState<string | null>(null);

  // Submitted confirmation modal
  const [justSubmittedApp, setJustSubmittedApp] = useState<Application | null>(null);

  const handleStartNewApplication = () => {
    setEditingAppId(undefined);
    setActiveTab('application');
  };

  const handleEditApplication = (appId: string) => {
    setEditingAppId(appId);
    setActiveTab('application');
  };

  const handleSubmitted = (appId: string) => {
    const found = applications.find((a) => a.id === appId);
    if (found) {
      setJustSubmittedApp(found);
    }
    setActiveTab('dashboard');
  };

  const handleSelectAppForScoring = (appId: string) => {
    setScoringAppId(appId);
    setActiveTab('reviewer-score');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7F9] text-[#1E2A33]">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewApplication={handleStartNewApplication}
      />

      <main className="flex-1 pb-16">
        {/* Teacher Views */}
        {activeTab === 'program-info' && (
          <ProgramOverview onStartApplication={handleStartNewApplication} />
        )}

        {activeTab === 'dashboard' && (
          <TeacherDashboard
            onStartNewApplication={handleStartNewApplication}
            onEditApplication={handleEditApplication}
          />
        )}

        {activeTab === 'application' && (
          <ApplicationForm
            initialAppId={editingAppId}
            onSubmitted={handleSubmitted}
            onCancel={() => setActiveTab('dashboard')}
          />
        )}

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

        {/* Admin / Owner Views */}
        {activeTab === 'admin-rankings' && <AdminRankingsView />}

        {activeTab === 'admin-vendors' && (
          <VendorManagement onNavigateAuditLog={() => setActiveTab('admin-audit')} />
        )}

        {activeTab === 'admin-settings' && (
          <AdminSettings onNavigateAuditLog={() => setActiveTab('admin-audit')} />
        )}

        {activeTab === 'admin-audit' && <AdminAuditLogView />}
      </main>

      {/* Confirmation Modal */}
      {justSubmittedApp && (
        <ConfirmationModal
          application={justSubmittedApp}
          programSettings={programSettings}
          onGoToDashboard={() => setJustSubmittedApp(null)}
        />
      )}

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
          <div className="text-[11px] text-slate-300">
            Merited Grants System • Protected by Blind Review & Enterprise Persistence
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
