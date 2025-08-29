"use client"

import { useState, useMemo, useContext } from "react"
import { Link } from "react-router-dom"
import { Dropdown } from "react-bootstrap"
import {
  Filter,
  Download,
  Eye,
  FileText,
  Search,
  MoreHorizontal,
  Calendar,
  User,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Activity,
  BarChart3,
  Target,
  Zap,
  Heart,
  Brain,
  Stethoscope,
  Plus,
  RefreshCw,
} from "lucide-react"
import { ThemeContext } from "../../../context/ThemeContext"

// Simulando datos del historial de diagnósticos
const diagnosticHistory = {
  patient: {
    name: "Carlos Mendoza",
    id: "P-75542",
    age: 42,
    lastEvaluation: "15 de mayo, 2023",
    avatar: "/placeholder.svg?height=80&width=80",
  },
  stats: {
    totalDiagnostics: 12,
    treatments: 8,
    improvement: "+65%",
    lastUpdate: "Hace 2 horas",
  },
  diagnostics: [
    {
      id: "#12",
      title: "Análisis de Presión Plantar",
      date: "15 de mayo, 2023",
      timestamp: new Date("2023-05-15"),
      doctor: "Dr. Elena Rodríguez",
      status: "Más reciente",
      priority: "Mejora significativa",
      category: "Biomecánica",
      severity: "low",
      charts: {
        leftFoot: "Mapa de calor - Pie izquierdo",
        rightFoot: "Mapa de calor - Pie derecho",
        pressureGraph: "Gráfica de presión vs tiempo",
      },
      findings: [
        "Reducción significativa en talón izquierdo (25%)",
        "Mayor distribución de carga en antepié derecho",
        "Disminución de asimetría en la marcha",
      ],
      metrics: {
        improvement: 25,
        confidence: 95,
        duration: "45 min",
      },
    },
    {
      id: "#11",
      title: "Análisis Postural",
      date: "28 de marzo, 2023",
      timestamp: new Date("2023-03-28"),
      doctor: "Dr. Miguel Sánchez",
      status: "Mejora moderada",
      priority: "",
      category: "Postura",
      severity: "medium",
      charts: {
        frontalView: "Vista frontal",
        lateralView: "Vista lateral",
        comparison: "Comparativa con evaluación anterior",
      },
      findings: [
        "Mejora en alineación de hombros (15%)",
        "Reducción de inclinación pélvica anterior",
        "Persiste leve escoliosis funcional",
      ],
      metrics: {
        improvement: 15,
        confidence: 88,
        duration: "35 min",
      },
    },
    {
      id: "#10",
      title: "Análisis de Presión Plantar",
      date: "15 de enero, 2023",
      timestamp: new Date("2023-01-15"),
      doctor: "Dr. Elena Rodríguez",
      status: "Requiere atención",
      priority: "",
      category: "Biomecánica",
      severity: "high",
      charts: {
        leftFoot: "Mapa de calor - Pie izquierdo",
        rightFoot: "Mapa de calor - Pie derecho",
        pressureGraph: "Gráfica de presión vs tiempo",
      },
      findings: [
        "Hiperpresión venosa en talón izquierdo",
        "Distribución asimétrica de carga",
        "Pronación excesiva en pie derecho",
      ],
      metrics: {
        improvement: -5,
        confidence: 92,
        duration: "40 min",
      },
    },
    {
      id: "#9",
      title: "Análisis de Marcha",
      date: "5 de noviembre, 2022",
      timestamp: new Date("2022-11-05"),
      doctor: "Dr. Carlos Vega",
      status: "Mejora moderada",
      priority: "",
      category: "Marcha",
      severity: "medium",
      charts: {
        gaitSequence: "Secuencia de marcha",
        jointAngles: "Ángulos articulares",
        dynamicPressure: "Distribución de presión dinámica",
      },
      findings: [
        "Mejora en la fase de apoyo (20%)",
        "Reducción de asimetría en longitud de paso",
        "Persiste rotación externa en cadera derecha",
      ],
      metrics: {
        improvement: 20,
        confidence: 90,
        duration: "50 min",
      },
    },
  ],
}

const DiagnosticHistory = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDiagnostic, setSelectedDiagnostic] = useState(null)

  // Usar el contexto de tema
  const { background } = useContext(ThemeContext)
  const isDark = background.value === "dark"

  // Categorías únicas
  const categories = useMemo(() => {
    const cats = [...new Set(diagnosticHistory.diagnostics.map((d) => d.category))]
    return cats
  }, [])

  // Estados únicos
  const statuses = useMemo(() => {
    const stats = [...new Set(diagnosticHistory.diagnostics.map((d) => d.status))]
    return stats
  }, [])

  // Filtrar y ordenar diagnósticos (siempre descendente)
  const filteredDiagnostics = useMemo(() => {
    const filtered = diagnosticHistory.diagnostics.filter((diagnostic) => {
      const matchesSearch =
        diagnostic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        diagnostic.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        diagnostic.findings.some((f) => f.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesCategory = selectedCategory === "all" || diagnostic.category === selectedCategory
      const matchesStatus = selectedStatus === "all" || diagnostic.status === selectedStatus

      return matchesSearch && matchesCategory && matchesStatus
    })

    // Ordenar siempre descendente
    filtered.sort((a, b) => {
      let aVal, bVal

      switch (sortBy) {
        case "date":
          aVal = a.timestamp
          bVal = b.timestamp
          break
        case "doctor":
          aVal = a.doctor
          bVal = b.doctor
          break
        case "improvement":
          aVal = a.metrics.improvement
          bVal = b.metrics.improvement
          break
        case "title":
          aVal = a.title
          bVal = b.title
          break
        default:
          aVal = a.timestamp
          bVal = b.timestamp
      }

      // Siempre orden descendente
      return aVal < bVal ? 1 : -1
    })

    return filtered
  }, [searchTerm, selectedCategory, selectedStatus, sortBy])

  const getStatusConfig = (status) => {
    const configs = {
      "Más reciente": {
        class: "badge-primary",
        icon: <Clock size={12} />,
        color: "primary",
      },
      "Mejora moderada": {
        class: "badge-success",
        icon: <CheckCircle size={12} />,
        color: "success",
      },
      "Requiere atención": {
        class: "badge-warning",
        icon: <AlertCircle size={12} />,
        color: "warning",
      },
    }
    return configs[status] || { class: "badge-secondary", icon: <Clock size={12} />, color: "secondary" }
  }

  const getSeverityConfig = (severity) => {
    const configs = {
      low: { color: "success", text: "Baja" },
      medium: { color: "warning", text: "Media" },
      high: { color: "danger", text: "Alta" },
    }
    return configs[severity] || configs.medium
  }

  const getPriorityConfig = (priority) => {
    if (priority === "Mejora significativa") return { class: "badge-success", icon: <TrendingUp size={12} /> }
    return { class: "badge-secondary", icon: <Target size={12} /> }
  }

  const renderChart = (chartType, title) => {
    const chartConfigs = {
      leftFoot: { bg: "bg-gradient-primary", icon: <Activity size={24} />, color: "text-white" },
      rightFoot: { bg: "bg-gradient-primary", icon: <Activity size={24} />, color: "text-white" },
      pressureGraph: { bg: "bg-gradient-info", icon: <BarChart3 size={24} />, color: "text-white" },
      frontalView: { bg: "bg-gradient-success", icon: <User size={24} />, color: "text-white" },
      lateralView: { bg: "bg-gradient-success", icon: <User size={24} />, color: "text-white" },
      comparison: { bg: "bg-gradient-warning", icon: <TrendingUp size={24} />, color: "text-white" },
      gaitSequence: { bg: "bg-gradient-info", icon: <Zap size={24} />, color: "text-white" },
      jointAngles: { bg: "bg-gradient-danger", icon: <Target size={24} />, color: "text-white" },
      dynamicPressure: { bg: "bg-gradient-primary", icon: <Heart size={24} />, color: "text-white" },
    }

    const config = chartConfigs[chartType] || chartConfigs.pressureGraph

    return (
      <div className="col-md-4 mb-3">
        <div
          className={`card border-0 ${config.bg} h-100 chart-card`}
          style={{
            background: `linear-gradient(135deg, var(--bs-${config.bg.split("-")[2]}) 0%, var(--bs-${config.bg.split("-")[2]}) 100%)`,
            transition: "all 0.3s ease",
            cursor: "pointer",
          }}
        >
          <div className="card-body text-center d-flex flex-column justify-content-center position-relative overflow-hidden">
            <div
              className="chart-icon-bg position-absolute opacity-10"
              style={{
                fontSize: "4rem",
                top: "-10px",
                right: "-10px",
              }}
            >
              {config.icon}
            </div>
            <div className={`${config.color} mb-2 position-relative z-1`}>{config.icon}</div>
            <h6 className={`card-title mb-0 ${config.color} position-relative z-1`} style={{ fontSize: "0.85rem" }}>
              {title}
            </h6>
          </div>
        </div>
      </div>
    )
  }

  const simulateApiCall = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCategory("all")
    setSelectedStatus("all")
    setSortBy("date")
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="page-titles">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li className="breadcrumb-item active">
            <Link to="/patient-details">Paciente</Link>
          </li>
          <li className="breadcrumb-item active">Historial de Diagnósticos</li>
        </ol>
      </div>

      {/* Header del Paciente Mejorado */}
      <div className="row mb-4">
        <div className="col-xl-12">
          <div className={`card border-0 shadow-sm`}>
            <div className="card-body p-4">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <div className="d-flex align-items-center">
                    <div className="position-relative me-4">
                      <img
                        src={diagnosticHistory.patient.avatar || "/placeholder.svg"}
                        alt="Patient"
                        className="rounded-circle shadow-sm"
                        width={80}
                        height={80}
                        style={{ objectFit: "cover" }}
                      />
                      <div
                        className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-3 border-white"
                        style={{ width: "20px", height: "20px" }}
                      ></div>
                    </div>
                    <div>
                      <h2 className={`font-weight-bold mb-1 d-flex align-items-center`}>
                        {diagnosticHistory.patient.name}
                        <span className="badge bg-light-primary ms-2 text-primary">
                          <User size={14} className="me-1" />
                          Activo
                        </span>
                      </h2>
                      <p className={`mb-1 d-flex align-items-center text-muted`}>
                        <span className="me-3">ID: {diagnosticHistory.patient.id}</span>
                        <span className="me-3">Edad: {diagnosticHistory.patient.age} años</span>
                      </p>
                      <small className={`d-flex align-items-center text-muted`}>
                        <Calendar size={14} className="me-1" />
                        Última evaluación: {diagnosticHistory.patient.lastEvaluation}
                      </small>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="row text-center">
                    <div className="col-4">
                      <div className="stats-card p-3 bg-light-primary rounded">
                        <h3 className="text-primary font-weight-bold mb-1">
                          {diagnosticHistory.stats.totalDiagnostics}
                        </h3>
                        <small className="text-muted">Diagnósticos</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="stats-card p-3 bg-light-success rounded">
                        <h3 className="text-success font-weight-bold mb-1">{diagnosticHistory.stats.treatments}</h3>
                        <small className="text-muted">Tratamientos</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="stats-card p-3 bg-light-warning rounded">
                        <h3 className="text-warning font-weight-bold mb-1">{diagnosticHistory.stats.improvement}</h3>
                        <small className="text-muted">Mejora</small>
                      </div>
                    </div>
                  </div>
                  <div className="text-center mt-2">
                    <small className="text-muted">
                      <RefreshCw size={12} className="me-1" />
                      {diagnosticHistory.stats.lastUpdate}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controles Mejorados */}
      <div className="row mb-4">
        <div className="col-xl-12">
          <div className={`card border-0 shadow-sm`}>
            <div className="card-body p-3">
              {/* Búsqueda Principal */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <div className="search-box position-relative">
                    <Search
                      size={18}
                      className={`position-absolute top-50 start-0 translate-middle-y ms-3 text-muted`}
                    />
                    <input
                      type="text"
                      className={`form-control form-control-lg ps-5 border-1 ${isDark ? "bg-dark text-white" : ""}`}
                      placeholder="Buscar por diagnóstico, doctor o hallazgos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ paddingLeft: "50px" }}
                    />
                    {searchTerm && (
                      <button
                        className="btn btn-sm position-absolute top-50 end-0 translate-middle-y me-2"
                        onClick={() => setSearchTerm("")}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex gap-2 justify-content-end">
                    <button
                      className={`btn ${showFilters ? "btn-primary" : "btn-outline-primary"}`}
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <Filter size={16} className="me-1" />
                      Filtros
                      {(selectedCategory !== "all" || selectedStatus !== "all") && (
                        <span className="badge bg-warning ms-1">!</span>
                      )}
                    </button>

                    <button className="btn btn-outline-success" onClick={simulateApiCall}>
                      <Download size={16} className="me-1" />
                      {isLoading ? <RefreshCw size={16} className="spin" /> : "Exportar"}
                    </button>

                    <button className="btn btn-outline-info">
                      <Plus size={16} className="me-1" />
                      Nuevo Diagnóstico
                    </button>
                  </div>
                </div>
              </div>

              {/* Panel de Filtros Expandible */}
              {showFilters && (
                <div className={`filters-panel border-top pt-3 animate-slide-down`}>
                  <div className="row">
                    <div className="col-md-3">
                      <label className={`form-label mb-1 text-muted`}>Categoría</label>
                      <select
                        className={`form-select form-select-sm`}
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        <option value="all">Todas las categorías</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className={`form-label mb-1 text-muted`}>Estado</label>
                      <select
                        className={`form-select form-select-sm`}
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                      >
                        <option value="all">Todos los estados</option>
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className={`form-label mb-1 text-muted`}>Ordenar por</label>
                      <select
                        className={`form-select form-select-sm`}
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="date">Fecha</option>
                        <option value="doctor">Doctor</option>
                        <option value="improvement">Mejora</option>
                        <option value="title">Título</option>
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className={`form-label mb-1 text-muted`}>Acciones</label>
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-secondary" onClick={clearFilters}>
                          <X size={14} className="me-1" />
                          Limpiar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Resultados */}
              <div className="d-flex justify-content-between align-items-center mt-3">
                <span className="text-muted">{filteredDiagnostics.length} diagnósticos encontrados</span>
                {searchTerm && <span className="text-muted">Búsqueda: "{searchTerm}"</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Diagnósticos Mejorada */}
      <div className="row">
        {filteredDiagnostics.map((diagnostic, index) => {
          const statusConfig = getStatusConfig(diagnostic.status)
          const severityConfig = getSeverityConfig(diagnostic.severity)
          const priorityConfig = getPriorityConfig(diagnostic.priority)

          return (
            <div key={diagnostic.id} className="col-xl-12 mb-4">
              <div
                className={`card border-0 shadow-sm diagnostic-card`}
                style={{
                  transform: "translateY(0)",
                  transition: "all 0.3s ease",
                }}
              >
                <div className="card-header border-0 pb-0 w-100 px-0">
                  <div className="row align-items-start w-100 mx-0">
                    <div className="col-md-8">
                      <div className="d-flex align-items-start">
                        <div className={`me-3 p-2 rounded bg-light-${statusConfig.color}`}>
                          <Stethoscope size={20} className={`text-${statusConfig.color}`} />
                        </div>
                        <div className="flex-grow-1">
                          <h4 className={`fs-18 font-weight-bold mb-1`}>
                            {diagnostic.title}
                            <span className="badge bg-light-secondary ms-2 text-secondary">{diagnostic.id}</span>
                          </h4>
                          <p className={`mb-2 d-flex align-items-center flex-wrap text-muted`}>
                            <span className="me-3">
                              <Calendar size={14} className="me-1" />
                              {diagnostic.date}
                            </span>
                            <span className="me-3">
                              <User size={14} className="me-1" />
                              {diagnostic.doctor}
                            </span>
                            <span className="me-3">
                              <Clock size={14} className="me-1" />
                              {diagnostic.metrics.duration}
                            </span>
                          </p>
                          <div className="d-flex flex-wrap gap-2 mb-2">
                            <span className={`badge bg-${statusConfig.color} d-flex align-items-center`}>
                              {statusConfig.icon}
                              <span className="ms-1">{diagnostic.status}</span>
                            </span>
                            {diagnostic.priority && (
                              <span
                                className={`badge bg-${priorityConfig.class?.includes("success") ? "success" : "secondary"} d-flex align-items-center`}
                              >
                                {priorityConfig.icon}
                                <span className="ms-1">{diagnostic.priority}</span>
                              </span>
                            )}
                            <span className={`badge bg-light-${severityConfig.color} text-${severityConfig.color}`}>
                              Urgencia: {severityConfig.text}
                            </span>
                            <span className="badge bg-light-info text-info">{diagnostic.category}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="d-flex align-items-start justify-content-between">
                        <div className="metrics-mini me-3">
                          <div className="ms-auto">
                            <TrendingUp
                              size={16}
                              className={`me-1 ${diagnostic.metrics.improvement > 0 ? "text-success" : "text-danger"}`}
                            />
                            <span
                              className={`font-weight-bold ${diagnostic.metrics.improvement > 0 ? "text-success" : "text-danger"}`}
                            >
                              {diagnostic.metrics.improvement > 0 ? "+" : ""}
                              {diagnostic.metrics.improvement}%
                            </span>
                          </div>
                          <small className="text-muted">Confianza: {diagnostic.metrics.confidence}%</small>
                        </div>

                        <Dropdown>
                          <Dropdown.Toggle size="sm" className="btn-rounded border-0">
                            <MoreHorizontal size={16} />
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="shadow-sm">
                            <Dropdown.Item className="d-flex align-items-center">
                              <FileText size={16} className="me-2" />
                              Descargar informe
                            </Dropdown.Item>
                            <Dropdown.Item className="d-flex align-items-center">
                              <Eye size={16} className="me-2" />
                              Ver detalles completos
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item className="d-flex align-items-center text-primary">
                              <Brain size={16} className="me-2" />
                              Análisis con IA
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card-body pt-3">
                  {/* Gráficos y Visualizaciones Mejoradas */}
                  <div className="row mb-4">
                    {Object.entries(diagnostic.charts).map(([key, title]) => renderChart(key, title))}
                  </div>

                  {/* Hallazgos Principales Mejorados */}
                  <div className="mb-4">
                    <h6 className={`font-weight-bold mb-3 d-flex align-items-center`}>
                      <Target size={16} className="me-2 text-primary" />
                      Hallazgos principales
                    </h6>
                    <div className="findings-list">
                      {diagnostic.findings.map((finding, idx) => (
                        <div key={idx} className={`finding-item d-flex align-items-start mb-2 p-2 rounded`}>
                          <div className="finding-bullet me-2 mt-1">
                            <div className="bg-primary rounded-circle" style={{ width: "8px", height: "8px" }}></div>
                          </div>
                          <span className={`flex-grow-1`}>{finding}</span>
                          <CheckCircle size={16} className="text-success ms-2" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botones de Acción Mejorados */}
                  <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
                    <div className="d-flex gap-2">
                      <button className="btn btn-outline-primary btn-sm d-flex align-items-center">
                        <Download size={16} className="me-1" />
                        Descargar
                      </button>
                      <button className="btn btn-primary btn-sm d-flex align-items-center">
                        <Eye size={16} className="me-1" />
                        Ver detalles
                      </button>
                      <button className="btn btn-outline-success btn-sm d-flex align-items-center">
                        <Brain size={16} className="me-1" />
                        Análisis IA
                      </button>
                    </div>

                    <div className="confidence-meter">
                      <small className="text-muted">Confianza del diagnóstico</small>
                      <div className="progress" style={{ height: "4px", width: "100px" }}>
                        <div
                          className="progress-bar bg-success"
                          style={{ width: `${diagnostic.metrics.confidence}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Estado de carga */}
      {isLoading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className={`mt-3 text-muted`}>Procesando datos...</p>
        </div>
      )}

      {/* No hay resultados */}
      {filteredDiagnostics.length === 0 && !isLoading && (
        <div className="text-center py-5">
          <div className="empty-state">
            <div className="mb-4">
              <Search size={64} className={`opacity-50 text-muted`} />
            </div>
            <h4 className="text-muted">No se encontraron diagnósticos</h4>
            <p className={`mb-4 text-muted`}>
              Intenta ajustar los filtros o la búsqueda para encontrar los diagnósticos que necesitas.
            </p>
            <button className="btn btn-primary" onClick={clearFilters}>
              <RefreshCw size={16} className="me-1" />
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      {/* Botón para cargar más diagnósticos */}
      {filteredDiagnostics.length > 0 && (
        <div className="text-center btn-lg mx-4">
          <button className="btn btn-outline-primary btn-lg" onClick={simulateApiCall} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw size={16} className="me-2 spin" />
                Cargando...
              </>
            ) : (
              <>
                <Plus size={16} className="me-2" />
                Cargar diagnósticos anteriores
              </>
            )}
          </button>
        </div>
      )}

      {/* Estilos CSS integrados */}
      <style jsx>{`
        /* Estilos para tema oscuro usando data attributes */
        [data-theme-version="dark"] .card {
          background-color: #1a1a1a !important;
          color: #ffffff !important;
          border-color: #333 !important;
        }

        [data-theme-version="dark"] .text-muted {
          color: #aaa !important;
        }

        [data-theme-version="dark"] .bg-light {
          background-color: #333 !important;
        }

        [data-theme-version="dark"] .form-control {
          background-color: #333 !important;
          color: #fff !important;
          border-color: #555 !important;
        }

        [data-theme-version="dark"] .form-select {
          background-color: #333 !important;
          color: #fff !important;
          border-color: #555 !important;
        }

        [data-theme-version="dark"] .finding-item {
          background-color: #333 !important;
        }

        [data-theme-version="dark"] .finding-item:hover {
          background-color: #444 !important;
        }

        [data-theme-version="dark"] .filters-panel {
          background: linear-gradient(135deg, #333 0%, #444 100%) !important;
        }

        [data-theme-version="dark"] ::-webkit-scrollbar-track {
          background: #333 !important;
        }

        .diagnostic-card {
          transition: all 0.3s ease;
        }
        
        .diagnostic-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
        }
        
        .chart-card {
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .chart-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }
        
        .search-box input:focus {
          box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
          border-color: #007bff;
        }
        
        .stats-card {
          transition: all 0.3s ease;
        }
        
        .stats-card:hover {
          transform: translateY(-2px);
        }
        
        .animate-slide-down {
          animation: slideDown 0.3s ease-out;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .finding-item {
          transition: all 0.2s ease;
        }
        
        .finding-item:hover {
          transform: translateX(5px);
        }
        
        .confidence-meter {
          min-width: 120px;
        }
        
        .progress {
          border-radius: 2px;
        }
        
        .badge {
          font-size: 0.75rem;
          padding: 0.35em 0.65em;
        }
        
        .chart-icon-bg {
          opacity: 0.1;
          transform: rotate(15deg);
        }
        
        .bg-gradient-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .bg-gradient-success {
          background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        }
        
        .bg-gradient-info {
          background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
        }
        
        .bg-gradient-warning {
          background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
        }
        
        .bg-gradient-danger {
          background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
        }
        
        .bg-light-primary {
          background-color: rgba(0, 123, 255, 0.1);
        }
        
        .bg-light-success {
          background-color: rgba(40, 167, 69, 0.1);
        }
        
        .bg-light-info {
          background-color: rgba(23, 162, 184, 0.1);
        }
        
        .bg-light-warning {
          background-color: rgba(255, 193, 7, 0.1);
        }
        
        .bg-light-danger {
          background-color: rgba(220, 53, 69, 0.1);
        }
        
        .bg-light-secondary {
          background-color: rgba(108, 117, 125, 0.1);
        }
        
        .font-weight-bold {
          font-weight: 600;
        }
        
        .empty-state {
          max-width: 400px;
          margin: 0 auto;
        }
        
        .filters-panel {
          border-radius: 8px;
          padding: 1rem;
        }
        
        /* Responsive improvements */
        @media (max-width: 768px) {
          .search-box input {
            padding-left: 45px !important;
            font-size: 16px;
          }
          
          .stats-card {
            margin-bottom: 1rem;
          }
          
          .chart-card {
            margin-bottom: 1rem;
          }
          
          .finding-item {
            padding: 0.75rem !important;
          }
          
          .diagnostic-card {
            margin-bottom: 1.5rem;
          }
          
          .metrics-mini {
            display: none;
          }
          
          .confidence-meter {
            min-width: 100px;
          }
        }
        
        @media (max-width: 576px) {
          .page-titles {
            margin-bottom: 1rem;
          }
          
          .card-body {
            padding: 1rem;
          }
          
          .btn-sm {
            padding: 0.25rem 0.5rem;
            font-size: 0.775rem;
          }
          
          .badge {
            font-size: 0.65rem;
          }
          
          .finding-item {
            flex-direction: column;
            align-items: flex-start !important;
          }
          
          .finding-bullet {
            margin-top: 0.5rem;
          }
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </>
  )
}

export default DiagnosticHistory
