import React, { useState, useEffect } from 'react';
import { useGrants, normalizeRole } from '../../context/GrantContext';
import { ShieldCheck, FileText, Edit2, Save, X, Loader2 } from 'lucide-react';

interface TermsPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'privacy';
}

export const TermsPrivacyModal: React.FC<TermsPrivacyModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
}) => {
  const { currentUser, legalTerms, legalPrivacy, saveLegalDocument } = useGrants();
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const isAdmin = normalizeRole(currentUser?.role) === 'admin';

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const doc = activeTab === 'terms' ? legalTerms : legalPrivacy;
    if (doc) {
      setTitle(doc.title);
      setContent(doc.content);
    } else {
      if (activeTab === 'terms') {
        setTitle('Terms of Service — Nacogdoches ISD Education Foundation');
        setContent(
          `1. Purpose\nMerited is the official grant proposal review portal of the Nacogdoches ISD Education Foundation (NEF). It is provided solely to facilitate evaluation and scoring of Innovative Teaching Grant proposals.\n\n2. Blind Review Protocol\nAll proposals undergo confidential, blind committee review. Reviewers agree to evaluate proposals solely on the basis of educational merit, objectives, TEKS alignment, innovation, and sustainability as articulated in the official 8-criterion rubric.\n\n3. Conflicts of Interest\nReviewers must recuse themselves from scoring any proposal submitted by immediate family members, close co-workers, or direct instructional partners.\n\n4. Data Integrity & Audit\nAll scoring activities, decisions, and system modifications are recorded in persistent audit logs. Unauthorized access, identity disclosure, or tampering is strictly prohibited.`
        );
      } else {
        setTitle('Privacy Policy & Student Data Protection');
        setContent(
          `1. Sensitivity of Applicant and Student Information\nMerited safeguards educator identities, applicant contact details, campus affiliations, student numbers, and instructional budgets. Under blind review protocol, personal identifiable information (PII) is securely stored in admin-only collections and masked from committee evaluators.\n\n2. Storage and Security\nData is hosted in isolated, enterprise-grade cloud databases with strict security rules enforcing role-based access control (RBAC). Only authenticated administrators may view applicant identities.\n\n3. Third-Party Sharing\nStudent and teacher data is never sold, shared, or transmitted to unauthorized third parties or commercial entities. Summaries generated through AI models use anonymous proposal abstracts stripped of personal identifiers.\n\n4. Inquiries\nQuestions regarding this policy should be directed to the Foundation Executive Director at ewindham@nacisd.org.`
        );
      }
    }
    setIsEditing(false);
  }, [activeTab, legalTerms, legalPrivacy]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveLegalDocument(activeTab, title, content);
      setIsEditing(false);
    } catch (err: any) {
      alert(err?.message || 'Failed to update document.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#062A3D] text-[#8CC8E8]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#062A3D]">
                Legal & Governance Documents
              </h3>
              <p className="text-xs text-slate-500">
                Nacogdoches ISD Education Foundation Policy
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('terms');
                setIsEditing(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'terms'
                  ? 'bg-[#062A3D] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Terms of Service
            </button>
            <button
              onClick={() => {
                setActiveTab('privacy');
                setIsEditing(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'privacy'
                  ? 'bg-[#062A3D] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Privacy Policy
            </button>
          </div>

          {isAdmin && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Document</span>
            </button>
          )}
        </div>

        {/* Document Body */}
        <div className="flex-1 overflow-y-auto space-y-3 text-xs leading-relaxed">
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs font-bold rounded-xl border border-slate-200 p-2.5 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Document Content (Markdown / Text)
                </label>
                <textarea
                  rows={14}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full text-xs font-mono rounded-xl border border-slate-200 p-3 bg-white"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-[#062A3D]">{title}</h2>
              <div className="whitespace-pre-line text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200 font-sans">
                {content}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 text-[11px]">
            Governance maintained by Nacogdoches ISD Education Foundation.
          </span>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#062A3D] text-white hover:bg-[#0A3D59] flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8CC8E8]" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 text-[#8CC8E8]" />
                      <span>Save Policy</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#062A3D] text-white hover:bg-[#0A3D59]"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
