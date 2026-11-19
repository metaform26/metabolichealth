
import { useState } from 'react'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardHeader, CardTitle, CardEyebrow, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { Watch } from 'lucide-react'
import { useIsAdmin } from '@/lib/use-is-admin'

interface Integration {
  id: string
  icon: string
  name: string
  description: string
  connected: boolean
  color: string
}

const INITIAL_INTEGRATIONS: Integration[] = [
  {
    id: 'healthkit',
    icon: 'H',
    name: 'Apple HealthKit',
    description: 'Steps, sleep, heart rate, workouts, active calories, and hydration.',
    connected: false,
    color: 'bg-rose-500',
  },
  {
    id: 'fitbit',
    icon: 'F',
    name: 'Fitbit',
    description: 'Wearable steps, sleep, heart rate, exercise sessions, and calories burned.',
    connected: false,
    color: 'bg-teal-500',
  },
  {
    id: 'scale',
    icon: 'S',
    name: 'Smart Scale',
    description: 'Weight, body fat percentage, lean mass, and trend history.',
    connected: false,
    color: 'bg-violet-500',
  },
  {
    id: 'cgm',
    icon: 'G',
    name: 'CGM Device',
    description: 'Glucose trends for diabetes, prediabetes, insulin resistance, or GLP-1 care.',
    connected: false,
    color: 'bg-amber-500',
  },
  {
    id: 'wearables',
    icon: 'W',
    name: 'Other Wearables',
    description: 'Garmin, Oura, Whoop, Samsung Health, and compatible activity trackers.',
    connected: false,
    color: 'bg-blue-500',
  },
]

const EMPTY_METRICS = {
  steps: '—',
  sleep: '—',
  heartRate: '—',
  exerciseCalories: '—',
  weight: '—',
  glucose: '—',
}

// The Devices page is still being built, so only admins can preview it.
// (It used to be behind a password written into the page code, which anyone
// could read in the JavaScript bundle.)
export default function Devices() {
  const isAdmin = useIsAdmin()

  if (isAdmin === null) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Topbar eyebrow="API & Device Integration" title="Connected Devices" />
        <div className="flex flex-1 items-center justify-center bg-slate-50 p-6">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
              <Watch className="h-5 w-5 text-teal-700" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Devices are coming soon</h2>
            <p className="mt-1 text-sm text-slate-500">
              Connecting wearables and smart scales is still being built. Check back soon.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <DevicesContent />
}

function DevicesContent() {
  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_INTEGRATIONS)

  const connectedCount = integrations.filter((i) => i.connected).length

  function toggleConnection(id: string) {
    setIntegrations((prev) => prev.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i)))
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar eyebrow="API & Device Integration" title="Connected Devices" />

      <main className="flex-1 overflow-y-auto p-5 lg:p-6 space-y-6">

        {/* Live Metrics */}
        <section>
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Live device data</p>
            <h2 className="text-lg font-bold text-slate-900">Today&apos;s Metrics</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Steps" value={EMPTY_METRICS.steps} sub="Today" />
            <StatCard label="Sleep" value={EMPTY_METRICS.sleep} sub="Last night" />
            <StatCard label="Heart Rate" value={EMPTY_METRICS.heartRate} sub="Resting avg" />
            <StatCard label="Exercise Cal." value={EMPTY_METRICS.exerciseCalories} sub="Active burn" accent />
            <StatCard label="Weight" value={EMPTY_METRICS.weight} sub="Smart scale" />
            <StatCard label="Glucose" value={EMPTY_METRICS.glucose} sub="CGM reading" />
          </div>
        </section>

        {/* Integrations */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Device management</p>
              <h2 className="text-lg font-bold text-slate-900">Integrations</h2>
            </div>
            <Badge variant={connectedCount > 0 ? 'teal' : 'slate'}>
              {connectedCount} connected
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {integrations.map((integration) => (
              <Card key={integration.id}>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl ${integration.color} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
                      {integration.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-slate-900 text-sm">{integration.name}</h3>
                        {integration.connected && (
                          <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{integration.description}</p>
                    </div>
                    <button
                      onClick={() => toggleConnection(integration.id)}
                      className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                        integration.connected
                          ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                          : 'bg-teal-700 text-white hover:bg-teal-800'
                      }`}
                    >
                      {integration.connected ? 'Connected' : 'Connect'}
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>


      </main>
    </div>
  )
}
