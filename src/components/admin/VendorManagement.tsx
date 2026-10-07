import React, { useState } from 'react';
import { useGrant } from '../../context/GrantContext';
import { Vendor } from '../../types/grant';
import { matchVendor } from '../../utils/vendorMatcher';
import {
  Upload,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Search,
  ExternalLink,
  Sparkles,
  Building2,
  X,
  FileSpreadsheet,
  History,
} from 'lucide-react';

interface VendorManagementProps {
  onNavigateAuditLog?: () => void;
}

export const VendorManagement: React.FC<VendorManagementProps> = ({ onNavigateAuditLog }) => {
  const { vendors, addVendor, updateVendor, deleteVendor, uploadVendorCsv } = useGrant();

  const [searchQuery, setSearchQuery] = useState('');
  const [testVendorInput, setTestVendorInput] = useState('');

  // Add / Edit Modal
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newVendorForm, setNewVendorForm] = useState<Omit<Vendor, 'id'>>({
    name: '',
    category: 'Instructional Supplies',
    website: '',
    notes: '',
    isApproved: true,
  });

  // CSV text modal
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState(
    `Vendor Name,Category,Website,Notes\nFisher Scientific,STEM Science Kits,https://www.fishersci.com,Approved district lab equipment vendor\nPasco Scientific,Physics & Data Sensors,https://www.pasco.com,Approved probeware vendor`
  );
  const [csvResultCount, setCsvResultCount] = useState<number | null>(null);

  // Filter vendors
  const filteredVendors = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.notes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Test fuzzy matcher
  const testMatchResult = matchVendor(testVendorInput, vendors);

  const handleSaveNew = async () => {
    if (!newVendorForm.name.trim()) return;
    await addVendor(newVendorForm);
    setIsNewModalOpen(false);
    setNewVendorForm({
      name: '',
      category: 'Instructional Supplies',
      website: '',
      notes: '',
      isApproved: true,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingVendor) return;
    await updateVendor(editingVendor);
    setEditingVendor(null);
  };

  const handleUploadCsv = async () => {
    const count = await uploadVendorCsv(csvText);
    setCsvResultCount(count);
    setTimeout(() => {
      setIsCsvModalOpen(false);
      setCsvResultCount(null);
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#8CC8E8]" />
            <h1 className="text-2xl font-bold text-[#062A3D]">District Approved Vendors</h1>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Manage approved vendor records checked during teacher budget creation.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {onNavigateAuditLog && (
            <button
              onClick={onNavigateAuditLog}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 hover:bg-slate-100 transition flex items-center gap-1.5 text-slate-700 shadow-xs"
            >
              <History className="w-4 h-4 text-[#8CC8E8]" />
              <span>View Audit Trail</span>
            </button>
          )}

          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 hover:bg-slate-100 transition flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Upload Vendor CSV</span>
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#8CC8E8] text-[#062A3D] hover:bg-[#a0d4ef] transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Approved Vendor</span>
          </button>
        </div>
      </div>

      {/* Fuzzy Matching Diagnostic Sandbox */}
      <div className="bg-[#062A3D] text-white p-5 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#8CC8E8]">
            <Sparkles className="w-4 h-4 text-[#8CC8E8]" />
            <span>Live Fuzzy Match Sandbox</span>
          </div>
          <span className="text-[11px] text-slate-300">
            Real-time test of teacher input matching
          </span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed">
          Type any vendor keyword (e.g. "Amazon", "Lakeshore", "Blick", "Carolina") to verify how teacher budget entries match our approved database.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            placeholder="Type a vendor name (e.g. 'Amazon', 'Lakeshore Learning')..."
            value={testVendorInput}
            onChange={(e) => setTestVendorInput(e.target.value)}
            className="w-full sm:w-80 text-xs rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
          />

          {testVendorInput.trim() && (
            <div
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                testMatchResult.isApproved
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                  : 'bg-amber-500/20 text-amber-200 border border-amber-400/40'
              }`}
            >
              {testMatchResult.isApproved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Matched Approved Vendor: {testMatchResult.matchedVendor?.name}
                  </span>
                </>
              ) : (
                <span>⚠️ Not matched to approved list (Triggers Gemini alternative lookup)</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search approved vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
          />
        </div>
        <span className="text-xs text-slate-500">
          Showing {filteredVendors.length} of {vendors.length} vendors
        </span>
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors.map((vendor) => (
          <div
            key={vendor.id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Approved Vendor
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setEditingVendor(vendor)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded"
                    title="Edit Vendor"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteVendor(vendor.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Delete Vendor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-sm font-bold text-[#062A3D]">{vendor.name}</h3>
              <p className="text-[11px] font-semibold text-slate-600">
                {vendor.category}
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">{vendor.notes}</p>
            </div>

            {vendor.website && (
              <a
                href={vendor.website}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#062A3D] hover:underline flex items-center gap-1 pt-1 border-t border-slate-100"
              >
                <span>Visit catalog</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Add New Vendor Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#062A3D]">Add Approved Vendor</h3>
              <button onClick={() => setIsNewModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Vendor Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fisher Scientific"
                  value={newVendorForm.name}
                  onChange={(e) =>
                    setNewVendorForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Science Labs, Manipulatives, Hardware"
                  value={newVendorForm.category}
                  onChange={(e) =>
                    setNewVendorForm((p) => ({ ...p, category: e.target.value }))
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Website URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newVendorForm.website}
                  onChange={(e) =>
                    setNewVendorForm((p) => ({ ...p, website: e.target.value }))
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">District Notes</label>
                <textarea
                  rows={2}
                  placeholder="Contract terms, purchasing order codes, etc."
                  value={newVendorForm.notes}
                  onChange={(e) =>
                    setNewVendorForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 p-2"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNew}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-[#8CC8E8] text-[#062A3D]"
              >
                Save Vendor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Vendor Modal */}
      {editingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#062A3D]">Edit Vendor</h3>
              <button onClick={() => setEditingVendor(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Vendor Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingVendor.name}
                  onChange={(e) =>
                    setEditingVendor((p) => (p ? { ...p, name: e.target.value } : null))
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={editingVendor.category}
                  onChange={(e) =>
                    setEditingVendor((p) => (p ? { ...p, category: e.target.value } : null))
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Website URL</label>
                <input
                  type="url"
                  value={editingVendor.website}
                  onChange={(e) =>
                    setEditingVendor((p) => (p ? { ...p, website: e.target.value } : null))
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">District Notes</label>
                <textarea
                  rows={2}
                  value={editingVendor.notes}
                  onChange={(e) =>
                    setEditingVendor((p) => (p ? { ...p, notes: e.target.value } : null))
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 p-2"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setEditingVendor(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-[#8CC8E8] text-[#062A3D]"
              >
                Update Vendor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload CSV Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-[#062A3D]">Upload District Vendor CSV</h3>
              </div>
              <button onClick={() => setIsCsvModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Paste or edit comma-separated values matching: <code>Vendor Name,Category,Website,Notes</code>
            </p>

            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full text-xs font-mono rounded-lg border border-slate-200 p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
            />

            {csvResultCount !== null && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Imported {csvResultCount} vendor records successfully!</span>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadCsv}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-[#062A3D] text-white hover:bg-[#0A3D59]"
              >
                Process & Import Vendors
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
