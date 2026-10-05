/** How Indonesian plates are written: one or two region letters, up to four digits, up to three letters. */
const PLATE = /^[A-Z]{1,2} ?\d{1,4} ?[A-Z]{0,3}$/

/** What a plate field keeps as you type: upper case, letters, digits and single spaces, at most 11 characters. */
export function typedPlate(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/ {2,}/g, ' ')
    .replace(/^ /, '')
    .slice(0, 11)
}

/** True once the text reads as a whole plate, like B 1234 KEN or D 12 AB. */
export function isPlate(text: string): boolean {
  return PLATE.test(text.trim())
}
