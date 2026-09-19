import { Topbar } from '@/components/layout/topbar'
import { Card, CardHeader, CardTitle, CardEyebrow, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AppOverview() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar eyebrow="Getting Started" title="App Overview" />

      <main className="flex-1 min-w-0 p-5 lg:p-6 overflow-y-auto space-y-6">

        {/* How to use this app */}
        <Card>
          <CardHeader>
            <div>
              <CardEyebrow>How to use this app</CardEyebrow>
              <CardTitle>Quick Guide</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { icon: '🎯', title: 'Goals', desc: 'Review your calorie prescription, protein target, body metrics, and clinical alerts.' },
                { icon: '📋', title: 'Daily Tracking', desc: 'Log meals with photo estimates, track hydration, steps, and complete your workout.' },
                { icon: '📈', title: 'Progress Check-In', desc: 'Weekly check-in for weight, waist, body fat, and BMI trend comparison.' },
                { icon: '📱', title: 'Devices', desc: 'Connect smart scales, wearables, Fitbit, Apple Health, and CGM sources here.' },
                { icon: '🌟', title: 'Explore', desc: 'Browse coaches, education videos, subscriptions, and shopping resources.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xl shrink-0 mt-0.5">{icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Permissions */}
        <Card>
          <CardHeader>
            <div>
              <CardEyebrow>Privacy & permissions</CardEyebrow>
              <CardTitle>Data Access</CardTitle>
            </div>
            <Badge variant="green">HIPAA-eligible</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Read-only access', desc: 'We only read device data — we never write back to your health platforms.' },
                { label: 'Encrypted in transit', desc: 'All data is transferred over TLS/HTTPS and stored in an encrypted Supabase instance.' },
                { label: 'No third-party sharing', desc: 'Your health data is never sold or shared with advertisers or data brokers.' },
                { label: 'Revoke anytime', desc: 'Disconnect any device above at any time. Existing logs are preserved unless you delete them.' },
              ].map(({ label, desc }) => (
                <div key={label} className="flex gap-3">
                  <span className="text-green-500 font-bold text-sm mt-0.5">✓</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{label}</p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  )
}
