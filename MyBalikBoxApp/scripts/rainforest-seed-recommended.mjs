/**
 * Replaces `public.recommended_items` using Rainforest API (Traject Data) bestseller charts.
 *
 * Required env (do NOT commit real values):
 *   RAINFOREST_API_KEY          — from Rainforest / Traject dashboard
 *   SUPABASE_URL                — Project Settings → API → Project URL
 *   SUPABASE_SERVICE_ROLE_KEY   — service_role (server-side only; never ship to Expo)
 *
 * Usage (from MyBalikBoxApp):
 *   node --env-file=.env.seed scripts/rainforest-seed-recommended.mjs
 *
 * If any category URL fails, edit `scripts/data/rainforest-bestseller-categories.json`
 * (use Rainforest Categories browser + `url` or `category_id` from their docs).
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RF = 'https://api.rainforestapi.com/request';
const TOP_N = 10;
const PAUSE_MS = 1200;

const categories = JSON.parse(
  readFileSync(join(__dirname, 'data', 'rainforest-bestseller-categories.json'), 'utf8'),
);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function slugPart(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

async function fetchBestsellers(apiKey, pageUrl) {
  const params = new URLSearchParams({
    api_key: apiKey,
    type: 'bestsellers',
    amazon_domain: 'amazon.com',
    url: pageUrl,
  });
  const res = await fetch(`${RF}?${params.toString()}`);
  const json = await res.json();
  if (!json.request_info?.success) {
    const msg = json.request_info || json;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  const list = json.bestsellers;
  if (!Array.isArray(list)) return [];
  return list.slice(0, TOP_N);
}

async function clearRecommended(supabase) {
  for (;;) {
    const { data, error } = await supabase.from('recommended_items').select('id').limit(500);
    if (error) throw error;
    if (!data?.length) return;
    const { error: delErr } = await supabase.from('recommended_items').delete().in(
      'id',
      data.map((r) => r.id),
    );
    if (delErr) throw delErr;
  }
}

async function main() {
  const apiKey = process.env.RAINFOREST_API_KEY?.trim();
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!apiKey || !supabaseUrl || !serviceKey) {
    console.error(
      'Missing env. Set RAINFOREST_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (e.g. in .env.seed loaded via node --env-file=.env.seed).',
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  console.log('Clearing recommended_items…');
  await clearRecommended(supabase);

  let sortOrder = 0;
  const rows = [];
  /** @type {Map<string, any[]>} */
  const urlCache = new Map();

  for (let c = 0; c < categories.length; c++) {
    const { name: categoryName, url } = categories[c];
    process.stdout.write(`[${c + 1}/${categories.length}] ${categoryName}… `);
    try {
      let items = urlCache.get(url);
      const fromCache = items != null;
      if (!items) {
        items = await fetchBestsellers(apiKey, url);
        urlCache.set(url, items);
      }
      if (items.length === 0) {
        console.log('no items (check URL in JSON).');
      } else {
        console.log(`ok (${items.length})${fromCache ? ' [cached URL]' : ''}.`);
      }
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const title = item.title?.trim();
        if (!title) continue;
        const asin = item.asin?.trim() || null;
        const link = item.link?.trim() || null;
        const image = item.image?.trim() || null;
        const price =
          item.price && typeof item.price.value === 'number'
            ? item.price.value
            : item.price?.value != null
              ? Number(item.price.value)
              : 0;

        const slugBase = asin ? `amazon-${slugPart(asin)}-c${c}-r${i + 1}` : `amazon-${slugPart(title)}-c${c}-r${i + 1}`;
        const slug = slugBase.slice(0, 200);

        rows.push({
          slug,
          name: title.length > 500 ? title.slice(0, 497) + '…' : title,
          category: categoryName,
          reference_price: Number.isFinite(price) ? price : 0,
          image_url: image,
          amazon_url: link,
          asin,
          sort_order: sortOrder++,
          is_active: true,
        });
      }
    } catch (e) {
      console.log(`FAILED: ${e instanceof Error ? e.message : e}`);
    }
    await sleep(PAUSE_MS);
  }

  const chunk = 80;
  for (let i = 0; i < rows.length; i += chunk) {
    const part = rows.slice(i, i + chunk);
    const { error } = await supabase.from('recommended_items').insert(part);
    if (error) {
      console.error('Insert error:', error);
      process.exit(1);
    }
    console.log(`Inserted ${Math.min(i + chunk, rows.length)} / ${rows.length}`);
  }

  console.log(`Done. Total rows: ${rows.length} (target up to ${TOP_N * categories.length}).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
