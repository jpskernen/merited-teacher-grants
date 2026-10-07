import React from 'react';
import { AdminAuditLog } from '../../../types/grant';
import { History, Shield, Building2, Sliders, Award, Clock } from 'lucide-react';

interface AuditLogStatsProps {
  logs: AdminAuditLog[];
}

export const AuditLogStats: React.FC<AuditLogStatsProps> = ({ logs }) => {
  const totalLogs = logs.length;
  const settingsCount = logs.filter((l) => l.category === 'Settings').length;
  const vendorsCount = logs.filter((l) => l.category === 'Vendors').length;
  const rubricCount = logs.filter((l) => l.category === 'Rubric').length;
  const awardsCount = logs.filter((l) => l.category === 'Awards & Decisions').length;

  const latestLog = logs[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
      {/* Total Events */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-1">
        <div className="flex items-center justify-between text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
          <span>Total Audit Logs</span>
          <History className="w-4 h-4 text-[#8CC8E8]" />
        </div>
        <div className="text-2xl font-extrabold text-[#062A3D]">{totalLogs}</div>
        <p className="text-[11px] text-slate-500">Recorded system mutations</p>
      </div>

      {/* Settings & Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-1">
        <div className="flex items-center justify-between text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
          <span>Settings & Rubric</span>
          <Sliders className="w-4 h-4 text-sky-600" />
        </div>
        <div className="text-2xl font-extrabold text-[#062A3D]">
          {settingsCount + rubricCount}
        </div>
        <p className="text-[11px] text-slate-500">
          {settingsCount} cycle/caps • {rubricCount} rubric
        </p>
      </div>

      {/* Vendor Updates */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-1">
        <div className="flex items-center justify-between text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
          <span>Vendor Changes</span>
          <Building2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-2xl font-extrabold text-[#062A3D]">{vendorsCount}</div>
        <p className="text-[11px] text-slate-500">Catalog updates & imports</p>
      </div>

      {/* Decisions & Awards */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-1">
        <div className="flex items-center justify-between text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
          <span>Awards & Inquiries</span>
          <Award className="w-4 h-4 text-amber-600" />
        </div>
        <div className="text-2xl font-extrabold text-[#062A3D]">{awardsCount}</div>
        <p className="text-[11px] text-slate-500">
          {latestLog ? `Latest: ${new Date(latestLog.timestamp).toLocaleDateString()}` : 'No activity yet'}
        </p>
      </div>
    </div>
  );
};
