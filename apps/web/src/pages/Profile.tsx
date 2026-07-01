import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardHeader, CardTitle, CardEyebrow, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OnboardingPanel } from '@/components/onboarding/onboarding-panel'
import { supabase } from '@/lib/supabase'
import { AlertCircle, CheckCircle, Camera, ChevronLeft, AlertTriangle } from 'lucide-react'
import { checkTimeline, getMinBodyFat } from '@/components/onboarding/onboarding-panel'
import type { UserProfile, ActivityLevel, GoalType, Symptom, ConditionFocus } from '@/lib/types'

const fallbackProfile: UserProfile = {
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

const inputCls = 'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile>(fallbackProfile)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      setEmail(session.user.email ?? '')
      setFullName((session.user.user_metadata?.full_name as string) ?? '')
      setAvatarUrl((session.user.user_metadata?.avatar_url as string) ?? null)

      const { data } = await supabase
        .from('user_health_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (data) {
        setProfile({
          age: data.age,
          sex: data.sex as 'male' | 'female',
          heightInches: data.height_inches,
          weightLbs: data.weight_lbs,
          bodyFatPercent: data.body_fat_percent ?? 28,
          waistInches: data.waist_inches ?? 34,
          activityLevel: data.activity_level as ActivityLevel,
          goal: data.goal as GoalType,
          userGoals: {
            targetWeightLbs: data.target_weight_lbs ?? null,
            targetBodyFatPercent: data.target_body_fat_percent ?? null,
            targetDays: data.target_days ?? null,
          },
          conditionFocus: (data.condition_focus ?? []) as ConditionFocus[],
          onGlp1: data.on_glp1,
          symptoms: (data.symptoms ?? []) as Symptom[],
          conditions: data.conditions ?? [],
        })
      }
    })
  }, [])

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const size = 256
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const scale = Math.max(size / img.width, size / img.height)
        const w = img.width * scale
        const h = img.height * scale
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
        setAvatarUrl(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)

    // Body fat minimum check
    const minBf = getMinBodyFat(profile.sex)
    if (profile.userGoals.targetBodyFatPercent !== null && profile.userGoals.targetBodyFatPercent < minBf) {
      setError(`Target body fat ${profile.userGoals.targetBodyFatPercent}% is below the safe minimum of ${minBf}% for ${profile.sex === 'male' ? 'men' : 'women'}. Please set a higher target.`)
      setSaving(false)
      return
    }

    // Timeline safety check
    const tw = profile.userGoals.targetWeightLbs ?? profile.weightLbs
    const tbf = profile.userGoals.targetBodyFatPercent ?? profile.bodyFatPercent
    const days = profile.userGoals.targetDays ?? 90
    if (tw !== profile.weightLbs || tbf !== profile.bodyFatPercent) {
      const check = checkTimeline(profile.weightLbs, tw, profile.bodyFatPercent, tbf, days, profile.goal)
      if (!check.safe) {
        setError(`Unsafe timeline: ${check.warning} Please increase the duration to at least ${check.minDays} days (${Math.round(check.minDays / 7)} weeks).`)
        setSaving(false)
        return
      }
    }

    try {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError || !refreshData.session) {
        await supabase.auth.signOut()
        throw new Error('Your session has expired. You have been signed out — please log back in.')
      }
      const session = refreshData.session

      const payload = {
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
        condition_focus: profile.conditionFocus,
        on_glp1: profile.onGlp1,
        symptoms: profile.symptoms,
        conditions: profile.conditions,
      }

      // Check whether a row already exists for this user
      const { data: existing } = await supabase
        .from('user_health_profiles')
        .select('user_id')
        .eq('user_id', session.user.id)
        .maybeSingle()

      const { error: dbError } = existing
        ? await supabase.from('user_health_profiles').update(payload).eq('user_id', session.user.id)
        : await supabase.from('user_health_profiles').insert({ user_id: session.user.id, ...payload })

      if (dbError) throw new Error(`DB: ${dbError.message ?? JSON.stringify(dbError)} | uid=${session.user.id} | op=${existing ? 'UPDATE' : 'INSERT'}`)

      const { error: metaError } = await supabase.auth.updateUser({
        data: { full_name: fullName, avatar_url: avatarUrl },
      })
      if (metaError) throw new Error(`Auth: ${metaError.message ?? JSON.stringify(metaError)}`)

      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar eyebrow="Account" title="Profile" />

      <main className="flex-1 min-w-0 p-5 lg:p-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-5">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Goals
          </button>

          <Card>
            <CardHeader>
              <div>
                <CardEyebrow>Account</CardEyebrow>
                <CardTitle>Your details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-20 h-20 rounded-full bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-teal-300 hover:bg-teal-50/30 transition-all overflow-hidden shrink-0 relative"
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-slate-700">{avatarUrl ? 'Change photo' : 'Upload photo'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Click to upload a profile picture</p>
                </div>
              </div>
              <Field label="Full name">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  disabled
                  className={`${inputCls} opacity-60 cursor-not-allowed`}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <OnboardingPanel profile={profile} onChange={setProfile} />
          </Card>

          {error && (
            <div className="flex gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex gap-2 p-3 bg-green-50 border border-green-100 rounded-xl text-green-700">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs">Profile updated.</p>
            </div>
          )}

          <div className="flex justify-end pb-2">
            <Button onClick={handleSave} loading={saving}>Save changes</Button>
          </div>
        </div>
      </main>
    </div>
  )
}
