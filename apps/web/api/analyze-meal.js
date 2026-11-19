// Server-side meal photo analysis. Keeps the OpenAI key off the client:
// the browser sends the photo plus its Supabase session token, and only
// signed-in users of this app can spend the key.
export const config = { runtime: 'edge' }

// OPENAI_API_KEY is the intended name. VITE_OPENAI_API_KEY is read only as a
// fallback so existing deployments keep working until the variable is renamed.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? process.env.VITE_OPENAI_API_KEY ?? ''
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? ''

const MAX_IMAGE_CHARS = 4_000_000 // ~3 MB of base64; client resizes to 640px so real photos are far smaller

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

export default async function handler(req) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  if (!OPENAI_API_KEY) return json({ error: 'OpenAI API key not configured' }, 500)
  if (!(await isSignedIn(req))) return json({ error: 'Please sign in again' }, 401)

  let image
  try {
    ;({ image } = await req.json())
  } catch {
    return json({ error: 'Invalid request body' }, 400)
  }
  if (typeof image !== 'string' || !/^data:image\/(jpeg|png|webp|gif);base64,/.test(image)) {
    return json({ error: 'Expected an image data URL' }, 400)
  }
  if (image.length > MAX_IMAGE_CHARS) return json({ error: 'Image is too large' }, 413)

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PROMPT },
            { type: 'image_url', image_url: { url: image } },
          ],
        },
      ],
      max_tokens: 1024,
      temperature: 0.1,
    }),
  })

  if (!res.ok) {
    if (res.status === 429) return json({ error: 'Rate limit reached — please wait a moment and try again' }, 429)
    return json({ error: `Analysis failed (${res.status}) — please try again` }, 502)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) return json({ error: 'No response from OpenAI' }, 502)

  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  try {
    return json(JSON.parse(cleaned))
  } catch {
    return json({ error: 'Could not read the analysis — please try again' }, 502)
  }
}
