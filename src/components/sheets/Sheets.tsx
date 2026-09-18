import { useState } from 'react'
import { useT } from '../../i18n'
import { useUi } from '../../store/ui'
import { Sheet } from '../ui/Sheet'
import { BookSheet } from './BookSheet'
import { ClockSheet } from './ClockSheet'
import { EvSheet } from './EvSheet'
import { FindCarSheet } from './FindCarSheet'
import { ImpactSheet, PremiumSheet, PrivacySheet, VehicleSheet } from './InfoSheets'
import { PassSheet } from './PassSheet'
import { SaveSpotSheet } from './SaveSpotSheet'
import { SearchSheet } from './SearchSheet'

/** One place that decides which modal sheet is open. */
export function Sheets() {
  const t = useT()
  const current = useUi((s) => s.sheet)
  const close = useUi((s) => s.close)
  // Keep rendering the last sheet while it slides out, instead of an empty panel.
  const [last, setLast] = useState(current)
  if (current && current !== last) setLast(current)
  const sheet = current ?? last

  let body = null
  switch (sheet?.kind) {
    case 'search':
      body = <SearchSheet />
      break
    case 'clock':
      body = <ClockSheet />
      break
    case 'book':
      body = <BookSheet key={sheet.id} venueId={sheet.id} />
      break
    case 'ev':
      body = <EvSheet key={sheet.id} venueId={sheet.id} />
      break
    case 'save-spot':
      body = <SaveSpotSheet key={sheet.id} venueId={sheet.id} />
      break
    case 'find-car':
      body = <FindCarSheet />
      break
    case 'pass':
      body = <PassSheet passId={sheet.id} />
      break
    case 'impact':
      body = <ImpactSheet />
      break
    case 'premium':
      body = <PremiumSheet />
      break
    case 'privacy':
      body = <PrivacySheet />
      break
    case 'vehicle':
      body = <VehicleSheet />
      break
  }

  return (
    <Sheet open={!!current} onClose={close} label={sheet?.kind ?? ''} tone={sheet?.kind === 'pass' ? 'dark' : 'default'}>
      {body ?? <span className="sr-only">{t.common.close}</span>}
    </Sheet>
  )
}
