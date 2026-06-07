'use client'

import { useState } from 'react'
import { Trash2, Plus, Send, ShieldCheck, UserPlus } from 'lucide-react'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardHeader, CardTitle, CardEyebrow, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'

const DEMO_PATIENTS = [
  { name: 'Ava Morgan', age: 46, compliance: 92, reports: 6, subscription: 'clinical', conditions: 'Prediabetes, Hypertension', glp1: true },
  { name: 'Mina Shah', age: 52, compliance: 80, reports: 5, subscription: 'coach', conditions: 'Type 2 diabetes, GERD', glp1: true },
  { name: 'Ben Carter', age: 39, compliance: 76, reports: 4, subscription: 'basic', conditions: 'High cholesterol, sleep apnea', glp1: false },
  { name: 'Chris Lee', age: 31, compliance: 68, reports: 3, subscription: 'basic', conditions: 'No active conditions', glp1: false },
]

const AVATAR_COLORS = ['bg-teal-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500']

interface AdminMessage {
  id: number
  from: string
  subject: string
  body: string
  timestamp: string
  read: boolean
}

const INITIAL_MESSAGES: AdminMessage[] = [
  { id: 1, from: 'Ava Morgan', subject: 'GLP-1 side effects question', body: 'Hi, I have been experiencing more nausea than usual this week. Should I reduce my dose?', timestamp: '2 hours ago', read: false },
  { id: 2, from: 'Mina Shah', subject: 'Glucose trending high', body: 'My CGM shows post-meal glucose above 180 for the past 3 days. Is this a concern?', timestamp: '1 day ago', read: true },
  { id: 3, from: 'Ben Carter', subject: 'Progress check-in review', body: 'Can you review my latest check-in? I have lost 8 lbs this month but my waist is still the same.', timestamp: '2 days ago', read: true },
]

interface AdminVideo { title: string; category: string; description: string }
interface AdminCoach { name: string; role: string; details: string }
interface AdminShopItem { title: string; description: string; status: string }

const INITIAL_VIDEOS: AdminVideo[] = [
  { title: 'GLP-1 nausea strategies', category: 'GLP-1 support', description: 'Small meals, hydration, constipation prevention, and red flags.' },
  { title: 'Prediabetes action plan', category: 'Prediabetes', description: 'Steps, protein, weight targets, and glucose-friendly meals.' },
  { title: 'Resistance training starter', category: 'Exercise', description: 'Two-day weekly strength routine for lean mass preservation.' },
]

const INITIAL_COACHES: AdminCoach[] = [
  { name: 'Dr. Maya Patel', role: 'Obesity medicine physician', details: 'GLP-1 care, diabetes prevention, metabolic risk review' },
  { name: 'Jordan Lee, RD', role: 'Registered dietitian', details: 'High-protein meal planning, vegetarian options' },
]

const INITIAL_SHOP: AdminShopItem[] = [
  { title: 'Protein Starter Pack', description: 'High-protein shake and snack bundle.', status: 'Available' },
  { title: 'GLP-1 Comfort Pack', description: 'Ginger chews, hydration packets, support guide.', status: 'Available' },
]

// ─── Admin access panel ───────────────────────────────────────────────────────
function AdminAccessPanel() {
  const OWNERS = ['dipanbaral05@gmail.com', 'mandal.kash@gmail.com', 'admin.metaform@gmail.com']
  const [admins, setAdmins] = useState<string[]>(OWNERS)
  const [newEmail, setNewEmail] = useState('')
  const [added, setAdded] = useState(false)

  function handleAdd() {
    const email = newEmail.trim().toLowerCase()
    if (!email || admins.includes(email)) return
    setAdmins((prev) => [...prev, email])
    setNewEmail('')
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  function handleRemove(email: string) {
    if (OWNERS.includes(email)) return // can't remove owners
    setAdmins((prev) => prev.filter((e) => e !== email))
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardEyebrow>Access control</CardEyebrow>
          <CardTitle>Admin Access</CardTitle>
        </div>
        <Badge variant="teal">{admins.length} admin{admins.length !== 1 ? 's' : ''}</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-slate-500 mb-4">
          Only email addresses listed here can access the Admin dashboard. Owner accounts are permanent and cannot be removed.
          Adding an email here grants access — the user must sign up with that exact email.
        </p>

        {/* Current admins */}
        <div className="space-y-2 mb-4">
          {admins.map((email) => (
            <div
              key={email}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50"
            >
              <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
              </div>
              <p className="flex-1 text-sm text-slate-900 font-medium truncate">{email}</p>
              {OWNERS.includes(email) ? (
                <Badge variant="teal">Owner</Badge>
              ) : (
                <button
                  onClick={() => handleRemove(email)}
                  className="shrink-0 text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add new admin */}
        <div className="flex gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add admin by email address"
            className="flex-1 text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-300"
          />
          <button
            onClick={handleAdd}
            disabled={!newEmail.trim()}
            className="bg-teal-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-teal-800 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            {added ? 'Added ✓' : 'Add'}
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-3">
          ℹ️ In production, this list is stored securely in Supabase and checked server-side on every request via middleware.
        </p>
      </CardContent>
    </Card>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [messages, setMessages] = useState<AdminMessage[]>(INITIAL_MESSAGES)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  const [videos, setVideos] = useState<AdminVideo[]>(INITIAL_VIDEOS)
  const [newVideo, setNewVideo] = useState({ title: '', category: '', description: '' })

  const [coaches, setCoaches] = useState<AdminCoach[]>(INITIAL_COACHES)
  const [newCoach, setNewCoach] = useState({ name: '', role: '', details: '' })

  const [shopItems, setShopItems] = useState<AdminShopItem[]>(INITIAL_SHOP)
  const [newShop, setNewShop] = useState({ title: '', description: '', status: '' })

  const [selectedPatient, setSelectedPatient] = useState(0)
  const patient = DEMO_PATIENTS[selectedPatient]

  const unread = messages.filter((m) => !m.read).length
  const avgCompliance = Math.round(DEMO_PATIENTS.reduce((s, p) => s + p.compliance, 0) / DEMO_PATIENTS.length)
  const paid = DEMO_PATIENTS.filter((p) => p.subscription !== 'basic').length
  const subRevenue = DEMO_PATIENTS.reduce((s, p) => s + (p.subscription === 'clinical' ? 99 : p.subscription === 'coach' ? 49 : 0), 0)

  function markRead(id: number) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)))
  }

  function deleteMessage(id: number) {
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }

  function sendReply() {
    if (!replyText.trim() || !replyTo) return
    setReplyTo(null)
    setReplyText('')
  }

  function addVideo() {
    if (!newVideo.title) return
    setVideos((prev) => [{ ...newVideo, title: newVideo.title || 'New Video', category: newVideo.category || 'Education', description: newVideo.description || 'Patient education content.' }, ...prev])
    setNewVideo({ title: '', category: '', description: '' })
  }

  function addCoach() {
    if (!newCoach.name) return
    setCoaches((prev) => [{ ...newCoach, name: newCoach.name || 'New Provider', role: newCoach.role || 'Care team', details: newCoach.details || 'Affiliated provider.' }, ...prev])
    setNewCoach({ name: '', role: '', details: '' })
  }

  function addShopItem() {
    if (!newShop.title) return
    setShopItems((prev) => [{ title: newShop.title || 'New Item', description: newShop.description || 'New resource.', status: newShop.status || 'Coming soon' }, ...prev])
    setNewShop({ title: '', description: '', status: '' })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar eyebrow="Clinician Portal" title="Admin Dashboard" />

      <main className="flex-1 overflow-y-auto p-5 lg:p-6 space-y-6">

        {/* Top stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Avg Compliance" value={`${avgCompliance}%`} sub="Across all patients" accent />
          <StatCard label="Active Patients" value={`${DEMO_PATIENTS.length}`} sub="Enrolled" />
          <StatCard label="Paid Subscriptions" value={`${paid}`} sub="Coach or Clinical" />
          <StatCard label="Monthly Revenue" value={`$${subRevenue}`} sub="Subscription MRR" />
        </div>

        {/* Patient selector + compliance */}
        <div className="grid lg:grid-cols-2 gap-5">
          <Card>
            <CardHeader>
              <div>
                <CardEyebrow>Clinician view</CardEyebrow>
                <CardTitle>Patient Profiles</CardTitle>
              </div>
              <Badge variant="teal">{DEMO_PATIENTS.length} patients</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {DEMO_PATIENTS.map((p, i) => (
                  <button
                    key={p.name}
                    onClick={() => setSelectedPatient(i)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                      selectedPatient === i ? 'border-teal-200 bg-teal-50' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full ${AVATAR_COLORS[i]} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                      {p.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.conditions}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-900">{p.compliance}%</p>
                      <Badge variant={p.subscription === 'clinical' ? 'teal' : p.subscription === 'coach' ? 'green' : 'slate'} className="text-xs">
                        {p.subscription}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
              {/* Selected patient detail */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Selected patient</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Name', value: patient.name },
                    { label: 'Age', value: `${patient.age} yrs` },
                    { label: 'Compliance', value: `${patient.compliance}%` },
                    { label: 'Reports/wk', value: `${patient.reports}` },
                    { label: 'GLP-1', value: patient.glp1 ? 'Yes' : 'No' },
                    { label: 'Plan', value: patient.subscription },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-400 font-medium">{label}</p>
                      <p className="text-sm font-semibold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compliance report */}
          <Card>
            <CardHeader>
              <div>
                <CardEyebrow>Adherence tracking</CardEyebrow>
                <CardTitle>Compliance Report</CardTitle>
              </div>
              <Badge variant={avgCompliance >= 80 ? 'green' : avgCompliance >= 65 ? 'amber' : 'red'}>
                {avgCompliance}% avg
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...DEMO_PATIENTS].sort((a, b) => b.compliance - a.compliance).map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full ${AVATAR_COLORS[DEMO_PATIENTS.indexOf(p)]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {p.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.compliance}%</p>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${p.compliance >= 85 ? 'bg-teal-500' : p.compliance >= 70 ? 'bg-amber-400' : 'bg-red-400'}`}
                          style={{ width: `${p.compliance}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 shrink-0">{p.reports} rpts/wk</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Subscribed users (coach or clinical)</p>
                {DEMO_PATIENTS.filter((p) => p.subscription !== 'basic').length === 0 ? (
                  <p className="text-xs text-slate-400">No paid subscribers.</p>
                ) : (
                  <div className="space-y-2">
                    {DEMO_PATIENTS.filter((p) => p.subscription !== 'basic').map((p) => (
                      <div key={p.name} className="flex items-center justify-between bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
                        <p className="text-xs font-semibold text-slate-900">{p.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">{p.compliance}% compliant</span>
                          <Badge variant={p.subscription === 'clinical' ? 'teal' : 'green'}>{p.subscription}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Inbox */}
        <Card>
          <CardHeader>
            <div>
              <CardEyebrow>Patient messages</CardEyebrow>
              <CardTitle>Admin Inbox</CardTitle>
            </div>
            <Badge variant={unread > 0 ? 'red' : 'green'}>
              {unread > 0 ? `${unread} unread` : 'All read'}
            </Badge>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <p className="text-sm text-slate-400">No messages. User messages and coach requests will appear here.</p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-xl border transition-colors ${msg.read ? 'border-slate-100 bg-slate-50' : 'border-teal-100 bg-teal-50'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-slate-900">{msg.from}</p>
                          {!msg.read && <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />}
                          <span className="text-xs text-slate-400 ml-auto">{msg.timestamp}</span>
                        </div>
                        <p className="text-xs font-medium text-slate-700 mb-1">{msg.subject}</p>
                        <p className="text-xs text-slate-500 leading-relaxed">{msg.body}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {!msg.read && (
                          <button
                            onClick={() => markRead(msg.id)}
                            className="text-xs text-teal-700 hover:text-teal-900 px-2 py-1 rounded-lg hover:bg-teal-100 transition-colors"
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={() => setReplyTo(msg.from)}
                          className="text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          Reply
                        </button>
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {replyTo === msg.from && (
                      <div className="mt-3 pt-3 border-t border-slate-200 flex gap-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={`Reply to ${msg.from}…`}
                          className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                        <button
                          onClick={sendReply}
                          className="bg-teal-700 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-teal-800 transition-colors flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          Send
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content management: Videos / Coaches / Shop */}
        <div className="grid lg:grid-cols-3 gap-5">

          {/* Add video */}
          <Card>
            <CardHeader>
              <div>
                <CardEyebrow>Content library</CardEyebrow>
                <CardTitle>Add Video</CardTitle>
              </div>
              <Badge variant="slate">{videos.length} videos</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <input
                  type="text"
                  placeholder="Video title"
                  value={newVideo.title}
                  onChange={(e) => setNewVideo((v) => ({ ...v, title: e.target.value }))}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={newVideo.category}
                  onChange={(e) => setNewVideo((v) => ({ ...v, category: e.target.value }))}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <textarea
                  placeholder="Description"
                  value={newVideo.description}
                  onChange={(e) => setNewVideo((v) => ({ ...v, description: e.target.value }))}
                  rows={2}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
                <button
                  onClick={addVideo}
                  className="w-full bg-teal-700 text-white text-xs font-semibold py-2 rounded-lg hover:bg-teal-800 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Video
                </button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {videos.map((v, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="w-6 h-6 rounded bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold shrink-0">▶</div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{v.title}</p>
                      <p className="text-xs text-slate-400">{v.category}</p>
                    </div>
                    <button onClick={() => setVideos((prev) => prev.filter((_, j) => j !== i))} className="shrink-0 text-slate-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Add coach */}
          <Card>
            <CardHeader>
              <div>
                <CardEyebrow>Care team</CardEyebrow>
                <CardTitle>Add Coach</CardTitle>
              </div>
              <Badge variant="slate">{coaches.length} coaches</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <input
                  type="text"
                  placeholder="Provider name"
                  value={newCoach.name}
                  onChange={(e) => setNewCoach((c) => ({ ...c, name: e.target.value }))}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <input
                  type="text"
                  placeholder="Role / title"
                  value={newCoach.role}
                  onChange={(e) => setNewCoach((c) => ({ ...c, role: e.target.value }))}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <input
                  type="text"
                  placeholder="Specialties"
                  value={newCoach.details}
                  onChange={(e) => setNewCoach((c) => ({ ...c, details: e.target.value }))}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  onClick={addCoach}
                  className="w-full bg-violet-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-violet-700 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Coach
                </button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {coaches.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-bold shrink-0">
                      {c.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.role}</p>
                    </div>
                    <button onClick={() => setCoaches((prev) => prev.filter((_, j) => j !== i))} className="shrink-0 text-slate-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Add shop item */}
          <Card>
            <CardHeader>
              <div>
                <CardEyebrow>Resources</CardEyebrow>
                <CardTitle>Add Shop Item</CardTitle>
              </div>
              <Badge variant="slate">{shopItems.length} items</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <input
                  type="text"
                  placeholder="Item title"
                  value={newShop.title}
                  onChange={(e) => setNewShop((s) => ({ ...s, title: e.target.value }))}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <textarea
                  placeholder="Description"
                  value={newShop.description}
                  onChange={(e) => setNewShop((s) => ({ ...s, description: e.target.value }))}
                  rows={2}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
                <input
                  type="text"
                  placeholder="Status (e.g. Available, Coming soon)"
                  value={newShop.status}
                  onChange={(e) => setNewShop((s) => ({ ...s, status: e.target.value }))}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  onClick={addShopItem}
                  className="w-full bg-amber-500 text-white text-xs font-semibold py-2 rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {shopItems.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold shrink-0">🛍</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{s.title}</p>
                      <p className="text-xs text-slate-400">{s.status}</p>
                    </div>
                    <button onClick={() => setShopItems((prev) => prev.filter((_, j) => j !== i))} className="shrink-0 text-slate-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Access Management */}
        <AdminAccessPanel />

        {/* System status */}
        <Card>
          <CardHeader>
            <div>
              <CardEyebrow>Platform health</CardEyebrow>
              <CardTitle>System Status</CardTitle>
            </div>
            <Badge variant="green">All systems operational</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Supabase DB', status: 'Operational', ok: true },
                { label: 'Auth service', status: 'Operational', ok: true },
                { label: 'File storage', status: 'Operational', ok: true },
                { label: 'Edge functions', status: 'Operational', ok: true },
              ].map(({ label, status, ok }) => (
                <div key={label} className={`p-3 rounded-xl border ${ok ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-2 h-2 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
                    <p className="text-xs font-semibold text-slate-900">{label}</p>
                  </div>
                  <p className="text-xs text-slate-500">{status}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  )
}
