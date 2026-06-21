import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, ChevronRight, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { NumberInput } from '@/components/ui/number-input'
import { checkTimeline, getMinBodyFat } from '@/components/onboarding/onboarding-panel'
import type { UserProfile, ActivityLevel, GoalType, Symptom } from '@/lib/types'

const defaultProfile: UserProfile = {
  age: 35,
  sex: 'female',
  heightInches: 65,
  weightLbs: 160,
  bodyFatPercent: 28,
  waistInches: 34,
  activityLevel: 'sedentary',
  goal: 'moderateLoss',
  userGoals: { targetWeightLbs: null, targetBodyFatPercent: null, targetDays: null },
  conditionFocus: [],
  onGlp1: false,
  symptoms: [],
  conditions: [],
}

const GOAL_OPTIONS: { value: GoalType; label: string; desc: string }[] = [
  { value: 'moderateLoss',   label: 'Moderate weight loss',           desc: '~500 kcal deficit/day' },
  { value: 'mildLoss',       label: 'Mild weight loss',               desc: '~300 kcal deficit/day' },
  { value: 'aggressiveLoss', label: 'Aggressive obesity intervention', desc: '~700 kcal deficit/day' },
  { value: 'recomposition',  label: 'Fat loss / recomposition',       desc: 'Build muscle, lose fat' },
  { value: 'leanGain',       label: 'Lean mass gain',                 desc: '~200 kcal surplus/day' },
  { value: 'maintenance',    label: 'Maintenance',                    desc: 'Hold current weight' },
]

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary — desk job, little or no exercise' },
  { value: 'light',     label: 'Light — exercise 1–3 days/week' },
  { value: 'moderate',  label: 'Moderate — exercise 3–5 days/week' },
  { value: 'heavy',     label: 'Heavy — hard training 6–7 days/week' },
  { value: 'athlete',   label: 'Athlete — twice daily or manual labor' },
]

const SYMPTOM_OPTIONS: { value: Symptom; label: string }[] = [
  { value: 'nausea',       label: 'Nausea' },
  { value: 'constipation', label: 'Constipation' },
  { value: 'reflux',       label: 'Reflux / heartburn' },
  { value: 'fatigue',      label: 'Fatigue' },
  { value: 'poorIntake',   label: 'Poor appetite / intake' },
  { value: 'hypoglycemia', label: 'Hypoglycemia risk' },
]

const STEPS = ['Basics', 'Body', 'Goals', 'Health', 'Review']

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white'
const selectCls = inputCls

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }))
  }

  function toggleSymptom(s: Symptom) {
    const current = profile.symptoms
    update('symptoms', current.includes(s) ? current.filter((x) => x !== s) : [...current, s])
  }

  async function handleFinish() {
    setSaving(true)
    setError(null)

    const minBf = getMinBodyFat(profile.sex)
    if (profile.userGoals.targetBodyFatPercent !== null && profile.userGoals.targetBodyFatPercent < minBf) {
      setError(`Target body fat ${profile.userGoals.targetBodyFatPercent}% is below the safe minimum of ${minBf}% for ${profile.sex === 'male' ? 'men' : 'women'}.`)
      setSaving(false)
      return
    }

    const tw = profile.userGoals.targetWeightLbs ?? profile.weightLbs
    const tbf = profile.userGoals.targetBodyFatPercent ?? profile.bodyFatPercent
    const days = profile.userGoals.targetDays ?? 90
    if (tw !== profile.weightLbs || tbf !== profile.bodyFatPercent) {
      const check = checkTimeline(profile.weightLbs, tw, profile.bodyFatPercent, tbf, days, profile.goal)
      if (!check.safe) {
        setError(`Unsafe timeline: ${check.warning} Please increase the duration to at least ${check.minDays} days.`)
        setSaving(false)
        return
      }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not signed in')

      // Save health profile to DB
      const { error: dbError } = await supabase
        .from('user_health_profiles')
        .upsert({
          user_id: session.user.id,
          age: profile.age,
          sex: profile.sex,
          height_inches: profile.heightInches,
          weight_lbs: profile.weightLbs,
          body_fat_percent: profile.bodyFatPercent,
          waist_inches: profile.waistInches,
          activity_level: profile.activityLevel,
          goal: profile.goal,
          target_weight_lbs: profile.userGoals.targetWeightLbs,
          target_body_fat_percent: profile.userGoals.targetBodyFatPercent,
          target_days: profile.userGoals.targetDays,
          baseline_weight_lbs: profile.weightLbs,
          baseline_body_fat_percent: profile.bodyFatPercent,
          baseline_waist_inches: profile.waistInches,
          baseline_bmi: (profile.weightLbs / (profile.heightInches * profile.heightInches)) * 703,
          baseline_lean_mass_lbs: profile.weightLbs * (1 - profile.bodyFatPercent / 100),
          baseline_date: new Date().toISOString().slice(0, 10),
          condition_focus: profile.conditionFocus,
          on_glp1: profile.onGlp1,
          symptoms: profile.symptoms,
          conditions: profile.conditions,
        }, { onConflict: 'user_id' })

      if (dbError) throw dbError

      // Mark onboarding complete in user metadata
      const { error: metaError } = await supabase.auth.updateUser({
        data: { onboarded: true, full_name: fullName },
      })
      if (metaError) throw metaError

      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message :
        (err as { message?: string })?.message ?? JSON.stringify(err)
      setError(msg)
      setSaving(false)
    }
  }

  const canNext = (() => {
    if (step === 0) return fullName.trim().length > 0
    if (step === 1) return profile.age >= 18 && profile.weightLbs >= 80 && profile.heightInches >= 48
    return true
  })()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-teal-700 flex items-center justify-center mb-3 shadow-lg shadow-teal-200">
            <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Set up your profile</h1>
          <p className="text-sm text-slate-500 mt-1">This takes about 2 minutes — required to personalize your plan</p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1 mb-6">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-1.5 w-full rounded-full transition-all ${i <= step ? 'bg-teal-600' : 'bg-slate-200'}`} />
              <span className={`text-[10px] font-semibold ${i === step ? 'text-teal-700' : 'text-slate-400'}`}>{label}</span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 p-7">

          {/* Step 0 — Basics */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">Step 1</p>
                <h2 className="text-lg font-bold text-slate-900">What's your name?</h2>
                <p className="text-sm text-slate-500 mt-1">We'll use this to personalize your experience.</p>
              </div>
              <Field label="Full name">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ava Morgan"
                  autoFocus
                  className={inputCls}
                />
              </Field>
              <Field label="Biological sex (affects metabolic calculations)">
                <div className="grid grid-cols-2 gap-3">
                  {(['female', 'male'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => update('sex', s)}
                      className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                        profile.sex === s
                          ? 'bg-teal-50 border-teal-300 text-teal-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {s === 'female' ? '♀ Female' : '♂ Male'}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Age">
                <NumberInput min={18} max={100} value={profile.age}
                  onValueChange={(v) => update('age', v)} className={inputCls} />
              </Field>
            </div>
          )}

          {/* Step 1 — Body */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">Step 2</p>
                <h2 className="text-lg font-bold text-slate-900">Body measurements</h2>
                <p className="text-sm text-slate-500 mt-1">Used to calculate your BMR, TDEE, and protein targets.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Height (inches)">
                  <NumberInput min={48} max={84} value={profile.heightInches}
                    onValueChange={(v) => update('heightInches', v)} className={inputCls} />
                </Field>
                <Field label="Weight (lbs)">
                  <NumberInput min={80} max={600} value={profile.weightLbs}
                    onValueChange={(v) => update('weightLbs', v)} className={inputCls} />
                </Field>
                <Field label="Body fat % (estimate)">
                  <NumberInput min={5} max={70} value={profile.bodyFatPercent}
                    onValueChange={(v) => update('bodyFatPercent', v)} className={inputCls} />
                </Field>
                <Field label="Waist (inches)">
                  <NumberInput min={20} max={80} value={profile.waistInches}
                    onValueChange={(v) => update('waistInches', v)} className={inputCls} />
                </Field>
              </div>
              <p className="text-xs text-slate-400">Don't know your body fat? A rough estimate is fine — you can update this later.</p>
            </div>
          )}

          {/* Step 2 — Goals */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">Step 3</p>
                <h2 className="text-lg font-bold text-slate-900">Your goal & activity</h2>
              </div>
              <Field label="Primary goal">
                <div className="space-y-2">
                  {GOAL_OPTIONS.map(({ value, label, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => update('goal', value)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                        profile.goal === value
                          ? 'bg-teal-50 border-teal-300 text-teal-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-sm font-semibold">{label}</span>
                      <span className="text-xs text-slate-400 ml-2 shrink-0">{desc}</span>
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Activity level">
                <select value={profile.activityLevel}
                  onChange={(e) => update('activityLevel', e.target.value as ActivityLevel)}
                  className={selectCls}>
                  {ACTIVITY_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          {/* Step 3 — Health */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">Step 4</p>
                <h2 className="text-lg font-bold text-slate-900">Health & medications</h2>
                <p className="text-sm text-slate-500 mt-1">Helps us flag clinical alerts and tailor your plan.</p>
              </div>
              <Field label="Are you on a GLP-1 / weight-loss medication?">
                <div className="grid grid-cols-2 gap-3">
                  {[true, false].map((v) => (
                    <button key={String(v)} type="button" onClick={() => {
                        update('onGlp1', v)
                        if (!v) update('symptoms', [])
                      }}
                      className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                        profile.onGlp1 === v
                          ? 'bg-teal-50 border-teal-300 text-teal-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {v ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </Field>
              {profile.onGlp1 && (
                <Field label="Current symptoms (select all that apply)">
                  <div className="space-y-2">
                    {SYMPTOM_OPTIONS.map(({ value, label }) => (
                      <label key={value}
                        className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                        <input type="checkbox" className="w-4 h-4 accent-teal-600"
                          checked={profile.symptoms.includes(value)}
                          onChange={() => toggleSymptom(value)} />
                        <span className="text-sm text-slate-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </Field>
              )}
              <Field label="Health conditions (optional)">
                <textarea
                  rows={2}
                  placeholder="e.g. Prediabetes, Hypertension, Sleep apnea"
                  value={profile.conditions.join(', ')}
                  onChange={(e) => update('conditions', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                  className={`${inputCls} resize-none`}
                />
              </Field>
            </div>
          )}

          {/* Step 4 — Review */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">Step 5</p>
                <h2 className="text-lg font-bold text-slate-900">Review your profile</h2>
                <p className="text-sm text-slate-500 mt-1">You can always update this later from the dashboard.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  { label: 'Name',         value: fullName || '—' },
                  { label: 'Sex / Age',    value: `${profile.sex} · ${profile.age} yrs` },
                  { label: 'Height',       value: `${profile.heightInches} in` },
                  { label: 'Weight',       value: `${profile.weightLbs} lbs` },
                  { label: 'Body fat',     value: `${profile.bodyFatPercent}%` },
                  { label: 'Waist',        value: `${profile.waistInches} in` },
                  { label: 'Goal',         value: GOAL_OPTIONS.find((g) => g.value === profile.goal)?.label ?? profile.goal },
                  { label: 'Activity',     value: ACTIVITY_OPTIONS.find((a) => a.value === profile.activityLevel)?.label.split('—')[0].trim() ?? profile.activityLevel },
                  { label: 'GLP-1',        value: profile.onGlp1 ? 'Yes' : 'No' },
                  { label: 'Symptoms',     value: profile.symptoms.length > 0 ? profile.symptoms.join(', ') : 'None' },
                  { label: 'Conditions',   value: profile.conditions.length > 0 ? profile.conditions.join(', ') : 'None' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                    <p className="text-xs text-slate-400 font-medium">{label}</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
                  </div>
                ))}
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700">{error}</div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-7">
            {step > 0 ? (
              <button type="button" onClick={() => setStep((s) => s - 1)}
                className="text-sm font-semibold text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext}
                className="flex items-center gap-2 bg-teal-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-teal-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-teal-100"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={saving}
                className="flex items-center gap-2 bg-teal-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-teal-800 transition-all disabled:opacity-60 shadow-md shadow-teal-100"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                ) : (
                  <>Go to dashboard <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          Your data is encrypted and never sold.
        </p>
      </div>
    </div>
  )
}
