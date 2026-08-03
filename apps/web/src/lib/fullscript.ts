const AUTHORIZE_URL = 'https://us-snd.fullscript.io/oauth/authorize'

const CLIENT_ID = import.meta.env.VITE_FULLSCRIPT_CLIENT_ID as string
const REDIRECT_URI = import.meta.env.VITE_FULLSCRIPT_REDIRECT_URI as string

export function goToFullscriptAuthorize() {
  const url = new URL(AUTHORIZE_URL)
  url.searchParams.set('client_id', CLIENT_ID)
  url.searchParams.set('redirect_uri', REDIRECT_URI)
  url.searchParams.set('response_type', 'code')
  window.location.href = url.toString()
}
