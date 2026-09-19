import type { Account } from '../store/app'

/*
  Google sign-in through Firebase Authentication (free on the Spark plan).

  The web config below is a public identifier, not a secret: it ships in the
  bundle of every Firebase web app. It still comes from env variables so a
  fork builds without it, in which case the app simply stays in guest mode.
  See .env.example.

  Only the Google profile (name, email, photo) comes back. Tickets, history
  and the parked car stay in this browser, the same as for a guest.

  The Firebase SDK is about 60 KB gzipped, so it is only downloaded when the
  user taps "Masuk dengan Google", never on first load.
*/

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

export const authAvailable = !!(config.apiKey && config.authDomain && config.projectId && config.appId)

const REDIRECT_FLAG = 'kenneth-auth-redirect'

async function sdk() {
  const [{ initializeApp, getApps }, auth] = await Promise.all([import('firebase/app'), import('firebase/auth')])
  const app = getApps()[0] ?? initializeApp(config)
  return { auth, instance: auth.getAuth(app) }
}

type FirebaseUser = { uid: string; displayName: string | null; email: string | null; photoURL: string | null }

const toAccount = (u: FirebaseUser): Account => ({
  uid: u.uid,
  name: u.displayName ?? u.email?.split('@')[0] ?? 'Google',
  email: u.email ?? '',
  photo: u.photoURL ?? undefined,
})

export type AuthError = 'not-enabled' | 'cancelled' | 'failed'

/** Why sign-in failed, in words the UI can pick copy for. */
function reason(e: unknown): AuthError {
  const code = (e as { code?: string })?.code ?? ''
  if (code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found' || code === 'auth/unauthorized-domain') {
    return 'not-enabled'
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return 'cancelled'
  return 'failed'
}

export type SignIn = { account: Account } | { redirecting: true } | { error: AuthError }

/**
 * Popup first. Installed iPhone apps and some in-app browsers block popups,
 * so those fall back to a full page redirect, picked up by `finishRedirect`.
 */
export async function signInWithGoogle(): Promise<SignIn> {
  try {
    const { auth, instance } = await sdk()
    const provider = new auth.GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    try {
      const res = await auth.signInWithPopup(instance, provider)
      return { account: toAccount(res.user) }
    } catch (e) {
      const code = (e as { code?: string })?.code
      if (code !== 'auth/popup-blocked' && code !== 'auth/operation-not-supported-in-this-environment') throw e
      sessionStorage.setItem(REDIRECT_FLAG, '1')
      await auth.signInWithRedirect(instance, provider)
      return { redirecting: true }
    }
  } catch (e) {
    return { error: reason(e) }
  }
}

/** Call on start-up. Only touches Firebase when a redirect sign-in is actually in flight. */
export async function finishRedirect(): Promise<Account | null> {
  if (!authAvailable || !sessionStorage.getItem(REDIRECT_FLAG)) return null
  sessionStorage.removeItem(REDIRECT_FLAG)
  const { auth, instance } = await sdk()
  const res = await auth.getRedirectResult(instance).catch(() => null)
  return res ? toAccount(res.user) : null
}

export async function signOutGoogle() {
  if (!authAvailable) return
  const { auth, instance } = await sdk()
  await auth.signOut(instance).catch(() => undefined)
}
