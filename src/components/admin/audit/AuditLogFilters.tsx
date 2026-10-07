import React from 'react';
import { AuditCategory, UserRole } from '../../../types/grant';
import { Search, Filter, Download, Trash2, ArrowUpDown } from 'lucide-react';

interface AuditLogFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedRole: string;
  onRoleChange: (role: string) => void;
  sortOrder: 'newest' | 'oldest';
  onSortChange: (order: 'newest' | 'oldest') => void;
  onExportCsv: () => void;
  onClearLogs?: () => void;
  canClear: boolean;
}

export const AuditLogFilters: React.FC<AuditLogFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedRole,
  onRoleChange,
  sortOrder,
  onSortChange,
  onExportCsv,
  onClearLogs,
  canClear,
}) => {
  const categories: Array<AuditCategory | 'all'> = [
    'all',
    'Settings',
    'Vendors',
    'Rubric',
    'Awards & Decisions',
    'Inquiries',
    'System',
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
      {/* Search and Category Filters */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search details, actor, or action..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
          />
        </div>

        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1 bg-slate-50 text-slate-700 font-semibold"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
          <span>Role:</span>
          <select
            value={selectedRole}
            onChange={(e) => onRoleChange(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1 bg-slate-50 text-slate-700 font-semibold"
          >
            <option value="all">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Owner">Owner</option>
            <option value="Reviewer">Reviewer</option>
            <option value="Teacher">Teacher</option>
          </select>
        </div>
      </div>

      {/* Sorting, Export, and Reset */}
      <div className="flex items-center gap-2 self-end md:self-center">
        <button
          onClick={() => onSortChange(sortOrder === 'newest' ? 'oldest' : 'newest')}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1 transition"
          title="Toggle sort order"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span>{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
        </button>

        <button
          onClick={onExportCsv}
          className="px-3 py-1.5 rounded-lg font-bold bg-[#062A3D] text-white hover:bg-[#0A3D59] transition flex items-center gap-1.5 shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-[#8CC8E8]" />
          <span>Export CSV</span>
        </button>

        {canClear && onClearLogs && (
          <button
            onClick={onClearLogs}
            className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 font-medium flex items-center gap-1 transition"
            title="Archive and reset audit logs (Owner permission)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Archive</span>
          </button>
        )}
      </div>
    </div>
  );
};
