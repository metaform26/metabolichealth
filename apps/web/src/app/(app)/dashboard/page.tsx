'use client'

import { useState, useMemo } from 'react'
import { Topbar } from '@/components/layout/topbar'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardHeader, CardTitle, CardEyebrow, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertItem } from '@/components/ui/alert-item'
import { OnboardingPanel } from '@/components/onboarding/onboarding-panel'
import { MacroBars } from '@/components/dashboard/macro-bars'
import { PlanBlocks } from '@/components/dashboard/plan-blocks'
import { calculatePrescription } from '@health/core'
import type { UserProfile, MetabolicPrescription } from '@health/core'

const defaultProfile: UserProfile = {
  age: 46,
  sex: 'female',
  heightInches: 66,
  weightLbs: 214,
  bodyFatPercent: 42,
  waistInches: 42,
  activityLevel: 'sedentary',
  goal: 'moderateLoss',
  onGlp1: true,
  symptoms: ['nausea', 'poorIntake'],
  conditions: ['Prediabetes', 'Hypertension'],
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const [showOnboarding, setShowOnboarding] = useState(true)

  const rx: MetabolicPrescription = useMemo(() => calculatePrescription(profile), [profile])

  const bmiVariant =
    rx.bmi >= 35 ? 'red' : rx.bmi >= 30 ? 'amber' : rx.bmi >= 25 ? 'amber' : 'green'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar eyebrow="Metabolic Goals" title="Your Prescription" />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Onboarding sidebar — independently scrollable */}
        {showOnboarding && (
          <aside className="w-full lg:w-80 xl:w-96 shrink-0 border-r border-slate-100 bg-white overflow-y-auto">
            <OnboardingPanel
              profile={profile}
              onChange={setProfile}
              onClose={() => setShowOnboarding(false)}
            />
          </aside>
        )}

        {/* Main content — independently scrollable */}
        <main className="flex-1 min-w-0 p-5 lg:p-6 space-y-5 overflow-y-auto">
          {/* Top stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="BMR" value={`${rx.bmr.toLocaleString()} kcal`} sub="Harris-Benedict estimate" />
            <StatCard label="TDEE" value={`${rx.tdee.toLocaleString()} kcal`} sub="Activity adjusted" />
            <StatCard label="Daily Calories" value={`${rx.targetCalories.toLocaleString()} kcal`} sub="Goal adjusted" accent />
            <StatCard label="Protein Target" value={`${rx.proteinGrams}g`} sub={`${rx.proteinPerKg}g/kg · goal adjusted`} />
          </div>

          {/* Body assessment */}
          <Card>
            <CardHeader>
              <div>
                <CardEyebrow>Current metabolic parameters</CardEyebrow>
                <CardTitle>Body Assessment</CardTitle>
              </div>
              <Badge variant="slate">{rx.obesityClass}</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'BMI', value: rx.bmi.toFixed(1), sub: rx.bmiClass },
                  { label: 'Body Fat', value: `${profile.bodyFatPercent}%`, sub: rx.bodyFatClass },
                  { label: 'Lean Mass', value: `${rx.leanMassLbs.toFixed(1)} lbs`, sub: `${rx.leanMassKg} kg` },
                  { label: 'Weight', value: `${profile.weightLbs} lbs`, sub: `${rx.weightKg} kg` },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">{label}</p>
                    <p className="text-xl font-bold text-slate-900 leading-none">{value}</p>
                    <p className="text-xs text-slate-400 font-medium mt-1.5">{sub}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Macros + Alerts */}
          <div className="grid sm:grid-cols-2 gap-5">
            <Card>
              <CardHeader>
                <CardTitle>Macro Plan</CardTitle>
                <Badge variant="teal">{rx.dietPattern.replace(/([A-Z])/g, ' $1').trim()}</Badge>
              </CardHeader>
              <CardContent>
                <MacroBars
                  protein={rx.proteinGrams}
                  carbs={rx.carbGrams}
                  fat={rx.fatGrams}
                  calories={rx.targetCalories}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Clinical Alerts</CardTitle>
                <Badge variant={rx.alerts.length > 0 ? 'red' : 'green'}>
                  {rx.alerts.length > 0 ? `${rx.alerts.length} active` : 'All clear'}
                </Badge>
              </CardHeader>
              <CardContent>
                {rx.alerts.length === 0 ? (
                  <p className="text-sm text-slate-400">No alerts for current profile.</p>
                ) : (
                  <div className="space-y-2">
                    {rx.alerts.map((alert, i) => (
                      <AlertItem key={i} alert={alert} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Plan blocks */}
          <PlanBlocks rx={rx} onGlp1={profile.onGlp1} />
        </main>
      </div>
    </div>
  )
}
