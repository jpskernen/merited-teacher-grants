import React, { useState } from 'react';
import { AdminAuditLog } from '../../../types/grant';
import {
  Clock,
  User,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Sliders,
  Building2,
  Award,
  MessageSquare,
  History,
} from 'lucide-react';

interface AuditLogItemProps {
  log: AdminAuditLog;
}

export const AuditLogItem: React.FC<AuditLogItemProps> = ({ log }) => {
  const [showMetadata, setShowMetadata] = useState(false);

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'Settings':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Vendors':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Rubric':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Awards & Decisions':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Inquiries':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Settings':
        return <Sliders className="w-3.5 h-3.5 text-sky-600" />;
      case 'Vendors':
        return <Building2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Rubric':
        return <Sliders className="w-3.5 h-3.5 text-purple-600" />;
      case 'Awards & Decisions':
        return <Award className="w-3.5 h-3.5 text-amber-600" />;
      case 'Inquiries':
        return <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />;
      default:
        return <History className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const formattedDate = new Date(log.timestamp).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs transition hover:border-slate-300 space-y-2.5">
      {/* Header Row: Category, Action, Timestamp */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${getCategoryBadge(
              log.category
            )}`}
          >
            {getCategoryIcon(log.category)}
            <span>{log.category}</span>
          </span>

          <span className="text-xs font-mono font-bold text-[#062A3D] bg-slate-100 px-2 py-0.5 rounded">
            {log.action}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Details Description */}
      <p className="text-xs text-slate-800 leading-relaxed font-medium">
        {log.details}
      </p>

      {/* Footer Row: User / Actor Identification */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-700">{log.userName}</span>
          <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
            {log.userRole}
          </span>
          <span className="text-slate-400 font-mono text-[10px] hidden sm:inline">
            ({log.userEmail})
          </span>
        </div>

        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className="text-[11px] font-semibold text-[#062A3D] hover:underline flex items-center gap-1 self-end sm:self-center"
          >
            <span>{showMetadata ? 'Hide Technical Metadata' : 'View Metadata'}</span>
            {showMetadata ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Expandable Technical Metadata */}
      {showMetadata && log.metadata && (
        <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] font-mono text-slate-700 overflow-x-auto">
          <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
