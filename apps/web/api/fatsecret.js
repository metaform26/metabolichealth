export const config = { runtime: 'edge' }

const CLIENT_ID = process.env.VITE_FATSECRET_CLIENT_ID ?? ''
const CLIENT_SECRET = process.env.VITE_FATSECRET_CLIENT_SECRET ?? ''

const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
const empty = () => new Response(JSON.stringify([]), { headers: CORS })

function parseDescription(desc) {
  const serving  = desc.match(/^Per (.+?) -/)?.[1] ?? '100g'
  const calories = Math.round(Number(desc.match(/Calories:\s*([\d.]+)kcal/)?.[1] ?? 0))
  const fat      = Math.round(Number(desc.match(/Fat:\s*([\d.]+)g/)?.[1] ?? 0))
  const carbs    = Math.round(Number(desc.match(/Carbs:\s*([\d.]+)g/)?.[1] ?? 0))
  const protein  = Math.round(Number(desc.match(/Protein:\s*([\d.]+)g/)?.[1] ?? 0))
  return { serving, calories, fat, carbs, protein }
}

export default async function handler(req) {
  const q = new URL(req.url).searchParams.get('q')
  if (!q || !CLIENT_ID) return empty()

  try {
    const tokenRes = await fetch('https://oauth.fatsecret.com/connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${encodeURIComponent(CLIENT_ID)}&client_secret=${encodeURIComponent(CLIENT_SECRET)}&scope=basic`,
    })
    if (!tokenRes.ok) return empty()
    const { access_token } = await tokenRes.json()

    const searchRes = await fetch(
      `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(q)}&format=json&max_results=8`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    )
    if (!searchRes.ok) return empty()
    const data = await searchRes.json()
    const raw = data.foods?.food
    if (!raw) return empty()

    const items = Array.isArray(raw) ? raw : [raw]
    const results = items.map((f) => {
      const p = parseDescription(f.food_description ?? '')
      return {
        id: `fs_${f.food_id}`,
        description: f.food_name,
        brandName: f.brand_name,
        servingDisplay: p.serving,
        calories: p.calories,
        protein: p.protein,
        carbs: p.carbs,
        fat: p.fat,
        fiber: 0,
        source: 'fatsecret',
      }
    })

    return new Response(JSON.stringify(results), { headers: CORS })
  } catch {
    return empty()
  }
}
