// src/jsx/components/Dashboard/PatientHome.jsx
import { useState, useEffect, useRef } from "react"
import {
  Calendar,
  Bell,
  Activity,
  FileText,
  User,
  Heart,
  Clock,
  CheckCircle,
  Eye,
  Phone,
  Mail,
  Footprints,
  AlertCircle,
  ChevronRight,
  Search,
  ArrowRight,
} from "lucide-react"
import { Row, Card, Col, Button, Badge, ProgressBar, Alert } from "react-bootstrap"
import { Link, useNavigate, useLocation } from "react-router-dom"
import PersonalRecommendations from "./PersonalRecommendations.jsx";           // ⬅️ si está en el mismo folder (Dashboard)


// Mantén tu CSS existente
import "./dashboardCss/patientHome.css"

// Servicios (ajusta rutas si difieren en tu proyecto)
import { getLatestAnalysis, getAnalyses } from "../../../services/AnalysisService.js"
import { getPatientById } from "../../../services/patients/patientService.js"

/* ---------------- utils ---------------- */
const dash = (v, fmt = (x) => x) => (v === undefined || v === null || v === "" ? "-" : fmt(v))
const mean = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return null
  const nums = arr
    .map((v) => (typeof v === "number" ? v : typeof v?.value === "number" ? v.value : null))
    .filter((n) => typeof n === "number")
  if (nums.length === 0) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}
const clamp01 = (n) => Math.max(0, Math.min(1, n))
const formatShort = (iso) => {
  if (!iso) return "-"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "-"
  return new Intl.DateTimeFormat("es-MX", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}
// Progreso para barras (si no hay datos devuelve 0)
const progressFrom = {
  indiceArco: (ia) => Math.round(clamp01(typeof ia === "number" ? ia : 0) * 100),
  gsr: (us) => Math.round(clamp01((typeof us === "number" ? us : 0) / 100) * 100), // 0–100 μS
  volt: (v) => Math.round(clamp01((typeof v === "number" ? v : 0) / 5) * 100), // 0–5 V
  res: (r) => Math.round(clamp01((typeof r === "number" ? r : 0) / 10000) * 100), // 0–10kΩ
}
const getStatusColor = (status) => (status === "confirmed" ? "success" : "warning")

/* --------------- componente --------------- */
const PatientDashboard = () => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [loading, setLoading] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)
  const animRef = useRef(null)

  // Resolver patientId sin depender de la URL
  const statePatientId = state?.patientId ?? null
  const storedPatientId = sessionStorage.getItem("currentPatientId") || localStorage.getItem("currentPatientId")
  const patientId = statePatientId || storedPatientId || null

  // Estados
  const [patient, setPatient] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [analysesCount, setAnalysesCount] = useState(0)

  // Guardar backup si venimos con state
  useEffect(() => {
    if (statePatientId) sessionStorage.setItem("currentPatientId", statePatientId)
  }, [statePatientId])

  useEffect(() => {
    let cancel = false
    const load = async () => {
      if (!patientId) {
        setLoading(false)
        return
      }
      try {
        const p = await getPatientById(patientId).catch(() => null)
        const a = await getLatestAnalysis(patientId).catch(() => null)
        let count = 0
        try {
          const list = await getAnalyses(patientId, { limit: 10, order: "desc" })
          count = Array.isArray(list) ? list.length : 0
        } catch (_) {}
        if (!cancel) {
          setPatient(p)
          setAnalysis(a)
          setAnalysesCount(count)
        }
      } finally {
        if (!cancel) setLoading(false)
      }
    }
    load()
    return () => {
      cancel = true
      if (animRef.current) clearTimeout(animRef.current)
    }
  }, [patientId])

  const handleDiagCardClick = () => {
    if (isAnimating) return
    setIsAnimating(true)
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 120 : 1800
    animRef.current = setTimeout(() => {
      setIsAnimating(false)
      navigate("/historial-diagnosticos")
    }, delay)
  }
  const handleDiagCardClick2 = () => {
    if (isAnimating) return
    setIsAnimating(true)
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 120 : 1800
    animRef.current = setTimeout(() => {
      setIsAnimating(false)
      navigate("/app-calender")
    }, delay)
  }

  /* --------- derivaciones a partir del backend --------- */
  const personal = {
    name: dash(patient?.name || analysis?.patientName || null),
    idCorto: dash(patientId ? `#${patientId.slice(0, 6)}…` : null),
    age: dash(patient?.datos_personales?.edad, (x) => `${x} años`),
    phone: dash(patient?.telefono),
    email: dash(patient?.email),
    address: dash(patient?.direccion),
    bloodType: dash(patient?.datos_personales?.tipo_sangre),
    sexo: dash(patient?.datos_personales?.sexo),
  }

  const foot = analysis?.footPressure || {}
  const gsr = analysis?.galvanic || {}
  const ggraph = gsr?.graphData || {}
  const voltAvg = mean(ggraph?.voltage)
  const resAvg = mean(ggraph?.resistance)
  const usAvg = mean(ggraph?.us)
  const usActual = typeof gsr?.usActual === "number" ? gsr.usActual : (usAvg ?? null)

  const footMetrics = [
    {
      label: "Índice de arco",
      value: dash(foot?.indiceArco, (x) => x.toFixed(3)),
      progress: progressFrom.indiceArco(foot?.indiceArco || 0),
      variant: "info",
    },
    {
      label: "GSR actual",
      value: dash(usActual, (x) => `${x.toFixed(1)}μS`),
      progress: progressFrom.gsr(usActual || 0),
      variant: "success",
    },
    {
      label: "Voltaje promedio",
      value: dash(voltAvg, (x) => `${x.toFixed(2)}V`),
      progress: progressFrom.volt(voltAvg || 0),
      variant: "warning",
    },
    {
      label: "Resistencia promedio",
      value: dash(resAvg, (x) => `${Math.round(x)}Ω`),
      progress: progressFrom.res(resAvg || 0),
      variant: "secondary",
    },
  ]

  // valores ficticios/placeholder para las secciones que aún no conectas
  const placeholderAppointments = [
    {
      id: "appt-1",
      date: "-",
      time: "-",
      doctor: "-",
      specialty: "-",
      type: "-",
      status: "pending",
    },
  ]
  const placeholderNotifications = [
    {
      id: "n1",
      type: "info",
      title: "-",
      description: "-",
      time: "-",
      read: true,
    },
  ]
  const placeholderRecommendations = (analysis?.recomendaciones || []).slice(0, 5).map((r, i) => ({
    icon: <Footprints size={16} />,
    title: "Recomendación",
    description: r,
    priority: "media",
    completed: false,
    id: `rec-${i}`,
  }))

  const totalRecommendations = analysis?.recomendaciones?.length || 0

  const statsCards = [
    { icon: <Calendar size={30} />, value: "-", label: "Citas", sublabel: "próximas", variant: "primary" },
    { icon: <Bell size={30} />, value: "-", label: "Notificaciones", sublabel: "nuevas", variant: "danger" },
  ]

  if (!patientId && !loading) {
    return (
      <div className="container-fluid px-4 py-5">
        <div className="alert alert-warning">
          No se pudo determinar el paciente para el dashboard.
          <div className="mt-2">
            <Button size="sm" onClick={() => navigate("/pacientes")}>
              Ir a lista de pacientes
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container-fluid px-4 py-5">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando información del paciente...</span>
          </div>
          <p className="mt-3 text-muted">Preparando su dashboard…</p>
        </div>
      </div>
    )
  }

  return (
      <div
        className="container-fluid px-2 px-md-4 py-3 py-md-5 pt-4 pt-md-5"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
      >
        {/* Header de Bienvenida */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-3">
        <div className="d-flex align-items-center">
          <div className="me-3">
            <User className="text-primary" size={28} />
          </div>
          <div>
            <h3 className="mb-1 text-dark fw-bold">¡Hola, {personal.name}! 👋</h3>
            <p className="text-muted mb-0 small">{personal.idCorto}</p>
          </div>
        </div>
      </div>

      

      <Row className="gx-2 gy-3 gy-md-4">
        {/* Panel Principal */}
        <Col lg={8}>
          {/* Estadísticas Rápidas (NO se quitan, valores “-” si no hay) */}
          <Row className="g-2 g-md-3 mb-3 mb-md-4">
            {statsCards.map((stat, i) => (
              <Col key={i} className="d-flex justify-content-center">
                <Card className="w-100 rounded-3 shadow-sm border-0 h-100">
                  <Card.Body className="p-2 p-md-3 d-flex flex-column justify-content-between text-center">
                    <div className="d-flex align-items-center justify-content-between gap-2">
                      <span className={`text-${stat.variant} flex-shrink-0`}>{stat.icon}</span>
                      <small className="text-muted text-nowrap">{stat.sublabel}</small>
                    </div>
                    <div className="mt-1">
                      <div className="fw-bold text-dark lh-1 d-md-none fs-4">{stat.value}</div>
                      <div className="fw-bold text-dark lh-1 d-none d-md-block fs-2">{stat.value}</div>
                      <div className="text-muted small text-truncate">{stat.label}</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Citas Recientes (sección intacta) */}
          <div className="diag-card-wrap">
            <Card
              className="border-0 shadow-sm rounded-3 mb-3 mb-md-4 h-auto"
              onClick={handleDiagCardClick2}
              role="button"
              aria-label="Ir a últimos diagnósticos"
            >
              <Card.Body className="p-3 p-md-4">
                <h5 className="fw-bold mb-3">Citas recientes</h5>
                <div className="d-flex align-items-center justify-content-between p-3 p-md-4 rounded-3 border flex-wrap gap-2">
                  <div className="me-3">
                    <div className="fw-semibold">Tus ultimas citas</div>
                  </div>
                  <span className="d-inline-flex align-items-center gap-2">
                    <span className="fw-medium">Ver más</span>
                    <ChevronRight size={22} aria-hidden="true" />
                  </span>
                </div>
              </Card.Body>
            </Card>

            {isAnimating && (
              <div className="diag-overlay rounded-3">
                <div className="diag-steps">
                  <div className="diag-step d1">
                    <FileText size={22} />
                    <small className="text-muted">Cargando</small>
                  </div>
                  <div className="diag-step d2">
                    <Search size={22} />
                    <small className="text-muted">Buscando</small>
                  </div>
                  <div className="diag-step d3">
                    <CheckCircle size={22} />
                    <small className="text-muted">Procesando</small>
                  </div>
                  <div className="diag-step d4">
                    <ArrowRight size={22} />
                    <small className="text-muted">Completado</small>
                  </div>
                </div>
                <div className="diag-track" aria-hidden="true"></div>
              </div>
            )}
          </div>

          {/* Análisis Biomecánico del Pie (sección intacta) */}
          <Card className="border-0 shadow-sm rounded-3 mb-3 mb-md-4 h-auto">
            <Card.Body className="p-3 p-md-4">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 gap-2">
                <h5 className="fw-bold mb-0">Análisis Biomecánico del Pie</h5>
                <small className="text-muted">Último análisis: {dash(analysis?.timestamp, formatShort)}</small>
              </div>

              <Row className="g-3 g-md-4">
                <Col lg={8}>
                  <div
                    className="bg-light rounded-3 d-flex align-items-center justify-content-center p-4"
                    style={{ minHeight: "250px" }}
                  >
                    <div className="text-center">
                      <Footprints size={60} className="text-primary mb-3" />
                      <h6 className="fw-semibold mb-2">Clasificación</h6>
                      <p className="text-muted mb-3 small">
                        {dash(
                          analysis?.footPressure?.tipoPie?.nombre ||
                            (analysis?.footPressure?.prediction === 1
                              ? "Pie plano"
                              : analysis?.footPressure?.prediction === 2
                                ? "Pie normal"
                                : analysis?.footPressure?.prediction === 3
                                  ? "Pie cavo"
                                  : null),
                        )}
                      </p>
                      <Button variant="primary" size="sm" className="rounded-3" onClick={() => navigate("/expediente")}>
                        <Eye size={14} className="me-1" />
                        Ver en expediente
                      </Button>
                    </div>
                  </div>
                </Col>

                <Col lg={4}>
                  <div className="h-100 d-flex flex-column">
                    <h6 className="fw-semibold mb-3">Métricas del Análisis</h6>
                    <div className="flex-fill">
                      {footMetrics.map((m, idx) => (
                        <div key={idx} className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <small className="text-muted">{m.label}</small>
                            <small className="fw-semibold">{m.value}</small>
                          </div>
                          <ProgressBar
                            variant={m.variant}
                            now={typeof m.progress === "number" ? m.progress : 0}
                            style={{ height: "6px" }}
                            className="rounded-pill"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </Col>
              </Row>

              <Alert variant="light" className="mt-3 p-3 rounded-3">
                <div className="d-flex align-items-start">
                  <AlertCircle size={16} className="text-info me-2 flex-shrink-0 mt-1" />
                  <div>
                    <small className="fw-semibold d-block mb-1">Recomendación:</small>
                    <small className="text-muted">{dash(analysis?.recomendaciones?.[0] || null, (x) => x)}</small>
                  </div>
                </div>
              </Alert>
            </Card.Body>
          </Card>
        </Col>

        {/* Panel Derecho (no se quita nada) */}
        <Col lg={4}>
          <div className="d-flex flex-column">
            {/* Información Personal */}
            <Card className="border-0 shadow-sm rounded-3 mb-3 mb-md-4 h-auto">
              <Card.Body className="p-3 p-md-4">
                <h5 className="fw-bold mb-3">Mi Información</h5>
                <div className="d-flex flex-column gap-3">
                  {[
                    {
                      icon: <User size={16} />,
                      label: "Edad",
                      value: personal.age,
                    },
                    {
                      icon: <Phone size={16} />,
                      label: "Teléfono",
                      value: personal.phone,
                    },
                    {
                      icon: <Mail size={16} />,
                      label: "Email",
                      value: personal.email,
                    },
                    {
                      icon: <Heart size={16} />,
                      label: "Tipo de Sangre",
                      value: personal.bloodType,
                    },
                  ].map((item, index) => (
                    <div key={index} className="d-flex align-items-center">
                      <div className="text-muted me-2">{item.icon}</div>
                      <div className="flex-fill">
                        <small className="text-muted d-block">{item.label}:</small>
                        <small className="fw-semibold">{item.value}</small>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-top">
                  <small className="text-muted d-block mb-2">Alergias:</small>
                  <div className="d-flex gap-1 flex-wrap">
                    {/* Si no hay alergias mostramos un solo guion */}
                    {Array.isArray(patient?.alergias) && patient.alergias.length > 0 ? (
                      patient.alergias.map((a, i) => (
                        <Badge key={i} bg="danger" className="rounded-pill">
                          {a}
                        </Badge>
                      ))
                    ) : (
                      <small className="text-muted">-</small>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        </Col>
        {/* Recomendaciones Personales */}
        <Card className="mb-3 mb-md-4 h-auto">
          <Card.Body className="p-0">
            <PersonalRecommendations
              readOnly={true}         // 👈 lo usamos solo en modo lectura para dashboard
            />
            <div className="px-3 pb-3">
              <Link
                to={`/Plan/`}  // 👈 navega al plan del paciente logeado
                className="text-decoration-none cta-arrow d-inline-flex align-items-center gap-2 mt-3"
                aria-label="Ir a plan"
              >
                <span className="fw-medium">Ver plan completo</span>
                <ChevronRight size={22} className="chev-icon" aria-hidden="true" />
              </Link>
            </div>
          </Card.Body>
        </Card>
      </Row>
    </div>
  )
}

export default PatientDashboard
