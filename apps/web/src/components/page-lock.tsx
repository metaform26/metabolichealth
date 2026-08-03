import { useState, type FormEvent, type ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface PageLockProps {
  password: string
  storageKey: string
  title?: string
  description?: string
  children: ReactNode
}

export function PageLock({
  password,
  storageKey,
  title = 'This page is locked',
  description = 'Enter the password to continue.',
  children,
}: PageLockProps) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(storageKey) === 'true')
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (value === password) {
      sessionStorage.setItem(storageKey, 'true')
      setUnlocked(true)
    } else {
      setError('Incorrect password.')
    }
  }

  if (unlocked) return <>{children}</>

  return (
    <div className="flex h-full items-center justify-center bg-slate-50 p-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <Lock className="h-5 w-5 text-slate-500" />
        </div>
        <h2 className="text-center text-lg font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-center text-sm text-slate-500">{description}</p>
        <div className="mt-5">
          <Input
            type="password"
            autoFocus
            value={value}
            onChange={(e) => { setValue(e.target.value); setError('') }}
            placeholder="Password"
            error={error}
          />
        </div>
        <Button type="submit" className="mt-4 w-full">Unlock</Button>
      </form>
    </div>
  )
}
