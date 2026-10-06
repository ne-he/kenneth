import type { FirebaseApp } from 'firebase/app'

/*
  The Firebase project this build talks to, if any: Google sign-in uses it,
  and so does shared data when the build turns it on (src/lib/shared.ts).

  The web config is a public identifier, not a secret: it ships in the bundle
  of every Firebase web app. It still comes from env variables so a fork
  builds without it, in which case the app stays in guest mode with every
  record on the phone. See .env.example.
*/

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  /*
    Always <project>.firebaseapp.com, never a hosting domain like kenneth-park.web.app.
    The OAuth client Google creates for the project only lists
    https://<project>.firebaseapp.com/__/auth/handler as a redirect URI, so any other
    auth domain makes the popup answer "Error 400: redirect_uri_mismatch". Every
    hosting site signs in through this one, as long as it is an authorized domain
    in Firebase Authentication.
  */
  authDomain: projectId ? `${projectId}.firebaseapp.com` : undefined,
  projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseReady = !!(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId)

let app: Promise<FirebaseApp> | null = null

/** The Firebase app, set up on first use. Nothing Firebase downloads before that. */
export function firebaseApp(): Promise<FirebaseApp> {
  app ??= import('firebase/app')
    .then(({ getApps, initializeApp }) => getApps()[0] ?? initializeApp(firebaseConfig))
    .catch((e: unknown) => {
      // Offline before the script was ever fetched. Forget the failure so the next call tries again.
      app = null
      throw e
    })
  return app
}
