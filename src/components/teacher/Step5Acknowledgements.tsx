import React from 'react';
import { Application } from '../../types/grant';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Cpu,
  Building,
  Mail,
  PenTool,
  Clock,
  Info,
} from 'lucide-react';

interface Step5Props {
  formData: Partial<Application>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Application>>>;
}

export const Step5Acknowledgements: React.FC<Step5Props> = ({ formData, setFormData }) => {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-[#062A3D]">Step 5 – Program Acknowledgements & Approvals</h2>
        <p className="text-xs text-slate-600 mt-1">
          Review recipient commitments, administrative approvals, and provide your electronic signature.
        </p>
      </div>

      {/* Prominent Administrative Notice */}
      <div className="p-4 rounded-xl bg-[#062A3D]/5 border border-[#062A3D]/20 text-xs text-[#062A3D] space-y-1">
        <div className="font-bold flex items-center gap-1.5 text-sm text-[#062A3D]">
          <Info className="w-4 h-4 text-[#8CC8E8]" />
          <span>Administrative Requirement:</span>
        </div>
        <p className="leading-relaxed">
          "Get approval from campus principal and all other related administrators via email and have available upon request."
        </p>
      </div>

      {/* Question 16: Implementation Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 max-w-xl">
            <h3 className="text-sm font-bold text-[#062A3D]">
              16. Project Implementation Timeline <span className="text-rose-500">*</span>
            </h3>
            <p className="text-xs text-slate-600">
              I understand the project must be fully implemented and grant funds fully spent by the end of the following school year.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, ackImplementation: true }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                formData.ackImplementation === true
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Yes</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, ackImplementation: false }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                formData.ackImplementation === false
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>No</span>
            </button>
          </div>
        </div>

        {formData.ackImplementation === false && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
            <strong>Action needed:</strong> Program rules require projects to be completed by the close of the following school year. If your timeline cannot meet this, please consult with the NEF director prior to submitting.
          </div>
        )}
      </div>

      {/* Question 17: Non-Consumable Property */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 max-w-xl">
            <h3 className="text-sm font-bold text-[#062A3D]">
              17. District Property Ownership <span className="text-rose-500">*</span>
            </h3>
            <p className="text-xs text-slate-600">
              I understand that non-consumables remain the permanent property of Nacogdoches ISD and the designated campus.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, ackProperty: true }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                formData.ackProperty === true
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Yes</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, ackProperty: false }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                formData.ackProperty === false
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>No</span>
            </button>
          </div>
        </div>

        {formData.ackProperty === false && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
            <strong>Action needed:</strong> All grant purchases must be retained by NISD for student instruction. Personal retention of equipment is strictly prohibited by foundation bylaws.
          </div>
        )}
      </div>

      {/* NEW: Technology & Facilities Checkboxes & Question 18 Approvals */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-[#062A3D]">
            Required Administrative Endorsements <span className="text-rose-500">*</span>
          </h3>
          <p className="text-xs text-slate-600">
            Select if your project interfaces with district technology infrastructure or facility physical plant:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="flex items-center space-x-2.5 p-3 rounded-lg border border-slate-200 hover:border-[#8CC8E8] cursor-pointer bg-[#F4F7F9]/40">
              <input
                type="checkbox"
                checked={formData.involvesTech || false}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, involvesTech: e.target.checked }))
                }
                className="w-4 h-4 rounded text-[#062A3D] focus:ring-[#8CC8E8]"
              />
              <div className="text-xs">
                <div className="font-bold text-[#062A3D] flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-[#8CC8E8]" />
                  <span>This project involves technology</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  (Software, hardware, devices, or Wi-Fi network access)
                </div>
              </div>
            </label>

            <label className="flex items-center space-x-2.5 p-3 rounded-lg border border-slate-200 hover:border-[#8CC8E8] cursor-pointer bg-[#F4F7F9]/40">
              <input
                type="checkbox"
                checked={formData.involvesFacilities || false}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, involvesFacilities: e.target.checked }))
                }
                className="w-4 h-4 rounded text-[#062A3D] focus:ring-[#8CC8E8]"
              />
              <div className="text-xs">
                <div className="font-bold text-[#062A3D] flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-[#8CC8E8]" />
                  <span>This project involves facilities</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  (Electrical modifications, plumbing, physical fixtures, or grounds)
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Question 18 Certification */}
        <div className="border-t border-slate-100 pt-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 max-w-xl">
              <h4 className="text-xs font-bold text-[#062A3D]">
                18. Administrative Certification
              </h4>
              <p className="text-xs text-slate-600">
                I certify this proposal has all required administrative approvals (Department head, campus principal, and any other related admin. If technology is involved: Technology Director approval; if facilities are involved: Facility Director approval).
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setFormData((p) => ({ ...p, ackApprovals: true }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  formData.ackApprovals === true
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Yes</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData((p) => ({ ...p, ackApprovals: false }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  formData.ackApprovals === false
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>No</span>
              </button>
            </div>
          </div>

          {formData.ackApprovals === false && (
            <div className="mt-2.5 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
              <strong>Approval required:</strong> You must receive email confirmation or endorsement from your campus principal (and Tech/Facility Directors if applicable) prior to grant committee evaluation.
            </div>
          )}
        </div>

        {/* Optional Principal & Director Notification Contacts */}
        <div className="border-t border-slate-100 pt-3 space-y-3">
          <h4 className="text-xs font-bold text-[#062A3D] flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-[#8CC8E8]" />
            <span>Administrator Contact for One-Click Endorsement (Optional)</span>
          </h4>
          <p className="text-[11px] text-slate-500">
            Enter your campus principal's email. We can send a one-click notification so they can review and approve in their portal.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Campus Principal Email
              </label>
              <input
                type="email"
                placeholder="principal@nacisd.org"
                value={formData.principalEmail || ''}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, principalEmail: e.target.value }))
                }
                className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
              />
            </div>

            {formData.involvesTech && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Technology Director Email
                </label>
                <input
                  type="email"
                  placeholder="techdirector@nacisd.org"
                  value={formData.techDirectorEmail || ''}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, techDirectorEmail: e.target.value }))
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
                />
              </div>
            )}

            {formData.involvesFacilities && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Facility Director Email
                </label>
                <input
                  type="email"
                  placeholder="facilities@nacisd.org"
                  value={formData.facilityDirectorEmail || ''}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, facilityDirectorEmail: e.target.value }))
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Question 19: Electronic Signature */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <PenTool className="w-5 h-5 text-[#8CC8E8]" />
          <h3 className="text-sm font-bold text-[#062A3D]">
            19. Electronic Signature <span className="text-rose-500">*</span>
          </h3>
        </div>
        <p className="text-xs text-slate-600">
          Type your full legal name below. By signing electronically, you certify that all information submitted is true, accurate, and approved.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <input
            type="text"
            required
            placeholder="Type your full name (e.g. Jane Kernen)"
            value={formData.electronicSignature || ''}
            onChange={(e) => {
              const val = e.target.value;
              setFormData((p) => ({
                ...p,
                electronicSignature: val,
                signedAt: val ? new Date().toISOString() : '',
              }));
            }}
            className="w-full text-sm font-semibold rounded-lg border border-slate-200 px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
          />

          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>
              Timestamp:{' '}
              {formData.signedAt
                ? new Date(formData.signedAt).toLocaleString()
                : 'Will record upon signing'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
