/// <reference types="vite/client" />

declare const __APP_VERSION__: string

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_APP_ID?: string
  /** "on" shares condition reports and booth sessions through Firestore. See src/lib/shared.ts. */
  readonly VITE_SHARED?: string
}
