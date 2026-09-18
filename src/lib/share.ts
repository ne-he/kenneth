/** Native share sheet when there is one, the clipboard otherwise. */
export async function shareSpot(text: string, onCopied: () => void) {
  try {
    if (navigator.share) {
      await navigator.share({ title: 'KENNETH', text })
      return
    }
  } catch (e) {
    // The user closed the share sheet on purpose, so do not copy behind their back.
    if (e instanceof DOMException && e.name === 'AbortError') return
  }
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Clipboard blocked, nothing else to try.
  }
  onCopied()
}
