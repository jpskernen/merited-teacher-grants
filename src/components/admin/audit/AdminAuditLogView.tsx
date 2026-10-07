import React, { useState, useMemo } from 'react';
import { useGrant } from '../../../context/GrantContext';
import { AdminAuditLog } from '../../../types/grant';
import { AuditLogStats } from './AuditLogStats';
import { AuditLogFilters } from './AuditLogFilters';
import { AuditLogItem } from './AuditLogItem';
import { History, ShieldCheck, FileSpreadsheet, X } from 'lucide-react';

export const AdminAuditLogView: React.FC = () => {
  const { auditLogs, currentUser, clearAuditLogs } = useGrant();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  // Filter and sort logs
  const filteredLogs = useMemo(() => {
    return auditLogs
      .filter((log) => {
        if (selectedCategory !== 'all' && log.category !== selectedCategory) return false;
        if (selectedRole !== 'all' && log.userRole !== selectedRole) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchAction = log.action.toLowerCase().includes(q);
          const matchDetails = log.details.toLowerCase().includes(q);
          const matchUser = log.userName.toLowerCase().includes(q);
          const matchEmail = log.userEmail.toLowerCase().includes(q);
          if (!matchAction && !matchDetails && !matchUser && !matchEmail) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [auditLogs, selectedCategory, selectedRole, searchQuery, sortOrder]);

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'Log ID',
      'Timestamp (ISO)',
      'Category',
      'Action Code',
      'Description / Details',
      'Actor Name',
      'Actor Role',
      'Actor Email',
    ];

    const rows = filteredLogs.map((log) => [
      `"${log.id}"`,
      `"${log.timestamp}"`,
      `"${log.category}"`,
      `"${log.action}"`,
      `"${log.details.replace(/"/g, '""')}"`,
      `"${log.userName.replace(/"/g, '""')}"`,
      `"${log.userRole}"`,
      `"${log.userEmail}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `NEF_Grants_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmArchive = async () => {
    await clearAuditLogs();
    setConfirmClearOpen(false);
  };

  const canClear = currentUser.role === 'Owner';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-[#8CC8E8]" />
            <h1 className="text-2xl font-bold text-[#062A3D]">Admin Audit Log</h1>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Tamper-evident activity trail tracking all significant system changes, cycle parameters, vendor catalog updates, rubric revisions, and award decisions.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold self-start sm:self-center">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Real-time Compliance Tracking Active</span>
        </div>
      </div>

      {/* Summary Stats */}
      <AuditLogStats logs={auditLogs} />

      {/* Filter and Search Bar */}
      <AuditLogFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
        onExportCsv={handleExportCsv}
        onClearLogs={() => setConfirmClearOpen(true)}
        canClear={canClear}
      />

      {/* Logs List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
            <History className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-[#062A3D]">No Matching Audit Events</h3>
            <p className="text-xs text-slate-500">
              Try adjusting your category filter or search keywords.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => <AuditLogItem key={log.id} log={log} />)
        )}
      </div>

      {/* Archive / Reset Confirmation Modal */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#062A3D]">Archive Audit Trail</h3>
              <button
                onClick={() => setConfirmClearOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to archive current audit logs? An official record of this archiving action will be automatically recorded under your Owner credentials.
            </p>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setConfirmClearOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmArchive}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700"
              >
                Confirm Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
