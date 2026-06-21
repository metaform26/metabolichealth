'use client'

import { X, AlertTriangle } from 'lucide-react'
import { NumberInput } from '@/components/ui/number-input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { UserProfile, ActivityLevel, GoalType, Symptom, ConditionFocus } from '@/lib/types'

export function getMinBodyFat(sex: 'male' | 'female') { return sex === 'male' ? 8 : 16 }
function getHealthyRange(sex: 'male' | 'female') { return sex === 'male' ? '10–20%' : '18–28%' }
function getAthleticRange(sex: 'male' | 'female') { return sex === 'male' ? '10–15%' : '18–23%' }

export interface SafetyCheck {
  safe: boolean
  minDays: number
  maxDays: number
  warning: string | null
  info: string
}

export function checkTimeline(currentLbs: number, targetLbs: number, currentBf: number, targetBf: number, days: number, goal: GoalType): SafetyCheck {
  if (goal === 'recomposition') {
    const bfDiff = currentBf - targetBf
    if (bfDiff <= 0) return { safe: true, minDays: 0, maxDays: 365, warning: null, info: 'Body recomposition — weight stays stable while body fat decreases' }
    const minWeeks = Math.ceil(bfDiff / 0.5)
    const minDays = minWeeks * 7
    const safe = days >= minDays
    return {
      safe,
      minDays,
      maxDays: minDays * 3,
      warning: safe ? null : `Too aggressive — minimum safe timeline is ${minDays} days (${minWeeks} weeks) for ${bfDiff.toFixed(1)}% BF reduction`,
      info: `Recommended pace: ~0.5% body fat per week`,
    }
  }

  if (goal === 'leanGain') {
    const gain = targetLbs - currentLbs
    if (gain <= 0) return { safe: true, minDays: 0, maxDays: 365, warning: null, info: 'Set a target weight above your current weight for lean gain' }
    const monthlyRate = currentLbs * 0.00375
    const minMonths = gain / (currentLbs * 0.005)
    const maxMonths = gain / (currentLbs * 0.0025)
    const minDays = Math.ceil(minMonths * 30.44)
    const maxDays = Math.ceil(maxMonths * 30.44)
    const actualMonths = days / 30.44
    const actualPerMonth = gain / actualMonths
    const safe = days >= minDays
    return {
      safe,
      minDays,
      maxDays,
      warning: safe ? null : `Too fast — minimum safe timeline is ${minDays} days. Recommended gain: 0.25–0.5% of body weight/month (${(currentLbs * 0.0025).toFixed(1)}–${(currentLbs * 0.005).toFixed(1)} lb/month)`,
      info: `Recommended pace: ${(currentLbs * 0.0025).toFixed(1)}–${(currentLbs * 0.005).toFixed(1)} lb/month`,
    }
  }

  // Fat loss goals
  const loss = currentLbs - targetLbs
  if (loss <= 0) return { safe: true, minDays: 0, maxDays: 365, warning: null, info: 'Set a target weight below your current weight for fat loss' }
  const maxPerWeek = currentLbs * 0.01
  const safePerWeek = currentLbs * 0.0075
  const minWeeks = Math.ceil(loss / maxPerWeek)
  const recommendedWeeks = Math.ceil(loss / safePerWeek)
  const minDays = minWeeks * 7
  const recommendedDays = recommendedWeeks * 7
  const weeks = days / 7
  const actualPerWeek = loss / weeks
  const safe = days >= minDays
  return {
    safe,
    minDays,
    maxDays: recommendedDays * 2,
    warning: safe ? null : `Unsafe — ${actualPerWeek.toFixed(1)} lb/week exceeds 1% of body weight (${maxPerWeek.toFixed(1)} lb/week). Minimum safe timeline: ${minDays} days`,
    info: `Recommended pace: ${(currentLbs * 0.005).toFixed(1)}–${maxPerWeek.toFixed(1)} lb/week (0.5–1.0% body weight)`,
  }
}

interface OnboardingPanelProps {
  profile: UserProfile
  onChange: (p: UserProfile) => void
  onClose?: () => void
}

const GOAL_OPTIONS: { value: GoalType; label: string }[] = [
  { value: 'moderateLoss', label: 'Moderate weight loss' },
  { value: 'mildLoss', label: 'Mild weight loss' },
  { value: 'aggressiveLoss', label: 'Aggressive obesity intervention' },
  { value: 'recomposition', label: 'Fat loss / recomposition' },
  { value: 'leanGain', label: 'Lean mass gain' },
  { value: 'maintenance', label: 'Maintenance' },
]

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary (desk job, no exercise)' },
  { value: 'light', label: 'Light activity (1–3 days/week)' },
  { value: 'moderate', label: 'Moderate (3–5 days/week)' },
  { value: 'heavy', label: 'Heavy training (6–7 days/week)' },
  { value: 'athlete', label: 'Athlete / manual labor' },
]

const FOCUS_OPTIONS: { value: ConditionFocus; label: string }[] = [
  { value: 'weightLoss', label: 'Weight Loss / Obesity' },
  { value: 'diabetes', label: 'Diabetes Management' },
  { value: 'heartFailure', label: 'Heart Failure Management' },
  { value: 'heartRhythm', label: 'Heart Rhythm Management' },
  { value: 'ckd', label: 'CKD Management' },
]

const CONDITION_OPTIONS = [
  'Diabetes',
  'Pre-diabetes',
  'Obstructive sleep apnea',
  'Chronic kidney disease',
  'Irregular heart beats',
  'Coronary artery disease',
  'Heart failure',
]

const SYMPTOM_OPTIONS: { value: Symptom; label: string }[] = [
  { value: 'nausea', label: 'Nausea' },
  { value: 'constipation', label: 'Constipation' },
  { value: 'reflux', label: 'Reflux / heartburn' },
  { value: 'fatigue', label: 'Fatigue' },
  { value: 'poorIntake', label: 'Poor appetite / intake' },
  { value: 'hypoglycemia', label: 'Hypoglycemia risk' },
]

export function OnboardingPanel({ profile, onChange, onClose }: OnboardingPanelProps) {
  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    onChange({ ...profile, [key]: value })
  }

  const toggleFocus = (f: ConditionFocus) => {
    const current = profile.conditionFocus
    update(
      'conditionFocus',
      current.includes(f) ? current.filter((x) => x !== f) : [...current, f]
    )
  }

  const toggleSymptom = (s: Symptom) => {
    const current = profile.symptoms
    update(
      'symptoms',
      current.includes(s) ? current.filter((x) => x !== s) : [...current, s]
    )
  }

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-teal-600">Onboarding</p>
          <h2 className="text-base font-bold text-slate-800 mt-0.5">User Profile</h2>
        </div>
        <div className="flex gap-2">
          {onClose && (
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-xl" onClick={onClose}>
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Basic metrics */}
      <section className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Body Metrics</p>
        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            label="Age"
            min={18}
            max={100}
            value={profile.age}
            onValueChange={(v) => update('age', v)}
          />
          <Select
            label="Sex"
            value={profile.sex}
            onChange={(e) => update('sex', e.target.value as 'male' | 'female')}
            options={[
              { value: 'female', label: 'Female' },
              { value: 'male', label: 'Male' },
            ]}
          />
          <NumberInput
            label="Height"
            min={48}
            max={84}
            suffix="in"
            value={profile.heightInches}
            onValueChange={(v) => update('heightInches', v)}
          />
          <NumberInput
            label="Weight"
            min={80}
            max={600}
            suffix="lbs"
            value={profile.weightLbs}
            onValueChange={(v) => update('weightLbs', v)}
          />
          <NumberInput
            label="Body Fat"
            min={5}
            max={70}
            suffix="%"
            value={profile.bodyFatPercent}
            onValueChange={(v) => update('bodyFatPercent', v)}
          />
          <NumberInput
            label="Waist"
            min={20}
            max={80}
            suffix="in"
            value={profile.waistInches}
            onValueChange={(v) => update('waistInches', v)}
          />
        </div>
      </section>

      {/* Goal & Activity */}
      <section className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Goal & Activity</p>
        <Select
          label="Goal"
          value={profile.goal}
          onChange={(e) => update('goal', e.target.value as GoalType)}
          options={GOAL_OPTIONS}
        />
        <Select
          label="Activity Level"
          value={profile.activityLevel}
          onChange={(e) => update('activityLevel', e.target.value as ActivityLevel)}
          options={ACTIVITY_OPTIONS}
        />
      </section>

      {/* Personalized Targets */}
      <section className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Your Targets</p>
        <p className="text-xs text-slate-500">
          Current: {profile.weightLbs} lb · {profile.bodyFatPercent}% body fat.
          Healthy BF range: {getHealthyRange(profile.sex)} · Athletic: {getAthleticRange(profile.sex)}
        </p>
        <div className="grid grid-cols-3 gap-3">
          <NumberInput
            label="Target Weight"
            suffix="lb"
            min={50}
            max={600}
            value={profile.userGoals.targetWeightLbs ?? profile.weightLbs}
            onValueChange={(v) => update('userGoals', { ...profile.userGoals, targetWeightLbs: v })}
          />
          <NumberInput
            label="Target Body Fat"
            suffix="%"
            min={getMinBodyFat(profile.sex)}
            max={60}
            value={profile.userGoals.targetBodyFatPercent ?? profile.bodyFatPercent}
            onValueChange={(v) => {
              const min = getMinBodyFat(profile.sex)
              update('userGoals', { ...profile.userGoals, targetBodyFatPercent: Math.max(v, min) })
            }}
          />
          <NumberInput
            label="Duration"
            suffix="days"
            min={7}
            max={730}
            value={profile.userGoals.targetDays ?? 90}
            onValueChange={(v) => update('userGoals', { ...profile.userGoals, targetDays: v })}
          />
        </div>
        {profile.userGoals.targetBodyFatPercent !== null && profile.userGoals.targetBodyFatPercent < getMinBodyFat(profile.sex) && (
          <div className="flex gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-xs">Minimum safe target for {profile.sex === 'male' ? 'men' : 'women'} is {getMinBodyFat(profile.sex)}%</p>
          </div>
        )}
        {(() => {
          const tw = profile.userGoals.targetWeightLbs ?? profile.weightLbs
          const tbf = profile.userGoals.targetBodyFatPercent ?? profile.bodyFatPercent
          const days = profile.userGoals.targetDays ?? 90
          if (tw === profile.weightLbs && tbf === profile.bodyFatPercent) return null
          const check = checkTimeline(profile.weightLbs, tw, profile.bodyFatPercent, tbf, days, profile.goal)
          return (
            <div className="space-y-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs text-slate-500 font-medium">
                {check.info}
              </div>
              <div className="rounded-xl border border-teal-100 bg-teal-50 px-3 py-2.5 text-xs text-teal-700 font-medium">
                {days} days ({Math.round(days / 7)} weeks · {Math.round(days / 30.44)} months)
                {tw !== profile.weightLbs && <> · {Math.abs(profile.weightLbs - tw).toFixed(1)} lb {tw < profile.weightLbs ? 'to lose' : 'to gain'}</>}
                {tbf !== profile.bodyFatPercent && <> · {Math.abs(profile.bodyFatPercent - tbf).toFixed(1)}% BF change</>}
              </div>
              {check.warning && (
                <div className="flex gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium">{check.warning}</p>
                </div>
              )}
              {check.safe && check.minDays > 0 && (
                <p className="text-[11px] text-slate-400">Minimum safe duration: {check.minDays} days</p>
              )}
            </div>
          )
        })()}
      </section>

      {/* Condition Focus */}
      <section className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Condition Focus</p>
        <p className="text-xs text-slate-500">Select all that apply — the app will personalize your experience.</p>
        <div className="space-y-2">
          {FOCUS_OPTIONS.map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <input
                type="checkbox"
                className="w-4 h-4 accent-teal-600"
                checked={profile.conditionFocus.includes(value)}
                onChange={() => toggleFocus(value)}
              />
              <span className="text-sm text-slate-700">{label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* GLP-1 toggle */}
      <section className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Medications</p>
        <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
          <input
            type="checkbox"
            className="w-4 h-4 accent-teal-600"
            checked={profile.onGlp1}
            onChange={(e) => update('onGlp1', e.target.checked)}
          />
          <span className="text-sm font-semibold text-slate-700">GLP-1 / Weight-loss medication</span>
        </label>
      </section>

      {/* Symptoms — only relevant when on GLP-1 */}
      {profile.onGlp1 && (
        <section className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Current Symptoms</p>
          <div className="space-y-2">
            {SYMPTOM_OPTIONS.map(({ value, label }) => (
              <label
                key={value}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-teal-600"
                  checked={profile.symptoms.includes(value)}
                  onChange={() => toggleSymptom(value)}
                />
                <span className="text-sm text-slate-700">{label}</span>
              </label>
            ))}
          </div>
        </section>
      )}

      {/* Health conditions */}
      <section className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Health Conditions</p>
        <div className="space-y-2">
          {CONDITION_OPTIONS.map((condition) => (
            <label
              key={condition}
              className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <input
                type="checkbox"
                className="w-4 h-4 accent-teal-600"
                checked={profile.conditions.includes(condition)}
                onChange={() => {
                  const current = profile.conditions
                  update(
                    'conditions',
                    current.includes(condition)
                      ? current.filter((c) => c !== condition)
                      : [...current, condition]
                  )
                }}
              />
              <span className="text-sm text-slate-700">{condition}</span>
            </label>
          ))}
        </div>
      </section>
    </div>
  )
}
