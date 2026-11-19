const API_KEY = import.meta.env.VITE_USDA_API_KEY || 'DEMO_KEY'
const BASE = 'https://api.nal.usda.gov/fdc/v1'

export interface FoodResult {
  id: string
  description: string
  brandName?: string
  servingDisplay: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  source: 'usda' | 'openfoodfacts'
}

interface RawNutrient {
  nutrientId: number
  value: number
}

interface RawFood {
  fdcId: number
  description: string
  brandName?: string
  servingSize?: number
  servingSizeUnit?: string
  foodNutrients: RawNutrient[]
}

function extractNutrient(nutrients: RawNutrient[], id: number): number {
  return Math.round(nutrients.find((n) => n.nutrientId === id)?.value ?? 0)
}

function mapFood(raw: RawFood): FoodResult {
  return {
    id: String(raw.fdcId),
    description: raw.description,
    brandName: raw.brandName,
    servingDisplay: raw.servingSize && raw.servingSizeUnit
      ? `${raw.servingSize} ${raw.servingSizeUnit}`
      : '100 g',
    calories: extractNutrient(raw.foodNutrients, 1008),
    protein: extractNutrient(raw.foodNutrients, 1003),
    carbs: extractNutrient(raw.foodNutrients, 1005),
    fat: extractNutrient(raw.foodNutrients, 1004),
    fiber: extractNutrient(raw.foodNutrients, 1079),
    source: 'usda',
  }
}

const DATA_TYPES = ['Foundation', 'SR Legacy', 'Survey (FNDDS)']

// Lets "chi" match "chicken": USDA search only matches whole words unless the
// last word ends in a wildcard. (USDA has no autocomplete endpoint.)
function withPrefixMatch(query: string): string {
  const q = query.trim()
  const last = q.split(/\s+/).pop() ?? ''
  return /^[\p{L}\p{N}]{2,}$/u.test(last) ? `${q}*` : q
}

// Sent as a POST with a JSON body: as a GET, USDA intermittently rejects the
// comma-separated dataType list with a 400 (the "Survey (FNDDS)" entry).
async function postSearch(query: string, pageSize: number): Promise<FoodResult[]> {
  const res = await fetch(`${BASE}/foods/search?api_key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, pageSize, dataType: DATA_TYPES }),
  })
  if (!res.ok) throw new Error(`USDA API error: ${res.status}`)
  const data = await res.json()
  return ((data.foods as RawFood[] | undefined) ?? []).map(mapFood)
}

// Runs the exact search and a prefix search ("chi" -> "chi*") together.
// Exact matches come first so finished words rank well ("apple" isn't
// buried under "Applebee's"); prefix matches fill in while the user is still
// typing a word.
export async function searchFoods(query: string, pageSize = 10): Promise<FoodResult[]> {
  const q = query.trim()
  if (!q) return []
  const prefixQuery = withPrefixMatch(q)
  if (prefixQuery === q) return postSearch(q, pageSize)

  const [exact, prefix] = await Promise.allSettled([postSearch(q, pageSize), postSearch(prefixQuery, pageSize)])
  if (exact.status === 'rejected' && prefix.status === 'rejected') throw exact.reason
  const seen = new Set<string>()
  const merged: FoodResult[] = []
  for (const list of [exact, prefix]) {
    if (list.status !== 'fulfilled') continue
    for (const food of list.value) {
      if (seen.has(food.id)) continue
      seen.add(food.id)
      merged.push(food)
    }
  }
  return merged.slice(0, pageSize)
}
