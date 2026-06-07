
import { useState, useMemo, useRef } from 'react'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardHeader, CardTitle, CardEyebrow, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Camera, Scale, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CheckIn {
  date: string
  weight: number
  waist: number
  bodyFat: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function seedLogs(weight: number, waist: number, bodyFat: number): CheckIn[] {
  const today = new Date()
  return [8, 4, 0].map((weeksAgo) => {
    const d = new Date(today)
    d.setDate(today.getDate() - weeksAgo * 7)
    const f = weeksAgo / 4
    return {
      date: d.toISOString().slice(0, 10),
      weight: Math.round((weight + f * 9) * 10) / 10,
      waist: Math.round((waist + f * 2.8) * 10) / 10,
      bodyFat: Math.round((bodyFat + f * 3.6) * 10) / 10,
    }
  })
}

function bmiClass(bmi: number) {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal'
  if (bmi < 30) return 'Overweight'
  if (bmi < 35) return 'Obesity I'
  if (bmi < 40) return 'Obesity II'
  return 'Obesity III'
}

// ─── SVG Chart ────────────────────────────────────────────────────────────────

function ProgressChart({
  logs,
  heightInches,
  targetWeight,
  targetBodyFat,
}: {
  logs: CheckIn[]
  heightInches: number
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

  const bmis = sorted.map((l) => (l.weight / (heightInches * heightInches)) * 703)
  const allValues = sorted.flatMap((l, i) => [l.weight, l.waist, l.bodyFat, bmis[i]])
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
    { key: 'bmi',    values: bmis,                          color: '#7c3aed' },
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
          { color: '#7c3aed', label: 'BMI' },
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

const HEIGHT_INCHES = 66
const STARTING_WEIGHT = 214
const STARTING_WAIST = 42
const STARTING_BODY_FAT = 42

export default function Progress() {
  const [logs, setLogs] = useState<CheckIn[]>(() =>
    seedLogs(STARTING_WEIGHT, STARTING_WAIST, STARTING_BODY_FAT)
  )

  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [targetWeight, setTargetWeight] = useState('')
  const [targetBodyFat, setTargetBodyFat] = useState('')
  const [beforeSrc, setBeforeSrc] = useState<string | null>(null)
  const [afterSrc, setAfterSrc] = useState<string | null>(null)
  const [reminders, setReminders] = useState({
    calories: true, hydration: true, steps: true, weekly: true,
  })

  const beforeRef = useRef<HTMLInputElement>(null)
  const afterRef = useRef<HTMLInputElement>(null)

  const sorted = useMemo(
    () => [...logs].sort((a, b) => a.date.localeCompare(b.date)),
    [logs]
  )
  const latest = sorted[sorted.length - 1] ?? {
    weight: STARTING_WEIGHT, waist: STARTING_WAIST, bodyFat: STARTING_BODY_FAT,
  }
  const first = sorted[0]
  const bmi = (latest.weight / (HEIGHT_INCHES * HEIGHT_INCHES)) * 703
  const leanMass = latest.weight * (1 - latest.bodyFat / 100)
  const weightDelta = first ? latest.weight - first.weight : 0
  const fatDelta = first ? latest.bodyFat - first.bodyFat : 0

  function saveCheckIn() {
    const w = parseFloat(weight) || STARTING_WEIGHT
    const wt = parseFloat(waist) || STARTING_WAIST
    const bf = parseFloat(bodyFat) || STARTING_BODY_FAT
    setLogs((prev) => prev.filter((l) => l.date !== date).concat({ date, weight: w, waist: wt, bodyFat: bf }))
    setWeight('')
    setWaist('')
    setBodyFat('')
  }

  function loadPhoto(e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) {
    const file = e.target.files?.[0]
    if (!file) return
    setter(URL.createObjectURL(file))
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar eyebrow="Check-In" title="Progress" />

      <main className="flex-1 overflow-y-auto p-5 lg:p-6 space-y-5">

        {/* Metric summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Weight"
            value={`${latest.weight} lb`}
            sub={weightDelta !== 0 ? `${weightDelta > 0 ? '+' : ''}${weightDelta.toFixed(1)} lb since start` : 'Starting weight'}
          />
          <StatCard label="Waist" value={`${latest.waist} in`} sub="Latest check-in" />
          <StatCard label="BMI" value={bmi.toFixed(1)} sub={bmiClass(bmi)} />
          <StatCard label="Body Fat" value={`${latest.bodyFat}%`} sub={`${leanMass.toFixed(1)} lb lean mass`} accent />
        </div>

        {/* Log check-in */}
        <Card>
          <CardHeader>
            <div>
              <CardEyebrow>Progress check-in</CardEyebrow>
              <CardTitle>Log Today's Measurements</CardTitle>
            </div>
            <Badge variant="slate">{logs.length} check-in{logs.length !== 1 ? 's' : ''}</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
              <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <Input label="Weight" type="number" step="0.1" min={0} suffix="lb"
                placeholder={String(STARTING_WEIGHT)} value={weight} onChange={(e) => setWeight(e.target.value)} />
              <Input label="Waist" type="number" step="0.1" min={0} suffix="in"
                placeholder={String(STARTING_WAIST)} value={waist} onChange={(e) => setWaist(e.target.value)} />
              <Input label="Body Fat" type="number" step="0.1" min={0} suffix="%"
                placeholder={String(STARTING_BODY_FAT)} value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} />
              <Input label="Target Weight" type="number" step="0.1" min={0} suffix="lb"
                placeholder="Goal" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} />
              <Button onClick={saveCheckIn} className="h-[42px]">Save check-in</Button>
            </div>

            {logs.length > 0 && (
              <div className="mt-4 space-y-2">
                {[...logs].sort((a, b) => b.date.localeCompare(a.date)).map((log) => (
                  <CheckInRow
                    key={log.date}
                    log={log}
                    onDelete={() => setLogs((prev) => prev.filter((l) => l.date !== log.date))}
                  />
                ))}
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
              <ProgressChart
                logs={logs}
                heightInches={HEIGHT_INCHES}
                targetWeight={targetWeight ? parseFloat(targetWeight) : null}
                targetBodyFat={targetBodyFat ? parseFloat(targetBodyFat) : null}
              />
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

        {/* Photo comparison */}
        <Card>
          <CardHeader>
            <div>
              <CardEyebrow>Visual progress</CardEyebrow>
              <CardTitle>Photo Comparison</CardTitle>
            </div>
            <Badge variant="slate">Self upload</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-[1fr_1fr_260px] gap-4">
              {/* Before */}
              <div onClick={() => beforeRef.current?.click()}
                className={cn(
                  'min-h-[240px] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 relative overflow-hidden cursor-pointer transition-all hover:border-teal-300 hover:bg-teal-50/30 flex items-center justify-center',
                  beforeSrc && 'border-teal-200'
                )}>
                <input ref={beforeRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => loadPhoto(e, setBeforeSrc)} />
                {beforeSrc ? (
                  <>
                    <img src={beforeSrc} alt="Before" className="w-full h-full object-cover absolute inset-0" />
                    <span className="absolute bottom-2 left-2 rounded-full bg-black/60 text-white text-xs font-semibold px-2.5 py-1">Before</span>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Camera className="w-7 h-7" />
                    <span className="text-sm font-medium">Upload before photo</span>
                  </div>
                )}
              </div>

              {/* After */}
              <div onClick={() => afterRef.current?.click()}
                className={cn(
                  'min-h-[240px] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 relative overflow-hidden cursor-pointer transition-all hover:border-teal-300 hover:bg-teal-50/30 flex items-center justify-center',
                  afterSrc && 'border-teal-200'
                )}>
                <input ref={afterRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => loadPhoto(e, setAfterSrc)} />
                {afterSrc ? (
                  <>
                    <img src={afterSrc} alt="Current" className="w-full h-full object-cover absolute inset-0" />
                    <span className="absolute bottom-2 left-2 rounded-full bg-black/60 text-white text-xs font-semibold px-2.5 py-1">Current</span>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Camera className="w-7 h-7" />
                    <span className="text-sm font-medium">Upload current photo</span>
                  </div>
                )}
              </div>

              {/* Summary panel */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 flex flex-col gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">Summary</p>
                  <p className="font-semibold text-slate-800 text-sm leading-snug">
                    {beforeSrc && afterSrc
                      ? 'Progress comparison ready'
                      : beforeSrc || afterSrc
                      ? 'Add the second photo to compare'
                      : 'Add two photos to compare progress'}
                  </p>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Use consistent lighting, posture, and distance for accurate comparison.
                  </p>
                </div>
                <div className="space-y-2 mt-auto">
                  {weightDelta !== 0 && (
                    <div className="flex items-center gap-2 rounded-xl bg-teal-50 border border-teal-100 px-3 py-2">
                      <TrendingDown className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="text-xs font-semibold text-teal-700">
                        {Math.abs(weightDelta).toFixed(1)} lb {weightDelta < 0 ? 'lost' : 'gained'}
                      </span>
                    </div>
                  )}
                  {fatDelta !== 0 && (
                    <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2">
                      <TrendingDown className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="text-xs font-semibold text-rose-600">
                        {Math.abs(fatDelta).toFixed(1)}% body fat {fatDelta < 0 ? 'lost' : 'gained'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  )
}
