// src/components/GSR/GSRResults.jsx
import ZoomableGSRChart from "./ZoomableGSRChart"

export default function GSRResults({ analysis, values = [], onReset }) {
  const basic = analysis?.metrics || null
  return (
    <div className="row g-3">
      <div className="col-12">
        <ZoomableGSRChart values={values} />
      </div>

      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Resumen</h6>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-outline-danger" onClick={onReset}>Limpiar</button>
              {/* Se dejó sólo el botón Limpiar como pediste */}
            </div>
          </div>
          <div className="card-body">
            {basic ? (
              <div className="row g-3">
                <Info title="Muestras" value={basic.n} />
                <Info title="Min / Max" value={`${fmt(basic.min)} / ${fmt(basic.max)}`} />
                <Info title="Media / Mediana" value={`${fmt(basic.mean)} / ${fmt(basic.median)}`} />
                <Info title="Desv. Estándar" value={fmt(basic.std)} />
              </div>
            ) : (
              <div className="text-muted">Aún no hay análisis. Conéctate, recibe datos y presiona <strong>Analizar</strong>.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Info({ title, value }) {
  return (
    <div className="col-6 col-md-3">
      <div className="border rounded-3 p-2 h-100">
        <div className="text-muted small">{title}</div>
        <div className="fw-semibold fs-5">{value}</div>
      </div>
    </div>
  )
}

function fmt(x) {
  if (x == null || !isFinite(x)) return "—"
  return Math.abs(x) >= 1 ? x.toFixed(2) : x.toFixed(3)
}
