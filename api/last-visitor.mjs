// Records the city of each visit and returns the previous visitor's city.
// Only a city/region label is stored (from Vercel's geo headers) — no IPs, no identifiers.
// Needs an Upstash Redis store connected to the project (Vercel → Storage), which sets
// KV_REST_API_URL / KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = 'portfolio:last-visitor';

async function redis(cmd) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  return (await r.json()).result;
}

function placeFrom(req) {
  const h = (k) => req.headers[k] && decodeURIComponent(String(req.headers[k]));
  const city = h('x-vercel-ip-city');
  const region = h('x-vercel-ip-country-region');
  const country = h('x-vercel-ip-country');
  if (!city && !country) return null;
  const tail = country === 'US' ? region : country;   // "chicago, IL" in the US, "london, GB" elsewhere
  return [city && city.toLowerCase(), tail].filter(Boolean).join(', ');
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_ || !TOKEN) return res.status(200).json({ last: null, reason: 'no-store' });
  try {
    const here = placeFrom(req);
    // GETSET swaps in this visit and hands back the one before it
    const prev = req.method === 'POST' && here ? await redis(['GETSET', KEY, here]) : await redis(['GET', KEY]);
    return res.status(200).json({ last: prev || null });
  } catch (e) {
    return res.status(200).json({ last: null, reason: 'error' });
  }
}
