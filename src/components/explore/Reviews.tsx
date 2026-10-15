import { CellSignalFull, Lightbulb, ShieldCheck, ThumbsDown, ThumbsUp, ArrowsOutLineHorizontal } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import type { VenueId } from '../../data/types'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import type { ReviewAspect } from '../../lib/shared'
import { wib } from '../../lib/time'
import { useReviewStore, useReviewTally } from '../../store/reviews'
import { useUi } from '../../store/ui'
import { Label } from '../ui/Kit'

const ICON: Record<ReviewAspect, ReactNode> = {
  light: <Lightbulb size={16} weight="fill" />,
  wide: <ArrowsOutLineHorizontal size={16} weight="bold" />,
  safe: <ShieldCheck size={16} weight="fill" />,
  signal: <CellSignalFull size={16} weight="fill" />,
}

const dayKey = (ts: number) => {
  const p = wib(ts)
  return `${p.year}-${p.month + 1}-${p.date}`
}

/**
 * What drivers say about the car park itself, the things a map never shows:
 * is it well lit, are the bays wide, does it feel safe, is there signal for
 * the parking app. Yes or no per question, shown as the share of yes. A place
 * nobody rated yet says so instead of showing a number.
 */
export function Reviews({ venueId, now }: { venueId: VenueId; now: number }) {
  const t = useT()
  const tally = useReviewTally(venueId)
  const ratedOn = useReviewStore((s) => s.ratedOn)
  const rate = useReviewStore((s) => s.rate)
  const today = dayKey(now)
  const rated = tally.reduce((a, x) => a + x.total, 0)

  return (
    <section>
      <Label aside={rated ? t.review.count(Math.max(...tally.map((x) => x.total))) : undefined}>{t.review.title}</Label>
      <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
        {tally.map(({ aspect, yes, total }) => {
          const pct = total ? Math.round((yes / total) * 100) : null
          const done = ratedOn[`${venueId}:${aspect}`] === today
          return (
            <div key={aspect} className="border-t border-line px-4 py-3 first:border-t-0">
              <div className="flex items-center gap-2.5">
                <span className="text-ink-3">{ICON[aspect]}</span>
                <span className="flex-1 text-[14px] font-medium">{t.review.aspect[aspect]}</span>
                <span className="text-[13px] text-ink-2 tabular">{pct === null ? t.review.none : t.review.share(pct)}</span>
              </div>
              {pct !== null && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                </div>
              )}
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[12px] text-ink-3">{done ? t.review.thanks : t.review.ask[aspect]}</span>
                {!done && (
                  <span className="flex shrink-0 gap-1.5">
                    {([true, false] as const).map((good) => (
                      <button
                        key={String(good)}
                        type="button"
                        aria-label={`${t.review.ask[aspect]} ${good ? t.review.yes : t.review.no}`}
                        onClick={() => {
                          haptic('tap')
                          rate({ venueId, aspect, good }, today)
                          useUi.getState().notify(t.review.sent)
                        }}
                        className="flex h-8 items-center gap-1 rounded-full border border-line px-3 text-[12.5px] font-medium text-ink-2 hover:text-ink"
                      >
                        {good ? <ThumbsUp size={14} /> : <ThumbsDown size={14} />} {good ? t.review.yes : t.review.no}
                      </button>
                    ))}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
