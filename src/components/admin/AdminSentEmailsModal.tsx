import React, { useState, useEffect } from 'react';
import { useGrants } from '../../context/GrantContext';
import { SentEmail } from '../../types/grant';
import {
  Mail,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  Search,
  RefreshCw,
  Eye,
  Send,
  ShieldAlert,
} from 'lucide-react';

interface AdminSentEmailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSentEmailsModal: React.FC<AdminSentEmailsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { sentEmails, fetchSentEmails } = useGrants();
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectEmail, setInspectEmail] = useState<SentEmail | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadEmails();
    }
  }, [isOpen]);

  const loadEmails = async () => {
    setLoading(true);
    try {
      await fetchSentEmails();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredEmails = sentEmails.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchRecipient = item.recipient.toLowerCase().includes(q);
      const matchSubject = item.subject.toLowerCase().includes(q);
      const matchCode = (item.grantCode || '').toLowerCase().includes(q);
      if (!matchRecipient && !matchSubject && !matchCode) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#062A3D] text-[#8CC8E8]">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#062A3D]">
                Foundation Sent Emails Audit Log
              </h3>
              <p className="text-xs text-slate-500">
                Persistent server log (`sent_emails` collection). Admin-only visibility.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadEmails}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-[#062A3D] hover:bg-slate-100 rounded-xl transition"
              title="Refresh logs from server"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by recipient email, subject, or grant code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none text-xs focus:outline-none placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 bg-white text-slate-700 font-semibold text-xs"
            >
              <option value="all">All Email Types</option>
              <option value="decision">Decisions</option>
              <option value="reviewer_invite">Reviewer Invites</option>
              <option value="review_submitted">Review Submissions</option>
              <option value="cycle_open">Review Cycle Open</option>
              <option value="status_change">Status Changes</option>
              <option value="teacher_confirmation">Teacher Confirmations</option>
            </select>
            <span className="text-slate-500 font-medium whitespace-nowrap">
              {filteredEmails.length} logged
            </span>
          </div>
        </div>

        {/* Emails Table */}
        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#062A3D] text-white uppercase text-[10px] tracking-wider sticky top-0">
              <tr>
                <th className="py-2.5 px-4 font-bold">Recipient</th>
                <th className="py-2.5 px-4 font-bold">Subject & Grant</th>
                <th className="py-2.5 px-4 font-bold">Type</th>
                <th className="py-2.5 px-4 font-bold">Delivery Status</th>
                <th className="py-2.5 px-4 font-bold">Timestamp</th>
                <th className="py-2.5 px-4 font-bold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmails.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No emails logged in this category.
                  </td>
                </tr>
              ) : (
                filteredEmails.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {item.recipient}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-[#062A3D] truncate">{item.subject}</div>
                      {item.grantCode && (
                        <div className="text-[10px] font-mono font-bold text-slate-500 mt-0.5">
                          Grant: {item.grantCode}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                        {item.type}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.simulated ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <span>Simulated (No SMTP)</span>
                        </span>
                      ) : item.delivered ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Delivered</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>Failed</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setInspectEmail(item)}
                        className="p-1.5 text-slate-500 hover:text-[#062A3D] hover:bg-slate-100 rounded-lg transition"
                        title="Inspect full log payload"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Every outbound message is rendered with the `#062A3D` navy header & feather logo.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#062A3D] text-white hover:bg-[#0A3D59]"
          >
            Close
          </button>
        </div>
      </div>

      {/* Inspect Single Email Modal */}
      {inspectEmail && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-[#062A3D]">Email Audit Entry</h4>
                <p className="text-xs text-slate-500">{inspectEmail.id}</p>
              </div>
              <button
                onClick={() => setInspectEmail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500 font-semibold">Recipient:</span>
                <div className="font-mono font-bold text-slate-800">{inspectEmail.recipient}</div>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Subject:</span>
                <div className="font-bold text-[#062A3D]">{inspectEmail.subject}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 font-semibold">Type:</span>
                  <div>{inspectEmail.type}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Grant Code:</span>
                  <div className="font-mono">{inspectEmail.grantCode || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Dispatched At:</span>
                  <div>{new Date(inspectEmail.timestamp).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Mode:</span>
                  <div>{inspectEmail.simulated ? 'Simulated Log' : 'SMTP Server'}</div>
                </div>
              </div>
              {inspectEmail.error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                  <strong>Error details:</strong> {inspectEmail.error}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectEmail(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
