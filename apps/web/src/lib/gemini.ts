const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

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

const PROMPT = `Analyze this meal photo and identify all foods visible. For each food item, estimate the quantity and macronutrients.

Return ONLY valid JSON in this exact format, no markdown or extra text:
{
  "foods": [
    { "name": "food name", "quantity": "estimated amount (e.g. 1 cup, 6 oz)", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0 }
  ],
  "totalCalories": 0,
  "totalProtein": 0,
  "totalCarbs": 0,
  "totalFat": 0,
  "totalFiber": 0,
  "description": "brief one-line meal description"
}

Use USDA-standard nutritional values. Round all numbers to integers. If you cannot identify the food clearly, give your best estimate based on what the image looks like.`

export async function analyzeMealPhoto(imageDataUrl: string): Promise<MealAnalysis> {
  if (!API_KEY) throw new Error('Gemini API key not configured')

  const base64 = imageDataUrl.split(',')[1]
  const mimeType = imageDataUrl.split(';')[0].split(':')[1] || 'image/jpeg'

  const res = await fetch(`${BASE}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: PROMPT },
          { inline_data: { mime_type: mimeType, data: base64 } },
        ],
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
      },
    }),
  })

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error('Rate limit reached — please wait a moment and try again')
    }
    throw new Error(`Analysis failed (${res.status}) — please try again`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('No response from Gemini')

  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  return JSON.parse(cleaned) as MealAnalysis
}
