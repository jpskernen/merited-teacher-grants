import React, { useState, useMemo } from 'react';
import { useGrants } from '../../context/GrantContext';
import {
  parseCsvText,
  buildImportPreview,
  TARGET_FIELDS,
  CsvImportPreview,
} from '../../utils/googleFormCsvParser';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  X,
  RefreshCw,
  Shield,
  Lock,
} from 'lucide-react';

interface GoogleFormImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleFormImportModal: React.FC<GoogleFormImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    programSettings,
    applications,
    importGoogleFormResponses,
  } = useGrants();

  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [customMappings, setCustomMappings] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSummary, setImportSummary] = useState<{
    importedCount: number;
    duplicatesSkipped: number;
    startCode: string;
    endCode: string;
  } | null>(null);

  // Parse CSV
  const parsedGrid = useMemo(() => {
    if (!csvRawText.trim()) return [];
    return parseCsvText(csvRawText);
  }, [csvRawText]);

  // Preview data
  const previewData: CsvImportPreview = useMemo(() => {
    if (parsedGrid.length < 2) {
      return {
        headers: [],
        mappings: [],
        rows: [],
        totalRows: 0,
        newRowsCount: 0,
        duplicateRowsCount: 0,
        largeRequestsCount: 0,
        startCodePreview: 'N/A',
        endCodePreview: 'N/A',
      };
    }
    return buildImportPreview(parsedGrid, programSettings, applications, 0, customMappings);
  }, [parsedGrid, programSettings, applications, customMappings]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCsvRawText(content);
        setStep('mapping');
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleData = async () => {
    try {
      const res = await fetch('/assets/aistudio/Nagadoches__9e5f975e');
      if (res.ok) {
        const text = await res.text();
        setFileName('2026-27 NEF Innovative Grant Application Responses (21 Applications).csv');
        setCsvRawText(text);
        setStep('mapping');
        return;
      }
    } catch (e) {
      console.warn('Failed loading /assets/aistudio/Nagadoches__9e5f975e', e);
    }
  };

  const handleExecuteImport = async () => {
    setIsImporting(true);
    try {
      const result = await importGoogleFormResponses(csvRawText, customMappings);
      setImportSummary({
        importedCount: result.importedCount,
        duplicatesSkipped: result.duplicatesSkipped,
        startCode: result.startCode,
        endCode: result.endCode,
      });
    } catch (err: any) {
      console.error('Import failed:', err);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#062A3D] text-[#8CC8E8] flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#062A3D]">Import from Google Form CSV</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-[#062A3D] border border-sky-200">
                  Firestore Transaction Counter
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Creates one proposal per row. Assigns grant codes IGF2601, IGF2602… in row order. Applicant PII stored in admin-only collection.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        {!importSummary && (
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs">
            <button
              onClick={() => setStep('upload')}
              className={`font-semibold flex items-center gap-1.5 ${
                step === 'upload' ? 'text-[#062A3D] font-bold' : 'text-slate-400'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-[#062A3D] text-white flex items-center justify-center text-[11px]">
                1
              </span>
              <span>Upload CSV</span>
            </button>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            <button
              onClick={() => {
                if (csvRawText) setStep('mapping');
              }}
              disabled={!csvRawText}
              className={`font-semibold flex items-center gap-1.5 ${
                step === 'mapping' ? 'text-[#062A3D] font-bold' : 'text-slate-400'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-[#062A3D] text-white flex items-center justify-center text-[11px]">
                2
              </span>
              <span>Column Matcher</span>
            </button>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            <button
              onClick={() => {
                if (csvRawText) setStep('preview');
              }}
              disabled={!csvRawText}
              className={`font-semibold flex items-center gap-1.5 ${
                step === 'preview' ? 'text-[#062A3D] font-bold' : 'text-slate-400'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-[#062A3D] text-white flex items-center justify-center text-[11px]">
                3
              </span>
              <span>Preview & Counter</span>
            </button>
          </div>
        )}

        {/* Success / Summary Screen */}
        {importSummary ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#062A3D]">Google Form Responses Imported!</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Created <strong>{importSummary.importedCount}</strong> applications ({importSummary.startCode} to {importSummary.endCode}) with atomic sequence numbering.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-lg mx-auto">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold text-[#062A3D]">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>Proposal Content (/applications)</span>
                </div>
                <div className="text-xl font-extrabold text-[#062A3D] mt-1">{importSummary.importedCount} Applications</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Blind proposals viewable by reviewers</div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                  <Lock className="w-4 h-4 text-purple-700" />
                  <span>Applicant Identities (/applicantIdentities)</span>
                </div>
                <div className="text-xl font-extrabold text-purple-900 mt-1">{importSummary.importedCount} Identities</div>
                <div className="text-[11px] text-purple-700 mt-0.5">Admin-only secure separation</div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-[#062A3D] text-white hover:bg-[#0A3D59] shadow-sm transition"
            >
              View Grant Rankings
            </button>
          </div>
        ) : (
          <>
            {/* Step 1: Upload */}
            {step === 'upload' && (
              <div className="space-y-6">
                <div className="border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center space-y-4 hover:border-[#8CC8E8] transition">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#062A3D] flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6 text-[#062A3D]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#062A3D]">Upload Form Response CSV</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Exported from Google Forms responses. One row per teacher application.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <label className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#062A3D] text-white hover:bg-[#0A3D59] cursor-pointer shadow-sm transition flex items-center gap-2">
                      <Upload className="w-4 h-4 text-[#8CC8E8]" />
                      <span>Choose CSV File</span>
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleLoadSampleData}
                      className="px-4 py-2.5 rounded-xl font-bold text-xs border border-slate-300 hover:bg-slate-50 text-slate-700 transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>Load Official Nacogdoches Form CSV (21 Grants)</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Or Paste CSV Data Directly:
                  </label>
                  <textarea
                    rows={4}
                    value={csvRawText}
                    onChange={(e) => setCsvRawText(e.target.value)}
                    placeholder="Timestamp,Email Address,Applicant Name(s),School / Campus,..."
                    className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
                  />
                  {csvRawText && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => setStep('mapping')}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-[#062A3D] text-white hover:bg-[#0A3D59] flex items-center gap-1.5"
                      >
                        <span>Continue to Column Matcher</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#8CC8E8]" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Column Matcher */}
            {step === 'mapping' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="font-bold text-[#062A3D]">Loaded File: </span>
                    <span className="font-mono text-slate-700">{fileName || 'Pasted CSV'}</span>
                    <span className="text-slate-400 mx-2">•</span>
                    <span>{previewData.headers.length} Columns Detected</span>
                  </div>
                  <button
                    onClick={() => setStep('upload')}
                    className="text-xs text-slate-500 hover:text-slate-800 underline self-start sm:self-auto"
                  >
                    Change File
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#062A3D] flex items-center justify-between">
                    <span>Google Form Questions → Merited Field Mapping</span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Verify matched fields
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {previewData.mappings.map((mapping, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 truncate" title={mapping.csvHeader}>
                            "{mapping.csvHeader}"
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Form Column {idx + 1}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                          <select
                            value={mapping.fieldKey}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomMappings((prev) => ({
                                ...prev,
                                [mapping.csvHeader]: val,
                              }));
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-slate-50 font-medium text-[#062A3D] focus:outline-none focus:ring-1 focus:ring-[#8CC8E8]"
                          >
                            <option value="">-- Unmapped (Ignore) --</option>
                            {TARGET_FIELDS.map((f) => (
                              <option key={f.key} value={f.key}>
                                {f.label} {f.required ? '*' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => setStep('upload')}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep('preview')}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#062A3D] text-white hover:bg-[#0A3D59] flex items-center gap-1.5 shadow-sm"
                  >
                    <span>View Import Preview & Grant Codes</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#8CC8E8]" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Preview */}
            {step === 'preview' && (
              <div className="space-y-5">
                {/* Statistics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-500">Total Rows</div>
                    <div className="text-lg font-bold text-[#062A3D] mt-0.5">
                      {previewData.totalRows}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-[10px] font-bold uppercase text-emerald-800">New Applications</div>
                    <div className="text-lg font-bold text-emerald-900 mt-0.5">
                      {previewData.newRowsCount}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-mono">
                      {previewData.startCodePreview} → {previewData.endCodePreview}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-500">Existing Skipped</div>
                    <div className="text-lg font-bold text-slate-700 mt-0.5">
                      {previewData.duplicateRowsCount}
                    </div>
                    <div className="text-[10px] text-slate-500">Never re-assigned</div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="text-[10px] font-bold uppercase text-amber-800">Large Requests</div>
                    <div className="text-lg font-bold text-amber-900 mt-0.5">
                      {previewData.largeRequestsCount}
                    </div>
                    <div className="text-[10px] text-amber-700">≥ $6,000 threshold</div>
                  </div>
                </div>

                {/* Table Preview */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#062A3D] text-white sticky top-0 text-[11px]">
                      <tr>
                        <th className="p-2.5 font-semibold">Row</th>
                        <th className="p-2.5 font-semibold">Grant Code</th>
                        <th className="p-2.5 font-semibold">Applicant</th>
                        <th className="p-2.5 font-semibold">Campus</th>
                        <th className="p-2.5 font-semibold">Title</th>
                        <th className="p-2.5 font-semibold">Amount</th>
                        <th className="p-2.5 font-semibold">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {previewData.rows.map((row) => (
                        <tr
                          key={row.rowNumber}
                          className={`hover:bg-slate-50 ${
                            row.isDuplicate ? 'opacity-60 bg-slate-50/50' : ''
                          } ${row.isLargeRequest ? 'bg-amber-50/30' : ''}`}
                        >
                          <td className="p-2.5 font-mono text-slate-500">{row.rowNumber}</td>
                          <td className="p-2.5 font-mono font-bold text-[#062A3D]">
                            {row.assignedGrantCode}
                          </td>
                          <td className="p-2.5 font-medium">
                            <div>{row.leadName}</div>
                            <div className="text-[10px] text-slate-400">{row.leadEmail}</div>
                          </td>
                          <td className="p-2.5 text-slate-600 truncate max-w-[130px]">
                            {row.campus}
                          </td>
                          <td className="p-2.5 text-slate-800 font-medium truncate max-w-[180px]">
                            {row.title}
                          </td>
                          <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap">
                            ${row.amountRequested.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-[10px] text-slate-500 font-mono whitespace-nowrap">
                            {row.timestamp}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 text-xs text-purple-900 flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Zero-Trust Identity Separation:</strong> Applicant names, emails, and campuses will be stored in <code className="font-mono bg-purple-100 px-1 py-0.5 rounded">/applicantIdentities</code> (admin-only). Reviewers will see only the grant code and proposal content in <code className="font-mono bg-purple-100 px-1 py-0.5 rounded">/applications</code>.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setStep('mapping')}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                  >
                    Back to Column Matcher
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExecuteImport}
                      disabled={isImporting || previewData.newRowsCount === 0}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#062A3D] text-white hover:bg-[#0A3D59] shadow-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-[#8CC8E8]" />
                          <span>Importing via Transaction...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-[#8CC8E8]" />
                          <span>Confirm & Import ({previewData.newRowsCount} New)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
