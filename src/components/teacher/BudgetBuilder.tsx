import React, { useState, useMemo } from 'react';
import { BudgetItem, Vendor } from '../../types/grant';
import { matchVendor } from '../../utils/vendorMatcher';
import {
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  ArrowRightLeft,
  X,
  Loader2,
  DollarSign,
  HelpCircle,
  FileText,
} from 'lucide-react';

interface BudgetBuilderProps {
  items: BudgetItem[];
  onChange: (items: BudgetItem[], plainText: string, total: number) => void;
  category: 'Category 1' | 'Category 2';
  categoryCap: number;
  approvedVendors: Vendor[];
}

export const BudgetBuilder: React.FC<BudgetBuilderProps> = ({
  items,
  onChange,
  category,
  categoryCap,
  approvedVendors,
}) => {
  // Modal state for Gemini alternative search
  const [activeItemForGemini, setActiveItemForGemini] = useState<BudgetItem | null>(null);
  const [loadingAlternatives, setLoadingAlternatives] = useState<boolean>(false);
  const [geminiAlternatives, setGeminiAlternatives] = useState<
    Array<{
      productName: string;
      vendor: string;
      approximatePrice: number;
      url: string;
      note: string;
    }>
  >([]);
  const [geminiError, setGeminiError] = useState<string | null>(null);

  // Compute line total
  const computeLineTotal = (item: BudgetItem): number => {
    const qty = Number(item.quantity) || 0;
    const cost = Number(item.unitCost) || 0;
    const ship = Number(item.shipping) || 0;
    return Number((qty * cost + ship).toFixed(2));
  };

  // Grand total
  const grandTotal = useMemo(() => {
    return items.reduce((sum, it) => sum + computeLineTotal(it), 0);
  }, [items]);

  // Generate plain text in original grant format
  const generatePlainText = (itemList: BudgetItem[], total: number): string => {
    const lines = itemList.map((it) => {
      const lineCost = computeLineTotal(it);
      return `${it.quantity || 1} ${it.name || 'Item'} from ${it.vendor || 'Vendor'} @ $${(
        it.unitCost || 0
      ).toFixed(2)} ea${it.shipping ? ` (+$${it.shipping.toFixed(2)} ship)` : ''} = $${lineCost.toFixed(
        2
      )}${it.consumable ? ' [Consumable]' : ' [Non-consumable]'}`;
    });
    return `${lines.join('\n')}\nTotal: $${total.toFixed(2)}`;
  };

  // Handler for updating an item
  const updateItem = (index: number, updates: Partial<BudgetItem>) => {
    const updated = [...items];
    const target = { ...updated[index], ...updates };

    // If vendor changed, re-evaluate fuzzy matching
    if ('vendor' in updates) {
      const match = matchVendor(target.vendor, approvedVendors);
      target.isApprovedVendor = match.isApproved;
      target.matchedApprovedVendor = match.matchedVendor?.name;
    }

    updated[index] = target;
    const total = updated.reduce((sum, it) => sum + computeLineTotal(it), 0);
    const plain = generatePlainText(updated, total);
    onChange(updated, plain, total);
  };

  // Add new item line
  const addItem = () => {
    const newItem: BudgetItem = {
      id: `b-${Date.now()}`,
      name: '',
      vendor: '',
      quantity: 1,
      unitCost: 0,
      shipping: 0,
      productLink: '',
      consumable: false,
      isApprovedVendor: false,
    };
    const updated = [...items, newItem];
    const total = updated.reduce((sum, it) => sum + computeLineTotal(it), 0);
    onChange(updated, generatePlainText(updated, total), total);
  };

  // Remove item line
  const removeItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    const total = updated.reduce((sum, it) => sum + computeLineTotal(it), 0);
    onChange(updated, generatePlainText(updated, total), total);
  };

  // Call Gemini backend to find alternative from approved vendors
  const handleFindAlternatives = async (item: BudgetItem) => {
    setActiveItemForGemini(item);
    setLoadingAlternatives(true);
    setGeminiError(null);
    setGeminiAlternatives([]);

    try {
      const response = await fetch('/api/gemini/vendor-alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemDescription: item.name,
          currentVendor: item.vendor,
          price: item.unitCost,
          approvedVendors: approvedVendors
            .filter((v) => v.isApproved)
            .map((v) => v.name),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to find alternatives');
      }

      const data = await response.json();
      setGeminiAlternatives(data.options || []);
    } catch (err) {
      console.warn('Alternative search error:', err);
      setGeminiError(
        'Could not reach AI vendor catalog. You may still keep this item with a brief justification below.'
      );
    } finally {
      setLoadingAlternatives(false);
    }
  };

  // Swap to selected approved alternative
  const handleSwapItem = (
    originalItem: BudgetItem,
    alt: {
      productName: string;
      vendor: string;
      approximatePrice: number;
      url: string;
    }
  ) => {
    const idx = items.findIndex((it) => it.id === originalItem.id);
    if (idx === -1) return;

    updateItem(idx, {
      name: alt.productName,
      vendor: alt.vendor,
      unitCost: alt.approximatePrice,
      productLink: alt.url,
      isApprovedVendor: true,
      matchedApprovedVendor: alt.vendor,
      justification: undefined,
    });

    setActiveItemForGemini(null);
  };

  // Count unapproved items
  const unapprovedCount = useMemo(() => {
    return items.filter((it) => it.name && !it.isApprovedVendor && !it.justification)
      .length;
  }, [items]);

  const isOverCap = grandTotal > categoryCap;

  return (
    <div className="space-y-6">
      {/* Category Cap & Running Total Status Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
            {category} Budget Limit
          </div>
          <div className="text-xl font-bold text-[#062A3D] mt-0.5">
            Maximum Cap: ${categoryCap.toLocaleString()}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
            Grand Total Requested
          </div>
          <div
            className={`text-2xl font-extrabold mt-0.5 ${
              isOverCap ? 'text-rose-600' : 'text-[#062A3D]'
            }`}
          >
            ${grandTotal.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Over cap warning banner */}
      {isOverCap && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Budget exceeds category cap!</strong> Your total of $
            {grandTotal.toFixed(2)} exceeds the ${categoryCap.toLocaleString()} maximum for{' '}
            {category}. Please adjust quantities or unit costs before submitting.
          </div>
        </div>
      )}

      {/* Vendor Status Summary Banner */}
      {items.length > 0 && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
            unapprovedCount === 0
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {unapprovedCount === 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            )}
            <span>
              {unapprovedCount === 0
                ? 'All budget items are from approved district vendors or have justifications.'
                : `${unapprovedCount} item${
                    unapprovedCount > 1 ? 's need' : ' needs'
                  } attention (use Gemini to find approved options or provide a short rationale).`}
            </span>
          </div>

          <div className="text-[11px] text-slate-500 hidden sm:block">
            {approvedVendors.filter((v) => v.isApproved).length} District Vendors Active
          </div>
        </div>
      )}

      {/* Item Lines */}
      <div className="space-y-4">
        {items.map((item, index) => {
          const lineTotal = computeLineTotal(item);
          return (
            <div
              key={item.id || index}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 transition hover:border-slate-300 space-y-4"
            >
              {/* Row Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-[#062A3D] px-2 py-0.5 rounded bg-slate-100">
                    Line {index + 1}
                  </span>
                  {item.vendor && (
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        item.isApprovedVendor
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {item.isApprovedVendor ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Approved: {item.matchedApprovedVendor || item.vendor}</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Not on approved list</span>
                        </>
                      )}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500">Line Total: </span>
                    <span className="text-sm font-bold text-[#062A3D]">
                      ${lineTotal.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => removeItem(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Remove item line"
                    aria-label={`Remove Line ${index + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
                {/* Item Name */}
                <div className="md:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Item Description <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Micro:bit v2 Classroom 10-pack"
                    value={item.name}
                    onChange={(e) => updateItem(index, { name: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
                  />
                </div>

                {/* Vendor with Fuzzy Match */}
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vendor <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amazon, Lakeshore, CDW-G"
                    value={item.vendor}
                    onChange={(e) => updateItem(index, { vendor: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
                  />
                </div>

                {/* Qty */}
                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qty <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, { quantity: Math.max(1, parseInt(e.target.value) || 1) })
                    }
                    className="w-full text-xs rounded-lg border border-slate-200 px-2 py-2 text-center focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
                  />
                </div>

                {/* Unit Cost */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit Cost ($) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={item.unitCost || ''}
                    onChange={(e) =>
                      updateItem(index, { unitCost: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
                  />
                </div>

                {/* Shipping */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shipping ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={item.shipping || ''}
                    onChange={(e) =>
                      updateItem(index, { shipping: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
                  />
                </div>
              </div>

              {/* Secondary Details: Product Link & Consumable Checkbox */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
                <div className="md:col-span-7">
                  <input
                    type="url"
                    placeholder="Product URL / catalog reference (e.g. https://...)"
                    value={item.productLink}
                    onChange={(e) => updateItem(index, { productLink: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
                  />
                </div>

                <div className="md:col-span-5 flex items-center justify-between sm:justify-end gap-4">
                  <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={item.consumable}
                      onChange={(e) => updateItem(index, { consumable: e.target.checked })}
                      className="rounded border-slate-300 text-[#062A3D] focus:ring-[#8CC8E8] w-4 h-4"
                    />
                    <span className="font-medium">
                      {item.consumable ? 'Consumable Item' : 'Non-Consumable (District Property)'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Unapproved Vendor Actions: Gemini Search & Justification */}
              {item.vendor && !item.isApprovedVendor && (
                <div className="mt-2 p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-amber-900 font-medium">
                      ⚠️ "{item.vendor}" is not recognized on the NISD approved vendor list.
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFindAlternatives(item)}
                      className="px-3 py-1 rounded-md text-xs font-semibold bg-[#062A3D] text-[#8CC8E8] hover:bg-[#0A3D59] transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#8CC8E8]" />
                      <span>Find Approved Vendor Alternative (Gemini)</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Or keep this item by providing a brief teacher justification:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Specialized local science specimen not stocked by standard educational vendors"
                      value={item.justification || ''}
                      onChange={(e) => updateItem(index, { justification: e.target.value })}
                      className="w-full text-xs rounded-md border border-amber-200 bg-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#8CC8E8]"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Item Button */}
      <button
        type="button"
        onClick={addItem}
        className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#8CC8E8] text-slate-700 hover:text-[#062A3D] font-semibold text-xs flex items-center justify-center gap-2 bg-white transition shadow-sm"
      >
        <Plus className="w-4 h-4 text-[#8CC8E8]" />
        <span>Add Another Budget Line Item</span>
      </button>

      {/* Gemini Alternative Options Modal */}
      {activeItemForGemini && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#8CC8E8]/20 text-[#062A3D] text-[11px] font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-[#062A3D]" />
                  <span>Gemini Grounded Search</span>
                </div>
                <h3 className="text-base font-bold text-[#062A3D] mt-1">
                  Approved Vendor Alternatives for "{activeItemForGemini.name}"
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Searching district-approved vendors (School Specialty, Lakeshore, Amazon Business, CDW-G, etc.)
                </p>
              </div>
              <button
                onClick={() => setActiveItemForGemini(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingAlternatives && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#062A3D] animate-spin" />
                <p className="text-xs text-slate-600 font-medium">
                  Connecting to Google Search and approved vendor catalogs...
                </p>
              </div>
            )}

            {geminiError && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                {geminiError}
              </div>
            )}

            {!loadingAlternatives && geminiAlternatives.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-700">
                  Select an option to automatically replace this budget line:
                </div>
                {geminiAlternatives.map((alt, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-slate-200 hover:border-[#8CC8E8] bg-[#F4F7F9]/50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-[#062A3D]">
                        {alt.productName}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-600">
                        <span className="font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          {alt.vendor}
                        </span>
                        <span>•</span>
                        <span className="font-bold text-[#062A3D]">
                          ~${alt.approximatePrice.toFixed(2)}
                        </span>
                        {alt.url && (
                          <a
                            href={alt.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#062A3D] hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        )}
                      </div>
                      {alt.note && (
                        <div className="text-[11px] text-slate-500 italic">
                          {alt.note}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSwapItem(activeItemForGemini, alt)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#8CC8E8] text-[#062A3D] hover:bg-[#72bde4] transition flex items-center gap-1.5 flex-shrink-0 shadow-sm"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-[#062A3D]" />
                      <span>Swap to this item</span>
                    </button>
                  </div>
                ))}

                <p className="text-[11px] text-slate-400 italic text-center pt-1">
                  *Prices are estimates retrieved via search grounding. Please verify current pricing prior to final purchase.
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveItemForGemini(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Close & Keep Original
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
