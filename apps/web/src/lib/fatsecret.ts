import type { FoodResult } from '@/lib/usda'

export async function searchFatSecret(query: string): Promise<FoodResult[]> {
  if (!query.trim()) return []
  const res = await fetch(`/api/fatsecret?q=${encodeURIComponent(query.trim())}`)
  if (!res.ok) return []
  return res.json() as Promise<FoodResult[]>
}
