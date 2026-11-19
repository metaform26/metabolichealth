import { supabase } from '@/lib/supabase'

// Meal photo analysis runs server-side in api/analyze-meal.js (OpenAI
// gpt-4o-mini) so the API key never ships in the browser bundle.

export interface MealAnalysis {
  foods: {
    name: string
    quantity: string
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  totalFiber: number
  description: string
}

export async function analyzeMealPhoto(imageDataUrl: string): Promise<MealAnalysis> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Please sign in again to analyze photos')

  const res = await fetch('/api/analyze-meal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ image: imageDataUrl }),
  })

  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(body?.error ?? `Analysis failed (${res.status}) — please try again`)
  }
  return body as MealAnalysis
}
