/** Native share sheet when there is one, the clipboard otherwise. */
export async function shareSpot(text: string, onCopied: () => void) {
  try {
    if (navigator.share) {
      await navigator.share({ title: 'KENNETH', text })
      return
    }
  } catch {
    // Share sheet dismissed, fall through to copying.
  }
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Clipboard blocked, nothing else to try.
  }
  onCopied()
}
