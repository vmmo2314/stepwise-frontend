// src/components/GSR/gsrUtils.js

// Extrae pares gsrN:valor desde cualquier texto/ línea
export function parseGsrLog(input) {
  if (!input) return { values: [], indices: [], count: 0 }
  const lines = String(input).split(/\r?\n/)
  const map = new Map()
  const rePair = /gsr\s*(\d+)\s*:\s*(-?\d+(?:\.\d+)?)/gi

  for (let raw of lines) {
    let line = raw
    const tagPos = line.toUpperCase().indexOf("GSR_DATA:")
    if (tagPos >= 0) line = line.slice(tagPos + "GSR_DATA:".length)
    line = line.split("===").shift()

    let m
    while ((m = rePair.exec(line)) !== null) {
      const idx = parseInt(m[1], 10)
      const val = parseFloat(m[2])
      if (Number.isFinite(idx) && Number.isFinite(val)) map.set(idx, val)
    }
  }
  const entries = [...map.entries()].sort((a, b) => a[0] - b[0])
  const indices = entries.map(([i]) => i)
  const values = entries.map(([, v]) => v)
  return { values, indices, count: values.length }
}

// Métricas básicas únicamente
export function computeGsrMetrics(values) {
  if (!values?.length) return { n: 0 }
  const n = values.length
  const sorted = [...values].sort((a, b) => a - b)
  const min = sorted[0], max = sorted[n - 1]
  const mean = values.reduce((a, b) => a + b, 0) / n
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n
  const std = Math.sqrt(variance)
  const median = n % 2 ? sorted[(n - 1) >> 1] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2
  return { n, min, max, mean, median, std }
}
