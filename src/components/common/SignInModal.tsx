import React, { useState } from 'react';
import { useGrants } from '../../context/GrantContext';
import { UserRole } from '../../types/grant';
import { Mail, CheckCircle2, AlertCircle, ArrowRight, Shield, KeyRound, Sparkles, X } from 'lucide-react';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose }) => {
  const { sendEmailSignInLink, signInWithEmailLinkDirect, signInAsTestUser } = useGrants();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    const res = await sendEmailSignInLink(email);
    setIsSubmitting(false);

    if (res.success) {
      setLinkSent(true);
      setStatusMessage(res.message);
    } else {
      setStatusMessage(res.message);
    }
  };

  const handleQuickSignIn = async (userEmail: string, role: UserRole, displayName: string) => {
    await signInAsTestUser(userEmail, role, displayName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#062A3D] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-widest uppercase bg-[#8CC8E8]/20 text-[#8CC8E8] px-2 py-0.5 rounded border border-[#8CC8E8]/30">
              NACOGDOCHES ISD EDUCATION FOUNDATION
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Reviewer & Admin Sign-In</h2>
          <p className="text-xs text-white/75 mt-1">
            Secure passwordless authentication for scoring committee members and grant administrators.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {!linkSent ? (
            <form onSubmit={handleSendLink} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  District or Committee Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. ewindham@nacisd.org or reviewer@nef.org"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#8CC8E8] focus:border-[#062A3D] outline-hidden transition"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  No password required. We'll send you an encrypted sign-in link directly to your inbox.
                </p>
              </div>

              {statusMessage && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{statusMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#062A3D] text-white hover:bg-[#093e5a] disabled:opacity-50 transition shadow-md flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Sending magic link...</span>
                ) : (
                  <>
                    <span>Send Magic Sign-In Link</span>
                    <ArrowRight className="w-4 h-4 text-[#8CC8E8]" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Check Your Email</h3>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  We've sent a passwordless sign-in link to <span className="font-semibold text-slate-900">{email}</span>. Click the link in your email to authenticate.
                </p>
              </div>

              {/* Sandbox Direct Login Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    await signInWithEmailLinkDirect(email);
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#8CC8E8] text-[#062A3D] hover:bg-[#a0d4ef] transition shadow-xs"
                >
                  Complete Sign-In Now (Preview Mode)
                </button>
              </div>

              <button
                type="button"
                onClick={() => setLinkSent(false)}
                className="text-xs text-slate-500 hover:text-slate-800 underline block mx-auto"
              >
                Use a different email address
              </button>
            </div>
          )}

          {/* Quick Sandbox Profiles */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-[#062A3D]" />
                One-Click Committee Access
              </span>
              <span className="text-[10px] text-slate-400">Sandbox Preview</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickSignIn('ewindham@nacisd.org', 'Admin', 'Erin Windham (Admin)')}
                className="p-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-left transition"
              >
                <div className="font-bold text-purple-900">Erin Windham</div>
                <div className="text-[11px] text-purple-700">Admin (Nacogdoches)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSignIn('Abottja021820@gmail.com', 'Reviewer', 'Judy Abbott')}
                className="p-2.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-left transition"
              >
                <div className="font-bold text-sky-900">Judy Abbott</div>
                <div className="text-[11px] text-sky-700">Reviewer</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSignIn('sydneykr@gmail.com', 'Reviewer', 'Sydney Kroll')}
                className="p-2.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-left transition"
              >
                <div className="font-bold text-sky-900">Sydney Kroll</div>
                <div className="text-[11px] text-sky-700">Reviewer</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSignIn('mmloa@asp-inc.com', 'Reviewer', 'Monica Loa')}
                className="p-2.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-left transition"
              >
                <div className="font-bold text-sky-900">Monica Loa</div>
                <div className="text-[11px] text-sky-700">Reviewer</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Strict Blind Review Enforced</span>
          </span>
          <span>Merited Grants Engine</span>
        </div>
      </div>
    </div>
  );
};
