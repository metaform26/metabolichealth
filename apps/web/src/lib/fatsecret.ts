import type { FoodResult } from '@/lib/usda'

const CLIENT_ID = import.meta.env.VITE_FATSECRET_CLIENT_ID ?? ''
const CLIENT_SECRET = import.meta.env.VITE_FATSECRET_CLIENT_SECRET ?? ''

let _token: string | null = null
let _tokenExpiry = 0

async function getToken(): Promise<string> {
  if (_token && Date.now() < _tokenExpiry) return _token
  const res = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${encodeURIComponent(CLIENT_ID)}&client_secret=${encodeURIComponent(CLIENT_SECRET)}&scope=basic`,
  })
  if (!res.ok) throw new Error(`FatSecret auth: ${res.status}`)
  const data = await res.json()
  _token = data.access_token as string
  _tokenExpiry = Date.now() + ((data.expires_in as number) - 60) * 1000
  return _token
}

function parseDescription(desc: string): { serving: string; calories: number; fat: number; carbs: number; protein: number } {
  // "Per 100g - Calories: 165kcal | Fat: 3.57g | Carbs: 0g | Protein: 31.02g"
  const serving  = desc.match(/^Per (.+?) -/)?.[1] ?? '100g'
  const calories = Math.round(Number(desc.match(/Calories:\s*([\d.]+)kcal/)?.[1] ?? 0))
  const fat      = Math.round(Number(desc.match(/Fat:\s*([\d.]+)g/)?.[1] ?? 0))
  const carbs    = Math.round(Number(desc.match(/Carbs:\s*([\d.]+)g/)?.[1] ?? 0))
  const protein  = Math.round(Number(desc.match(/Protein:\s*([\d.]+)g/)?.[1] ?? 0))
  return { serving, calories, fat, carbs, protein }
}

export async function searchFatSecret(query: string, maxResults = 8): Promise<FoodResult[]> {
  if (!query.trim() || !CLIENT_ID || !CLIENT_SECRET) return []
  const token = await getToken()
  const q = encodeURIComponent(query.trim())
  const url = `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${q}&format=json&max_results=${maxResults}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`FatSecret search: ${res.status}`)
  const data = await res.json()
  const raw = data.foods?.food
  if (!raw) return []
  const items: any[] = Array.isArray(raw) ? raw : [raw]
  return items.map((f): FoodResult => {
    const parsed = parseDescription(f.food_description ?? '')
    return {
      id: `fs_${f.food_id}`,
      description: f.food_name,
      brandName: f.brand_name,
      servingDisplay: parsed.serving,
      calories: parsed.calories,
      protein: parsed.protein,
      carbs: parsed.carbs,
      fat: parsed.fat,
      fiber: 0,
      source: 'fatsecret',
    }
  })
}
