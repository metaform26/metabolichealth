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
  source: 'usda' | 'fatsecret'
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

export async function searchFoods(query: string, pageSize = 10): Promise<FoodResult[]> {
  if (!query.trim()) return []
  const q = encodeURIComponent(query.trim())
  const url = `${BASE}/foods/search?query=${q}&api_key=${API_KEY}&pageSize=${pageSize}&dataType=${encodeURIComponent('Foundation,SR Legacy,Survey (FNDDS)')}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`USDA API error: ${res.status}`)
  const data = await res.json()
  return (data.foods as RawFood[]).map(mapFood)
}
