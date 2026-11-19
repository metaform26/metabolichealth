
import { useState, useMemo, useRef, useEffect } from 'react'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardHeader, CardTitle, CardEyebrow, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Camera, Scale, History, ChevronLeft, AlertTriangle, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CheckIn {
  id: string
  date: string
  weight: number
  waist: number
  bodyFat: number
}

interface PhotoLog {
  date: string
  loggedAt: number
  front: string | null
  back: string | null
  side: string | null
}

const PHOTO_LOG_PREFIX = 'mh:progress-photos:'
const PHOTO_ANGLES = ['front', 'back', 'side'] as const
type PhotoAngle = (typeof PHOTO_ANGLES)[number]

// ─── Helpers ──────────────────────────────────────────────────────────────────

type CheckInDbRow = Database['public']['Tables']['progress_check_ins']['Row']

function rowToCheckIn(row: CheckInDbRow): CheckIn {
  return {
    id: row.id,
    date: row.date,
    weight: Number(row.weight_lbs ?? 0),
    waist: Number(row.waist_inches ?? 0),
    bodyFat: Number(row.body_fat_percent ?? 0),
  }
}

function bmiClass(bmi: number) {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal'
  if (bmi < 30) return 'Overweight'
  if (bmi < 35) return 'Obesity I'
  if (bmi < 40) return 'Obesity II'
  return 'Obesity III'
}

// ─── Photo log helpers ───────────────────────────────────────────────────────

function todayDateString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

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

function loadTodayPhotos(): PhotoLog {
  try {
    const raw = localStorage.getItem(`${PHOTO_LOG_PREFIX}${todayDateString()}`)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { date: todayDateString(), loggedAt: Date.now(), front: null, back: null, side: null }
}

function saveTodayPhotos(log: PhotoLog) {
  try {
    localStorage.setItem(`${PHOTO_LOG_PREFIX}${log.date}`, JSON.stringify(log))
  } catch { /* quota exceeded */ }
}

function loadPhotoHistory(): PhotoLog[] {
  const entries: PhotoLog[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(PHOTO_LOG_PREFIX)) continue
      const raw = localStorage.getItem(key)
      if (raw) entries.push(JSON.parse(raw))
    }
  } catch { /* ignore */ }
  return entries.sort((a, b) => b.date.localeCompare(a.date))
}

function formatPhotoDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const label = new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  return dateStr === todayDateString() ? `Today · ${label}` : label
}

// ─── SVG Chart ────────────────────────────────────────────────────────────────

function ProgressChart({
  logs,
  heightInches,
  targetWeight,
  targetBodyFat,
}: {
  logs: CheckIn[]
  heightInches: number | null
  targetWeight: number | null
  targetBodyFat: number | null
}) {
  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        No check-ins yet — log your first entry above.
      </div>
    )
  }

  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date))
  const W = 640
  const H = 220
  const PAD = 32

  // BMI needs a height; without one the BMI line is left out.
  const bmis = heightInches ? sorted.map((l) => (l.weight / (heightInches * heightInches)) * 703) : null
  const allValues = sorted.flatMap((l, i) => [l.weight, l.waist, l.bodyFat, ...(bmis ? [bmis[i]] : [])])
  if (targetWeight) allValues.push(targetWeight)
  if (targetBodyFat) allValues.push(targetBodyFat)

  const min = Math.min(...allValues) * 0.92
  const max = Math.max(...allValues) * 1.06

  const x = (i: number) => PAD + (i / Math.max(1, sorted.length - 1)) * (W - PAD * 2)
  const y = (v: number) => H - PAD - ((v - min) / (max - min || 1)) * (H - PAD * 2)
  const line = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')

  const series = [
    { key: 'weight', values: sorted.map((l) => l.weight), color: '#0d9488' },
    { key: 'waist',  values: sorted.map((l) => l.waist),  color: '#d97706' },
    { key: 'fat',    values: sorted.map((l) => l.bodyFat), color: '#e11d48' },
    ...(bmis ? [{ key: 'bmi', values: bmis, color: '#7c3aed' }] : []),
  ]

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Progress chart">
        <line x1={PAD} x2={W - PAD} y1={H - PAD} y2={H - PAD} stroke="#e2e8f0" strokeWidth="1.5" />
        {targetWeight && (
          <line x1={PAD} x2={W - PAD} y1={y(targetWeight)} y2={y(targetWeight)}
            stroke="#0d9488" strokeDasharray="6 4" strokeWidth="1.5" opacity="0.5" />
        )}
        {targetBodyFat && (
          <line x1={PAD} x2={W - PAD} y1={y(targetBodyFat)} y2={y(targetBodyFat)}
            stroke="#e11d48" strokeDasharray="6 4" strokeWidth="1.5" opacity="0.5" />
        )}
        {series.map(({ key, values, color }) => (
          <path key={key} d={line(values)} fill="none" stroke={color} strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {series.map(({ key, values, color }) =>
          values.map((v, i) => (
            <circle key={`${key}-${i}`} cx={x(i)} cy={y(v)} r="5"
              fill={color} stroke="white" strokeWidth="2" />
          ))
        )}
        {sorted.map((l, i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor="middle"
            fill="#94a3b8" fontSize="11" fontWeight="600">
            {l.date.slice(5)}
          </text>
        ))}
      </svg>
      <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
        {[
          { color: '#0d9488', label: 'Weight' },
          { color: '#d97706', label: 'Waist' },
          { color: '#e11d48', label: 'Body Fat' },
          ...(bmis ? [{ color: '#7c3aed', label: 'BMI' }] : []),
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Check-In Row ─────────────────────────────────────────────────────────────

function CheckInRow({ log, onDelete }: { log: CheckIn; onDelete: () => void }) {
  const formatted = new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-center border border-slate-100 rounded-xl px-4 py-3 bg-white text-sm">
      <span className="font-semibold text-slate-700">{formatted}</span>
      <span className="text-slate-500">{log.weight} lb</span>
      <span className="text-slate-500">{log.waist} in</span>
      <span className="text-slate-500">{log.bodyFat}% fat</span>
      <button onClick={onDelete}
        className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none font-bold">
        ×
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// Measurements and goals from the user's health profile (set during onboarding
// and on the Profile page). Any of these can be missing.
interface ProfileStats {
  heightInches: number | null
  weight: number | null
  waist: number | null
  bodyFat: number | null
  baselineWeight: number | null
  targetWeight: number | null
  targetBodyFat: number | null
}

const numOrNull = (v: number | null | undefined) => (v == null || Number.isNaN(Number(v)) ? null : Number(v))

export default function Progress() {
  const [logs, setLogs] = useState<CheckIn[]>([])
  const [profile, setProfile] = useState<ProfileStats | null>(null)
  const [logsLoading, setLogsLoading] = useState(true)
  const [logsError, setLogsError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { if (!cancelled) setLogsLoading(false); return }
      const [checkIns, health] = await Promise.all([
        supabase
          .from('progress_check_ins')
          .select('*')
          .eq('user_id', session.user.id)
          .order('date', { ascending: true }),
        supabase
          .from('user_health_profiles')
          .select('height_inches, weight_lbs, waist_inches, body_fat_percent, baseline_weight_lbs, target_weight_lbs, target_body_fat_percent')
          .eq('user_id', session.user.id)
          .maybeSingle(),
      ])
      if (cancelled) return
      if (checkIns.error) setLogsError(`Couldn't load check-ins: ${checkIns.error.message}`)
      else setLogs((checkIns.data ?? []).map(rowToCheckIn))
      const h = health.data
      if (h) {
        const stats: ProfileStats = {
          heightInches: numOrNull(h.height_inches),
          weight: numOrNull(h.weight_lbs),
          waist: numOrNull(h.waist_inches),
          bodyFat: numOrNull(h.body_fat_percent),
          baselineWeight: numOrNull(h.baseline_weight_lbs),
          targetWeight: numOrNull(h.target_weight_lbs),
          targetBodyFat: numOrNull(h.target_body_fat_percent),
        }
        setProfile(stats)
        if (stats.targetWeight != null) setTargetWeight(String(stats.targetWeight))
      }
      setLogsLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Local calendar date — toISOString() would give the UTC date, which is
  // already "tomorrow" in the evening for US time zones.
  const today = todayDateString()
  const [date, setDate] = useState(today)
  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [targetWeight, setTargetWeight] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [staged, setStaged] = useState<Record<PhotoAngle, string | null>>({ front: null, back: null, side: null })
  const [checkInsOpen, setCheckInsOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<CheckIn | null>(null)
  const [editWeight, setEditWeight] = useState('')
  const [editWaist, setEditWaist] = useState('')
  const [editBodyFat, setEditBodyFat] = useState('')
  const [photoHistoryOpen, setPhotoHistoryOpen] = useState(false)
  const [selectedPhotoDate, setSelectedPhotoDate] = useState<string | null>(null)
  const photoHistory = useMemo(() => (photoHistoryOpen ? loadPhotoHistory() : []), [photoHistoryOpen])
  const selectedPhotoEntry = photoHistory.find((e) => e.date === selectedPhotoDate)
  const [reminders, setReminders] = useState({
    calories: true, hydration: true, steps: true, weekly: true,
  })

  const fileRefs = {
    front: useRef<HTMLInputElement>(null),
    back: useRef<HTMLInputElement>(null),
    side: useRef<HTMLInputElement>(null),
  }

  async function handlePhotoUpload(angle: PhotoAngle, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await resizeImageToDataUrl(file)
    setStaged((prev) => ({ ...prev, [angle]: dataUrl }))
  }

  function submitPhotos() {
    const existing = loadTodayPhotos()
    const log: PhotoLog = {
      date: todayDateString(),
      loggedAt: Date.now(),
      front: staged.front ?? existing.front,
      back: staged.back ?? existing.back,
      side: staged.side ?? existing.side,
    }
    saveTodayPhotos(log)
    setUploadOpen(false)
    setStaged({ front: null, back: null, side: null })
  }

  const stagedCount = PHOTO_ANGLES.filter((a) => staged[a]).length
  const existingToday = useMemo(() => (uploadOpen ? loadTodayPhotos() : null), [uploadOpen])
  const replacingAngles = existingToday ? PHOTO_ANGLES.filter((a) => staged[a] && existingToday[a]) : []

  function closePhotoHistory() {
    setPhotoHistoryOpen(false)
    setSelectedPhotoDate(null)
  }

  const sorted = useMemo(
    () => [...logs].sort((a, b) => a.date.localeCompare(b.date)),
    [logs]
  )
  // Latest numbers: newest check-in, otherwise what the user entered in their profile.
  const lastLog = sorted[sorted.length - 1]
  const latest = {
    weight: lastLog?.weight ?? profile?.weight ?? null,
    waist: lastLog?.waist ?? profile?.waist ?? null,
    bodyFat: lastLog?.bodyFat ?? profile?.bodyFat ?? null,
  }
  const heightInches = profile?.heightInches ?? null
  const bmi = latest.weight != null && heightInches ? (latest.weight / (heightInches * heightInches)) * 703 : null
  const leanMass = latest.weight != null && latest.bodyFat != null ? latest.weight * (1 - latest.bodyFat / 100) : null
  // "Start" is the onboarding baseline when we have it, else the first check-in.
  const startWeight = profile?.baselineWeight ?? sorted[0]?.weight ?? null
  const weightDelta = lastLog && startWeight != null ? lastLog.weight - startWeight : null
  const targetBodyFat = profile?.targetBodyFat ?? null

  const canSave = !saving && date <= today &&
    parseFloat(weight) > 0 && parseFloat(waist) > 0 && parseFloat(bodyFat) > 0

  async function saveCheckIn() {
    if (!canSave) return
    setSaving(true)
    setLogsError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('You are signed out — please sign in again.')
      const values = {
        weight_lbs: parseFloat(weight),
        waist_inches: parseFloat(waist),
        body_fat_percent: parseFloat(bodyFat),
      }
      // One check-in per day: update the existing row for this date if there is one.
      const existing = logs.find((l) => l.date === date)
      const { data, error } = existing
        ? await supabase.from('progress_check_ins').update(values).eq('id', existing.id).select().single()
        : await supabase.from('progress_check_ins').insert({ user_id: session.user.id, date, ...values }).select().single()
      if (error) throw new Error(error.message)
      const saved = rowToCheckIn(data)
      setLogs((prev) => prev.filter((l) => l.id !== saved.id).concat(saved))
      setWeight('')
      setWaist('')
      setBodyFat('')

      // The target weight is the same goal shown on Dashboard and Profile,
      // so a change here is saved to the health profile.
      const newTarget = parseFloat(targetWeight)
      if (profile && newTarget > 0 && newTarget !== profile.targetWeight) {
        const { data: updated, error: targetError } = await supabase
          .from('user_health_profiles')
          .update({ target_weight_lbs: newTarget })
          .eq('user_id', session.user.id)
          .select('target_weight_lbs')
        if (targetError || !updated?.length) {
          throw new Error(`check-in saved, but the target weight wasn't: ${targetError?.message ?? 'no permission to update the profile'}`)
        }
        setProfile((p) => (p ? { ...p, targetWeight: newTarget } : p))
      }
    } catch (err) {
      setLogsError(`Couldn't save check-in: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }

  async function updateCheckIn(log: CheckIn) {
    setLogsError('')
    const { data, error } = await supabase
      .from('progress_check_ins')
      .update({
        weight_lbs: parseFloat(editWeight) || log.weight,
        waist_inches: parseFloat(editWaist) || log.waist,
        body_fat_percent: parseFloat(editBodyFat) || log.bodyFat,
      })
      .eq('id', log.id)
      .select()
      .single()
    if (error) { setLogsError(`Couldn't update check-in: ${error.message}`); return }
    const saved = rowToCheckIn(data)
    setLogs((prev) => prev.map((l) => (l.id === saved.id ? saved : l)))
    setEditingLog(null)
  }

  async function deleteCheckIn(log: CheckIn) {
    setLogsError('')
    // Ask for the deleted rows back: when RLS blocks a delete, Postgres deletes
    // zero rows and returns no error, so an empty result means it didn't happen.
    const { data, error } = await supabase
      .from('progress_check_ins')
      .delete()
      .eq('id', log.id)
      .select('id')
    if (error) { setLogsError(`Couldn't delete check-in: ${error.message}`); return }
    if (!data?.length) {
      setLogsError("Couldn't delete check-in: the database didn't allow it (no delete permission for this row).")
      return
    }
    setLogs((prev) => prev.filter((l) => l.id !== log.id))
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar eyebrow="Check-In" title="Progress" />

      <main className="flex-1 overflow-y-auto p-5 lg:p-6 space-y-5">

        {/* Metric summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Weight"
            value={latest.weight != null ? `${latest.weight} lb` : '—'}
            sub={
              weightDelta == null ? (latest.weight != null ? 'From your profile' : 'No check-ins yet')
              : weightDelta === 0 ? 'Starting weight'
              : `${weightDelta > 0 ? '+' : ''}${weightDelta.toFixed(1)} lb since start`
            }
          />
          <StatCard
            label="Waist"
            value={latest.waist != null ? `${latest.waist} in` : '—'}
            sub={lastLog ? 'Latest check-in' : latest.waist != null ? 'From your profile' : 'No check-ins yet'}
          />
          <StatCard
            label="BMI"
            value={bmi != null ? bmi.toFixed(1) : '—'}
            sub={bmi != null ? bmiClass(bmi) : heightInches ? 'Log your weight' : 'Add your height in Profile'}
          />
          <StatCard
            label="Body Fat"
            value={latest.bodyFat != null ? `${latest.bodyFat}%` : '—'}
            sub={leanMass != null ? `${leanMass.toFixed(1)} lb lean mass` : 'No check-ins yet'}
            accent
          />
        </div>

        {/* Log check-in */}
        <Card>
          <CardHeader>
            <div>
              <CardEyebrow>Progress check-in</CardEyebrow>
              <CardTitle>Log Today's Measurements</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="slate">{logs.length} check-in{logs.length !== 1 ? 's' : ''}</Badge>
              {logs.length > 0 && (
                <button
                  onClick={() => setCheckInsOpen(true)}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors"
                >
                  View all
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
              <Input label="Date" type="date" value={date} max={today} onChange={(e) => { if (e.target.value <= today) setDate(e.target.value) }} />
              <Input label="Weight" type="number" step="0.1" min={0} suffix="lb"
                placeholder={latest.weight != null ? String(latest.weight) : ''} value={weight} onChange={(e) => setWeight(e.target.value)} />
              <Input label="Waist" type="number" step="0.1" min={0} suffix="in"
                placeholder={latest.waist != null ? String(latest.waist) : ''} value={waist} onChange={(e) => setWaist(e.target.value)} />
              <Input label="Body Fat" type="number" step="0.1" min={0} suffix="%"
                placeholder={latest.bodyFat != null ? String(latest.bodyFat) : ''} value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} />
              <Input label="Target Weight" type="number" step="0.1" min={0} suffix="lb"
                placeholder="Goal" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} />
              <Button onClick={saveCheckIn} disabled={!canSave} className="h-[42px]">
                {saving ? 'Saving…' : 'Save check-in'}
              </Button>
            </div>
            {logsError && (
              <div className="flex gap-2 p-3 mt-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-xs">{logsError}</p>
              </div>
            )}

          </CardContent>
        </Card>

        {/* Chart + Reminders */}
        <div className="grid lg:grid-cols-[1fr_300px] gap-5">
          <Card>
            <CardHeader>
              <div>
                <CardEyebrow>Timeline</CardEyebrow>
                <CardTitle>Progress Comparison</CardTitle>
              </div>
              <Badge variant="slate">Logged over time</Badge>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Loading check-ins…</div>
              ) : <ProgressChart
                logs={logs}
                heightInches={heightInches}
                targetWeight={targetWeight ? parseFloat(targetWeight) : null}
                targetBodyFat={targetBodyFat}
              />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardEyebrow>Reminders</CardEyebrow>
                <CardTitle>Daily & Weekly</CardTitle>
              </div>
              <Badge variant="green">On</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { key: 'calories',  label: 'Calorie log 2–3×/day' },
                  { key: 'hydration', label: 'Hydration reminders' },
                  { key: 'steps',     label: 'Step goal nudges' },
                  { key: 'weekly',    label: 'Weekly progress check-in' },
                ].map(({ key, label }) => (
                  <label key={key}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input type="checkbox" className="w-4 h-4 accent-teal-600"
                      checked={reminders[key as keyof typeof reminders]}
                      onChange={(e) => setReminders((r) => ({ ...r, [key]: e.target.checked }))} />
                    <span className="text-sm font-medium text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50 p-3 text-xs text-teal-700 font-medium flex items-start gap-2">
                <Scale className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                Connect a smart scale in Devices to auto-sync weight and body composition.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Photo log */}
        <Card>
          <CardHeader>
            <div>
              <CardEyebrow>Visual progress</CardEyebrow>
              <CardTitle>Photo Comparison</CardTitle>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setPhotoHistoryOpen(true)}>
              <History className="w-3.5 h-3.5" />
              History
            </Button>
          </CardHeader>
          <CardContent>
            {uploadOpen ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {PHOTO_ANGLES.map((angle) => (
                    <div
                      key={angle}
                      onClick={() => fileRefs[angle].current?.click()}
                      className={cn(
                        'min-h-[200px] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 relative overflow-hidden cursor-pointer transition-all hover:border-teal-300 hover:bg-teal-50/30 flex items-center justify-center',
                        staged[angle] && 'border-teal-200'
                      )}
                    >
                      <input
                        ref={fileRefs[angle]}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(angle, e)}
                      />
                      {staged[angle] ? (
                        <>
                          <img src={staged[angle]!} alt={angle} className="w-full h-full object-cover absolute inset-0" />
                          <span className="absolute bottom-2 left-2 rounded-full bg-black/60 text-white text-xs font-semibold px-2.5 py-1 capitalize">{angle}</span>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <Camera className="w-6 h-6" />
                          <span className="text-xs font-semibold capitalize">{angle}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  Use consistent lighting, posture, and distance for accurate comparison.
                </p>
                {replacingAngles.length > 0 && (
                  <div className="flex gap-2 p-3 mt-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="text-xs">
                      This will replace your existing <strong>{replacingAngles.join(', ')}</strong> photo{replacingAngles.length > 1 ? 's' : ''} for today.
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between mt-4">
                  <Button variant="secondary" size="sm" onClick={() => { setUploadOpen(false); setStaged({ front: null, back: null, side: null }) }}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={submitPhotos} disabled={stagedCount === 0}>
                    Submit {stagedCount > 0 && `(${stagedCount}/3)`}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8">
                <Camera className="w-8 h-8 text-slate-300" />
                <p className="text-sm text-slate-500">Log progress photos from 3 angles</p>
                <Button onClick={() => setUploadOpen(true)}>
                  <Camera className="w-4 h-4" />
                  Upload Photos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

      </main>

      <Modal open={checkInsOpen} onClose={() => { setCheckInsOpen(false); setEditingLog(null) }} title="All Check-Ins">
        {logsError && (
          <p className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{logsError}</p>
        )}
        {editingLog ? (
          <div className="space-y-4">
            <button
              onClick={() => setEditingLog(null)}
              className="flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-900"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <p className="text-sm font-bold text-slate-800">
              {new Date(editingLog.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Weight" type="number" step="0.1" min={0} suffix="lb" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} />
              <Input label="Waist" type="number" step="0.1" min={0} suffix="in" value={editWaist} onChange={(e) => setEditWaist(e.target.value)} />
              <Input label="Body Fat" type="number" step="0.1" min={0} suffix="%" value={editBodyFat} onChange={(e) => setEditBodyFat(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" size="sm" onClick={() => setEditingLog(null)}>Cancel</Button>
              <Button size="sm" onClick={() => updateCheckIn(editingLog)}>
                Save changes
              </Button>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No check-ins yet</p>
        ) : (
          <div className="space-y-2">
            {[...logs].sort((a, b) => b.date.localeCompare(a.date)).map((log) => {
              const formatted = new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              return (
                <div key={log.id} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3 items-center border border-slate-100 rounded-xl px-4 py-3 bg-white text-sm">
                  <span className="font-semibold text-slate-700">{formatted}</span>
                  <span className="text-slate-500">{log.weight} lb</span>
                  <span className="text-slate-500">{log.waist} in</span>
                  <span className="text-slate-500">{log.bodyFat}% fat</span>
                  <button
                    onClick={() => { setEditingLog(log); setEditWeight(String(log.weight)); setEditWaist(String(log.waist)); setEditBodyFat(String(log.bodyFat)) }}
                    className="text-slate-400 hover:text-teal-600 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteCheckIn(log)}
                    className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none font-bold"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </Modal>

      <Modal open={photoHistoryOpen} onClose={closePhotoHistory} title="Photo History">
        {selectedPhotoEntry ? (
          <div>
            <button
              onClick={() => setSelectedPhotoDate(null)}
              className="flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-900 mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              All dates
            </button>
            <p className="text-sm font-bold text-slate-800 mb-3">{formatPhotoDate(selectedPhotoEntry.date)}</p>
            <div className="grid grid-cols-3 gap-3">
              {PHOTO_ANGLES.map((angle) => (
                <div key={angle} className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                  {selectedPhotoEntry[angle] ? (
                    <div className="relative">
                      <img src={selectedPhotoEntry[angle]!} alt={angle} className="w-full aspect-[3/4] object-cover" />
                      <span className="absolute bottom-2 left-2 rounded-full bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 capitalize">{angle}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center aspect-[3/4] text-slate-300">
                      <Camera className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-semibold capitalize">{angle}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : photoHistory.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No photo logs yet</p>
        ) : (
          <div className="space-y-2">
            {photoHistory.map((entry) => {
              const count = PHOTO_ANGLES.filter((a) => entry[a]).length
              return (
                <button
                  key={entry.date}
                  onClick={() => setSelectedPhotoDate(entry.date)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                >
                  <span className="text-sm font-semibold text-slate-700">{formatPhotoDate(entry.date)}</span>
                  <span className="text-xs text-slate-400 font-medium">{count}/3 photos</span>
                </button>
              )
            })}
          </div>
        )}
      </Modal>
    </div>
  )
}
