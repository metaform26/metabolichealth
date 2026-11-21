import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

// Daily Tracking data, stored in the signed-in user's account:
//   - daily totals  → daily_tracking (one row per user per local date)
//   - meals         → meal_logs (grouped into days by their local logged_at date)
// Meal photos are not in the database yet; they stay in this browser,
// keyed by meal id (see getMealPhoto / setMealPhoto).

export interface MealLog {
  id: string
  type: string
  meal: string
  serving: string
  calories: number
  protein: number
  carbs: number | null
  fat: number | null
  fiber: number | null
  photo?: string
  loggedAt?: number
}

export interface DailyTotals {
  calories: number
  protein: number
  steps: number
  water: number // fluid ounces
}

export interface HistoryEntry {
  date: string // YYYY-MM-DD (local)
  totals: DailyTotals
  meals: MealLog[]
}

export const EMPTY_DAILY_TOTALS: DailyTotals = { calories: 0, protein: 0, steps: 0, water: 0 }

type MealRow = Database['public']['Tables']['meal_logs']['Row']
type DailyRow = Database['public']['Tables']['daily_tracking']['Row']

const ML_PER_OZ = 29.5735

// ─── Dates ────────────────────────────────────────────────────────────────────

export function localDateString(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function localDayStart(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// [start, end) of a local calendar day, as ISO timestamps for querying logged_at.
function localDayRange(date: string): [string, string] {
  const start = localDayStart(date)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return [start.toISOString(), end.toISOString()]
}

// ─── Photos (this browser only, for now) ─────────────────────────────────────

const PHOTO_PREFIX = 'meal-photo:'

export function getMealPhoto(id: string): string | undefined {
  try { return localStorage.getItem(PHOTO_PREFIX + id) ?? undefined } catch { return undefined }
}

export function setMealPhoto(id: string, dataUrl: string) {
  try { localStorage.setItem(PHOTO_PREFIX + id, dataUrl) } catch { /* storage full: the meal still saves, without its photo */ }
}

export function removeMealPhoto(id: string) {
  try { localStorage.removeItem(PHOTO_PREFIX + id) } catch { /* ignore */ }
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

const num = (v: number | null | undefined) => (v == null ? null : Number(v))

function rowToMeal(r: MealRow): MealLog {
  return {
    id: r.id,
    type: r.meal_type ?? 'Meal',
    meal: r.name,
    serving: r.serving_description ?? '',
    calories: Number(r.calories ?? 0),
    protein: Number(r.protein_g ?? 0),
    carbs: num(r.carbs_g),
    fat: num(r.fat_g),
    fiber: num(r.fiber_g),
    loggedAt: Date.parse(r.logged_at),
    photo: getMealPhoto(r.id),
  }
}

function rowToTotals(r: DailyRow | null | undefined): DailyTotals {
  if (!r) return EMPTY_DAILY_TOTALS
  return {
    calories: Number(r.calories ?? 0),
    protein: Number(r.protein_g ?? 0),
    steps: Number(r.steps ?? 0),
    water: r.water_ml == null ? 0 : Math.round(Number(r.water_ml) / ML_PER_OZ),
  }
}

function totalsToColumns(t: DailyTotals) {
  return {
    calories: t.calories,
    protein_g: t.protein,
    steps: t.steps,
    water_ml: Math.round(t.water * ML_PER_OZ),
  }
}

function mealToColumns(m: MealLog, source: 'manual' | 'photo' | 'api' = 'manual') {
  return {
    meal_type: m.type,
    name: m.meal,
    serving_description: m.serving,
    calories: m.calories,
    protein_g: m.protein,
    carbs_g: m.carbs,
    fat_g: m.fat,
    fiber_g: m.fiber,
    source,
  }
}

async function requireUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('You are signed out — please sign in again.')
  return session.user.id
}

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function loadDay(date: string): Promise<{ totals: DailyTotals; meals: MealLog[] }> {
  const userId = await requireUserId()
  const [start, end] = localDayRange(date)
  const [daily, meals] = await Promise.all([
    supabase.from('daily_tracking').select('*').eq('user_id', userId).eq('date', date).maybeSingle(),
    supabase.from('meal_logs').select('*').eq('user_id', userId)
      .gte('logged_at', start).lt('logged_at', end).order('logged_at', { ascending: true }),
  ])
  if (daily.error) throw new Error(daily.error.message)
  if (meals.error) throw new Error(meals.error.message)
  return { totals: rowToTotals(daily.data), meals: (meals.data ?? []).map(rowToMeal) }
}

// Most recent days first. Days come from either table, so a day with only
// meals (or only totals) still shows up.
export async function loadHistory(days = 90): Promise<HistoryEntry[]> {
  const userId = await requireUserId()
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceDate = localDateString(since)
  const [daily, meals] = await Promise.all([
    supabase.from('daily_tracking').select('*').eq('user_id', userId).gte('date', sinceDate),
    supabase.from('meal_logs').select('*').eq('user_id', userId)
      .gte('logged_at', localDayStart(sinceDate).toISOString()).order('logged_at', { ascending: true }),
  ])
  if (daily.error) throw new Error(daily.error.message)
  if (meals.error) throw new Error(meals.error.message)

  const byDate = new Map<string, HistoryEntry>()
  const entry = (date: string) => {
    if (!byDate.has(date)) byDate.set(date, { date, totals: EMPTY_DAILY_TOTALS, meals: [] })
    return byDate.get(date)!
  }
  for (const r of daily.data ?? []) entry(r.date).totals = rowToTotals(r)
  for (const r of meals.data ?? []) entry(localDateString(new Date(r.logged_at))).meals.push(rowToMeal(r))
  return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date))
}

// ─── Writes ───────────────────────────────────────────────────────────────────

export async function saveTotals(date: string, totals: DailyTotals): Promise<void> {
  const userId = await requireUserId()
  const { error } = await supabase
    .from('daily_tracking')
    .upsert({ user_id: userId, date, ...totalsToColumns(totals) }, { onConflict: 'user_id,date' })
  if (error) throw new Error(error.message)
}

export async function insertMeal(meal: MealLog, source: 'manual' | 'photo' | 'api' = 'manual'): Promise<MealLog> {
  const userId = await requireUserId()
  const { data, error } = await supabase
    .from('meal_logs')
    .insert({
      id: meal.id,
      user_id: userId,
      logged_at: new Date(meal.loggedAt ?? Date.now()).toISOString(),
      ...mealToColumns(meal, source),
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  if (meal.photo) setMealPhoto(data.id, meal.photo)
  return { ...rowToMeal(data), photo: meal.photo }
}

export async function updateMeal(meal: MealLog): Promise<MealLog> {
  const { data, error } = await supabase
    .from('meal_logs')
    .update(mealToColumns(meal))
    .eq('id', meal.id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return { ...rowToMeal(data), photo: meal.photo }
}

export async function deleteMeal(id: string): Promise<void> {
  // Ask for the deleted row back: if RLS blocks a delete, Postgres deletes
  // nothing and reports no error.
  const { data, error } = await supabase.from('meal_logs').delete().eq('id', id).select('id')
  if (error) throw new Error(error.message)
  if (!data?.length) throw new Error("the database didn't allow deleting this meal")
  removeMealPhoto(id)
}

// ─── One-time import of data saved in this browser before accounts ───────────

const OLD_TOTALS_PREFIX = 'daily-tracking-'
const OLD_MEALS_PREFIX = 'daily-meals-'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function oldKeys(): string[] {
  const keys: string[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && /^daily-(tracking|meals)-\d{4}-\d{2}-\d{2}$/.test(k)) keys.push(k)
    }
  } catch { /* storage unavailable */ }
  return keys
}

/**
 * Copies meals and daily totals saved in this browser (before Daily Tracking
 * used the database) into the signed-in account, then removes them from the
 * browser. Safe to re-run: rows that already exist are left as they are.
 * Returns how many days were imported.
 */
export async function importBrowserData(): Promise<number> {
  const keys = oldKeys()
  if (keys.length === 0) return 0
  const userId = await requireUserId()

  const totalsRows: Database['public']['Tables']['daily_tracking']['Insert'][] = []
  const mealRows: Database['public']['Tables']['meal_logs']['Insert'][] = []
  const photos: [string, string][] = []
  const dates = new Set<string>()

  for (const key of keys) {
    let parsed: unknown
    try { parsed = JSON.parse(localStorage.getItem(key) ?? 'null') } catch { continue }
    if (key.startsWith(OLD_TOTALS_PREFIX)) {
      const date = key.slice(OLD_TOTALS_PREFIX.length)
      const t = { ...EMPTY_DAILY_TOTALS, ...(parsed as Partial<DailyTotals>) }
      if (!t.calories && !t.protein && !t.steps && !t.water) continue
      totalsRows.push({ user_id: userId, date, ...totalsToColumns(t) })
      dates.add(date)
    } else if (key.startsWith(OLD_MEALS_PREFIX) && Array.isArray(parsed)) {
      const date = key.slice(OLD_MEALS_PREFIX.length)
      const noon = localDayStart(date)
      noon.setHours(12)
      for (const m of parsed as MealLog[]) {
        const id = UUID_RE.test(m.id) ? m.id : crypto.randomUUID()
        mealRows.push({
          id,
          user_id: userId,
          logged_at: new Date(m.loggedAt ?? noon.getTime()).toISOString(),
          ...mealToColumns({ ...m, carbs: m.carbs ?? null, fat: m.fat ?? null, fiber: m.fiber ?? null }, m.photo ? 'photo' : 'manual'),
        })
        if (m.photo) photos.push([id, m.photo])
        dates.add(date)
      }
    }
  }

  if (totalsRows.length) {
    const { error } = await supabase.from('daily_tracking')
      .upsert(totalsRows, { onConflict: 'user_id,date', ignoreDuplicates: true })
    if (error) throw new Error(error.message)
  }
  if (mealRows.length) {
    const { error } = await supabase.from('meal_logs')
      .upsert(mealRows, { onConflict: 'id', ignoreDuplicates: true })
    if (error) throw new Error(error.message)
  }

  // Imported: keep the photos (keyed by meal id) and clear the old entries so
  // they aren't imported into another account that signs in on this browser.
  for (const [id, photo] of photos) setMealPhoto(id, photo)
  for (const key of keys) { try { localStorage.removeItem(key) } catch { /* ignore */ } }
  return dates.size
}
