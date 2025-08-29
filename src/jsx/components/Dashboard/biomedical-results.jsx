"use client"

import { useState, useEffect } from "react"
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  FileText,
  Calendar,
  User,
  Stethoscope,
  Download,
  Share2,
} from "lucide-react"
import { Row, Card, Col, Button, Badge, ProgressBar } from "react-bootstrap"

// Datos de ejemplo para los resultados biomédicos
const biomedicalData = {
  patient: {
    name: "Juan Pérez",
    id: "#P-00123",
    date: "14/06/2023",
  },
  results: {
    glucosa: { value: 98, unit: "mg/dL", status: "normal", range: "70-100" },
    colesterolTotal: { value: 215, unit: "mg/dL", status: "elevado", range: "< 200" },
    presionArterial: { systolic: 128, diastolic: 82, unit: "mmHg", status: "elevada", range: "120/80" },
    hdl: { value: 42, unit: "mg/dL", status: "bajo", range: "> 40" },
    ldl: { value: 145, unit: "mg/dL", status: "elevado", range: "< 100" },
    trigliceridos: { value: 180, unit: "mg/dL", status: "elevado", range: "< 150" },
    hemoglobina: { value: 14.2, unit: "g/dL", status: "normal", range: "12-16" },
  },
  diagnosis: {
    main: "Basado en sus resultados recientes, se identifica un perfil lipídico alterado con colesterol total y LDL elevados. HDL bajo. La presión arterial muestra valores ligeramente elevados.",
    risk: "moderado",
    riskColor: "warning",
  },
  recommendations: [
    {
      icon: <User size={16} />,
      title: "Dieta",
      description:
        "Reducir el consumo de grasas saturadas y aumentar el consumo de fibra. Incluir más vegetales y pescados ricos en omega 3.",
    },
    {
      icon: <Activity size={16} />,
      title: "Actividad Física",
      description: "Ejercicio aeróbico de intensidad moderada, mínimo 30 minutos, 5 días a la semana.",
    },
    {
      icon: <Stethoscope size={16} />,
      title: "Medicación",
      description: "Continuar con la dosis actual de Atorvastatina 10mg diarios. Programar revisión en 3 meses.",
    },
    {
      icon: <Calendar size={16} />,
      title: "Seguimiento",
      description: "Programar análisis de control en 3 meses para evaluar la evolución del perfil lipídico.",
    },
  ],
  additionalStudies: [
    {
      title: "Electrocardiograma",
      status: "Normal",
      description:
        "Ritmo sinusal normal. No se observan alteraciones significativas en la conducción o repolarización.",
      date: "10/06/2023",
    },
    {
      title: "Ecografía Cardíaca",
      status: "Normal",
      description:
        "Función sistólica no evidenciada con ecocardiograma. Función cardíaca derecha. Grosor intima-media aumentado.",
      date: "10/06/2023",
    },
    {
      title: "Ecocardiograma",
      status: "Normal",
      description: "Función sistólica conservada. Fracción de eyección 60%. No alteraciones valvulares significativas.",
      date: "12/06/2023",
    },
  ],
}

const BiomedicalResults = () => {
  const [loading, setLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState(null)

  useEffect(() => {
    // Simular carga de datos
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case "normal":
        return "success"
      case "elevado":
        return "warning"
      case "bajo":
        return "danger"
      case "elevada":
        return "warning"
      default:
        return "secondary"
    }
  }

  const getStatusBadge = (status) => {
    const colors = {
      normal: "success",
      elevado: "warning",
      bajo: "danger",
      elevada: "warning",
    }

    return (
      <Badge bg={colors[status]} className="ms-2 rounded-pill">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getProgressValue = (value, status) => {
    switch (status) {
      case "normal":
        return 100
      case "elevado":
        return 75
      case "bajo":
        return 25
      case "elevada":
        return 80
      default:
        return 50
    }
  }

  if (loading) {
    return (
      <div className="container-fluid px-4 py-5">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando resultados...</span>
          </div>
          <p className="mt-3 text-muted">Procesando resultados biomédicos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid px-4 py-5">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <div className="header-icon-container me-3">
            <Activity className="header-icon text-primary" size={28} />
          </div>
          <div>
            <h3 className="mb-1 text-dark fw-bold">Resumen de Resultados</h3>
            <p className="text-muted mb-0">
              Actualizado: {biomedicalData.patient.date} • Paciente: {biomedicalData.patient.name}
            </p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" size="sm" className="rounded-3">
            <Download size={16} className="me-1" />
            Descargar
          </Button>
          <Button variant="outline-secondary" size="sm" className="rounded-3">
            <Share2 size={16} className="me-1" />
            Compartir
          </Button>
        </div>
      </div>

      <Row>
        {/* Panel Izquierdo - Resultados */}
        <Col lg={8} className="d-flex flex-column">
          {/* Métricas Principales */}
          <Row className="mb-4">
            <Col md={4} className="mb-3">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="text-muted mb-0">Glucosa</h6>
                    <small className="text-muted">{biomedicalData.results.glucosa.unit}</small>
                  </div>
                  <h2 className="fw-bold text-dark mb-1">{biomedicalData.results.glucosa.value}</h2>
                  {getStatusBadge(biomedicalData.results.glucosa.status)}
                  <ProgressBar
                    variant={getStatusColor(biomedicalData.results.glucosa.status)}
                    now={getProgressValue(biomedicalData.results.glucosa.value, biomedicalData.results.glucosa.status)}
                    className="mt-3"
                    style={{ height: "6px" }}
                  />
                  <small className="text-muted d-block mt-2">Rango: {biomedicalData.results.glucosa.range}</small>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4} className="mb-3 d-flex flex-column">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="text-muted mb-0">Colesterol Total</h6>
                    <small className="text-muted">{biomedicalData.results.colesterolTotal.unit}</small>
                  </div>
                  <h2 className="fw-bold text-dark mb-1">{biomedicalData.results.colesterolTotal.value}</h2>
                  {getStatusBadge(biomedicalData.results.colesterolTotal.status)}
                  <ProgressBar
                    variant={getStatusColor(biomedicalData.results.colesterolTotal.status)}
                    now={getProgressValue(
                      biomedicalData.results.colesterolTotal.value,
                      biomedicalData.results.colesterolTotal.status,
                    )}
                    className="mt-3"
                    style={{ height: "6px" }}
                  />
                  <small className="text-muted d-block mt-2">
                    Rango: {biomedicalData.results.colesterolTotal.range}
                  </small>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4} className="mb-3 d-flex flex-column">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="text-muted mb-0">Presión Arterial</h6>
                    <small className="text-muted">{biomedicalData.results.presionArterial.unit}</small>
                  </div>
                  <h2 className="fw-bold text-dark mb-1">
                    {biomedicalData.results.presionArterial.systolic}/{biomedicalData.results.presionArterial.diastolic}
                  </h2>
                  {getStatusBadge(biomedicalData.results.presionArterial.status)}
                  <ProgressBar
                    variant={getStatusColor(biomedicalData.results.presionArterial.status)}
                    now={getProgressValue(
                      biomedicalData.results.presionArterial.systolic,
                      biomedicalData.results.presionArterial.status,
                    )}
                    className="mt-3"
                    style={{ height: "6px" }}
                  />
                  <small className="text-muted d-block mt-2">
                    Rango: {biomedicalData.results.presionArterial.range}
                  </small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Métricas Secundarias */}
          <Row className="mb-4">
            <Col md={3} className="mb-3">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center">
                  <h6 className="text-muted mb-2">HDL</h6>
                  <h4 className="fw-bold text-dark mb-1">{biomedicalData.results.hdl.value}</h4>
                  {getStatusBadge(biomedicalData.results.hdl.status)}
                  <ProgressBar
                    variant={getStatusColor(biomedicalData.results.hdl.status)}
                    now={getProgressValue(biomedicalData.results.hdl.value, biomedicalData.results.hdl.status)}
                    className="mt-2"
                    style={{ height: "4px" }}
                  />
                </Card.Body>
              </Card>
            </Col>

            <Col md={3} className="mb-3">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center">
                  <h6 className="text-muted mb-2">LDL</h6>
                  <h4 className="fw-bold text-dark mb-1">{biomedicalData.results.ldl.value}</h4>
                  {getStatusBadge(biomedicalData.results.ldl.status)}
                  <ProgressBar
                    variant={getStatusColor(biomedicalData.results.ldl.status)}
                    now={getProgressValue(biomedicalData.results.ldl.value, biomedicalData.results.ldl.status)}
                    className="mt-2"
                    style={{ height: "4px" }}
                  />
                </Card.Body>
              </Card>
            </Col>

            <Col md={3} className="mb-3">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center">
                  <h6 className="text-muted mb-2">Triglicéridos</h6>
                  <h4 className="fw-bold text-dark mb-1">{biomedicalData.results.trigliceridos.value}</h4>
                  {getStatusBadge(biomedicalData.results.trigliceridos.status)}
                  <ProgressBar
                    variant={getStatusColor(biomedicalData.results.trigliceridos.status)}
                    now={getProgressValue(
                      biomedicalData.results.trigliceridos.value,
                      biomedicalData.results.trigliceridos.status,
                    )}
                    className="mt-2"
                    style={{ height: "4px" }}
                  />
                </Card.Body>
              </Card>
            </Col>

            <Col md={3} className="mb-3">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center">
                  <h6 className="text-muted mb-2">Hemoglobina</h6>
                  <h4 className="fw-bold text-dark mb-1">{biomedicalData.results.hemoglobina.value}</h4>
                  {getStatusBadge(biomedicalData.results.hemoglobina.status)}
                  <ProgressBar
                    variant={getStatusColor(biomedicalData.results.hemoglobina.status)}
                    now={getProgressValue(
                      biomedicalData.results.hemoglobina.value,
                      biomedicalData.results.hemoglobina.status,
                    )}
                    className="mt-2"
                    style={{ height: "4px" }}
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>

        {/* Evolución Histórica */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body className="h-50 d-flex flex-column">
            <h5 className="fw-bold mb-2">Evolución Histórica</h5>
            <div className="chart-placeholder bg-light rounded-3 flex-grow-1 d-flex align-items-center justify-content-center">
              <div className="text-center w-100">
                <TrendingUp size={40} className="text-muted mb-1" />
                <p className="text-muted mb-0">Gráfico de evolución histórica</p>
                <small className="text-muted">Los datos se mostrarían aquí con una librería de gráficos</small>
              </div>
            </div>
            <div className="d-flex justify-content-center mt-2">
              <div className="d-flex gap-3">
                <div className="d-flex align-items-center">
                  <div className="bg-primary rounded-circle me-2" style={{ width: "12px", height: "12px" }}></div>
                  <small>Glucosa</small>
                </div>
                <div className="d-flex align-items-center">
                  <div className="bg-warning rounded-circle me-2" style={{ width: "12px", height: "12px" }}></div>
                  <small>Colesterol</small>
                </div>
                <div className="d-flex align-items-center">
                  <div className="bg-info rounded-circle me-2" style={{ width: "12px", height: "12px" }}></div>
                  <small>Presión Sistólica</small>
                </div>
                <div className="d-flex align-items-center">
                  <div className="bg-secondary rounded-circle me-2" style={{ width: "12px", height: "12px" }}></div>
                  <small>Presión Diastólica</small>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
        </Col>

        {/* Panel Derecho - Diagnóstico y Recomendaciones */}
        <Col lg={4} className="d-flex flex-column">
          {/* Diagnóstico */}
          <Card className="border-0 shadow-sm mb-3">
            <Card.Body className="h-100 d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <FileText className="text-primary me-2" size={20} />
                <h5 className="fw-bold mb-0 text-primary">Diagnóstico Predictivo</h5>
              </div>
              <div className="flex-grow-1 d-flex flex-column">
                <p className="text-dark mb-3 small" style={{ fontSize: "0.95rem", lineHeight: "1.6" }}>
                  Con base en el análisis biomecánico de la pisada registrado por nuestro sistema de sensores de presión,
                  se ha identificado un <strong>perfil podológico alterado</strong> que sugiere un <strong>arco plantar bajo</strong> (pie plano).
                  Este patrón puede estar relacionado con desalineaciones en la marcha y sobrecarga en articulaciones específicas.
                </p>
                <p className="text-muted small mb-3">
                  Además, el modelo ha detectado una posible propensión a <strong>fascitis plantar</strong> y <strong>síndrome rotuliano</strong>,
                  basándose en patrones coincidentes dentro del dataset clínico.
                </p>
                <div className="d-flex align-items-center">
                  <AlertTriangle className="text-warning me-2" size={18} />
                  <div>
                    <h6 className="fw-semibold mb-0">Nivel de riesgo estimado</h6>
                    <Badge bg={biomedicalData.diagnosis.riskColor} className="rounded-pill text-uppercase">
                      {biomedicalData.diagnosis.risk}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button variant="primary" size="sm" className="w-100 rounded-3 mt-auto">
                Ver informe completo del análisis
              </Button>
            </Card.Body>
          </Card>
          {/* Recomendaciones */}
          <Card
            className="border-0 shadow-sm flex-grow-1 d-flex flex-column">
            <Card.Body className="h-100 d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <CheckCircle className="text-success me-2" size={20} />
                <h5 className="fw-bold mb-0">Recomendaciones</h5>
              </div>
              <div className="recommendations-list flex-grow-1 overflow-auto">
                {biomedicalData.recommendations.map((rec, index) => (
                  <div key={index} className="recommendation-item mb-3 p-3 bg-light rounded-3">
                    <div className="d-flex align-items-start">
                      <div className="recommendation-icon me-3 mt-1 text-primary">{rec.icon}</div>
                      <div className="flex-grow-1">
                        <h6 className="fw-semibold mb-1">{rec.title}</h6>
                        <p className="text-muted mb-0 small">{rec.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="primary" className="w-100 rounded-3 mt-3">
                Agendar Cita de Seguimiento
              </Button>
            </Card.Body>
          </Card>
        </Col>
            {/* Estudios Adicionales */}
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h5 className="fw-bold mb-3">Estudios Adicionales</h5>
              <Row>
                {biomedicalData.additionalStudies.map((study, index) => (
                  <Col md={4} key={index} className="mb-3">
                    <Card className="h-100 border border-light">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="fw-semibold mb-0">{study.title}</h6>
                          <Badge bg="success" className="rounded-pill">
                            {study.status}
                          </Badge>
                        </div>
                        <p className="text-muted small mb-2">{study.description}</p>
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">Realizado: {study.date}</small>
                          <Button variant="link" size="sm" className="p-0 text-primary">
                            Ver detalles
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
      </Row>
    </div>
  )
}

export default BiomedicalResults
