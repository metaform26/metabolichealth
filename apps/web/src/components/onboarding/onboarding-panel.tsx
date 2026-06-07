'use client'

import { X, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { UserProfile, ActivityLevel, GoalType, Symptom } from '@/lib/types'

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

  function resetProfile() {
    onChange({
      age: 40,
      sex: 'female',
      heightInches: 65,
      weightLbs: 180,
      bodyFatPercent: 30,
      waistInches: 36,
      activityLevel: 'sedentary',
      goal: 'moderateLoss',
      onGlp1: false,
      symptoms: [],
      conditions: [],
    })
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
          <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-xl" onClick={resetProfile} title="Reset">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
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
          <Input
            label="Age"
            type="number"
            min={18}
            max={100}
            value={profile.age}
            onChange={(e) => update('age', +e.target.value)}
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
          <Input
            label="Height"
            type="number"
            min={48}
            max={84}
            suffix="in"
            value={profile.heightInches}
            onChange={(e) => update('heightInches', +e.target.value)}
          />
          <Input
            label="Weight"
            type="number"
            min={80}
            max={600}
            suffix="lbs"
            value={profile.weightLbs}
            onChange={(e) => update('weightLbs', +e.target.value)}
          />
          <Input
            label="Body Fat"
            type="number"
            min={5}
            max={70}
            suffix="%"
            value={profile.bodyFatPercent}
            onChange={(e) => update('bodyFatPercent', +e.target.value)}
          />
          <Input
            label="Waist"
            type="number"
            min={20}
            max={80}
            suffix="in"
            value={profile.waistInches}
            onChange={(e) => update('waistInches', +e.target.value)}
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

      {/* Symptoms */}
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

      {/* Health conditions */}
      <section className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Health Conditions</p>
        <textarea
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          rows={3}
          placeholder="e.g. Prediabetes, Hypertension, Sleep apnea"
          value={profile.conditions.join(', ')}
          onChange={(e) =>
            update(
              'conditions',
              e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
            )
          }
        />
      </section>
    </div>
  )
}
