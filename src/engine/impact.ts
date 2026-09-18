/*
  Sustainability numbers for the monthly report.

  Kept deliberately simple and shown to the user in full, so nobody has to
  trust a black box:
  - A minute spent crawling in a queue or circling a basement burns about
    13 ml of petrol for a typical city car (idle to walking pace).
  - Burning 1 litre of petrol releases about 2.31 kg of CO2.
  EVs save time but no petrol, so their fuel and CO2 lines stay at zero.
*/

export const FUEL_L_PER_MIN = 0.013
export const CO2_KG_PER_L = 2.31

export interface Impact {
  minutes: number
  fuelL: number
  co2Kg: number
}

export function impactOf(minutesSaved: number, isEV: boolean): Impact {
  const minutes = Math.max(0, minutesSaved)
  const fuelL = isEV ? 0 : minutes * FUEL_L_PER_MIN
  return { minutes, fuelL, co2Kg: fuelL * CO2_KG_PER_L }
}

export function sumImpact(items: Impact[]): Impact {
  return items.reduce(
    (a, b) => ({ minutes: a.minutes + b.minutes, fuelL: a.fuelL + b.fuelL, co2Kg: a.co2Kg + b.co2Kg }),
    { minutes: 0, fuelL: 0, co2Kg: 0 },
  )
}
