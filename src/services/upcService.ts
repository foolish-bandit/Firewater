import { Liquor } from '../liquorTypes';
import { normalizeLiquorName, levenshteinDistance } from '../utils/stringUtils';

const UPC_STORAGE_KEY = 'bs_upc_mappings';

export interface UpcMapping {
  [upc: string]: string; // upc -> liquor ID
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

export function saveUpcMapping(upc: string, liquorId: string): void {
  const mappings = getUpcMappings();
  mappings[upc] = liquorId;
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

// --- Liquor Detection ---

const LIQUOR_KEYWORDS = [
  'liquor', 'whiskey', 'whisky', 'bourbon', 'scotch',
  'vodka', 'gin', 'rum', 'tequila', 'mezcal',
  'brandy', 'cognac', 'liqueur', 'cordial',
  'kentucky straight', 'tennessee whiskey', 'corn whiskey',
  'rye whiskey', 'small batch', 'single barrel',
  'barrel proof', 'cask strength', 'single malt',
  'blended', 'spirit', 'distilled',
];

const NON_LIQUOR_KEYWORDS = [
  'mixer', 'soda', 'cola', 'tonic', 'juice', 'syrup',
  'bitters', 'glass', 'cup', 'mug', 'accessory', 'ice',
  'snack', 'chip', 'nut', 'pretzel', 'candy', 'chocolate',
  'shirt', 'hat', 'book', 'coaster', 'decanter',
];

export function isLikelyLiquor(result: UpcLookupResult): boolean {
  const text = [
    result.productName,
    result.brand,
    result.category,
    result.description,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // If it matches non-liquor keywords, reject
  if (NON_LIQUOR_KEYWORDS.some(kw => text.includes(kw))) {
    return false;
  }

  // If it matches liquor keywords, accept
  if (LIQUOR_KEYWORDS.some(kw => text.includes(kw))) {
    return true;
  }

  // If we can't tell, give the benefit of the doubt since
  // the user scanned it expecting liquor
  return true;
}

// --- Fuzzy Matching Against Catalog ---

export function fuzzyMatchLiquor(
  productName: string,
  liquors: Liquor[]
): Liquor | null {
  if (!productName.trim()) return null;

  const normalizedInput = normalizeLiquorName(productName);
  let bestMatch: Liquor | null = null;
  let bestScore = Infinity;

  for (const liquor of liquors) {
    const normalizedExisting = normalizeLiquorName(liquor.name);

    // Check substring match first
    if (
      normalizedExisting.includes(normalizedInput) ||
      normalizedInput.includes(normalizedExisting)
    ) {
      return liquor;
    }

    // Levenshtein distance
    const distance = levenshteinDistance(normalizedInput, normalizedExisting);
    const threshold = Math.max(3, Math.floor(normalizedExisting.length * 0.3));

    if (distance < bestScore && distance <= threshold) {
      bestScore = distance;
      bestMatch = liquor;
    }
  }

  return bestMatch;
}
