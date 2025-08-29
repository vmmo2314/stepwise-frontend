import { useState, useEffect } from "react"
import Step1_SelectPatient from "./Pacientes"
import Step2_Posture from "./analisis/Postura"
import Step3_Pisadas from "./analisis/Pisadas"
import Step4_RGPiel from "./analisis/RespuestaGalvanica"
import Step5_Radiografia from "./analisis/RadiografiaAngular"
import { User, Activity, Footprints, Zap, Bone } from "lucide-react"
import "./dashboardCss/PatientWizard.css"
import Swal from "sweetalert2"
import { useNavigate } from "react-router-dom"

import { saveAnalysis } from "../../../services/AnalysisService"

const steps = [
  { title: "Seleccionar Paciente", subtitle: "Elige o registra un paciente", icon: <User size={20} /> },
  { title: "Análisis de Postura", subtitle: "Estudio de alineación corporal", icon: <Activity size={20} /> },
  { title: "Análisis de Pisadas", subtitle: "Evaluación de pisada", icon: <Footprints size={20} /> },
  { title: "Respuesta Galvánica", subtitle: "Sensibilidad y reacciones", icon: <Zap size={20} /> },
  { title: "Radiografía Angular", subtitle: "Medición angular ósea", icon: <Bone size={20} /> },
]

const PatientWizard = () => {
  const navigate = useNavigate();

  // Paso actual (persistido)
  const [currentStep, setCurrentStep] = useState(() => {
    const storedStep = localStorage.getItem("currentWizardStep")
    const initialStep = storedStep ? Number.parseInt(storedStep, 10) : 0
    return initialStep >= 0 && initialStep < steps.length ? initialStep : 0
  })

  // Paciente seleccionado (persistido)
  const [selectedPatient, setSelectedPatient] = useState(() => {
    const storedPatient = localStorage.getItem("selectedPatient")
    return storedPatient ? JSON.parse(storedPatient) : null
  })

  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Estados por análisis
  const [postureAnalysisData, setPostureAnalysisData] = useState(null)
  const [footAnalysisData, setFootAnalysisData] = useState(null)
  const [radiographyAnalysisData, setRadiographyAnalysisData] = useState(null)
  const [galvanicAnalysisData, setGalvanicAnalysisData] = useState(null)
  const [isSavingToFirebase, setIsSavingToFirebase] = useState(false)

  useEffect(() => {
    localStorage.setItem("currentWizardStep", currentStep.toString())
  }, [currentStep])

  useEffect(() => {
    if (selectedPatient) {
      localStorage.setItem("selectedPatient", JSON.stringify(selectedPatient))
      // Backup para el expediente (por si refrescan)
      sessionStorage.setItem("currentPatientId", selectedPatient.id)
    } else {
      localStorage.removeItem("selectedPatient")
      sessionStorage.removeItem("currentPatientId")
    }
  }, [selectedPatient])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient)
    // backup inmediato
    sessionStorage.setItem("currentPatientId", patient.id)
    goToStep(1)
  }

  const goToStep = (index) => {
    if (index === currentStep || isTransitioning) return
    if (index === 0) {
      setSelectedPatient(null)
      setPostureAnalysisData(null)
      setFootAnalysisData(null)
      setRadiographyAnalysisData(null)
      setGalvanicAnalysisData(null)
      // no limpiamos storage aquí para permitir volver al expediente si ya se guardó
    }
    setTimeout(() => {
      setCurrentStep(index)
      setIsTransitioning(false)
    }, 150)
  }

  const handlePrevious = () => {
    if (currentStep > 0) goToStep(currentStep - 1)
  }

  const getStepStatus = (index) => {
    if (index < currentStep) return "completed"
    if (index === currentStep) return "active"
    return "pending"
  }

  const getVisibleSteps = () => {
    if (isMobile) return [currentStep]
    const visible = []
    if (currentStep === 0) visible.push(0, 1, 2)
    else if (currentStep === steps.length - 1) visible.push(currentStep - 2, currentStep - 1, currentStep)
    else visible.push(currentStep - 1, currentStep, currentStep + 1)
    return visible.filter((step) => step >= 0 && step < steps.length)
  }

  const saveAllAnalysesToFirebase = async () => {
    if (!selectedPatient) {
      Swal.fire({ icon: "error", title: "Paciente no seleccionado", text: "Selecciona un paciente antes de guardar." })
      return
    }

    const missingAnalyses = []
    if (!postureAnalysisData) missingAnalyses.push("Análisis de Postura")
    if (!footAnalysisData) missingAnalyses.push("Análisis de Pisadas")
    if (!galvanicAnalysisData) missingAnalyses.push("Respuesta Galvánica")
    if (!radiographyAnalysisData) missingAnalyses.push("Radiografía Angular")

    if (missingAnalyses.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Análisis incompletos",
        html: `Para finalizar, completa:<br/><strong>${missingAnalyses.join(", ")}</strong>`,
        confirmButtonText: "Entendido",
      })
      return
    }

    setIsSavingToFirebase(true)
    Swal.fire({
      title: "Guardando análisis...",
      text: "Espera mientras se suben los datos.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    })

    try {
      const analysisRecord = {
        patientName: selectedPatient.name,
        posture: postureAnalysisData,
        footPressure: footAnalysisData,
        galvanic: galvanicAnalysisData,
        radiography: radiographyAnalysisData,
      }

      const result = await saveAnalysis(selectedPatient.id, analysisRecord)
      const analysisId = result?.analysisId ?? null

      // Backup para el expediente (y navegación sin URL param)
      sessionStorage.setItem("currentPatientId", selectedPatient.id)
      if (analysisId) sessionStorage.setItem("currentAnalysisId", analysisId)

      Swal.fire({ icon: "success", title: "Análisis guardado", text: "Se guardó correctamente." })

      goToStep(0) // “reset” del wizard
      navigate("/expediente", {
        state: { patientId: selectedPatient.id, analysisId }, // navegación por state
        replace: true,
      })
    } catch (error) {
      console.error("Error al guardar análisis:", error)
      Swal.fire({ icon: "error", title: "Error al guardar", text: `No se pudo guardar: ${error}` })
    } finally {
      setIsSavingToFirebase(false)
    }
  }

  const renderStepComponent = () => {
    switch (currentStep) {
      case 0:
        return <Step1_SelectPatient onSelectPatient={handleSelectPatient} />
      case 1:
        return (
          <Step2_Posture
            patient={selectedPatient}
            onNext={() => goToStep(2)}
            onAnalysisComplete={setPostureAnalysisData}
          />
        )
      case 2:
        return (
          <Step3_Pisadas
            patient={selectedPatient}
            onNext={() => goToStep(3)}
            onAnalysisComplete={setFootAnalysisData}
          />
        )
      case 3:
        return (
          <Step4_RGPiel
            patient={selectedPatient}
            onNext={() => goToStep(4)}
            onAnalysisComplete={setGalvanicAnalysisData}
          />
        )
      case 4:
        return <Step5_Radiografia patient={selectedPatient} onAnalysisComplete={setRadiographyAnalysisData} />
      default:
        return null
    }
  }

  const visibleSteps = getVisibleSteps()
  const isLastStep = currentStep === steps.length - 1
  const isNextButtonDisabled =
    isTransitioning || (currentStep === 0 && !selectedPatient) || (isLastStep && isSavingToFirebase)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container-fluid px-2 sm:px-4 py-3 sm:py-5">
        <div className="wizard-container mx-auto">
          {/* Header */}
          <div className="header-section">
            <h1 className="wizard-title">Asistente de Análisis del Paciente</h1>
            <p className="wizard-description">Completa todos los pasos para realizar un análisis completo y detallado</p>
          </div>

          {/* Steps Carousel */}
          <div className="steps-carousel">
            {steps.map((step, index) => {
              const status = getStepStatus(index)
              const isVisible = visibleSteps.includes(index)
              const isActive = index === currentStep
              const showConnector = isVisible && index < steps.length - 1 && visibleSteps.includes(index + 1) && !isMobile
              const isStepIconDisabled = currentStep === 0 && !selectedPatient && index !== 0

              return (
                <div
                  key={index}
                  className={`step-item ${isVisible ? "visible" : "hidden"} ${isActive ? "active" : ""} ${status === "completed" ? "completed" : ""} ${isStepIconDisabled ? "disabled-step" : ""}`}
                  onClick={() => {
                    if (isStepIconDisabled) {
                      Swal.fire({
                        icon: "info",
                        title: "Selecciona un paciente",
                        text: "Selecciona un paciente antes de avanzar a otros análisis.",
                        toast: true,
                        position: "top-end",
                        showConfirmButton: false,
                        timer: 3000,
                      })
                      return
                    }
                    goToStep(index)
                  }}
                  style={{ display: isVisible ? "flex" : "none", pointerEvents: isTransitioning || isStepIconDisabled ? "none" : "auto" }}
                >
                  {/* Connector - Desktop */}
                  {showConnector && (
                    <div className={`step-connector to-right ${getStepStatus(index) === "completed" ? "completed" : ""}`}></div>
                  )}
                  <div className={`step-circle ${status}`}>{status === "completed" ? "✓" : step.icon}</div>
                  <div className="step-content">
                    <div className="step-title">{step.title}</div>
                    <div className="step-subtitle">{step.subtitle}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Progress Section */}
          <div className="progress-section">
            <span className="progress-text">Paso {currentStep + 1} de {steps.length}</span>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}></div>
            </div>
            <span className="progress-text">{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
          </div>

          {/* Mobile dots */}
          {isMobile && (
            <div className="mobile-steps-indicator">
              {steps.map((_, index) => (
                <div key={index} className={`mobile-step-dot ${getStepStatus(index)}`} onClick={() => goToStep(index)} />
              ))}
            </div>
          )}

          {/* Content */}
          <div className={`content-area ${isTransitioning ? "transitioning" : ""}`}>{renderStepComponent()}</div>

          {/* Navigation */}
          <div className="navigation-section">
            <div className="nav-controls">
              <button className="nav-button secondary" onClick={handlePrevious} disabled={currentStep === 0 || isTransitioning}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="nav-text">Anterior</span>
              </button>

              <div className="step-info">
                <h3 className="step-info-title">{steps[currentStep].title}</h3>
                <p className="step-info-subtitle">{steps[currentStep].subtitle}</p>
              </div>

              <button
                className="nav-button primary"
                onClick={isLastStep ? saveAllAnalysesToFirebase : () => goToStep(currentStep + 1)}
                disabled={isNextButtonDisabled}
              >
                <span className="nav-text">{isLastStep ? (isSavingToFirebase ? "Finalizando..." : "Finalizar") : "Siguiente"}</span>
                {isLastStep && isSavingToFirebase && <i className="fas fa-spinner fa-spin ms-2"></i>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientWizard
