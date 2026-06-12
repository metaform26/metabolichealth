import { useState, useEffect } from 'react'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardHeader, CardTitle, CardEyebrow, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OnboardingPanel } from '@/components/onboarding/onboarding-panel'
import { supabase } from '@/lib/supabase'
import { AlertCircle, CheckCircle } from 'lucide-react'
import type { UserProfile, ActivityLevel, GoalType, Symptom } from '@/lib/types'

const fallbackProfile: UserProfile = {
  age: 35,
  sex: 'female',
  heightInches: 65,
  weightLbs: 160,
  bodyFatPercent: 28,
  waistInches: 34,
  activityLevel: 'sedentary',
  goal: 'moderateLoss',
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
  const [profile, setProfile] = useState<UserProfile>(fallbackProfile)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      setEmail(session.user.email ?? '')
      setFullName((session.user.user_metadata?.full_name as string) ?? '')

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
          onGlp1: data.on_glp1,
          symptoms: (data.symptoms ?? []) as Symptom[],
          conditions: data.conditions ?? [],
        })
      }
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not signed in')

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
          on_glp1: profile.onGlp1,
          symptoms: profile.symptoms,
          conditions: profile.conditions,
        }, { onConflict: 'user_id' })
      if (dbError) throw dbError

      const { error: metaError } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      })
      if (metaError) throw metaError

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
          <Card>
            <CardHeader>
              <div>
                <CardEyebrow>Account</CardEyebrow>
                <CardTitle>Your details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
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
