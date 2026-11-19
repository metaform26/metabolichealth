import type { FoodResult } from '@/lib/usda'
import { supabase } from '@/lib/supabase'

// Searches Open Food Facts (branded/packaged foods) through our server proxy,
// api/food-search.js. Throws on failure; Tracking runs this alongside USDA with
// Promise.allSettled, so USDA results still show if Open Food Facts is down.
export async function searchOpenFoodFacts(query: string): Promise<FoodResult[]> {
  if (!query.trim()) return []
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []

  const res = await fetch(`/api/food-search?q=${encodeURIComponent(query.trim())}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    console.warn('Open Food Facts search failed:', body?.error ?? res.status)
    throw new Error(body?.error ?? `Food search failed (${res.status})`)
  }
  return body as FoodResult[]
}
