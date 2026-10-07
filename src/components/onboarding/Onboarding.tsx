import { GoogleLogo } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { useResolvedTheme } from '../../lib/theme'
import { useApp } from '../../store/app'
import { useSignIn } from '../account/useSignIn'
import { Button } from '../ui/Button'
import { Wordmark } from '../ui/Logo'
import { MascotPeek } from '../ui/Mascot'

/*
  First run, the only time the app talks about itself: one screen, then the
  map. Nothing is asked up front (UX audit #4): the plate is asked at the
  first booking that needs it, the car can be set from the chip on the home
  sheet, favourites come from the star on a place, and the history starts
  empty. The team fills it with a sample month from team mode when it presents.
*/
export function Onboarding() {
  const t = useT()
  const finish = useApp((s) => s.finishOnboarding)
  const account = useApp((s) => s.account)
  const { available, busy, signIn } = useSignIn()

  const start = () => {
    haptic('success')
    finish({
      name: useApp.getState().account?.name.split(' ')[0] ?? '',
      vehicle: { kind: 'mobil', plate: '', model: '', isEV: false },
      favorites: [],
      withSample: false,
    })
  }

  return (
    <motion.div
      className="absolute inset-0 z-[60] flex flex-col bg-canvas"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.35 }}
    >
      <div className="pt-safe px-5 pt-3">
        <Wordmark />
      </div>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pt-6 pb-4">
        <Welcome />
      </div>

      <div className="pb-safe px-6 pt-2">
        <Button variant="primary" size="lg" block onClick={start}>
          {t.onboarding.start}
        </Button>
        {available && !account && (
          <Button
            variant="ghost"
            size="lg"
            block
            className="mt-2"
            disabled={busy}
            onClick={async () => {
              if (await signIn()) start()
            }}
          >
            <GoogleLogo size={18} weight="bold" /> {busy ? t.profile.signingIn : t.profile.signIn}
          </Button>
        )}
        <p className="mt-3 text-center text-[11.5px] text-ink-3">{t.onboarding.privacyNote}</p>
      </div>
    </motion.div>
  )
}

function Welcome() {
  const t = useT()
  // The loop is rendered on the card's own colour for each theme, so the K never sits in a black box.
  const theme = useResolvedTheme()
  return (
    <div className="flex min-h-full flex-col">
      <div className="grid flex-1 place-items-center py-2">
        {/*
          The bekantan peeks over the animation; the space above the card is kept for him. On a short phone the
          card shrinks instead, so the welcome text and the button still fit without scrolling.
        */}
        <div className="relative mt-[78px] w-[min(280px,100%,calc(100dvh_-_460px))]">
          <MascotPeek width={112} className="right-7" />
          <div className="relative aspect-square w-full overflow-hidden rounded-[32px] border border-line bg-surface">
            <video
              key={theme}
              className="size-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              poster={`/brand/poster-${theme}.jpg`}
              aria-hidden="true"
            >
              <source src={`/brand/loop-${theme}.webm`} type="video/webm" />
              <source src={`/brand/loop-${theme}.mp4`} type="video/mp4" />
            </video>
          </div>
        </div>
      </div>
      <h1 className="mt-6 text-[30px] leading-[1.08] font-semibold tracking-tight text-balance">{t.onboarding.welcomeTitle}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{t.onboarding.welcomeBody}</p>
    </div>
  )
}
