// Branded/packaged food search via Open Food Facts (https://openfoodfacts.org).
// Runs server-side because Open Food Facts doesn't send CORS headers (browsers
// can't call it directly) and asks apps to identify themselves with a
// User-Agent, which browsers can't set. Only signed-in users can use it.
export const config = { runtime: 'edge' }

const SEARCH_URL = 'https://search.openfoodfacts.org/search'
const USER_AGENT = 'MetabolicHealth/1.0 (https://metabolichealth-web.vercel.app)'
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? ''

const MAX_QUERY_LENGTH = 100
const MAX_RESULTS = 8

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

async function isSignedIn(req) {
  const auth = req.headers.get('authorization') ?? ''
  if (!auth.startsWith('Bearer ') || !SUPABASE_URL || !SUPABASE_ANON_KEY) return false
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: auth },
  })
  return res.ok
}

const round = (v) => Math.round(Number(v) || 0)

// Open Food Facts values are crowd-sourced; nutrition is given per 100 g/ml,
// which is also how USDA results are shown.
function toFoodResult(p) {
  const n = p.nutriments ?? {}
  const kcal = n['energy-kcal_100g'] ?? (n['energy_100g'] != null ? n['energy_100g'] / 4.184 : null)
  const brand = Array.isArray(p.brands) ? p.brands[0] : p.brands
  return {
    id: `off_${p.code}`,
    description: String(p.product_name).trim(),
    brandName: brand || undefined,
    servingDisplay: '100 g',
    calories: round(kcal),
    protein: round(n.proteins_100g),
    carbs: round(n.carbohydrates_100g),
    fat: round(n.fat_100g),
    fiber: round(n.fiber_100g),
    source: 'openfoodfacts',
    _hasEnergy: kcal != null,
  }
}

export default async function handler(req) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405)
  if (!(await isSignedIn(req))) return json({ error: 'Please sign in again' }, 401)

  const q = (new URL(req.url).searchParams.get('q') ?? '').trim()
  if (!q) return json([])
  if (q.length > MAX_QUERY_LENGTH) return json({ error: 'Search is too long' }, 400)

  const params = new URLSearchParams({
    q,
    langs: 'en',
    // Ask for extra hits: some products are missing a name or calories.
    page_size: String(MAX_RESULTS * 2),
    fields: 'code,product_name,brands,nutriments',
  })

  try {
    const res = await fetch(`${SEARCH_URL}?${params}`, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) {
      console.error('Open Food Facts search failed', res.status)
      return json({ error: 'Food search is unavailable right now' }, 502)
    }
    const data = await res.json()
    const seen = new Set()
    const results = []
    for (const p of data.hits ?? []) {
      if (!p.code || !p.product_name || !String(p.product_name).trim()) continue
      const food = toFoodResult(p)
      if (!food._hasEnergy) continue
      // Collapse duplicate listings of the same product.
      const key = `${food.description}|${food.brandName ?? ''}`.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      delete food._hasEnergy
      results.push(food)
      if (results.length === MAX_RESULTS) break
    }
    return json(results)
  } catch (err) {
    console.error('Open Food Facts proxy error', err instanceof Error ? err.message : err)
    return json({ error: 'Food search is unavailable right now' }, 502)
  }
}
