// src/components/GSR/ZoomableGSRChart.jsx
import { useEffect, useMemo, useRef, useState } from "react"

export default function ZoomableGSRChart({
  values = [],
  height = 320,
  margin = { top: 10, right: 16, bottom: 28, left: 44 },
}) {
  const containerRef = useRef(null)              // ✅ NUEVO: contenedor capta wheel/gestos
  const [width, setWidth] = useState(600)

  // Dominios y estado
  const [xDomain, setXDomain] = useState([0, Math.max(1, values.length - 1)])
  const [yDomain, setYDomain] = useState([0, 3.3])
  const [autoY, setAutoY] = useState(true)

  // Interacción
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef(null)
  const [hover, setHover] = useState(null)
  const userInteractedRef = useRef(false)        // ✅ NUEVO: no resetear zoom tras interacción

  // Resize
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect
      if (cr?.width) setWidth(Math.max(320, cr.width))
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Ajuste inicial de dominios con datos (sin pisar zoom del usuario)
  useEffect(() => {
    if (!values.length) {
      setXDomain([0, 1])
      if (autoY) setYDomain([0, 3.3])
      return
    }
    if (!userInteractedRef.current) {
      setXDomain([0, values.length - 1])
      // Y se ajusta automáticamente en el efecto de autoY de abajo
    }
  }, [values.length])                            // ✅ ACTUALIZADO: no forzar reset si ya hubo zoom

  const innerW = Math.max(10, width - margin.left - margin.right)
  const innerH = Math.max(10, height - margin.top - margin.bottom)

  const xScale = (x) => {
    const [d0, d1] = xDomain
    return margin.left + ((x - d0) / (d1 - d0)) * innerW
  }
  const yScale = (y) => {
    const [d0, d1] = yDomain
    return margin.top + innerH - ((y - d0) / (d1 - d0)) * innerH
  }

  // Auto Y según ventana visible
  useEffect(() => {
    if (!values.length || !autoY) return
    const [xa, xb] = xDomain.map((v) => clamp(v, 0, Math.max(0, values.length - 1)))
    const i0 = Math.max(0, Math.floor(xa))
    const i1 = Math.min(values.length - 1, Math.ceil(xb))
    const slice = values.slice(i0, i1 + 1)
    const min = Math.min(...slice)
    const max = Math.max(...slice)
    const pad = (max - min) < 1e-6 ? 0.05 : (max - min) * 0.05
    setYDomain([min - pad, max + pad])
  }, [values, xDomain, autoY])

  // Path
  const pathD = useMemo(() => {
    if (!values.length) return ""
    const [xa, xb] = xDomain
    const i0 = Math.max(0, Math.floor(xa))
    const i1 = Math.min(values.length - 1, Math.ceil(xb))
    let d = ""
    for (let i = i0; i <= i1; i++) {
      const px = xScale(i)
      const py = yScale(values[i])
      d += (i === i0 ? "M" : "L") + px + "," + py
    }
    return d
  }, [values, xDomain, yDomain, width, height])

  // Ticks
  const xTicks = useMemo(() => {
    const [a, b] = xDomain
    const count = 6
    const step = Math.max(1, Math.round((b - a) / (count - 1)))
    return Array.from({ length: count }, (_, k) => clamp(Math.round(a) + k * step, Math.round(a), Math.round(b)))
  }, [xDomain])
  const yTicks = useMemo(() => {
    const [a, b] = yDomain
    const count = 5
    const step = (b - a) / (count - 1 || 1)
    return Array.from({ length: count }, (_, k) => a + k * step)
  }, [yDomain])

  // ✅ NUEVO: Wheel con passive:false + cancelación de gestos (Safari)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const wheelHandler = (ev) => {
      // Evitar scroll/zoom del navegador
      ev.preventDefault()
      ev.stopPropagation()
      userInteractedRef.current = true

      const rect = el.getBoundingClientRect()
      const px = ev.clientX - rect.left
      const py = ev.clientY - rect.top

      const zx = (px - margin.left) / innerW
      const zy = 1 - (py - margin.top) / innerH

      // Mapeo sin Ctrl para evitar page zoom
      const both = ev.shiftKey
      const onlyY = ev.altKey || ev.metaKey    // Alt/Option o Cmd
      const onlyX = !both && !onlyY

      const factor = ev.deltaY > 0 ? 1.10 : 1 / 1.10 // ✅ más suave

      // X
      if (both || onlyX) {
        setXDomain(([a, b]) => {
          const cx = a + (b - a) * zx
          const na = cx - (cx - a) * factor
          const nb = cx + (b - cx) * factor
          return normalizeDomain([na, nb], 0, Math.max(1, values.length - 1))
        })
      }

      // Y
      if (both || onlyY) {
        setAutoY(false)
        setYDomain(([a, b]) => {
          const cy = a + (b - a) * (1 - zy)
          const na = cy - (cy - a) * factor
          const nb = cy + (b - cy) * factor
          return normalizeDomain([na, nb])
        })
      }
    }

    const cancelGesture = (ev) => { ev.preventDefault(); ev.stopPropagation() }

    el.addEventListener("wheel", wheelHandler, { passive: false })
    // Safari: impedir pinch zoom de la página
    el.addEventListener("gesturestart", cancelGesture, { passive: false })
    el.addEventListener("gesturechange", cancelGesture, { passive: false })
    el.addEventListener("gestureend", cancelGesture, { passive: false })

    return () => {
      el.removeEventListener("wheel", wheelHandler)
      el.removeEventListener("gesturestart", cancelGesture)
      el.removeEventListener("gesturechange", cancelGesture)
      el.removeEventListener("gestureend", cancelGesture)
    }
  }, [innerW, innerH, margin.left, margin.top, values.length])

  // Pan con arrastre (igual que antes, con una marca de interacción)
  const onMouseDown = (e) => {
    e.preventDefault()
    userInteractedRef.current = true
    setIsPanning(true)
    panStartRef.current = { clientX: e.clientX, clientY: e.clientY, xDomain, yDomain }
  }
  const onMouseMove = (e) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect && values.length) {
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top
      const xi = unscaleX(px, xDomain, innerW, margin.left)
      const idx = Math.round(clamp(xi, 0, values.length - 1))
      const vx = xScale(idx)
      const vy = yScale(values[idx])
      setHover({ index: idx, value: values[idx], px: vx, py: vy })
    }

    if (!isPanning || !panStartRef.current) return
    e.preventDefault()
    const { clientX, clientY, xDomain: x0, yDomain: y0 } = panStartRef.current
    const dx = (e.clientX - clientX) / innerW
    const dy = (e.clientY - clientY) / innerH

    // X
    const [xa, xb] = x0
    const xSpan = xb - xa
    const shiftX = -dx * xSpan
    setXDomain(normalizeDomain([xa + shiftX, xb + shiftX], 0, Math.max(1, values.length - 1)))

    // Y (sólo si AutoY off)
    if (!autoY) {
      const [ya, yb] = y0
      const ySpan = yb - ya
      const shiftY = dy * ySpan
      setYDomain(normalizeDomain([ya + shiftY, yb + shiftY]))
    }
  }
  const onMouseUp = () => setIsPanning(false)
  const onMouseLeave = () => { setIsPanning(false); setHover(null) }

  // Controles
  const fitToData = () => {
    if (!values.length) return
    userInteractedRef.current = true
    setXDomain([0, values.length - 1])
    setAutoY(true)
  }
  const resetZoom = () => {
    userInteractedRef.current = false
    setXDomain([0, Math.max(1, values.length - 1)])
    setAutoY(false)
    setYDomain([0, 3.3])
  }
  const zoomX = (dir = "in") => {
    userInteractedRef.current = true
    const factor = dir === "in" ? 1 / 1.2 : 1.2
    setXDomain(([a, b]) => {
      const cx = (a + b) / 2
      return normalizeDomain([cx + (a - cx) * factor, cx + (b - cx) * factor], 0, Math.max(1, values.length - 1))
    })
  }
  const zoomY = (dir = "in") => {
    userInteractedRef.current = true
    setAutoY(false)
    const factor = dir === "in" ? 1 / 1.2 : 1.2
    setYDomain(([a, b]) => {
      const cy = (a + b) / 2
      return normalizeDomain([cy + (a - cy) * factor, cy + (b - cy) * factor])
    })
  }

  return (
    <div
      ref={containerRef}
      className="card border-0 shadow-sm gsr-chart-container"    // ✅ NUEVO: clase con CSS anti-scroll
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="card-header bg-white border-0 d-flex align-items-center justify-content-between">
        <h6 className="mb-0">GSR (interactiva)</h6>
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn btn-sm btn-outline-primary" onClick={() => zoomX("in")}>Zoom X+</button>
          <button className="btn btn-sm btn-outline-primary" onClick={() => zoomX("out")}>Zoom X-</button>
          <button className="btn btn-sm btn-outline-success" onClick={() => zoomY("in")}>Zoom Y+</button>
          <button className="btn btn-sm btn-outline-success" onClick={() => zoomY("out")}>Zoom Y-</button>
          <div className="form-check form-switch d-flex align-items-center">
            <input className="form-check-input" type="checkbox" checked={autoY} onChange={(e) => setAutoY(e.target.checked)} id="autoYswitch" />
            <label htmlFor="autoYswitch" className="form-check-label ms-1 small">Auto Y</label>
          </div>
          <button className="btn btn-sm btn-outline-secondary" onClick={fitToData}>Ajustar a datos</button>
          <button className="btn btn-sm btn-outline-danger" onClick={resetZoom}>Reset</button>
        </div>
      </div>

      <div className="card-body">
        <svg
          width={width}
          height={height}
          style={{ width: "100%", cursor: isPanning ? "grabbing" : "crosshair" }}
          // ⛔️ quitamos onWheel aquí: ahora se maneja en el contenedor con passive:false
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        >
          <rect x="0" y="0" width={width} height={height} fill="#fff" />

          {/* Grid Y */}
          {yTicks.map((t, i) => {
            const y = yScale(t)
            return (
              <g key={`gy-${i}`}>
                <line x1={margin.left} x2={width - margin.right} y1={y} y2={y} stroke="#f0f0f0" />
                <text x={margin.left - 6} y={y} textAnchor="end" dominantBaseline="middle" fontSize="11" fill="#6c757d">
                  {formatNumber(t)}
                </text>
              </g>
            )
          })}
          {/* Grid X */}
          {xTicks.map((t, i) => {
            const x = xScale(t)
            return (
              <g key={`gx-${i}`}>
                <line x1={x} x2={x} y1={margin.top} y2={height - margin.bottom} stroke="#f7f7f7" />
                <text x={x} y={height - margin.bottom + 16} textAnchor="middle" fontSize="11" fill="#6c757d">
                  {t}
                </text>
              </g>
            )
          })}

          {/* Ejes */}
          <line x1={margin.left} x2={width - margin.right} y1={height - margin.bottom} y2={height - margin.bottom} stroke="#dee2e6" />
          <line x1={margin.left} x2={margin.left} y1={margin.top} y2={height - margin.bottom} stroke="#dee2e6" />

          {/* Serie */}
          <path d={pathD} fill="none" stroke="currentColor" strokeWidth="2" />

          {/* Crosshair */}
          {hover && (
            <>
              <line x1={hover.px} x2={hover.px} y1={margin.top} y2={height - margin.bottom} stroke="#adb5bd" strokeDasharray="4 4" />
              <circle cx={hover.px} cy={hover.py} r="3" fill="currentColor" />
              <rect x={hover.px + 8} y={hover.py - 18} rx="4" ry="4" width="110" height="24" fill="rgba(0,0,0,0.65)" />
              <text x={hover.px + 12} y={hover.py - 2} fontSize="12" fill="#fff">
                i:{hover.index}  v:{formatNumber(hover.value)}
              </text>
            </>
          )}
        </svg>

        <div className="text-muted small mt-2">
          <ul className="mb-0">
            <li><strong>Zoom</strong>: rueda (Shift = ambos ejes, Alt/⌘ = sólo Y).</li>
            <li><strong>Pan</strong>: arrastrar dentro de la gráfica (en Y sólo si Auto Y está desactivado).</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function clamp(v, a, b) { return Math.min(Math.max(v, a), b) }
function normalizeDomain([a, b], min = -Infinity, max = Infinity) {
  if (b - a < 1e-9) { const c = (a + b) / 2; a = c - 0.5; b = c + 0.5 }
  if (a > b) [a, b] = [b, a]
  a = Math.max(min, a); b = Math.min(max, b)
  if (b - a < 1e-9) { const c = (a + b) / 2; a = c - 0.5; b = c + 0.5 }
  return [a, b]
}
function unscaleX(px, [d0, d1], innerW, left) {
  const t = (px - left) / innerW
  return d0 + t * (d1 - d0)
}
function formatNumber(x) {
  if (!isFinite(x)) return "—"
  return Math.abs(x) >= 1 ? x.toFixed(2) : x.toFixed(3)
}
