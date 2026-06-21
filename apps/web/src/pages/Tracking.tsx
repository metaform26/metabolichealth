
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardHeader, CardTitle, CardEyebrow, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { NumberInput } from '@/components/ui/number-input'
import { Modal } from '@/components/ui/modal'
import { Camera, Pencil, Trash2, Dumbbell, CheckSquare, History, ChevronLeft, Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { searchFoods, type USDAFood } from '@/lib/usda'
import { analyzeMealPhoto, type MealAnalysis } from '@/lib/gemini'

// ─── Data ─────────────────────────────────────────────────────────────────────


const MEAL_PRESETS: { type: string; meal: string; serving: string; calories: number; protein: number }[] = [
  { type: 'Breakfast', meal: 'Eggs and toast',         serving: '280 g',  calories: 420, protein: 25 },
  { type: 'Breakfast', meal: 'Oatmeal with berries',   serving: '320 g',  calories: 390, protein: 18 },
  { type: 'Breakfast', meal: 'Greek yogurt parfait',   serving: '300 g',  calories: 340, protein: 29 },
  { type: 'Breakfast', meal: 'Breakfast burrito',      serving: '330 g',  calories: 620, protein: 34 },
  { type: 'Lunch',     meal: 'Chicken and rice bowl',  serving: '430 g',  calories: 640, protein: 46 },
  { type: 'Lunch',     meal: 'Turkey wrap',            serving: '360 g',  calories: 520, protein: 39 },
  { type: 'Lunch',     meal: 'Salad with protein',     serving: '410 g',  calories: 430, protein: 34 },
  { type: 'Lunch',     meal: 'Soup and side',          serving: '420 g',  calories: 430, protein: 24 },
  { type: 'Dinner',    meal: 'Salmon vegetables plate',serving: '440 g',  calories: 610, protein: 45 },
  { type: 'Dinner',    meal: 'Pasta or rice meal',     serving: '480 g',  calories: 720, protein: 30 },
  { type: 'Dinner',    meal: 'Stir fry',               serving: '430 g',  calories: 570, protein: 40 },
  { type: 'Dinner',    meal: 'Curry bowl',             serving: '460 g',  calories: 690, protein: 34 },
  { type: 'Snack',     meal: 'Protein shake',          serving: '330 mL', calories: 210, protein: 30 },
  { type: 'Snack',     meal: 'Fruit and protein snack',serving: '240 g',  calories: 280, protein: 22 },
  { type: 'Snack',     meal: 'Cottage cheese snack',   serving: '220 g',  calories: 220, protein: 24 },
  { type: 'Snack',     meal: 'Edamame cup',            serving: '160 g',  calories: 190, protein: 17 },
]

interface DietChartEntry {
  meal: string
  food: string
  qty: string
  cal: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

const DIET_CHARTS: Record<string, DietChartEntry[]> = {
  highProtein: [
    { meal: 'Breakfast', food: 'Greek yogurt (3/4 cup) + berries (1/2 cup) + chia (1 tbsp)', qty: '280 g', cal: 320, protein: 28, carbs: 32, fat: 8, fiber: 5 },
    { meal: 'Breakfast', food: 'Egg white veggie omelet (4 whites + 1 cup veggies)', qty: '310 g', cal: 330, protein: 35, carbs: 10, fat: 14, fiber: 3 },
    { meal: 'Lunch',     food: 'Chicken breast (5 oz) + quinoa (3/4 cup) + greens', qty: '430 g', cal: 520, protein: 42, carbs: 48, fat: 12, fiber: 6 },
    { meal: 'Lunch',     food: 'Turkey (4 oz) lettuce wraps + hummus (2 tbsp)', qty: '330 g', cal: 390, protein: 34, carbs: 18, fat: 20, fiber: 4 },
    { meal: 'Dinner',    food: 'Lean turkey chili (1.5 cups) + kidney beans', qty: '420 g', cal: 470, protein: 42, carbs: 36, fat: 14, fiber: 10 },
    { meal: 'Dinner',    food: 'Shrimp (6 oz) + mixed vegetables (1.5 cups)', qty: '390 g', cal: 450, protein: 39, carbs: 28, fat: 18, fiber: 6 },
    { meal: 'Snack',     food: 'Cottage cheese (1 cup) + walnuts (1 tbsp)', qty: '220 g', cal: 220, protein: 24, carbs: 8, fat: 10, fiber: 0 },
    { meal: 'Snack',     food: 'Whey protein shake (1 scoop) + berries (1/2 cup)', qty: '360 mL', cal: 260, protein: 32, carbs: 18, fat: 3, fiber: 2 },
  ],
  mediterranean: [
    { meal: 'Breakfast', food: 'Feta (1 oz) + egg white scramble (4 whites) + tomato', qty: '290 g', cal: 340, protein: 30, carbs: 12, fat: 18, fiber: 2 },
    { meal: 'Breakfast', food: 'Greek yogurt (3/4 cup) + honey (1 tsp) + almonds (1 tbsp)', qty: '280 g', cal: 320, protein: 24, carbs: 32, fat: 12, fiber: 2 },
    { meal: 'Lunch',     food: 'Chicken breast (5 oz) Greek salad + olive oil (1 tbsp)', qty: '430 g', cal: 490, protein: 40, carbs: 18, fat: 28, fiber: 4 },
    { meal: 'Lunch',     food: 'Whole wheat wrap + hummus (3 tbsp) + veggies', qty: '360 g', cal: 430, protein: 22, carbs: 48, fat: 16, fiber: 8 },
    { meal: 'Dinner',    food: 'Salmon fillet (6 oz) + roasted vegetables + lemon', qty: '440 g', cal: 580, protein: 44, carbs: 16, fat: 36, fiber: 4 },
    { meal: 'Dinner',    food: 'Grilled chicken (5 oz) + tabbouleh (1 cup)', qty: '420 g', cal: 510, protein: 42, carbs: 38, fat: 18, fiber: 5 },
    { meal: 'Snack',     food: 'Tzatziki (1/4 cup) + cucumber + bell pepper slices', qty: '200 g', cal: 180, protein: 10, carbs: 14, fat: 8, fiber: 3 },
    { meal: 'Snack',     food: 'Feta (1.5 oz) + olives (8) + cherry tomatoes', qty: '100 g', cal: 200, protein: 8, carbs: 6, fat: 16, fiber: 1 },
  ],
  lowerCarb: [
    { meal: 'Breakfast', food: 'Egg bites (3) + spinach (1 cup) + cheese (1 oz)', qty: '260 g', cal: 340, protein: 30, carbs: 6, fat: 22, fiber: 2 },
    { meal: 'Breakfast', food: 'Chia pudding (3 tbsp chia + almond milk) + protein powder', qty: '240 g', cal: 310, protein: 27, carbs: 14, fat: 16, fiber: 10 },
    { meal: 'Lunch',     food: 'Chicken breast (6 oz) + avocado (1/2) + mixed greens', qty: '410 g', cal: 470, protein: 45, carbs: 10, fat: 28, fiber: 8 },
    { meal: 'Lunch',     food: 'Turkey burger patty (5 oz) + lettuce wrap + tomato', qty: '380 g', cal: 520, protein: 44, carbs: 8, fat: 34, fiber: 2 },
    { meal: 'Dinner',    food: 'Salmon fillet (6 oz) + asparagus (1 cup) + butter (1 tsp)', qty: '420 g', cal: 580, protein: 46, carbs: 8, fat: 40, fiber: 4 },
    { meal: 'Dinner',    food: 'Steak (5 oz) + fajita peppers & onions (1.5 cups)', qty: '410 g', cal: 560, protein: 47, carbs: 14, fat: 34, fiber: 4 },
    { meal: 'Snack',     food: 'Tuna (3 oz) + cucumber slices + mustard', qty: '150 g', cal: 170, protein: 22, carbs: 4, fat: 6, fiber: 1 },
    { meal: 'Snack',     food: 'Whey protein shake (1 scoop) + water', qty: '330 mL', cal: 210, protein: 30, carbs: 6, fat: 4, fiber: 0 },
  ],
  vegetarian: [
    { meal: 'Breakfast', food: 'Firm tofu scramble (6 oz) + bell pepper + onion', qty: '340 g', cal: 360, protein: 30, carbs: 16, fat: 20, fiber: 4 },
    { meal: 'Breakfast', food: 'Greek yogurt (1 cup) + granola (1/4 cup) + berries', qty: '300 g', cal: 340, protein: 29, carbs: 36, fat: 8, fiber: 4 },
    { meal: 'Lunch',     food: 'Lentils (1 cup cooked) + quinoa (3/4 cup) + greens', qty: '460 g', cal: 540, protein: 32, carbs: 72, fat: 10, fiber: 16 },
    { meal: 'Lunch',     food: 'Edamame (1 cup) + hummus (3 tbsp) + veggies', qty: '360 g', cal: 410, protein: 26, carbs: 34, fat: 18, fiber: 10 },
    { meal: 'Dinner',    food: 'Tempeh (5 oz) stir fry + broccoli (1 cup) + soy sauce', qty: '420 g', cal: 510, protein: 36, carbs: 32, fat: 26, fiber: 6 },
    { meal: 'Dinner',    food: 'Paneer tikka (4 oz) + mixed salad (2 cups)', qty: '430 g', cal: 560, protein: 38, carbs: 24, fat: 36, fiber: 4 },
    { meal: 'Snack',     food: 'Roasted chickpeas (1/3 cup)', qty: '55 g', cal: 180, protein: 10, carbs: 22, fat: 6, fiber: 6 },
    { meal: 'Snack',     food: 'Chia pudding (2 tbsp chia) + protein powder + almond milk', qty: '240 g', cal: 260, protein: 24, carbs: 16, fat: 12, fiber: 8 },
  ],
  glp1SmallMeals: [
    { meal: 'Breakfast', food: 'Soft-boiled eggs (2 large)', qty: '130 g', cal: 180, protein: 14, carbs: 2, fat: 12, fiber: 0 },
    { meal: 'Breakfast', food: 'Greek yogurt (1/2 cup) plain', qty: '150 g', cal: 170, protein: 17, carbs: 10, fat: 6, fiber: 0 },
    { meal: 'Lunch',     food: 'Chicken broth (1 cup) + shredded chicken (3 oz)', qty: '280 g', cal: 280, protein: 28, carbs: 8, fat: 14, fiber: 1 },
    { meal: 'Lunch',     food: 'Turkey roll-ups (3 oz) + mustard + lettuce', qty: '130 g', cal: 190, protein: 22, carbs: 4, fat: 8, fiber: 1 },
    { meal: 'Dinner',    food: 'Salmon (3 oz) + steamed broccoli (1/2 cup)', qty: '250 g', cal: 320, protein: 30, carbs: 6, fat: 18, fiber: 3 },
    { meal: 'Dinner',    food: 'Egg white scramble (4 whites) + spinach (1 cup)', qty: '220 g', cal: 240, protein: 24, carbs: 4, fat: 12, fiber: 2 },
    { meal: 'Snack',     food: 'Protein shake half scoop + water', qty: '200 mL', cal: 150, protein: 20, carbs: 4, fat: 2, fiber: 0 },
    { meal: 'Snack',     food: 'Cottage cheese (1/2 cup)', qty: '115 g', cal: 110, protein: 14, carbs: 4, fat: 4, fiber: 0 },
  ],
  diabetesFriendly: [
    { meal: 'Breakfast', food: 'Whole eggs (2) + spinach (1 cup) + mushrooms', qty: '280 g', cal: 300, protein: 26, carbs: 8, fat: 18, fiber: 3 },
    { meal: 'Breakfast', food: 'Chia (2 tbsp) + flaxmeal (1 tbsp) + protein powder + almond milk', qty: '260 g', cal: 310, protein: 24, carbs: 14, fat: 18, fiber: 10 },
    { meal: 'Lunch',     food: 'Grilled chicken breast (5 oz) + mixed greens (2 cups) + vinaigrette', qty: '430 g', cal: 460, protein: 42, carbs: 12, fat: 26, fiber: 4 },
    { meal: 'Lunch',     food: 'Turkey (4 oz) + avocado (1/2) + lettuce + tomato', qty: '380 g', cal: 500, protein: 38, carbs: 12, fat: 34, fiber: 8 },
    { meal: 'Dinner',    food: 'Baked cod fillet (6 oz) + broccoli (1.5 cups)', qty: '420 g', cal: 420, protein: 44, carbs: 14, fat: 18, fiber: 6 },
    { meal: 'Dinner',    food: 'Turkey meatballs (5 oz) + zucchini noodles (1.5 cups)', qty: '400 g', cal: 480, protein: 42, carbs: 16, fat: 26, fiber: 4 },
    { meal: 'Snack',     food: 'Celery (3 stalks) + almond butter (1 tbsp)', qty: '130 g', cal: 160, protein: 6, carbs: 8, fat: 12, fiber: 3 },
    { meal: 'Snack',     food: 'String cheese (1) + cucumber slices (1/2 cup)', qty: '100 g', cal: 140, protein: 10, carbs: 4, fat: 8, fiber: 1 },
  ],
}


const WORKOUT_PLANS: Record<string, string[]> = {
  moderateLoss:   ['Full-body lift', 'Zone 2 cardio 30 min', 'Walk after meals', 'Full-body lift', 'Zone 2 cardio 30 min', 'Active recovery'],
  aggressiveLoss: ['Full-body lift', 'Zone 2 cardio 45 min', 'HIIT intervals', 'Full-body lift', 'Zone 2 cardio 45 min', 'Active recovery'],
  recomposition:  ['Full-body lift', 'Zone 2 cardio', 'Full-body lift', 'Intervals', 'Full-body lift', 'Recovery walk'],
  leanGain:       ['Upper strength', 'Lower strength', 'Push volume', 'Pull volume', 'Leg hypertrophy', 'Mobility & core'],
  mildLoss:       ['Full-body lift', 'Zone 2 cardio 30 min', 'Walk 45 min', 'Full-body lift', 'Rest', 'Active recovery'],
  maintenance:    ['Strength training', 'Zone 2 cardio', 'Walk 30 min', 'Strength training', 'Zone 2 cardio', 'Rest'],
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface MealLog {
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

interface DailyTotals {
  calories: number
  protein: number
  steps: number
  water: number
}

const EMPTY_DAILY_TOTALS: DailyTotals = { calories: 0, protein: 0, steps: 0, water: 0 }

const DAILY_TOTALS_PREFIX = 'daily-tracking-'
const DAILY_MEALS_PREFIX = 'daily-meals-'

interface HistoryEntry {
  date: string // YYYY-MM-DD
  totals: DailyTotals
  meals: MealLog[]
}

// Keyed by local date, so a new day always starts back at 0. Manual entries
// and future device-sync updates (e.g. Apple Health step counts) both just
// write to this same per-day record. Every past day's record naturally
// becomes a history entry once a new day's key takes over as "today".
function todayDateString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function todayKey(): string {
  return `${DAILY_TOTALS_PREFIX}${todayDateString()}`
}

function todayMealsKey(): string {
  return `${DAILY_MEALS_PREFIX}${todayDateString()}`
}

function loadDailyTotals(): DailyTotals {
  try {
    const raw = localStorage.getItem(todayKey())
    if (raw) return { ...EMPTY_DAILY_TOTALS, ...JSON.parse(raw) }
  } catch {
    // localStorage unavailable or value corrupted — fall back to a fresh day
  }
  return EMPTY_DAILY_TOTALS
}

function loadDailyMeals(): MealLog[] {
  try {
    const raw = localStorage.getItem(todayMealsKey())
    if (raw) return JSON.parse(raw)
  } catch {
    // localStorage unavailable or value corrupted — fall back to a fresh day
  }
  return []
}

function dateFromKey(key: string | null, prefix: string): string | null {
  if (!key?.startsWith(prefix)) return null
  const date = key.slice(prefix.length)
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null
}

function loadHistoryEntries(): HistoryEntry[] {
  const dates = new Set<string>()
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      const date = dateFromKey(key, DAILY_TOTALS_PREFIX) ?? dateFromKey(key, DAILY_MEALS_PREFIX)
      if (date) dates.add(date)
    }
  } catch {
    // localStorage unavailable
  }

  const entries: HistoryEntry[] = []
  for (const date of dates) {
    let totals = EMPTY_DAILY_TOTALS
    let meals: MealLog[] = []
    try {
      const rawTotals = localStorage.getItem(`${DAILY_TOTALS_PREFIX}${date}`)
      if (rawTotals) totals = { ...EMPTY_DAILY_TOTALS, ...JSON.parse(rawTotals) }
    } catch {
      // skip corrupted entry
    }
    try {
      const rawMeals = localStorage.getItem(`${DAILY_MEALS_PREFIX}${date}`)
      if (rawMeals) meals = JSON.parse(rawMeals)
    } catch {
      // skip corrupted entry
    }
    entries.push({ date, totals, meals })
  }
  return entries.sort((a, b) => b.date.localeCompare(a.date))
}

// Downscales an uploaded photo before storing it, so a handful of meal
// photos don't quickly blow through localStorage's ~5MB quota.
function resizeImageToDataUrl(file: File, maxDim = 640, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not load image'))
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(reader.result as string); return }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

function formatLogTime(timestamp?: number): string | null {
  if (!timestamp) return null
  return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatHistoryDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const label = new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  return dateStr === todayDateString() ? `Today · ${label}` : label
}

// ─── Adherence Ring ────────────────────────────────────────────────────────────

function AdherenceRing({
  label, value, target, unit, status, color,
}: {
  label: string; value: number; target: number; unit: string; status?: string; color: string;
}) {
  const pct = Math.min(100, Math.round((value / Math.max(1, target)) * 100))
  const stroke = 2 * Math.PI * 38
  const dash = (pct / 100) * stroke

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r="38" fill="none" stroke="#f1f5f9" strokeWidth="8" />
          <circle cx="44" cy="44" r="38" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${dash} ${stroke}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.5s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-slate-800">{pct}%</span>
        </div>
      </div>
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      <p className="text-[11px] text-slate-400 font-medium">{value} / {target} {unit}</p>
      {status && <p className="text-[10px] font-bold" style={{ color }}>{status}</p>}
    </div>
  )
}

// ─── Meal Log Row ──────────────────────────────────────────────────────────────

function MealLogRow({ log, onEdit, onDelete }: { log: MealLog; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <div className="flex items-start gap-3">
        {log.photo && (
          <img src={log.photo} alt={log.meal} className="w-12 h-12 rounded-lg object-cover shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-600">{log.type}</span>
            <span className="font-semibold text-slate-800 text-sm">{log.meal}</span>
            {formatLogTime(log.loggedAt) && (
              <span className="text-[11px] text-slate-400 font-medium">{formatLogTime(log.loggedAt)}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-slate-400 font-medium">
            <span>{log.serving}</span>
            <span>{log.calories} kcal</span>
            <span>{log.protein}g protein</span>
            {log.carbs !== null && <span>{log.carbs}g carbs</span>}
            {log.fat !== null && <span>{log.fat}g fat</span>}
          </div>
        </div>
        {(onEdit || onDelete) && (
          <div className="flex gap-1 shrink-0">
            {onEdit && (
              <button onClick={onEdit}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-100 transition-colors">
                <Pencil className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors">
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const TARGETS = { calories: 1498, protein: 149, steps: 8000, waterOz: 80 }

export default function Tracking() {
  // Today's totals — reset to 0 each new day, persisted in localStorage for the rest of the day
  const [calorieLogged, setCalorieLogged] = useState(() => loadDailyTotals().calories)
  const [proteinLogged, setProteinLogged] = useState(() => loadDailyTotals().protein)
  const [stepsLogged, setStepsLogged] = useState(() => loadDailyTotals().steps)
  const [waterLogged, setWaterLogged] = useState(() => loadDailyTotals().water)

  useEffect(() => {
    localStorage.setItem(
      todayKey(),
      JSON.stringify({ calories: calorieLogged, protein: proteinLogged, steps: stepsLogged, water: waterLogged })
    )
  }, [calorieLogged, proteinLogged, stepsLogged, waterLogged])

  // History modal
  const [historyOpen, setHistoryOpen] = useState(false)
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(null)
  const historyEntries = useMemo(() => (historyOpen ? loadHistoryEntries() : []), [historyOpen])
  const selectedHistoryEntry = historyEntries.find((e) => e.date === selectedHistoryDate)

  function closeHistory() {
    setHistoryOpen(false)
    setSelectedHistoryDate(null)
  }

  // Meal log — persisted per day, alongside the daily totals above
  const [mealLogs, setMealLogs] = useState<MealLog[]>(() => loadDailyMeals())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [mealType, setMealType] = useState('Breakfast')
  const [mealPreset, setMealPreset] = useState('0')
  const [customName, setCustomName] = useState('')
  const [serving, setServing] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [fiber, setFiber] = useState('')

  // USDA food search
  const [foodQuery, setFoodQuery] = useState('')
  const [foodResults, setFoodResults] = useState<USDAFood[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const doSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) { setFoodResults([]); setSearching(false); return }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchFoods(q)
        setFoodResults(results)
      } catch {
        setFoodResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
  }, [])

  function selectUSDAFood(food: USDAFood) {
    setCustomName(food.description)
    const servingLabel = food.servingSize && food.servingSizeUnit
      ? `${food.servingSize} ${food.servingSizeUnit}`
      : '100 g'
    setServing(servingLabel)
    setCalories(String(food.calories))
    setProtein(String(food.protein))
    setCarbs(String(food.carbs))
    setFat(String(food.fat))
    setFiber(String(food.fiber))
    setMealPreset('custom')
    setFoodQuery('')
    setFoodResults([])
    setShowResults(false)
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(todayMealsKey(), JSON.stringify(mealLogs))
    } catch {
      // localStorage quota exceeded (e.g. too many photos) — skip persisting this update
    }
  }, [mealLogs])

  // Photo estimate (AI-powered)
  const [photoMeal, setPhotoMeal] = useState('Breakfast')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState<MealAnalysis | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  // Diet chart + workout
  const [dietPref, setDietPref] = useState('highProtein')
  const [workoutChecked, setWorkoutChecked] = useState<Record<number, boolean>>({ 0: true, 1: true })
  const [goal] = useState('moderateLoss')

  // Presets filtered by meal type
  const presetsForType = useMemo(
    () => MEAL_PRESETS.filter((p) => p.type === mealType),
    [mealType]
  )

  // Totals from meal log
  const totalCals = mealLogs.reduce((s, l) => s + l.calories, 0)
  const totalProtein = mealLogs.reduce((s, l) => s + l.protein, 0)

  // Sync sliders when meals are logged
  const effectiveCals = mealLogs.length > 0 ? Math.min(3200, totalCals) : calorieLogged
  const effectiveProtein = mealLogs.length > 0 ? Math.min(240, totalProtein) : proteinLogged

  async function analyzePhoto(dataUrl: string) {
    setAnalyzing(true)
    setAiError(null)
    setAiResult(null)
    try {
      const result = await analyzeMealPhoto(dataUrl)
      setAiResult(result)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to analyze photo')
    } finally {
      setAnalyzing(false)
    }
  }

  function applyPreset(type: string, idx: string) {
    if (idx === 'custom') { setCustomName(''); setServing(''); setCalories(''); setProtein(''); return }
    const presets = MEAL_PRESETS.filter((p) => p.type === type)
    const p = presets[Number(idx)]
    if (!p) return
    setCustomName('')
    setServing(p.serving)
    setCalories(String(p.calories))
    setProtein(String(p.protein))
    setCarbs('')
    setFat('')
    setFiber('')
  }

  function saveMeal() {
    const existing = editingId ? mealLogs.find((l) => l.id === editingId) : undefined
    const log: MealLog = {
      id: editingId ?? crypto.randomUUID(),
      type: mealType,
      meal: customName.trim() || (() => {
        if (mealPreset === 'custom') return 'Custom meal'
        const p = presetsForType[Number(mealPreset)]
        return p?.meal ?? 'Custom meal'
      })(),
      serving: serving || '1 serving',
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: carbs === '' ? null : Number(carbs),
      fat: fat === '' ? null : Number(fat),
      fiber: fiber === '' ? null : Number(fiber),
      loggedAt: existing?.loggedAt ?? Date.now(),
      ...(existing?.photo ? { photo: existing.photo } : {}),
    }
    if (editingId) {
      setMealLogs((prev) => prev.map((l) => l.id === editingId ? log : l))
      setEditingId(null)
    } else {
      setMealLogs((prev) => [...prev, log])
    }
    setCustomName(''); setServing(''); setCalories(''); setProtein(''); setCarbs(''); setFat(''); setFiber('')
    setMealPreset('0')
  }

  function loadForEdit(log: MealLog) {
    setEditingId(log.id)
    setMealType(log.type)
    setMealPreset('custom')
    setCustomName(log.meal)
    setServing(log.serving)
    setCalories(String(log.calories))
    setProtein(String(log.protein))
    setCarbs(log.carbs === null ? '' : String(log.carbs))
    setFat(log.fat === null ? '' : String(log.fat))
    setFiber(log.fiber === null ? '' : String(log.fiber))
  }

  function logPhotoMeal() {
    if (!aiResult) return
    const log: MealLog = {
      id: crypto.randomUUID(),
      type: photoMeal,
      meal: aiResult.description || aiResult.foods.map((f) => f.name).join(', '),
      serving: aiResult.foods.map((f) => `${f.name} (${f.quantity})`).join(', '),
      calories: aiResult.totalCalories,
      protein: aiResult.totalProtein,
      carbs: aiResult.totalCarbs,
      fat: aiResult.totalFat,
      fiber: aiResult.totalFiber,
      loggedAt: Date.now(),
      ...(photoPreview ? { photo: photoPreview } : {}),
    }
    setMealLogs((prev) => [...prev, log])
    setPhotoPreview(null)
    setAiResult(null)
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await resizeImageToDataUrl(file)
      setPhotoPreview(dataUrl)
      analyzePhoto(dataUrl)
    } catch {
      // unreadable file — ignore
    }
  }

  const calStatus = effectiveCals / TARGETS.calories > 1.1 ? `Over by ${effectiveCals - TARGETS.calories} kcal` : effectiveCals / TARGETS.calories < 0.8 ? 'Under target' : 'In range'
  const protStatus = effectiveProtein / TARGETS.protein < 0.8 ? 'Low protein' : effectiveProtein / TARGETS.protein > 1.2 ? 'Protein surplus' : 'On target'
  const calColor = effectiveCals / TARGETS.calories > 1.1 ? '#e11d48' : effectiveCals / TARGETS.calories < 0.8 ? '#d97706' : '#0d9488'
  const protColor = effectiveProtein / TARGETS.protein < 0.8 ? '#d97706' : '#0d9488'

  const workoutItems = WORKOUT_PLANS[goal] ?? WORKOUT_PLANS.moderateLoss
  const dietRows = DIET_CHARTS[dietPref] ?? DIET_CHARTS.highProtein

  const MEAL_TYPE_OPTIONS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((v) => ({ value: v, label: v }))
  const DIET_OPTIONS = [
    { value: 'highProtein', label: 'High protein balanced' },
    { value: 'mediterranean', label: 'Mediterranean' },
    { value: 'lowerCarb', label: 'Lower-carb metabolic' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'glp1SmallMeals', label: 'GLP-1 small meals' },
    { value: 'diabetesFriendly', label: 'Diabetes-friendly' },
  ]
  const presetOptions = [
    { value: 'custom', label: 'Custom meal' },
    ...presetsForType.map((p, i) => ({ value: String(i), label: p.meal })),
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar eyebrow="Daily Log" title="Daily Tracking" />

      <main className="flex-1 overflow-y-auto p-5 lg:p-6 space-y-5">

        {/* ── Synced device metrics ────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Steps',       value: stepsLogged.toLocaleString(), sub: 'Wearable import' },
            { label: 'Sleep',       value: '—',   sub: 'Apple Health / Fitbit' },
            { label: 'Heart Rate',  value: '—',   sub: 'Resting estimate' },
            { label: 'Glucose',     value: '—',sub: 'Optional CGM' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="rounded-2xl border border-slate-100 bg-white p-4 flex flex-col justify-between min-h-[100px] shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
              <div>
                <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
                <p className="text-xs text-slate-400 font-medium mt-1">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Sliders + Adherence rings ────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Today</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="slate">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Badge>
                <Button variant="secondary" size="sm" onClick={() => setHistoryOpen(true)}>
                  <History className="w-3.5 h-3.5" />
                  View history
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Calories logged', value: calorieLogged, set: setCalorieLogged, max: 3200, unit: 'kcal', target: TARGETS.calories },
                  { label: 'Protein logged',  value: proteinLogged, set: setProteinLogged, max: 240,  unit: 'g',    target: TARGETS.protein },
                  { label: 'Steps',           value: stepsLogged,   set: setStepsLogged,   max: 16000,unit: 'steps',target: TARGETS.steps },
                  { label: 'Water',           value: waterLogged,   set: setWaterLogged,   max: 160,  unit: 'oz',   target: TARGETS.waterOz },
                ].map(({ label, value, set, max, unit, target }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
                      <span>{label}</span>
                      <span className="text-slate-700">{value.toLocaleString()} {unit} <span className="text-slate-400 font-normal">/ {target.toLocaleString()}</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="range" min={0} max={max} value={value}
                        onChange={(e) => set(Number(e.target.value))}
                        className="w-full accent-teal-600 h-2 rounded-full" />
                      <NumberInput
                        min={0}
                        max={max}
                        value={value}
                        onValueChange={(v) => set(Math.min(max, Math.max(0, v)))}
                        suffix={unit}
                        className="w-28 shrink-0 py-1.5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Adherence</CardTitle>
              <Badge variant={calStatus === 'In range' ? 'green' : 'amber'}>
                {calStatus === 'In range' ? 'On track' : calStatus}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                <AdherenceRing label="Calories" value={effectiveCals}  target={TARGETS.calories} unit="kcal" status={calStatus}  color={calColor} />
                <AdherenceRing label="Protein"  value={effectiveProtein} target={TARGETS.protein} unit="g"  status={protStatus} color={protColor} />
                <AdherenceRing label="Steps"    value={stepsLogged}   target={TARGETS.steps}    unit="steps" color="#7c3aed" />
                <AdherenceRing label="Hydration"value={waterLogged}   target={TARGETS.waterOz}  unit="oz"    color="#0ea5e9" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Photo estimate + Meal log ────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Photo estimate — AI powered */}
          <Card>
            <CardHeader>
              <div>
                <CardEyebrow>AI smart log</CardEyebrow>
                <CardTitle>Photo Meal Analysis</CardTitle>
              </div>
              <Badge variant="teal">AI powered</Badge>
            </CardHeader>
            <CardContent>
              {/* Upload box */}
              <label className="flex flex-col items-center justify-center min-h-[110px] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 cursor-pointer hover:border-teal-300 hover:bg-teal-50/30 transition-colors mb-4 overflow-hidden relative">
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                {photoPreview ? (
                  <img src={photoPreview} alt="Uploaded meal" className="max-h-28 rounded-xl object-contain py-2" />
                ) : (
                  <>
                    <Camera className="w-7 h-7 text-slate-300 mb-2" />
                    <span className="text-sm font-medium text-slate-400">Upload a meal photo to analyze</span>
                  </>
                )}
                {analyzing && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
                    <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                    <span className="ml-2 text-sm font-medium text-teal-700">Analyzing...</span>
                  </div>
                )}
              </label>

              {aiError && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700 mb-3 flex items-center justify-between">
                  <span>{aiError}</span>
                  {photoPreview && (
                    <button
                      onClick={() => analyzePhoto(photoPreview)}
                      className="text-red-700 font-semibold underline ml-2 shrink-0"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}

              {aiResult && (
                <div className="space-y-3 mb-3">
                  <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3">
                    <p className="text-sm font-semibold text-teal-800 mb-2">{aiResult.description}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold">
                      <span className="text-slate-700">{aiResult.totalCalories} kcal</span>
                      <span className="text-teal-700">{aiResult.totalProtein}g protein</span>
                      <span className="text-amber-600">{aiResult.totalCarbs}g carbs</span>
                      <span className="text-rose-600">{aiResult.totalFat}g fat</span>
                      {aiResult.totalFiber > 0 && <span className="text-violet-600">{aiResult.totalFiber}g fiber</span>}
                    </div>
                  </div>
                  {aiResult.foods.length > 1 && (
                    <div className="space-y-1.5">
                      {aiResult.foods.map((food, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                          <span className="font-medium text-slate-700">{food.name} <span className="text-slate-400">({food.quantity})</span></span>
                          <span className="text-slate-500">{food.calories} kcal · {food.protein}g P</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <Select label="Log as" value={photoMeal}
                    onChange={(e) => setPhotoMeal(e.target.value)} options={MEAL_TYPE_OPTIONS} />
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={logPhotoMeal} size="sm" disabled={!aiResult}>
                  {analyzing ? 'Analyzing...' : aiResult ? 'Log meal' : 'Upload a photo to analyze'}
                </Button>
                {(aiResult || aiError) && (
                  <Button variant="secondary" size="sm" onClick={() => { setPhotoPreview(null); setAiResult(null); setAiError(null) }}>
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Manual meal log */}
          <Card>
            <CardHeader>
              <div>
                <CardEyebrow>Meal log</CardEyebrow>
                <CardTitle>Manual Meal Log</CardTitle>
              </div>
              <Badge variant="slate">
                {mealLogs.length} meal{mealLogs.length !== 1 ? 's' : ''}{mealLogs.length > 0 ? ` · ${totalCals} kcal` : ''}
              </Badge>
            </CardHeader>
            <CardContent>
              {/* USDA food search */}
              <div ref={searchRef} className="relative mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search USDA foods (e.g. greek yogurt, chicken breast)…"
                    value={foodQuery}
                    onChange={(e) => { setFoodQuery(e.target.value); setShowResults(true); doSearch(e.target.value) }}
                    onFocus={() => { if (foodResults.length > 0) setShowResults(true) }}
                    className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white"
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                {showResults && foodResults.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {foodResults.map((food) => (
                      <button
                        key={food.fdcId}
                        onClick={() => selectUSDAFood(food)}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                      >
                        <p className="text-sm font-semibold text-slate-800 leading-tight">{food.description}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {food.servingSize && food.servingSizeUnit ? `${food.servingSize} ${food.servingSizeUnit}` : '100 g'}
                          {' · '}{food.calories} kcal · {food.protein}g protein · {food.carbs}g carbs · {food.fat}g fat
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <Select label="Type" value={mealType} options={MEAL_TYPE_OPTIONS}
                  onChange={(e) => { setMealType(e.target.value); setMealPreset('0'); applyPreset(e.target.value, '0') }} />
                <Select label="Preset" value={mealPreset} options={presetOptions}
                  onChange={(e) => { setMealPreset(e.target.value); applyPreset(mealType, e.target.value) }} />
                <Input label="Food name" placeholder="Name or select from search above" value={customName}
                  onChange={(e) => setCustomName(e.target.value)} />
                <Input label="Serving" placeholder="e.g. 1 cup, 100 g" value={serving}
                  onChange={(e) => setServing(e.target.value)} />
                <Input label="Calories" type="number" min={0} suffix="kcal" value={calories}
                  onChange={(e) => setCalories(e.target.value)} />
                <Input label="Protein" type="number" min={0} suffix="g" value={protein}
                  onChange={(e) => setProtein(e.target.value)} />
                <Input label="Carbs" type="number" min={0} suffix="g" value={carbs}
                  onChange={(e) => setCarbs(e.target.value)} />
                <Input label="Fat" type="number" min={0} suffix="g" value={fat}
                  onChange={(e) => setFat(e.target.value)} />
                <Input label="Fiber" type="number" min={0} suffix="g" value={fiber}
                  onChange={(e) => setFiber(e.target.value)} />
              </div>
              <Button onClick={saveMeal} size="sm">
                {editingId ? 'Save changes' : 'Add meal'}
              </Button>

              {/* Meal rows */}
              {mealLogs.length > 0 && (
                <div className="mt-4 space-y-2">
                  {mealLogs.map((log) => (
                    <MealLogRow
                      key={log.id}
                      log={log}
                      onEdit={() => loadForEdit(log)}
                      onDelete={() => { setMealLogs((p) => p.filter((l) => l.id !== log.id)); if (editingId === log.id) setEditingId(null) }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Diet chart ───────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div>
              <CardEyebrow>Meal plan</CardEyebrow>
              <CardTitle>Diet Chart</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={dietPref}
                onChange={(e) => setDietPref(e.target.value)}
                options={DIET_OPTIONS}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dietRows.map((entry, i) => (
                <div key={i} className="border border-slate-100 rounded-xl px-4 py-3 bg-slate-50 text-sm">
                  <div className="flex items-start gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-teal-600 shrink-0 mt-0.5">{entry.meal}</span>
                    <span className="font-semibold text-slate-800">{entry.food}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                    <span className="text-slate-400 font-medium">{entry.qty}</span>
                    <span className="text-slate-600 font-semibold">{entry.cal} kcal</span>
                    <span className="text-teal-700 font-semibold">{entry.protein}g protein</span>
                    <span className="text-amber-600 font-semibold">{entry.carbs}g carbs</span>
                    <span className="text-rose-600 font-semibold">{entry.fat}g fat</span>
                    {entry.fiber > 0 && <span className="text-violet-600 font-semibold">{entry.fiber}g fiber</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Workout checklist ────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div>
              <CardEyebrow>Exercise</CardEyebrow>
              <CardTitle>Workout Checklist</CardTitle>
            </div>
            <Badge variant="teal">Progressive overload</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {workoutItems.map((item, i) => (
                <label key={i}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all select-none',
                    workoutChecked[i]
                      ? 'bg-teal-50 border-teal-200 text-teal-700'
                      : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                  )}>
                  <input type="checkbox" className="w-4 h-4 accent-teal-600"
                    checked={!!workoutChecked[i]}
                    onChange={(e) => setWorkoutChecked((p) => ({ ...p, [i]: e.target.checked }))} />
                  <span className="text-sm font-medium">{item}</span>
                </label>
              ))}
            </div>
            <div className="mt-3 text-xs text-slate-400 font-medium">
              {Object.values(workoutChecked).filter(Boolean).length} of {workoutItems.length} sessions completed this week
            </div>
          </CardContent>
        </Card>

      </main>

      <Modal open={historyOpen} onClose={closeHistory} title="Tracking History">
        {selectedHistoryEntry ? (
          <div>
            <button
              onClick={() => setSelectedHistoryDate(null)}
              className="flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-900 mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              All days
            </button>
            <p className="text-sm font-bold text-slate-800 mb-3">{formatHistoryDate(selectedHistoryEntry.date)}</p>
            <div className="space-y-2">
              {[
                { label: 'Calories logged', value: selectedHistoryEntry.totals.calories, unit: 'kcal', target: TARGETS.calories },
                { label: 'Protein logged',  value: selectedHistoryEntry.totals.protein,  unit: 'g',    target: TARGETS.protein },
                { label: 'Steps',           value: selectedHistoryEntry.totals.steps,    unit: 'steps', target: TARGETS.steps },
                { label: 'Water',           value: selectedHistoryEntry.totals.water,    unit: 'oz',    target: TARGETS.waterOz },
              ].map(({ label, value, unit, target }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-sm font-semibold text-slate-600">{label}</span>
                  <span className="text-sm font-bold text-slate-800">
                    {value.toLocaleString()} {unit} <span className="text-slate-400 font-normal text-xs">/ {target.toLocaleString()}</span>
                  </span>
                </div>
              ))}
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-5 mb-2">Meals logged</p>
            {selectedHistoryEntry.meals.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No meals logged</p>
            ) : (
              <div className="space-y-2">
                {selectedHistoryEntry.meals.map((log) => (
                  <MealLogRow key={log.id} log={log} />
                ))}
              </div>
            )}
          </div>
        ) : historyEntries.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No history</p>
        ) : (
          <div className="space-y-2">
            {historyEntries.map((entry) => (
              <button
                key={entry.date}
                onClick={() => setSelectedHistoryDate(entry.date)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
              >
                <span className="text-sm font-semibold text-slate-700">{formatHistoryDate(entry.date)}</span>
                <span className="text-xs text-slate-400 font-medium">
                  {entry.totals.calories.toLocaleString()} kcal · {entry.totals.protein}g · {entry.totals.steps.toLocaleString()} steps · {entry.totals.water}oz
                </span>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
