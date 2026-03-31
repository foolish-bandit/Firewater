import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { BOURBONS } from '../src/data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const DATA_DIR = resolve(ROOT, 'data');
const REPORT_FILE = resolve(DATA_DIR, 'bulk-photo-report.json');

// ─── Types ──────────────────────────────────────────────────────────────────

interface IowaRecord {
  itemno?: string;
  category_name?: string;
  im_desc?: string;
  vendor_name?: string;
  bottle_volume_ml?: string;
  proof?: string;
  upc?: string;
}

interface OpenFoodFactsProduct {
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  image_url?: string;
  image_front_url?: string;
  image_front_small_url?: string;
  selected_images?: {
    front?: { display?: Record<string, string> };
  };
}

interface PhotoResult {
  bourbonId: string;
  bourbonName: string;
  upc: string;
  imageUrl: string | null;
  status: 'found' | 'no_product' | 'no_image' | 'error' | 'uploaded' | 'upload_failed';
  blobUrl?: string;
  error?: string;
}

// ─── Config ─────────────────────────────────────────────────────────────────

const IOWA_ENDPOINT = 'https://data.iowa.gov/resource/gckp-fe7r.json';
const IOWA_QUERY = `$where=category_name in('STRAIGHT BOURBON WHISKIES','SINGLE BARREL BOURBON WHISKIES','BOTTLED IN BOND BOURBON','STRAIGHT RYE WHISKIES')&$limit=5000&$order=im_desc ASC`;
const OFF_API = 'https://world.openfoodfacts.org/api/v2/product';

// Rate limit: 100 requests/minute for Open Food Facts (be respectful)
const RATE_LIMIT_MS = 700;
const MAX_RETRIES = 2;

// Set APP_URL in .env if you want to upload directly to your deployment
const APP_URL = process.env.APP_URL || '';
const DRY_RUN = !APP_URL || process.argv.includes('--dry-run');

// ─── Name Matching (reused from ingest) ─────────────────────────────────────

const NOISE_WORDS = new Set([
  'whiskey', 'whisky', 'bourbon', 'straight', 'kentucky', 'rye',
  'small', 'batch', 'reserve', 'limited', 'edition', 'year', 'old',
  'proof', 'barrel', 'single', 'bottled', 'bond', 'the', 'a', 'an',
]);

function normalizeName(raw: string): string {
  let name = raw.trim();
  name = name.replace(/\s*\d+(\.?\d*)?\s*(ML|L|LITER|LITRE)\s*$/i, '');
  name = name.replace(/\s*\(BTB\)\s*/gi, '');
  name = name.replace(/\s*\(NCABC\)\s*/gi, '');
  name = name.replace(/\s*\(SLI\)\s*/gi, '');
  name = name.replace(/\s*\(ISL\)\s*/gi, '');
  if (name === name.toUpperCase() && name.length > 3) {
    name = name.toLowerCase().split(/\s+/).map((w, i) => {
      const lower = new Set(['of', 'the', 'and', 'in', 'on', 'at', 'to', 'for', 'by', 'a', 'an']);
      if (i > 0 && lower.has(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(' ');
  }
  return name.trim();
}

function tokenize(name: string): string[] {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
    .filter(w => w.length > 1 && !NOISE_WORDS.has(w));
}

function tokenOverlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  const matches = a.filter(t => setB.has(t)).length;
  return matches / Math.max(a.length, b.length);
}

function isFuzzyMatch(nameA: string, nameB: string, proofA?: number, proofB?: number): boolean {
  const la = nameA.toLowerCase().trim();
  const lb = nameB.toLowerCase().trim();
  if (la === lb) return true;
  if (la.includes(lb) || lb.includes(la)) return true;
  const tokA = tokenize(nameA);
  const tokB = tokenize(nameB);
  const overlap = tokenOverlap(tokA, tokB) >= 0.85;
  // If proofs are available, also check they're close
  if (overlap && proofA && proofB) {
    return Math.abs(proofA - proofB) < 5;
  }
  return overlap;
}

// ─── Fetch Iowa UPCs ────────────────────────────────────────────────────────

async function fetchIowaUPCs(): Promise<Map<string, { upc: string; name: string; proof: number }[]>> {
  console.log('[Iowa ABD] Fetching bourbon records with UPCs...');
  const url = `${IOWA_ENDPOINT}?${IOWA_QUERY}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Iowa API returned ${resp.status}`);
  const data: IowaRecord[] = await resp.json();

  // Only records with UPCs, filter to standard bottle sizes
  const VALID_VOLUMES = [750, 1000, 1750];
  const withUpc = data.filter(r => {
    const vol = parseInt(r.bottle_volume_ml || '0', 10);
    return r.upc && r.upc.length > 3 && VALID_VOLUMES.includes(vol);
  });

  console.log(`[Iowa ABD] ${withUpc.length} records with UPCs (of ${data.length} total)`);

  // Group by normalized name to avoid duplicate lookups
  const byName = new Map<string, { upc: string; name: string; proof: number }[]>();
  for (const r of withUpc) {
    const name = normalizeName(r.im_desc || '');
    const proof = parseFloat(r.proof || '0');
    const existing = byName.get(name) || [];
    existing.push({ upc: r.upc!, name, proof });
    byName.set(name, existing);
  }

  return byName;
}

// ─── Match Iowa Records to Catalog ──────────────────────────────────────────

function matchToCatalog(
  iowaData: Map<string, { upc: string; name: string; proof: number }[]>
): Map<string, { bourbonId: string; bourbonName: string; upc: string }> {
  const matches = new Map<string, { bourbonId: string; bourbonName: string; upc: string }>();

  for (const bourbon of BOURBONS) {
    // Skip if already matched
    if (matches.has(bourbon.id)) continue;

    for (const [iowaName, records] of iowaData) {
      if (isFuzzyMatch(bourbon.name, iowaName, bourbon.proof, records[0].proof)) {
        matches.set(bourbon.id, {
          bourbonId: bourbon.id,
          bourbonName: bourbon.name,
          upc: records[0].upc, // Use first UPC
        });
        break;
      }
    }
  }

  console.log(`[Match] ${matches.size} of ${BOURBONS.length} catalog bourbons matched to UPCs`);
  return matches;
}

// ─── Open Food Facts Lookup ─────────────────────────────────────────────────

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function lookupImage(upc: string): Promise<{ imageUrl: string | null; status: 'found' | 'no_product' | 'no_image' | 'error'; error?: string }> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await fetch(`${OFF_API}/${encodeURIComponent(upc)}.json`, {
        headers: { 'User-Agent': 'BRRL-Book/1.0 (bourbon catalog; bulk-photo-fetch)' },
      });

      if (resp.status === 404) return { imageUrl: null, status: 'no_product' };
      if (!resp.ok) {
        if (attempt < MAX_RETRIES) { await sleep(2000 * (attempt + 1)); continue; }
        return { imageUrl: null, status: 'error', error: `HTTP ${resp.status}` };
      }

      const data = await resp.json();
      if (data.status !== 1 || !data.product) return { imageUrl: null, status: 'no_product' };

      const product: OpenFoodFactsProduct = data.product;

      // Try multiple image fields (prefer high-quality front image)
      const imageUrl =
        product.image_front_url ||
        product.image_url ||
        product.selected_images?.front?.display?.en ||
        product.image_front_small_url ||
        null;

      if (!imageUrl) return { imageUrl: null, status: 'no_image' };
      return { imageUrl, status: 'found' };
    } catch (err: any) {
      if (attempt < MAX_RETRIES) { await sleep(2000 * (attempt + 1)); continue; }
      return { imageUrl: null, status: 'error', error: err.message };
    }
  }
  return { imageUrl: null, status: 'error', error: 'Max retries exceeded' };
}

// ─── Upload to App ──────────────────────────────────────────────────────────

async function uploadPhoto(
  imageUrl: string,
  bourbonId: string,
): Promise<{ blobUrl?: string; error?: string }> {
  try {
    // Download the image
    const imgResp = await fetch(imageUrl);
    if (!imgResp.ok) return { error: `Failed to download: HTTP ${imgResp.status}` };

    const contentType = imgResp.headers.get('content-type') || 'image/jpeg';
    const buffer = await imgResp.arrayBuffer();

    // Determine extension
    const extMap: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
    const ext = extMap[contentType] || 'jpg';

    // Upload to our API
    const uploadResp = await fetch(`${APP_URL}/api/photos/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'x-filename': `bulk-${bourbonId}.${ext}`,
        'x-bourbon-id': bourbonId,
        'x-user-id': 'system-bulk-import',
        'x-user-email': 'bulk-import@brrl.app',
        'x-user-name': 'BRRL Catalog',
        'x-bulk-import': 'true',
      },
      body: Buffer.from(buffer),
    });

    if (!uploadResp.ok) {
      const err = await uploadResp.text();
      return { error: `Upload failed: ${err}` };
    }

    const result = await uploadResp.json();
    return { blobUrl: result.blob_url };
  } catch (err: any) {
    return { error: err.message };
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Bulk Bourbon Photo Fetcher ===\n');
  console.log(`Catalog size: ${BOURBONS.length} bourbons`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (report only)' : 'LIVE (will upload to ' + APP_URL + ')'}\n`);

  if (DRY_RUN) {
    console.log('Tip: Set APP_URL in .env and remove --dry-run to upload photos directly.\n');
  }

  // Step 1: Fetch UPCs from Iowa ABD
  const iowaData = await fetchIowaUPCs();

  // Step 2: Match to catalog
  const matches = matchToCatalog(iowaData);

  // Step 3: Look up images on Open Food Facts
  const results: PhotoResult[] = [];
  const entries = Array.from(matches.values());
  let found = 0;

  console.log(`\n[Open Food Facts] Looking up ${entries.length} UPCs for images...\n`);

  for (let i = 0; i < entries.length; i++) {
    const { bourbonId, bourbonName, upc } = entries[i];

    const lookup = await lookupImage(upc);
    const result: PhotoResult = {
      bourbonId,
      bourbonName,
      upc,
      imageUrl: lookup.imageUrl,
      status: lookup.status,
      error: lookup.error,
    };

    if (lookup.status === 'found' && lookup.imageUrl) {
      found++;

      // Upload if not dry run
      if (!DRY_RUN) {
        const upload = await uploadPhoto(lookup.imageUrl, bourbonId);
        if (upload.blobUrl) {
          result.status = 'uploaded';
          result.blobUrl = upload.blobUrl;
        } else {
          result.status = 'upload_failed';
          result.error = upload.error;
        }
      }
    }

    results.push(result);

    // Progress update every 25 items
    if ((i + 1) % 25 === 0 || i === entries.length - 1) {
      const pct = ((i + 1) / entries.length * 100).toFixed(0);
      console.log(`  [${pct}%] ${i + 1}/${entries.length} checked, ${found} images found so far`);
    }

    // Rate limit
    await sleep(RATE_LIMIT_MS);
  }

  // Step 4: Write report
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  const report = {
    timestamp: new Date().toISOString(),
    mode: DRY_RUN ? 'dry_run' : 'live',
    catalogSize: BOURBONS.length,
    matchedToUpc: matches.size,
    imagesFound: results.filter(r => ['found', 'uploaded'].includes(r.status)).length,
    imagesUploaded: results.filter(r => r.status === 'uploaded').length,
    noProduct: results.filter(r => r.status === 'no_product').length,
    noImage: results.filter(r => r.status === 'no_image').length,
    errors: results.filter(r => r.status === 'error' || r.status === 'upload_failed').length,
    results,
  };

  writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

  // Summary
  console.log('\n=== Summary ===');
  console.log(`  Catalog bourbons:      ${BOURBONS.length}`);
  console.log(`  Matched to UPC:        ${report.matchedToUpc}`);
  console.log(`  Images found:          ${report.imagesFound}`);
  if (!DRY_RUN) {
    console.log(`  Images uploaded:       ${report.imagesUploaded}`);
  }
  console.log(`  No product on OFF:     ${report.noProduct}`);
  console.log(`  Product but no image:  ${report.noImage}`);
  console.log(`  Errors:                ${report.errors}`);
  console.log(`\nReport saved to: ${REPORT_FILE}`);

  if (DRY_RUN && report.imagesFound > 0) {
    console.log('\n=== Sample Images Found ===');
    const samples = results.filter(r => r.status === 'found').slice(0, 10);
    for (const s of samples) {
      console.log(`  ${s.bourbonName}`);
      console.log(`    UPC: ${s.upc} → ${s.imageUrl}`);
    }
    console.log(`\nRun with APP_URL set (no --dry-run) to upload these to your app.`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
