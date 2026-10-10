// ─── YouTube ──────────────────────────────────────────────────────────────────
export const getYoutubeId = (input: string): string | null => {
  try {
    const u = new URL(input)

    if (u.hostname.includes('youtu.be'))
      return u.pathname.split('/').filter(Boolean)[0] ?? null

    const v = new URLSearchParams(u.search).get('v')
    if (v) return v

    if (u.pathname.includes('/embed/'))
      return u.pathname.split('/embed/')?.[1]?.split('?')?.[0] ?? null

    return null
  } catch {
    return null
  }
}

// ─── Image URL check ──────────────────────────────────────────────────────────
// Hanya validasi format URL (http/https).
// Validasi apakah benar-benar gambar diserahkan ke <img onError> di MediaPreview,
// karena banyak URL gambar (Google, proxy, CDN) tidak pakai ekstensi file.
export const isLikelyImageUrl = (input: string): boolean => {
  try {
    const { protocol } = new URL(input)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

// ─── Image compression ────────────────────────────────────────────────────────
export const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img    = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string
    }

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx    = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      const MAX_WIDTH = 1200
      const scale    = Math.min(1, MAX_WIDTH / img.width)

      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Canvas toBlob failed')); return }
          resolve(blob)
        },
        'image/jpeg',
        0.78
      )
    }

    img.onerror    = () => reject(new Error('Failed to load image'))
    reader.onerror = () => reject(new Error('Failed to read file'))

    reader.readAsDataURL(file)
  })
}