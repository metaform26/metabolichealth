'use client'

import { useState } from 'react'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardHeader, CardTitle, CardEyebrow, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  MessageSquare, Play, ShoppingBag, Users, Lock, CheckCircle,
  ChevronRight, Star, Send, Trash2, Globe, Rss,
} from 'lucide-react'

// ─── Data ──────────────────────────────────────────────────────────────────────

const COACHES = [
  {
    name: 'Dr. Maya Patel', initials: 'MP', role: 'Obesity medicine physician',
    specialty: 'GLP-1 care, diabetes prevention, metabolic risk review',
    bio: 'Board-certified physician focused on medication safety, metabolic risk reduction, and sustainable obesity care.',
    color: 'bg-teal-600',
  },
  {
    name: 'Jordan Lee, RD', initials: 'JL', role: 'Registered dietitian coach',
    specialty: 'High-protein meal planning, vegetarian options, lactose intolerance',
    bio: 'Dietitian specializing in practical meal planning, protein targets, and culturally flexible nutrition plans.',
    color: 'bg-violet-600',
  },
  {
    name: 'Nina Brooks', initials: 'NB', role: 'Health coach',
    specialty: 'Medication routines, hydration, habit building, accountability',
    bio: 'Behavior-change coach helping users build daily routines around hydration, symptom tracking, sleep, and adherence.',
    color: 'bg-rose-500',
  },
  {
    name: 'Carlos Rivera', initials: 'CR', role: 'Exercise coach',
    specialty: 'Resistance training, walking plans, recovery, progressive overload',
    bio: 'Strength coach focused on safe beginner resistance training and lean-mass preservation during weight loss.',
    color: 'bg-amber-500',
  },
]

const VIDEOS: { title: string; category: string; description: string }[] = [
  { title: 'Insulin technique basics',        category: 'Diabetes care',  description: 'Injection site rotation, timing, and storage reminders.' },
  { title: 'CGM tips and tricks',             category: 'Diabetes care',  description: 'Sensor placement, alerts, trend arrows, and common troubleshooting.' },
  { title: 'Reading glucose trends',          category: 'Diabetes care',  description: 'Fasting, post-meal, and time-in-range basics.' },
  { title: 'Prediabetes action plan',         category: 'Prediabetes',    description: 'Steps, protein, weight targets, and glucose-friendly meals.' },
  { title: 'PCOS nutrition basics',           category: 'PCOS',           description: 'Insulin resistance, protein meals, fiber, and exercise timing.' },
  { title: 'Thyroid medication timing',       category: 'Thyroid',        description: 'Levothyroxine timing, food interactions, and symptom tracking.' },
  { title: 'Fatty liver lifestyle steps',     category: 'Fatty liver',    description: 'Weight loss, resistance training, and lower-sugar meal choices.' },
  { title: 'GLP-1 nausea strategies',         category: 'GLP-1 support',  description: 'Small meals, hydration, constipation prevention, and red flags.' },
  { title: 'Weight-loss plate method',        category: 'Weight loss',    description: 'Protein-first meal structure and portion control.' },
  { title: 'High-protein vegetarian meals',   category: 'Diet guidance',  description: 'Simple meals for protein targets without meat.' },
  { title: 'Meal prep for busy weeks',        category: 'Diet guidance',  description: 'Easy batch meals with serving weights and calorie estimates.' },
  { title: 'Home dumbbell functional strength', category: 'Exercise',     description: 'AI-generated demo: squat, hinge, press, row, carry, and core sequence.' },
  { title: 'Whole-body HIIT starter',         category: 'Exercise',       description: 'AI-generated demo: low-impact intervals for conditioning and metabolic health.' },
  { title: 'Resistance training starter',     category: 'Exercise',       description: 'Two-day weekly strength routine for lean mass preservation.' },
]

const VIDEO_CATEGORIES = ['All', ...Array.from(new Set(VIDEOS.map((v) => v.category)))]

const SHOP_ITEMS = [
  { name: 'Protein Starter Pack',    description: 'Demo high-protein shake and snack bundle for protein target support.',  tag: 'Supplement',        price: 39 },
  { name: 'Fiber & Hydration Kit',   description: 'Demo fiber powder, electrolyte packets, and hydration guide.',           tag: 'Gut health',        price: 29 },
  { name: 'Longevity Basics Bundle', description: 'Demo sleep, resistance training, and metabolic wellness resource pack.', tag: 'Longevity',         price: 49 },
  { name: 'CGM Care Kit',            description: 'Demo adhesive patches, skin prep, travel pouch, and sensor care guide.', tag: 'Device support',    price: 24 },
  { name: 'GLP-1 Comfort Pack',      description: 'Demo ginger chews, hydration packets, and constipation support guide.', tag: 'Medication support', price: 34 },
  { name: 'Resistance Band Set',     description: 'Demo beginner strength-training bands for home exercise.',               tag: 'Exercise',           price: 22 },
]

const SUBSCRIPTIONS = [
  {
    key: 'basic', name: 'Basic', monthlyPrice: 0, yearlyPrice: 0,
    description: 'Video library, progress tools, and all app resources.',
    features: ['Full progress tracking', 'Diet chart & meal plans', 'Workout checklist', 'Education video library'],
  },
  {
    key: 'coach', name: 'Coach Connect', monthlyPrice: 49, yearlyPrice: 499,
    description: 'Restricted messaging with affiliated diet coaches and health coaches.',
    features: ['Everything in Basic', 'Diet coach messaging', 'Health coach messaging', 'Exercise coach messaging'],
  },
  {
    key: 'clinical', name: 'Clinical Plus', monthlyPrice: 99, yearlyPrice: 999,
    description: 'Coach messaging plus physician/clinician messaging access when available.',
    features: ['Everything in Coach Connect', 'Physician messaging', 'Clinical review access', 'Priority care team response'],
  },
]

const TAG_COLORS: Record<string, string> = {
  'Supplement': 'bg-teal-50 text-teal-700 border-teal-100',
  'Gut health': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Longevity': 'bg-violet-50 text-violet-700 border-violet-100',
  'Device support': 'bg-blue-50 text-blue-700 border-blue-100',
  'Medication support': 'bg-amber-50 text-amber-700 border-amber-100',
  'Exercise': 'bg-rose-50 text-rose-700 border-rose-100',
}

// ─── Cart ──────────────────────────────────────────────────────────────────────

interface CartItem { id: string; name: string; tag: string; price: number }

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const [subscription, setSubscription] = useState<'basic' | 'coach' | 'clinical'>('basic')
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [videoCategory, setVideoCategory] = useState('All')
  const [cart, setCart] = useState<CartItem[]>([])
  const [message, setMessage] = useState('')
  const [messageTo, setMessageTo] = useState('Diet coach')
  const [sentMessages, setSentMessages] = useState<{ to: string; text: string }[]>([])
  const [inbox] = useState([
    { from: 'Care Team', subject: 'Welcome', body: 'Your care team inbox will show coach and admin replies here.' },
  ])
  const [checkoutStatus, setCheckoutStatus] = useState('')

  const messagingUnlocked = subscription === 'coach' || subscription === 'clinical'
  const filteredVideos = videoCategory === 'All' ? VIDEOS : VIDEOS.filter((v) => v.category === videoCategory)
  const cartTotal = cart.reduce((s, i) => s + i.price, 0)

  function addToCart(item: typeof SHOP_ITEMS[0]) {
    if (cart.find((c) => c.name === item.name)) return
    setCart((prev) => [...prev, { id: crypto.randomUUID(), name: item.name, tag: item.tag, price: item.price }])
  }

  function removeFromCart(id: string) { setCart((prev) => prev.filter((c) => c.id !== id)) }

  function checkout() {
    if (cart.length === 0) { setCheckoutStatus('Add a product before checkout.'); return }
    const orderId = `HA-${Date.now().toString().slice(-6)}`
    setCheckoutStatus(`Demo transaction complete. Order ${orderId} for $${cartTotal.toFixed(2)}.`)
    setCart([])
  }

  function sendMessage() {
    if (!message.trim() || !messagingUnlocked) return
    setSentMessages((prev) => [...prev, { to: messageTo, text: message.trim() }])
    setMessage('')
  }

  const price = (sub: typeof SUBSCRIPTIONS[0]) =>
    sub.monthlyPrice === 0 ? 'Free' : billing === 'monthly' ? `$${sub.monthlyPrice}/mo` : `$${sub.yearlyPrice}/yr`

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar eyebrow="Coaches & Resources" title="Explore" />

      <main className="flex-1 overflow-y-auto p-5 lg:p-6 space-y-5">

        {/* ── Hero banner ─────────────────────────────────── */}
        <div className="rounded-2xl bg-gradient-to-r from-teal-700 to-emerald-600 p-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-200 mb-1">Explore</p>
            <h2 className="text-xl font-bold text-white leading-snug max-w-lg">
              Coaches, physicians, education, and health resources
            </h2>
          </div>
          <Badge className="bg-white/20 text-white border-white/30 shrink-0">
            {subscription === 'basic' ? 'Basic access' : subscription === 'coach' ? 'Coach Connect' : 'Clinical Plus'}
          </Badge>
        </div>

        {/* ── Subscription plans ───────────────────────────── */}
        <Card>
          <CardHeader>
            <div>
              <CardEyebrow>Membership</CardEyebrow>
              <CardTitle>Subscription Plans</CardTitle>
            </div>
            <div className="flex rounded-xl border border-slate-200 p-0.5 gap-0.5">
              {(['monthly', 'yearly'] as const).map((b) => (
                <button key={b} onClick={() => setBilling(b)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                    billing === b ? 'bg-teal-700 text-white' : 'text-slate-500 hover:text-slate-700')}>
                  {b === 'monthly' ? 'Monthly' : 'Yearly (save 15%)'}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              {SUBSCRIPTIONS.map((sub) => {
                const active = subscription === sub.key
                return (
                  <div key={sub.key} className={cn(
                    'rounded-2xl border p-5 flex flex-col gap-3 transition-all',
                    active ? 'border-teal-300 bg-teal-50' : 'border-slate-100 bg-white hover:border-slate-200'
                  )}>
                    <div>
                      <p className="font-bold text-slate-800 text-base">{sub.name}</p>
                      <p className="text-2xl font-bold text-teal-700 mt-1">{price(sub)}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{sub.description}</p>
                    </div>
                    <ul className="space-y-1.5 flex-1">
                      {sub.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                          <CheckCircle className="w-3.5 h-3.5 text-teal-500 mt-0.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={active ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => setSubscription(sub.key as typeof subscription)}
                      className="w-full mt-1"
                    >
                      {active ? 'Current plan' : `Choose ${sub.name}`}
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Care team + Messaging ────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-5">
          <Card>
            <CardHeader>
              <div>
                <CardEyebrow>Affiliated care team</CardEyebrow>
                <CardTitle>Coaches & Physicians</CardTitle>
              </div>
              <Badge variant="slate">Subscription-based</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {COACHES.map((c) => (
                  <div key={c.name} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0', c.color)}>
                      {c.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">{c.name}</p>
                      <p className="text-xs font-semibold text-teal-600">{c.role}</p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{c.specialty}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardEyebrow>Secure messaging</CardEyebrow>
                <CardTitle>Message Care Team</CardTitle>
              </div>
              <Badge variant={messagingUnlocked ? 'green' : 'slate'}>
                {messagingUnlocked ? 'Unlocked' : <><Lock className="w-3 h-3 inline mr-1" />Locked</>}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 block mb-1.5">Send to</label>
                  <select value={messageTo} onChange={(e) => setMessageTo(e.target.value)}
                    disabled={!messagingUnlocked}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50">
                    {['Diet coach', 'Health coach', 'Exercise coach', 'Affiliated physician'].map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 block mb-1.5">Message</label>
                  <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)}
                    disabled={!messagingUnlocked}
                    placeholder={messagingUnlocked ? `Message your ${messageTo.toLowerCase()}…` : 'Upgrade to Coach Connect or Clinical Plus to message the care team.'}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none disabled:opacity-50" />
                </div>
                <Button onClick={sendMessage} disabled={!messagingUnlocked || !message.trim()} size="sm" className="gap-2">
                  <Send className="w-3.5 h-3.5" /> Send message
                </Button>
                {!messagingUnlocked && (
                  <p className="text-xs text-slate-400">Upgrade to <strong>Coach Connect</strong> or <strong>Clinical Plus</strong> to message the care team.</p>
                )}
                {sentMessages.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {sentMessages.map((m, i) => (
                      <div key={i} className="rounded-xl border border-teal-100 bg-teal-50 px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-teal-600 mb-0.5">To: {m.to}</p>
                        <p className="text-sm text-slate-700">{m.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Inbox ────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div>
              <CardEyebrow>Messages</CardEyebrow>
              <CardTitle>User Inbox</CardTitle>
            </div>
            <Badge variant="slate">{inbox.length} message{inbox.length !== 1 ? 's' : ''}</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inbox.map((msg, i) => (
                <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-slate-800 text-sm mb-0.5">{msg.from} — {msg.subject}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{msg.body}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Video library ─────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div>
              <CardEyebrow>Video library</CardEyebrow>
              <CardTitle>Education by Topic</CardTitle>
            </div>
            <Badge variant="slate">Updated periodically</Badge>
          </CardHeader>
          <CardContent>
            {/* Category filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              {VIDEO_CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setVideoCategory(cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                    videoCategory === cat
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-teal-300 hover:text-teal-600'
                  )}>
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {filteredVideos.map((v) => (
                <div key={v.title} className="rounded-2xl border border-slate-100 bg-white overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
                  <div className="aspect-video bg-gradient-to-br from-teal-600 to-emerald-500 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-teal-600 mb-0.5">{v.category}</p>
                    <p className="font-semibold text-slate-800 text-sm leading-snug">{v.title}</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{v.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Shop + Cart ───────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div>
              <CardEyebrow>Shopping resources</CardEyebrow>
              <CardTitle>Health, Supplements & Longevity</CardTitle>
            </div>
            <Badge variant={cart.length > 0 ? 'teal' : 'slate'}>
              {cart.length > 0 ? `${cart.length} in cart · $${cartTotal.toFixed(2)}` : 'Cart empty'}
            </Badge>
          </CardHeader>
          <CardContent>
            {/* Products */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
              {SHOP_ITEMS.map((item) => {
                const inCart = cart.some((c) => c.name === item.name)
                return (
                  <div key={item.name} className={cn(
                    'rounded-2xl border p-4 flex flex-col gap-3 transition-all',
                    inCart ? 'border-teal-200 bg-teal-50' : 'border-slate-100 bg-white hover:border-slate-200'
                  )}>
                    <div>
                      <span className={cn('text-[10px] font-bold uppercase tracking-widest border rounded-full px-2 py-0.5', TAG_COLORS[item.tag] ?? 'bg-slate-50 text-slate-500 border-slate-100')}>
                        {item.tag}
                      </span>
                      <p className="font-semibold text-slate-800 mt-2 text-sm">{item.name}</p>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="font-bold text-slate-800">${item.price.toFixed(2)}</span>
                      <Button
                        size="sm"
                        variant={inCart ? 'secondary' : 'primary'}
                        onClick={() => addToCart(item)}
                        disabled={inCart}
                      >
                        {inCart ? 'In cart' : 'Add to cart'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Cart */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800 text-sm">Cart & Checkout</h3>
                <span className="font-bold text-teal-700">${cartTotal.toFixed(2)}</span>
              </div>

              {cart.length === 0 ? (
                <p className="text-sm text-slate-400">No items in cart.</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 border border-slate-100 rounded-xl px-4 py-2.5 bg-slate-50 text-sm">
                      <span className="font-semibold text-slate-700 flex-1">{item.name}</span>
                      <span className="text-slate-400 text-xs">{item.tag}</span>
                      <span className="font-bold text-slate-800 w-14 text-right">${item.price.toFixed(2)}</span>
                      <button onClick={() => removeFromCart(item.id)}
                        className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors">
                        <Trash2 className="w-3 h-3 text-slate-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Checkout form */}
              <div className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 block mb-1.5">Name</label>
                  <input defaultValue="Demo User" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 block mb-1.5">Email</label>
                  <input defaultValue="user@example.com" type="email" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 block mb-1.5">Payment</label>
                  <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option>Demo card ending 4242</option>
                    <option>HSA/FSA demo card</option>
                    <option>Pay later demo</option>
                  </select>
                </div>
                <Button onClick={checkout} size="md" className="whitespace-nowrap">Checkout</Button>
              </div>
              {checkoutStatus && (
                <p className="mt-2 text-xs font-medium text-teal-600">{checkoutStatus}</p>
              )}
              <p className="mt-1.5 text-xs text-slate-400">Demo checkout only. No real payment is processed.</p>
            </div>
          </CardContent>
        </Card>

        {/* ── Social links ──────────────────────────────────── */}
        <div className="flex items-center gap-3 pb-2">
          <a href="https://www.instagram.com/" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:border-teal-300 hover:text-teal-700 transition-colors">
            <Globe className="w-4 h-4" /> Instagram
          </a>
          <a href="https://www.tiktok.com/" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:border-teal-300 hover:text-teal-700 transition-colors">
            <Rss className="w-4 h-4" /> TikTok
          </a>
        </div>

      </main>
    </div>
  )
}
