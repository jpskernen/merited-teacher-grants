import React, { useState, useMemo } from 'react';
import { useGrants } from '../../context/GrantContext';
import { ReviewerProfile } from '../../types/grant';
import {
  Users,
  UserPlus,
  Mail,
  Gift,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Send,
  Edit2,
  Trash2,
  ExternalLink,
  Shirt,
  MapPin,
  Sparkles,
  Calendar,
  X,
  RotateCw,
  Ban,
} from 'lucide-react';

export const ReviewerAppreciationView: React.FC = () => {
  const {
    reviewers,
    invites,
    inviteReviewer,
    resendInvite,
    revokeInvite,
    updateReviewerProfile,
    deleteReviewerProfile,
    sendReviewerReminder,
    sendReviewerThankYou,
    loginWithMagicLink,
    applications,
    reviews,
    programSettings,
    rubric,
  } = useGrants();

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Reviewer' | 'NonVotingReviewer'>('Reviewer');
  const [inviteCycles, setInviteCycles] = useState(1);
  const [inviteAddress, setInviteAddress] = useState('');
  const [inviteShirtSize, setInviteShirtSize] = useState<'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL'>('L');

  // Generated invitation result modal
  const [inviteResult, setInviteResult] = useState<{ reviewer: ReviewerProfile; magicLink: string } | null>(null);

  // Edit swag modal state
  const [editingReviewer, setEditingReviewer] = useState<ReviewerProfile | null>(null);

  // Clipboard copy state
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Filter submitted applications that require review
  const activeApplications = useMemo(
    () => applications.filter((a) => a.status !== 'Draft'),
    [applications]
  );

  // Compute scoring progress for each reviewer
  const reviewerStats = useMemo(() => {
    return reviewers.map((rev) => {
      const myReviews = reviews.filter((r) => r.reviewerEmail.toLowerCase() === rev.email.toLowerCase());
      const criteriaCount = rubric.length;
      // An application is considered scored if all criteria are scored
      const scoredReviews = myReviews.filter(
        (r) => Object.keys(r.scores || {}).length >= criteriaCount
      );
      const scoredCount = scoredReviews.length;
      const totalAssigned = activeApplications.length;
      const isFinished = totalAssigned > 0 && scoredCount >= totalAssigned;
      const percentComplete = totalAssigned > 0 ? Math.round((scoredCount / totalAssigned) * 100) : 0;

      return {
        rev,
        scoredCount,
        totalAssigned,
        isFinished,
        percentComplete,
      };
    });
  }, [reviewers, reviews, activeApplications, rubric]);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    const res = await inviteReviewer({
      name: inviteName.trim(),
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      cyclesServed: inviteCycles,
      mailingAddress: inviteAddress.trim(),
      shirtSize: inviteShirtSize,
    });

    setInviteResult(res);
    setShowInviteModal(false);
    // Reset form
    setInviteName('');
    setInviteEmail('');
    setInviteAddress('');
    setInviteCycles(1);
  };

  const handleCopyMagicLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleSaveSwagEdit = async () => {
    if (!editingReviewer) return;
    await updateReviewerProfile(editingReviewer);
    setEditingReviewer(null);
  };

  // Export reviewer appreciation and swag list to CSV
  const handleExportSwagCsv = () => {
    const headers = [
      'Reviewer Name',
      'Email',
      'Role',
      'Cycles Served',
      'Mailing Address',
      'Shirt Size',
      'Applications Scored',
      'Total Assigned',
      'Status',
      'Thank-You Dispatched',
    ];

    const rows = reviewerStats.map(({ rev, scoredCount, totalAssigned, isFinished }) => [
      `"${rev.name}"`,
      `"${rev.email}"`,
      `"${rev.role === 'admin' ? 'Admin' : 'Reviewer'}"`,
      rev.cyclesServed,
      `"${(rev.mailingAddress || '').replace(/"/g, '""')}"`,
      `"${rev.shirtSize || 'N/A'}"`,
      scoredCount,
      totalAssigned,
      isFinished ? 'Completed 100%' : 'In Progress',
      rev.thankYouSent ? 'YES' : 'PENDING',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NEF_Reviewer_Appreciation_Swag_${programSettings.schoolYear.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#062A3D]">
              Reviewer Management & Appreciation
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
              {reviewers.length} Evaluators
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Invite committee evaluators via passwordless magic links, schedule deadline reminders (3 days & 1 day before close), and track thank-you gifts & swag.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportSwagCsv}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
            title="Download formatted spreadsheet for mailing thank-you notes and swag"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Swag CSV</span>
          </button>

          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#062A3D] hover:bg-[#0A3D59] text-white text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <UserPlus className="w-4 h-4 text-[#8CC8E8]" />
            <span>Invite Reviewer</span>
          </button>
        </div>
      </div>

      {/* Automated Reminders & Deadline Countdown Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="text-sm font-bold text-[#062A3D]">
                Automated Reviewer Reminders Schedule
              </h3>
              <p className="text-xs text-slate-500">
                Automated notices dispatched to reviewers who haven't completed scoring before the deadline.
              </p>
            </div>
          </div>

          <div className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
            Scoring Closes: {programSettings.reviewClosesDate || 'November 11, 2026'} at 11:59 PM
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#062A3D] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>3 Days Before Review Closes</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">November 13, 2026</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Warm friendly nudge summarizing remaining unscored applications, direct magic sign-in link, and committee chair contact.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#062A3D] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>1 Day Before Review Closes (Final Notice)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">November 15, 2026</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              High-priority urgent reminder ensuring all scores are in before automated 11:59 PM portal lock for awards deliberation.
            </p>
          </div>
        </div>
      </div>

      {/* Pending Reviewer Invitations (14-Day Expiry) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#062A3D]" />
            <h3 className="text-xs font-bold text-[#062A3D] uppercase tracking-wider">
              Invitations Audit & 14-Day Expiry Controls
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {invites.filter((i) => i.status === 'pending').length} Active Pending Invites
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#062A3D] text-white uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4 font-bold">Recipient</th>
                <th className="py-2.5 px-4 font-bold">Role</th>
                <th className="py-2.5 px-4 font-bold">Dispatched</th>
                <th className="py-2.5 px-4 font-bold">14-Day Expiry</th>
                <th className="py-2.5 px-4 font-bold">Status</th>
                <th className="py-2.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invites.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                    No invitations generated yet. Click "Invite Reviewer" above to dispatch an invitation.
                  </td>
                </tr>
              ) : (
                invites.map((invite) => {
                  const now = new Date();
                  const expDate = new Date(invite.expiresAt);
                  const isExpired = expDate < now && invite.status === 'pending';
                  const daysLeft = Math.max(0, Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                  const magicLink = `${window.location.origin}/?invite=${encodeURIComponent(invite.token)}`;

                  return (
                    <tr key={invite.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#062A3D]">{invite.name || 'Unnamed Evaluator'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{invite.email}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            invite.role === 'admin'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {invite.role}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {new Date(invite.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-slate-800 font-semibold">
                          {expDate.toLocaleDateString()}
                        </div>
                        {invite.status === 'pending' && !isExpired && (
                          <div className="text-[10px] text-emerald-700 font-medium">
                            {daysLeft} day{daysLeft === 1 ? '' : 's'} remaining
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {invite.status === 'accepted' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Accepted
                          </span>
                        ) : invite.status === 'revoked' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            Revoked
                          </span>
                        ) : isExpired ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            Expired
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                        {invite.status === 'pending' && (
                          <>
                            <button
                              onClick={() => resendInvite(invite.id)}
                              className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition inline-flex items-center gap-1"
                              title="Resend invitation and renew 14-day validity window"
                            >
                              <RotateCw className="w-3 h-3" />
                              <span>Resend (Renew 14d)</span>
                            </button>

                            <button
                              onClick={() => revokeInvite(invite.id)}
                              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition inline-flex items-center gap-1"
                              title="Revoke this pending invitation link"
                            >
                              <Ban className="w-3 h-3" />
                              <span>Revoke</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleCopyMagicLink(magicLink, invite.id)}
                          className="p-1.5 text-slate-500 hover:text-[#062A3D] hover:bg-slate-100 rounded-lg transition"
                          title="Copy magic invite link"
                        >
                          {copiedLink === invite.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reviewer Appreciation & Swag Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-[#8CC8E8]" />
            <h3 className="text-xs font-bold text-[#062A3D] uppercase tracking-wider">
              Committee Evaluator Roster & Recognition
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {reviewerStats.filter((s) => s.isFinished).length} of {reviewers.length} Finished Scoring
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#062A3D] text-white uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold">Reviewer Name & Role</th>
                <th className="py-3 px-4 font-bold">Scoring Progress</th>
                <th className="py-3 px-4 font-bold">Cycles Served</th>
                <th className="py-3 px-4 font-bold">Mailing Address</th>
                <th className="py-3 px-4 font-bold text-center">Shirt Size</th>
                <th className="py-3 px-4 font-bold">Reminders</th>
                <th className="py-3 px-4 font-bold text-right">Appreciation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reviewerStats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No reviewers registered. Click "Invite Reviewer" above to add your first evaluator.
                  </td>
                </tr>
              ) : (
                reviewerStats.map(({ rev, scoredCount, totalAssigned, isFinished, percentComplete }) => {
                  const magicLink = `${window.location.origin}?reviewerToken=${rev.magicLinkToken || 'test'}&email=${encodeURIComponent(rev.email)}`;

                  return (
                    <tr key={rev.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-medium text-[#062A3D]">
                        <div className="font-bold flex items-center gap-1.5">
                          <span>{rev.name}</span>
                          {rev.thankYouSent && (
                            <span title="Thank-you appreciation sent" className="text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{rev.email}</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-semibold text-sky-800">
                            Reviewer
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#062A3D]">
                            {scoredCount} of {totalAssigned}
                          </span>
                          {isFinished ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Completed
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-medium">
                              ({percentComplete}%)
                            </span>
                          )}
                        </div>
                        {/* Progress mini bar */}
                        <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full ${isFinished ? 'bg-emerald-500' : 'bg-[#8CC8E8]'}`}
                            style={{ width: `${percentComplete}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-800">{rev.cyclesServed}</span>
                        <span className="text-slate-500 ml-1 text-[11px]">
                          {rev.cyclesServed === 1 ? 'cycle (New!)' : 'cycles'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs text-slate-600">
                        {rev.mailingAddress ? (
                          <div className="truncate text-[11px]" title={rev.mailingAddress}>
                            {rev.mailingAddress}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Address needed</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-bold text-[11px]">
                          {rev.shirtSize || 'L'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1 text-[10px]">
                          {rev.reminderSent3Day && (
                            <div className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              ✓ 3-Day Sent
                            </div>
                          )}
                          {rev.reminderSent1Day && (
                            <div className="text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              ✓ 1-Day Sent
                            </div>
                          )}
                          {!rev.reminderSent3Day && !rev.reminderSent1Day && (
                            <span className="text-slate-400">Scheduled</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        {/* Edit Swag Details */}
                        <button
                          onClick={() => setEditingReviewer(rev)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                          title="Edit address, shirt size, or cycles served"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Send Reminders */}
                        {!isFinished && (
                          <button
                            onClick={() => sendReviewerReminder(rev.id, rev.reminderSent3Day ? '1day' : '3day')}
                            className="px-2 py-1 rounded-md text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition"
                            title="Dispatch deadline reminder email"
                          >
                            {rev.reminderSent3Day ? 'Send 1-Day Notice' : 'Send 3-Day Nudge'}
                          </button>
                        )}

                        {/* Send Thank You Recognition */}
                        <button
                          onClick={() => sendReviewerThankYou(rev.id)}
                          className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
                            rev.thankYouSent
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                          title="Send official foundation thank-you recognition notice"
                        >
                          {rev.thankYouSent ? 'Resend Thank-You' : 'Send Thank-You'}
                        </button>

                        {/* Copy Magic Link */}
                        <button
                          onClick={() => handleCopyMagicLink(magicLink, rev.id)}
                          className="p-1.5 text-slate-500 hover:text-[#062A3D] hover:bg-slate-100 rounded-lg transition"
                          title="Copy passwordless magic sign-in link"
                        >
                          {copiedLink === rev.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Test Sign In */}
                        <button
                          onClick={() => loginWithMagicLink(rev.email)}
                          className="px-2 py-1 rounded-md text-[11px] font-bold bg-[#062A3D] hover:bg-[#0A3D59] text-white transition shadow-2xs"
                          title="Switch into this reviewer's active view"
                        >
                          Sign In
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Reviewer Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#062A3D] text-[#8CC8E8]">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#062A3D]">Invite New Reviewer</h3>
                  <p className="text-xs text-slate-500">
                    Reviewer receives a passwordless magic sign-in link and welcome guide.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvite} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Reviewer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Judy Abbott"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. judy@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Committee Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-white font-semibold"
                  >
                    <option value="Reviewer">Reviewer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cycles Served on Committee
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={inviteCycles}
                    onChange={(e) => setInviteCycles(parseInt(e.target.value, 10) || 1)}
                    className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mailing Address (for Thank-You Gifts & Swag)
                </label>
                <input
                  type="text"
                  placeholder="Street, City, State, ZIP"
                  value={inviteAddress}
                  onChange={(e) => setInviteAddress(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Swag Shirt Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setInviteShirtSize(sz)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                        inviteShirtSize === sz
                          ? 'bg-[#062A3D] text-white border-[#062A3D]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-slate-600">
                <div className="font-semibold text-slate-800">What the Reviewer Receives:</div>
                <p className="text-[11px] leading-snug">
                  • Instant passwordless magic link to log in directly.
                </p>
                <p className="text-[11px] leading-snug">
                  • Short welcome notice explaining the 8-criterion 100-pt rubric and the {programSettings.reviewClosesDate || 'November 11'} deadline.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-[#062A3D] text-white hover:bg-[#0A3D59]"
                >
                  Generate Invitation & Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated Invitation & Magic Link Modal */}
      {inviteResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#062A3D]">Invitation Ready</h3>
                  <p className="text-xs text-slate-500">
                    Generated for {inviteResult.reviewer.name} ({inviteResult.reviewer.email})
                  </p>
                </div>
              </div>
              <button onClick={() => setInviteResult(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Magic Link Box */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-[#062A3D]">
                Passwordless Magic Sign-In Link
              </label>
              <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                <input
                  type="text"
                  readOnly
                  value={inviteResult.magicLink}
                  className="w-full bg-transparent text-xs font-mono text-slate-700 outline-none"
                />
                <button
                  onClick={() => handleCopyMagicLink(inviteResult.magicLink, 'modal')}
                  className="px-3 py-1.5 rounded-lg bg-[#062A3D] text-white font-bold flex items-center gap-1 shrink-0 hover:bg-[#0A3D59]"
                >
                  {copiedLink === 'modal' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Email Preview Copy */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
              <div className="font-bold text-[#062A3D] uppercase text-[11px] tracking-wide">
                Welcome Message Preview:
              </div>
              <div className="text-slate-700 text-[11px] leading-relaxed bg-white p-3 rounded-lg border border-slate-200 font-sans space-y-1.5">
                <p>Dear {inviteResult.reviewer.name},</p>
                <p>
                  Thank you for serving on the <strong>Nacogdoches ISD Education Foundation Grants Committee</strong> for {programSettings.schoolYear}!
                </p>
                <p>
                  Your review queue has proposals assigned to evaluate against our 8-criterion 100-point rubric. Scoring closes on <strong>{programSettings.reviewClosesDate || 'November 11, 2026'} at 11:59 PM</strong>.
                </p>
                <p>
                  You can sign in instantly without a password using your personal link below:
                </p>
                <p className="font-mono text-[#062A3D] font-bold">{inviteResult.magicLink}</p>
                <p>With gratitude,<br />Sarah Holcomb, Foundation Director</p>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <button
                onClick={() => loginWithMagicLink(inviteResult.reviewer.email)}
                className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test Sign-In as {inviteResult.reviewer.name.split(' ')[0]}</span>
              </button>

              <button
                onClick={() => setInviteResult(null)}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-[#062A3D] text-white hover:bg-[#0A3D59]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Reviewer Swag Details Modal */}
      {editingReviewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#062A3D]">
                Edit Swag & Address: {editingReviewer.name}
              </h3>
              <button onClick={() => setEditingReviewer(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cycles Served</label>
                <input
                  type="number"
                  min={1}
                  value={editingReviewer.cyclesServed}
                  onChange={(e) =>
                    setEditingReviewer((p) =>
                      p ? { ...p, cyclesServed: parseInt(e.target.value, 10) || 1 } : null
                    )
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mailing Address for Swag/Gifts</label>
                <input
                  type="text"
                  value={editingReviewer.mailingAddress || ''}
                  onChange={(e) =>
                    setEditingReviewer((p) =>
                      p ? { ...p, mailingAddress: e.target.value } : null
                    )
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Shirt Size</label>
                <div className="flex flex-wrap gap-2">
                  {(['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() =>
                        setEditingReviewer((p) => (p ? { ...p, shirtSize: sz } : null))
                      }
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                        editingReviewer.shirtSize === sz
                          ? 'bg-[#062A3D] text-white border-[#062A3D]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <button
                onClick={() => {
                  if (confirm(`Remove ${editingReviewer.name} from committee?`)) {
                    deleteReviewerProfile(editingReviewer.id);
                    setEditingReviewer(null);
                  }
                }}
                className="text-rose-600 hover:text-rose-800 text-xs font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Reviewer</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingReviewer(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSwagEdit}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-[#062A3D] text-white hover:bg-[#0A3D59]"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
