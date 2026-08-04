import { useEffect, useState } from 'react'
import { Link2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { goToFullscriptAuthorize } from '@/lib/fullscript'
import { Button } from '@/components/ui/button'

export function FullscriptConnectButton() {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function checkStatus() {
      try {
        const { data, error } = await supabase.rpc('fullscript_connection_status')
        if (cancelled) return
        if (error) {
          console.error('[fullscript] connection_status RPC failed:', error)
          setConnected(false)
          return
        }
        setConnected(Array.isArray(data) && (data as unknown[]).length > 0)
      } catch (err) {
        if (cancelled) return
        console.error('[fullscript] connection_status RPC threw:', err)
        setConnected(false)
      }
    }
    checkStatus()
    return () => { cancelled = true }
  }, [])

  async function disconnect() {
    setDisconnecting(true)
    await supabase.functions.invoke('fullscript-disconnect', { method: 'POST' })
    setConnected(false)
    setDisconnecting(false)
  }

  if (connected === null) return null

  if (connected) {
    return (
      <button
        onClick={disconnect}
        disabled={disconnecting}
        title="Disconnect Fullscript"
        className="flex items-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-50"
      >
        <Link2 className="w-3.5 h-3.5" />
        Fullscript Connected
        <X className="w-3 h-3 ml-0.5" />
      </button>
    )
  }

  return (
    <Button variant="secondary" size="sm" onClick={goToFullscriptAuthorize} className="gap-1.5">
      <Link2 className="w-3.5 h-3.5" />
      Connect Fullscript
    </Button>
  )
}
