import { Vendor } from '../types/grant';

export function normalizeVendorName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchVendor(
  vendorInput: string,
  approvedVendors: Vendor[]
): {
  isApproved: boolean;
  matchedVendor?: Vendor;
} {
  if (!vendorInput || vendorInput.trim().length === 0) {
    return { isApproved: false };
  }

  const cleanInput = normalizeVendorName(vendorInput);

  // 1. Direct or partial approved match
  for (const v of approvedVendors) {
    if (!v.isApproved) continue;
    const cleanApproved = normalizeVendorName(v.name);

    if (cleanInput === cleanApproved) {
      return { isApproved: true, matchedVendor: v };
    }

    // Substring containment (e.g., "Amazon" in "Amazon Business" or "Lakeshore" in "Lakeshore Learning")
    if (
      cleanApproved.includes(cleanInput) ||
      cleanInput.includes(cleanApproved)
    ) {
      return { isApproved: true, matchedVendor: v };
    }

    // Word token overlap
    const inputWords = cleanInput.split(' ').filter((w) => w.length > 2);
    const approvedWords = cleanApproved.split(' ').filter((w) => w.length > 2);

    const hasCommonWord = inputWords.some((w) => approvedWords.includes(w));
    if (hasCommonWord) {
      return { isApproved: true, matchedVendor: v };
    }
  }

  return { isApproved: false };
}
