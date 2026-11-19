/// <reference types="vite/client" />

// Variables exposed to the browser via import.meta.env. Anything listed here is
// public: Vite copies VITE_* values into the JS bundle, so never add secrets.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_USDA_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
