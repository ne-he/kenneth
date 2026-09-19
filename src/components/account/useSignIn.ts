import { useState } from 'react'
import { useT } from '../../i18n'
import { authAvailable, signInWithGoogle, signOutGoogle } from '../../lib/auth'
import { haptic } from '../../lib/haptics'
import { useApp } from '../../store/app'
import { useUi } from '../../store/ui'

/** Sign in and out with Google, with the toasts and the busy state every button needs. */
export function useSignIn() {
  const t = useT()
  const [busy, setBusy] = useState(false)
  const setAccount = useApp((s) => s.setAccount)
  const notify = useUi((s) => s.notify)

  const signIn = async (): Promise<boolean> => {
    if (!authAvailable) {
      notify(t.profile.signInOff)
      return false
    }
    setBusy(true)
    const res = await signInWithGoogle()
    setBusy(false)
    if ('account' in res) {
      haptic('success')
      setAccount(res.account)
      notify(t.profile.signedIn(res.account.name.split(' ')[0]))
      return true
    }
    if ('error' in res && res.error !== 'cancelled') notify(res.error === 'not-enabled' ? t.profile.signInOff : t.profile.signInFail)
    return false
  }

  const signOut = async () => {
    await signOutGoogle()
    setAccount(null)
    notify(t.profile.signedOut)
  }

  return { available: authAvailable, busy, signIn, signOut }
}
