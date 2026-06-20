const API_KEY = import.meta.env.VITE_USDA_API_KEY || 'DEMO_KEY'
const BASE = 'https://api.nal.usda.gov/fdc/v1'

export interface USDAFood {
  fdcId: number
  description: string
  brandName?: string
  servingSize?: number
  servingSizeUnit?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
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

function mapFood(raw: RawFood): USDAFood {
  return {
    fdcId: raw.fdcId,
    description: raw.description,
    brandName: raw.brandName,
    servingSize: raw.servingSize,
    servingSizeUnit: raw.servingSizeUnit,
    calories: extractNutrient(raw.foodNutrients, 1008),
    protein: extractNutrient(raw.foodNutrients, 1003),
    carbs: extractNutrient(raw.foodNutrients, 1005),
    fat: extractNutrient(raw.foodNutrients, 1004),
    fiber: extractNutrient(raw.foodNutrients, 1079),
  }
}

export async function searchFoods(query: string, pageSize = 8): Promise<USDAFood[]> {
  if (!query.trim()) return []
  const params = new URLSearchParams({
    query: query.trim(),
    api_key: API_KEY,
    pageSize: String(pageSize),
    dataType: 'Survey (FNDDS),SR Legacy',
  })
  const res = await fetch(`${BASE}/foods/search?${params}`)
  if (!res.ok) throw new Error(`USDA API error: ${res.status}`)
  const data = await res.json()
  return (data.foods as RawFood[]).map(mapFood)
}
