import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';
import { BOURBONS } from '../src/data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const DATA_DIR = resolve(ROOT, 'data');

// ─── Types ───────────────────────────────────────────────────────────────────

interface IngestedBourbon {
  id: string;
  name: string;
  distillery: string;
  region: string;
  proof: number;
  age: string;
  mashBill: string;
  price: number;
  priceRange: string;
  description: string;
  type: string;
  source: string;
  flavorProfile: null;
  upc: string;
  existingMatch?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const IOWA_ENDPOINT = 'https://data.iowa.gov/resource/gckp-fe7r.json';
const IOWA_QUERY = `$where=category_name in('STRAIGHT BOURBON WHISKIES','SINGLE BARREL BOURBON WHISKIES','BOTTLED IN BOND BOURBON','STRAIGHT RYE WHISKIES')&$limit=5000&$order=im_desc ASC`;

const PA_URL = 'https://www.apps.lcb.pa.gov/webapp/reports/Wholesale_Spirits_Catalog_Full.xlsx';

const TYPE_MAP: Record<string, string> = {
  'STRAIGHT BOURBON WHISKIES': 'Bourbon',
  'SINGLE BARREL BOURBON WHISKIES': 'Single Barrel',
  'BOTTLED IN BOND BOURBON': 'Bottled in Bond',
  'STRAIGHT RYE WHISKIES': 'Rye',
};

const VALID_VOLUMES = [750, 1000, 1750];

// ─── Name Normalization ─────────────────────────────────────────────────────

function toTitleCase(str: string): string {
  const lowerWords = new Set(['of', 'the', 'and', 'in', 'on', 'at', 'to', 'for', 'by', 'a', 'an']);
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word, i) => {
      if (i > 0 && lowerWords.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function normalizeName(raw: string): string {
  let name = raw.trim();
  // Remove trailing size info
  name = name.replace(/\s*\d+(\.?\d*)?\s*(ML|L|LITER|LITRE)\s*$/i, '');
  // Remove state-specific suffixes
  name = name.replace(/\s*\(BTB\)\s*/gi, '');
  name = name.replace(/\s*\(NCABC\)\s*/gi, '');
  name = name.replace(/\s*\(SLI\)\s*/gi, '');
  name = name.replace(/\s*\(ISL\)\s*/gi, '');
  // Title case if mostly uppercase
  if (name === name.toUpperCase() && name.length > 3) {
    name = toTitleCase(name);
  }
  return name.trim();
}

function priceRange(price: number): string {
  if (price <= 25) return '$';
  if (price <= 50) return '$$';
  if (price <= 100) return '$$$';
  return '$$$$';
}

// ─── Fuzzy Matching ─────────────────────────────────────────────────────────

const NOISE_WORDS = new Set([
  'whiskey', 'whisky', 'bourbon', 'straight', 'kentucky', 'rye',
  'small', 'batch', 'reserve', 'limited', 'edition', 'year', 'old',
  'proof', 'barrel', 'single', 'bottled', 'bond', 'the', 'a', 'an',
]);

function tokenize(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !NOISE_WORDS.has(w));
}

function tokenOverlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  const matches = a.filter(t => setB.has(t)).length;
  return matches / Math.max(a.length, b.length);
}

function isFuzzyMatch(nameA: string, nameB: string): boolean {
  const la = nameA.toLowerCase().trim();
  const lb = nameB.toLowerCase().trim();
  // Exact match
  if (la === lb) return true;
  // One contains the other (for short-name vs long-name matches)
  if (la.includes(lb) || lb.includes(la)) return true;
  // Token overlap
  const tokA = tokenize(nameA);
  const tokB = tokenize(nameB);
  return tokenOverlap(tokA, tokB) >= 0.85;
}

// ─── Source A: Iowa ABD ─────────────────────────────────────────────────────

interface IowaRecord {
  itemno?: string;
  category_name?: string;
  im_desc?: string;
  vendor_name?: string;
  bottle_volume_ml?: string;
  age?: string;
  proof?: string;
  state_bottle_retail?: string;
  upc?: string;
  listdate?: string;
}

async function fetchIowaBourbons(): Promise<IngestedBourbon[]> {
  console.log('[Iowa ABD] Fetching...');
  const url = `${IOWA_ENDPOINT}?${IOWA_QUERY}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Iowa API returned ${resp.status}: ${resp.statusText}`);
  const data: IowaRecord[] = await resp.json();
  console.log(`[Iowa ABD] Fetched ${data.length} raw products`);

  const filtered = data.filter(r => {
    const vol = parseInt(r.bottle_volume_ml || '0', 10);
    return VALID_VOLUMES.includes(vol);
  });
  console.log(`[Iowa ABD] ${filtered.length} after 750ml+ filter`);

  return filtered.map(r => {
    const rawProof = parseFloat(r.proof || '0');
    const rawPrice = parseFloat((r.state_bottle_retail || '0').replace('$', ''));
    const rawAge = r.age?.trim() || '';
    const age = rawAge === '0' || rawAge === '' ? 'NAS' : rawAge;
    const name = normalizeName(r.im_desc || '');
    const categoryType = TYPE_MAP[r.category_name?.toUpperCase() || ''] || 'Bourbon';

    return {
      id: `iowa-${r.itemno || ''}`,
      name,
      distillery: toTitleCase(r.vendor_name || 'Unknown'),
      region: 'Kentucky',
      proof: rawProof,
      age,
      mashBill: '',
      price: rawPrice,
      priceRange: priceRange(rawPrice),
      description: '',
      type: categoryType,
      source: 'iowa_abd',
      flavorProfile: null,
      upc: r.upc || '',
    };
  }).filter(b => b.name && b.proof > 0);
}

// ─── Source B: PA PLCB ──────────────────────────────────────────────────────

async function fetchPABourbons(): Promise<IngestedBourbon[]> {
  console.log('[PA PLCB] Downloading .xlsx...');
  const resp = await fetch(PA_URL);
  if (!resp.ok) throw new Error(`PA download returned ${resp.status}: ${resp.statusText}`);
  const buffer = await resp.arrayBuffer();
  console.log(`[PA PLCB] Downloaded ${(buffer.byteLength / 1024 / 1024).toFixed(1)}MB`);

  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Skip header row
  const dataRows = rows.slice(1);
  console.log(`[PA PLCB] ${dataRows.length} total rows in spreadsheet`);

  const bourbonRows = dataRows.filter(row => {
    const className = String(row[2] || '').toUpperCase();
    return className.includes('BOURBON') || className.includes('RYE');
  });
  console.log(`[PA PLCB] ${bourbonRows.length} bourbon/rye rows`);

  return bourbonRows.map(row => {
    const className = String(row[2] || '').toUpperCase();
    const rawName = String(row[4] || '');
    const rawProof = parseFloat(String(row[27] || '0'));
    const rawPrice = parseFloat(String(row[9] || '0').replace('$', '').replace(',', ''));
    const upc = String(row[16] || '');
    const brandName = String(row[29] || '');
    const volume = String(row[7] || '');

    // Filter to standard bottle sizes
    const volNum = parseFloat(volume);
    if (volNum > 0 && volNum < 700) return null;

    let type = 'Bourbon';
    if (className.includes('SINGLE BARREL')) type = 'Single Barrel';
    else if (className.includes('BOTTLED IN BOND') || className.includes('BIB')) type = 'Bottled in Bond';
    else if (className.includes('RYE') && !className.includes('BOURBON')) type = 'Rye';

    const name = normalizeName(rawName);

    return {
      id: `pa-${String(row[3] || '')}`,
      name,
      distillery: brandName ? toTitleCase(brandName) : 'Unknown',
      region: 'Kentucky',
      proof: rawProof,
      age: 'NAS',
      mashBill: '',
      price: rawPrice,
      priceRange: priceRange(rawPrice),
      description: '',
      type,
      source: 'pa_plcb',
      flavorProfile: null,
      upc,
    };
  }).filter((b): b is IngestedBourbon => b !== null && !!b.name && b.proof > 0);
}

// ─── Deduplication ──────────────────────────────────────────────────────────

function mergeRecords(a: IngestedBourbon, b: IngestedBourbon): IngestedBourbon {
  // Prefer Iowa for age (since PA doesn't have it), PA for distillery (brand name)
  const iowaRec = a.source === 'iowa_abd' ? a : b;
  const paRec = a.source === 'pa_plcb' ? a : b;

  return {
    ...iowaRec,
    distillery: paRec.distillery !== 'Unknown' ? paRec.distillery : iowaRec.distillery,
    age: iowaRec.age !== 'NAS' ? iowaRec.age : paRec.age,
    price: Math.min(iowaRec.price, paRec.price) || iowaRec.price || paRec.price,
    priceRange: priceRange(Math.min(iowaRec.price, paRec.price) || iowaRec.price || paRec.price),
    source: 'iowa_abd+pa_plcb',
  };
}

function deduplicateProducts(products: IngestedBourbon[]): IngestedBourbon[] {
  // Level 1: UPC exact match
  const byUpc = new Map<string, IngestedBourbon[]>();
  const noUpc: IngestedBourbon[] = [];

  for (const p of products) {
    if (p.upc && p.upc.length > 3) {
      const existing = byUpc.get(p.upc) || [];
      existing.push(p);
      byUpc.set(p.upc, existing);
    } else {
      noUpc.push(p);
    }
  }

  const merged: IngestedBourbon[] = [];
  for (const [upc, records] of byUpc) {
    if (records.length === 1) {
      merged.push(records[0]);
    } else {
      // Merge all records with same UPC
      let result = records[0];
      for (let i = 1; i < records.length; i++) {
        result = mergeRecords(result, records[i]);
      }
      merged.push(result);
    }
  }

  // Level 2: Fuzzy name match for products without UPC matches
  const deduped = [...merged];
  for (const p of noUpc) {
    const existingMatch = deduped.find(
      d => isFuzzyMatch(d.name, p.name) && Math.abs(d.proof - p.proof) < 1
    );
    if (existingMatch) {
      // Merge into existing
      Object.assign(existingMatch, mergeRecords(existingMatch, p));
    } else {
      deduped.push(p);
    }
  }

  return deduped;
}

// ─── Catalog Comparison ─────────────────────────────────────────────────────

function compareWithCatalog(products: IngestedBourbon[]): { all: IngestedBourbon[]; newOnly: IngestedBourbon[] } {
  const catalogNames = BOURBONS.map(b => b.name);
  let matchCount = 0;

  for (const p of products) {
    const match = catalogNames.find(catName => isFuzzyMatch(p.name, catName));
    if (match) {
      p.existingMatch = match;
      matchCount++;
    }
  }

  console.log(`[Catalog] ${matchCount} match existing catalog, ${products.length - matchCount} are net new`);

  const newOnly = products.filter(p => !p.existingMatch);
  return { all: products, newOnly };
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Bourbon Data Ingestion Pipeline ===\n');
  console.log(`Existing catalog: ${BOURBONS.length} bourbons\n`);

  // Fetch from both sources in parallel
  const [iowa, pa] = await Promise.all([
    fetchIowaBourbons().catch(err => {
      console.error(`[Iowa ABD] ERROR: ${err.message}`);
      return [] as IngestedBourbon[];
    }),
    fetchPABourbons().catch(err => {
      console.error(`[PA PLCB] ERROR: ${err.message}`);
      return [] as IngestedBourbon[];
    }),
  ]);

  console.log(`\n[Combined] ${iowa.length} Iowa + ${pa.length} PA = ${iowa.length + pa.length} total\n`);

  // Deduplicate
  const allProducts = [...iowa, ...pa];
  const deduped = deduplicateProducts(allProducts);
  console.log(`[Dedup] ${deduped.length} unique products after cross-source dedup`);

  // Compare with catalog
  const { all, newOnly } = compareWithCatalog(deduped);

  // Write output
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  writeFileSync(resolve(DATA_DIR, 'abc-bourbons-all.json'), JSON.stringify(all, null, 2));
  writeFileSync(resolve(DATA_DIR, 'abc-bourbons-new.json'), JSON.stringify(newOnly, null, 2));

  console.log(`\nWrote data/abc-bourbons-all.json (${all.length} records)`);
  console.log(`Wrote data/abc-bourbons-new.json (${newOnly.length} records)`);

  // Show interesting finds
  console.log('\n=== Top 10 Interesting Finds (high proof / aged / unusual) ===\n');
  const interesting = [...newOnly]
    .sort((a, b) => {
      // Prefer aged bourbons, then high proof
      const ageA = a.age !== 'NAS' ? parseFloat(a.age) : 0;
      const ageB = b.age !== 'NAS' ? parseFloat(b.age) : 0;
      if (ageB !== ageA) return ageB - ageA;
      return b.proof - a.proof;
    })
    .slice(0, 10);

  for (const b of interesting) {
    const ageStr = b.age !== 'NAS' ? `${b.age}yr` : 'NAS';
    console.log(`  ${b.name} | ${b.distillery} | ${b.proof} proof | ${ageStr} | $${b.price} | ${b.type} | ${b.source}`);
  }

  console.log('\n=== Summary ===');
  console.log(`  Iowa ABD:        ${iowa.length} products`);
  console.log(`  PA PLCB:         ${pa.length} products`);
  console.log(`  After dedup:     ${deduped.length} unique`);
  console.log(`  Catalog matches: ${deduped.length - newOnly.length}`);
  console.log(`  Net new:         ${newOnly.length}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
