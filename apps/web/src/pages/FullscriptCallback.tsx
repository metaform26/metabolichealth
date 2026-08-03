import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function FullscriptCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'working' | 'success' | 'error'>('working')
  const [errorDetail, setErrorDetail] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setStatus('error')
      setErrorDetail('No authorization code was returned by Fullscript.')
      return
    }

    supabase.functions.invoke('fullscript-oauth-callback', { body: { code } }).then(({ error }) => {
      if (error) {
        setStatus('error')
        setErrorDetail(error.message)
      } else {
        setStatus('success')
      }
    })
  }, [searchParams])

  return (
    <div className="flex h-full items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        {status === 'working' && (
          <>
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-teal-600" />
            <p className="text-sm font-semibold text-slate-800">Connecting to Fullscript…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="mx-auto mb-3 h-8 w-8 text-green-500" />
            <p className="text-sm font-semibold text-slate-800">Fullscript connected</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
            >
              Back to dashboard
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
            <p className="text-sm font-semibold text-slate-800">Couldn't connect Fullscript</p>
            {errorDetail && <p className="mt-1 text-xs text-slate-400">{errorDetail}</p>}
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to dashboard
            </button>
          </>
        )}
      </div>
    </div>
  )
}
