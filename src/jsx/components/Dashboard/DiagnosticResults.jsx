const DiagnosticResults = ({ analysisResult }) => {
  if (!analysisResult) {
    return (
      <div className="card shadow-sm rounded-3 border-0 mb-4">
        <div className="card-header bg-white border-0">
          <h5 className="mb-0 fw-bold">Resultados del Análisis</h5>
        </div>
        <div className="card-body py-5">
          <p className="text-muted text-center">Realice un análisis para ver los resultados</p>
        </div>
      </div>
    )
  }

  // Interpretación del tipo de pie basado en el índice de arco
  const getTipoArco = () => {
    console.log(analysisResult.prediction)
    if (analysisResult.prediction === 1) {
      return { tipo: "Pie Normal", descripcion: "Arco plantar bien formado con distribución equilibrada del peso." }
    } else if (analysisResult.prediction === 2) {
      return {
        tipo: "Pie Plano",
        descripcion: "Arco plantar bajo o ausente, con mayor contacto en la zona media del pie.",
      }
    } else if (analysisResult.prediction === 3) {
      return { tipo: "Pie Cavo", descripcion: "Arco plantar elevado con menor contacto en la zona media del pie." }
    } else {
      return { tipo: "Indeterminado", descripcion: "No se ha podido determinar el tipo de arco con precisión." }
    }
  }

  // Calcular severidad basado en el índice de arco
  const getSeveridad = () => {
    const indice = analysisResult.indiceArco
    if (analysisResult.prediction === 1) {
      // Pie plano
      if (indice < 0.2) return "Severo"
      if (indice < 0.4) return "Moderado"
      return "Leve"
    } else if (analysisResult.prediction === 3) {
      // Pie cavo
      if (indice > 0.9) return "Severo"
      if (indice > 0.7) return "Moderado"
      return "Leve"
    }
    return "Normal"
  }

  // Generar recomendaciones basadas en el tipo de pie
  const getRecomendaciones = () => {
    if (analysisResult.prediction === 1) {
      return [
        "Plantillas con soporte de arco específicas para pie plano",
        "Ejercicios de fortalecimiento de la musculatura intrínseca del pie",
        "Calzado con buen soporte y amortiguación",
        "Considerar terapia física si hay dolor asociado",
      ]
    } else if (analysisResult.prediction === 3) {
      return [
        "Plantillas con mayor amortiguación en talón y antepié",
        "Calzado con mayor flexibilidad y menor control de movimiento",
        "Estiramientos de la fascia plantar y tendón de Aquiles",
        "Monitoreo regular para prevenir complicaciones como metatarsalgia",
      ]
    } else {
      return [
        "Calzado adecuado para actividades diarias",
        "Revisión periódica para mantener la salud del pie",
        "Ejercicios generales de mantenimiento y flexibilidad",
      ]
    }
  }

  // Información sobre posibles problemas asociados
  const getProblemasAsociados = () => {
    if (analysisResult.prediction === 1) {
      return [
        "Mayor riesgo de fatiga muscular",
        "Posible pronación excesiva",
        "Tendencia a desarrollar fascitis plantar",
        "Posibles problemas en rodilla y cadera por desalineación",
      ]
    } else if (analysisResult.prediction === 3) {
      return [
        "Mayor impacto en talón y metatarsos",
        "Riesgo de inestabilidad lateral",
        "Posibles problemas de absorción de impactos",
        "Mayor tensión en la fascia plantar",
      ]
    } else {
      return [
        "Bajo riesgo de complicaciones si se mantiene el cuidado adecuado",
        "Monitorear cambios en la biomecánica con la edad",
      ]
    }
  }

  const tipoArco = getTipoArco()
  const severidad = getSeveridad()

  // Funciones para determinar colores según severidad
  const getSeveridadColor = () => {
    if (severidad === "Severo") return "danger"
    if (severidad === "Moderado") return "warning"
    if (severidad === "Leve") return "info"
    return "success"
  }

  const getFootColor = (piedType) => {
    if (analysisResult.prediction === piedType) {
      if (piedType === 1) return "#ef4444"
      if (piedType === 2) return "#22c55e"
      if (piedType === 3) return "#3b82f6"
    }
    return "#e5e7eb"
  }

  return (
    <div className="card shadow-sm rounded-3 border-0 mb-4">
      <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center py-3">
        <h5 className="mb-0 fw-bold">Resultados del Análisis</h5>
        <button className="btn btn-sm btn-outline-primary rounded-pill px-3">
          <i className="bi bi-printer me-1"></i> Imprimir
        </button>
      </div>
      <div className="card-body">
        {analysisResult.status === "success" ? (
          <div>
            <div className="alert alert-success rounded-3 border-0">
              <h5 className="alert-heading fw-bold">Análisis completado correctamente</h5>
              <p className="mb-0">{analysisResult.message}</p>
            </div>

            {/* Resumen principal */}
            <div className="row mb-4 g-3">
              <div className="col-md-6">
                <div className="card h-100 bg-light border-0 rounded-3">
                  <div className="card-body text-center p-4">
                    <h6 className="text-muted mb-3 text-uppercase letter-spacing-1 small">DIAGNÓSTICO PRIMARIO</h6>
                    <h2 className="mb-0 fw-bold">{tipoArco.tipo}</h2>
                    <p className="mt-3 text-muted">{tipoArco.descripcion}</p>
                    <div className="mt-4">
                      <span className={`badge bg-${getSeveridadColor()} rounded-pill px-3 py-2`}>
                        Severidad: {severidad}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card h-100 border-0 rounded-3 shadow-sm">
                  <div className="card-body p-4">
                    <h6 className="fw-bold mb-3 pb-2 border-bottom">Métricas Detalladas</h6>
                    <div className="d-flex justify-content-between mb-3">
                      <span className="text-muted">Índice de Arco:</span>
                      <span className="fw-bold">{analysisResult.indiceArco.toFixed(2)}</span>
                    </div>
                    {analysisResult && analysisResult.distribucionPeso ? (
                      <div className="d-flex justify-content-between mb-3">
                        <span className="text-muted">Distribución de Peso:</span>
                        <span className="fw-bold">
                          Antepié: {analysisResult.distribucionPeso.antepie.toFixed(2)}%, Mediopie:{" "}
                          {analysisResult.distribucionPeso.mediopie.toFixed(2)}%, Retropie:{" "}
                          {analysisResult.distribucionPeso.retropie.toFixed(2)}%
                        </span>
                      </div>
                    ) : null}
                    <div className="d-flex justify-content-between mb-3">
                      <span className="text-muted">Pronación:</span>
                      <span className="fw-bold">
                        {analysisResult.prediction === 1
                          ? "Tendencia a pronación"
                          : analysisResult.prediction === 3
                            ? "Tendencia a supinación"
                            : "Neutra"}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Estabilidad:</span>
                      <span className="fw-bold">{analysisResult.prediction === 2 ? "Alta" : "Media"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico visual del tipo de pie */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card border-0 rounded-3 shadow-sm">
                  <div className="card-header bg-white border-0 py-3">
                    <h6 className="mb-0 fw-bold">Representación Visual</h6>
                  </div>
                  <div className="card-body text-center py-4">
                    <div className="d-flex justify-content-center">
                      <div className="mx-4 text-center">
                        <h6 className="mb-3">Pie Plano</h6>
                        <svg width="100" height="160" viewBox="0 0 100 160">
                          <path
                            d="M20,20 C50,20 80,20 80,40 C80,60 80,100 70,120 C60,140 40,150 30,140 C20,130 10,90 10,60 C10,30 20,20 20,20 Z"
                            fill={getFootColor(2)}
                            stroke="#333"
                            strokeWidth="1"
                          />
                          <path
                            d="M20,40 C40,40 60,40 80,40 C80,60 80,80 70,100 C50,100 30,100 10,60 C10,50 20,40 20,40 Z"
                            fill={getFootColor(2)}
                            stroke="#333"
                            strokeWidth="1"
                            opacity="0.7"
                          />
                        </svg>
                      </div>
                      <div className="mx-4 text-center">
                        <h6 className="mb-3">Pie Normal</h6>
                        <svg width="100" height="160" viewBox="0 0 100 160">
                          <path
                            d="M20,20 C50,20 80,20 80,40 C80,60 80,100 70,120 C60,140 40,150 30,140 C20,130 10,90 10,60 C10,30 20,20 20,20 Z"
                            fill={getFootColor(1)}
                            stroke="#333"
                            strokeWidth="1"
                          />
                          <path
                            d="M20,40 C40,40 60,40 80,40 C80,60 80,80 70,100 C60,100 40,100 30,90 C20,80 10,60 10,60 C10,50 20,40 20,40 Z"
                            fill={getFootColor(1)}
                            stroke="#333"
                            strokeWidth="1"
                            opacity="0.5"
                          />
                        </svg>
                      </div>
                      <div className="mx-4 text-center">
                        <h6 className="mb-3">Pie Cavo</h6>
                        <svg width="100" height="160" viewBox="0 0 100 160">
                          <path
                            d="M20,20 C50,20 80,20 80,40 C80,60 80,100 70,120 C60,140 40,150 30,140 C20,130 10,90 10,60 C10,30 20,20 20,20 Z"
                            fill={getFootColor(3)}
                            stroke="#333"
                            strokeWidth="1"
                          />
                          <path
                            d="M20,40 C40,40 60,40 80,40 C80,60 80,80 70,100 C65,100 60,100 55,90 C35,70 20,80 10,60 C10,50 20,40 20,40 Z"
                            fill={getFootColor(3)}
                            stroke="#333"
                            strokeWidth="1"
                            opacity="0.3"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recomendaciones y problemas asociados */}
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="card h-100 border-0 rounded-3 shadow-sm">
                  <div className="card-header bg-white border-0 py-3">
                    <h6 className="mb-0 fw-bold">Recomendaciones Clínicas</h6>
                  </div>
                  <div className="card-body">
                    <ul className="list-group list-group-flush">
                      {getRecomendaciones().map((recomendacion, index) => (
                        <li key={index} className="list-group-item border-0 py-3 d-flex align-items-center">
                          <i className="bi bi-check-circle-fill text-success me-2"></i>
                          {recomendacion}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card h-100 border-0 rounded-3 shadow-sm">
                  <div className="card-header bg-white border-0 py-3">
                    <h6 className="mb-0 fw-bold">Consideraciones Adicionales</h6>
                  </div>
                  <div className="card-body">
                    <ul className="list-group list-group-flush">
                      {getProblemasAsociados().map((problema, index) => (
                        <li key={index} className="list-group-item border-0 py-3 d-flex align-items-center">
                          <i className="bi bi-info-circle-fill text-primary me-2"></i>
                          {problema}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Seguimiento y evolución */}
            <div className="row">
              <div className="col-12">
                <div className="card border-0 rounded-3 shadow-sm">
                  <div className="card-header bg-white border-0 py-3">
                    <h6 className="mb-0 fw-bold">Seguimiento y Evolución</h6>
                  </div>
                  <div className="card-body p-4">
                    <div className="row g-4">
                      <div className="col-md-6">
                        <h6 className="text-muted mb-3 text-uppercase letter-spacing-1 small">
                          PRÓXIMA CITA RECOMENDADA
                        </h6>
                        <p className="mb-0 fw-bold">
                          {analysisResult.prediction === 1 && severidad === "Severo"
                            ? "2 semanas"
                            : analysisResult.prediction !== 2
                              ? "1 mes"
                              : "3 meses"}
                        </p>
                      </div>
                      <div className="col-md-6">
                        <h6 className="text-muted mb-3 text-uppercase letter-spacing-1 small">
                          EXÁMENES COMPLEMENTARIOS
                        </h6>
                        <p className="mb-0 fw-bold">
                          {analysisResult.prediction !== 2
                            ? "Se recomienda radiografía para evaluar estructura ósea"
                            : "No se requieren exámenes adicionales en este momento"}
                        </p>
                      </div>
                    </div>

                    <div className="row mt-4">
                      <div className="col-12">
                        <h6 className="text-muted mb-3 text-uppercase letter-spacing-1 small">NOTAS CLÍNICAS</h6>
                        <textarea
                          className="form-control rounded-3 border"
                          rows="3"
                          placeholder="Agregar notas de seguimiento..."
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="alert alert-danger rounded-3 border-0">
            <h5 className="alert-heading fw-bold">Error en el análisis</h5>
            <p className="mb-0">{analysisResult.message}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DiagnosticResults
