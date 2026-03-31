import { Bourbon } from '../bourbonTypes';
import { normalizeBourbonName, levenshteinDistance } from '../utils/stringUtils';

const UPC_STORAGE_KEY = 'bs_upc_mappings';

export interface UpcMapping {
  [upc: string]: string; // upc -> bourbon ID
}

export interface UpcLookupResult {
  productName: string;
  brand?: string;
  category?: string;
  description?: string;
}

// --- Local UPC Storage ---

export function getUpcMappings(): UpcMapping {
  try {
    const data = localStorage.getItem(UPC_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveUpcMapping(upc: string, bourbonId: string): void {
  const mappings = getUpcMappings();
  mappings[upc] = bourbonId;
  localStorage.setItem(UPC_STORAGE_KEY, JSON.stringify(mappings));
}

export function lookupLocalUpc(upc: string): string | null {
  const mappings = getUpcMappings();
  return mappings[upc] || null;
}

// --- External UPC Lookup ---

export async function lookupExternalUpc(upc: string): Promise<UpcLookupResult | null> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(upc)}.json`
    );
    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== 1 || !data.product) return null;

    const product = data.product;
    return {
      productName: product.product_name || product.product_name_en || '',
      brand: product.brands || '',
      category: product.categories || '',
      description: product.generic_name || '',
    };
  } catch {
    return null;
  }
}

// --- Bourbon Detection ---

const BOURBON_KEYWORDS = [
  'bourbon', 'whiskey', 'whisky', 'kentucky straight',
  'tennessee whiskey', 'corn whiskey', 'rye whiskey',
  'straight bourbon', 'small batch', 'single barrel',
  'barrel proof', 'cask strength',
];

const NON_BOURBON_KEYWORDS = [
  'mixer', 'soda', 'cola', 'tonic', 'juice', 'syrup',
  'bitters', 'glass', 'cup', 'mug', 'accessory', 'ice',
  'snack', 'chip', 'nut', 'pretzel', 'candy', 'chocolate',
  'shirt', 'hat', 'book', 'coaster', 'decanter',
];

export function isLikelyBourbon(result: UpcLookupResult): boolean {
  const text = [
    result.productName,
    result.brand,
    result.category,
    result.description,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // If it matches non-bourbon keywords, reject
  if (NON_BOURBON_KEYWORDS.some(kw => text.includes(kw))) {
    return false;
  }

  // If it matches bourbon keywords, accept
  if (BOURBON_KEYWORDS.some(kw => text.includes(kw))) {
    return true;
  }

  // If we can't tell, give the benefit of the doubt since
  // the user scanned it expecting bourbon
  return true;
}

// --- Fuzzy Matching Against Catalog ---

export function fuzzyMatchBourbon(
  productName: string,
  bourbons: Bourbon[]
): Bourbon | null {
  if (!productName.trim()) return null;

  const normalizedInput = normalizeBourbonName(productName);
  let bestMatch: Bourbon | null = null;
  let bestScore = Infinity;

  for (const bourbon of bourbons) {
    const normalizedExisting = normalizeBourbonName(bourbon.name);

    // Check substring match first
    if (
      normalizedExisting.includes(normalizedInput) ||
      normalizedInput.includes(normalizedExisting)
    ) {
      return bourbon;
    }

    // Levenshtein distance
    const distance = levenshteinDistance(normalizedInput, normalizedExisting);
    const threshold = Math.max(3, Math.floor(normalizedExisting.length * 0.3));

    if (distance < bestScore && distance <= threshold) {
      bestScore = distance;
      bestMatch = bourbon;
    }
  }

  return bestMatch;
}
