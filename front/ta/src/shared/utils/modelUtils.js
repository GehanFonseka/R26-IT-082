export function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export function mockDelay(ms = 550) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function copyJson(payload) {
  await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
}
