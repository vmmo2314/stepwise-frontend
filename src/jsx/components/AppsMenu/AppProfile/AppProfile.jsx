import { Fragment, useReducer, useState, useEffect } from "react"
import { Button, Modal, Tab, Nav, Form } from "react-bootstrap"
import { useAuthUser } from "../../../../services/CurrentAuth"
import ProfileService from "../../../../services/ProfileService"

// Import default profile image
import defaultProfile from "../../../../assets/images/profile/profile.png"

const initialState = {
  profilePhoto: false,
  personalInfoModal: false,
  medicalInfoModal: false,
  contactInfoModal: false,
}

const reducer = (state, action) => {
  switch (action.type) {
    case "profilePhoto":
      return { ...state, profilePhoto: !state.profilePhoto }
    case "personalInfoModal":
      return { ...state, personalInfoModal: !state.personalInfoModal }
    case "medicalInfoModal":
      return { ...state, medicalInfoModal: !state.medicalInfoModal }
    case "contactInfoModal":
      return { ...state, contactInfoModal: !state.contactInfoModal }
    default:
      return state
  }
}

const PatientProfileCompletion = () => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [profileImage, setProfileImage] = useState(defaultProfile)
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState(null)
  const [completion, setCompletion] = useState(0)

  const { uid, email, rol, nombre, organizacionId } = useAuthUser()

  const [formData, setFormData] = useState({
    // Datos personales
    edad: "",
    sexo: "",
    
    // Datos médicos básicos
    tipo_sangre: "",
    peso_kg: "",
    estatura_cm: "",
    IMC: "",
    
    // Información médica importante
    alergias: "",
    medicamentos_actuales: "",
    enfermedades_cronicas: "",
    antecedentes_familiares: "",
    cirugias_previas: "",
    vacunas: "",
    
    // Información de contacto
    telefono: "",
    telefono_emergencia: "",
    direccion: "",
    contacto_emergencia: "",
    relacion_contacto_emergencia: "",
    
    // Datos profesionales (para médicos)
    especialidad: "",
    cedula_profesional: "",
  })

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true)
        console.log("🔄 Cargando datos del perfil...")

        const response = await ProfileService.getProfile()
        const { profile, completion: completionPercentage } = response.data

        setProfileData(profile)
        setCompletion(completionPercentage)

        if (profile) {
          if (rol === "paciente") {
            setFormData({
              // Datos personales
              edad: profile.datos_personales?.edad || "",
              sexo: profile.datos_personales?.sexo || "",
              
              // Datos básicos y medidas
              peso_kg: profile.datos_personales?.peso_kg || "",
              estatura_cm: profile.datos_personales?.estatura_cm || "",
              IMC: profile.datos_personales?.IMC || "",
              
              // Datos médicos
              tipo_sangre: profile.datos_medicos?.tipo_sangre || "",
              
              // Información médica importante
              alergias: profile.datos_medicos?.alergias || "",
              medicamentos_actuales: profile.datos_medicos?.medicamentos_actuales || "",
              enfermedades_cronicas: profile.datos_medicos?.enfermedades_cronicas || "",
              antecedentes_familiares: profile.datos_medicos?.antecedentes_familiares || "",
              cirugias_previas: profile.datos_medicos?.cirugias_previas || "",
              vacunas: profile.datos_medicos?.vacunas || "",
              
              // Información de contacto
              telefono: profile.info_contacto?.telefono || "",
              telefono_emergencia: profile.info_contacto?.telefono_emergencia || "",
              direccion: profile.info_contacto?.direccion || "",
              contacto_emergencia: profile.info_contacto?.contacto_emergencia || "",
              relacion_contacto_emergencia: profile.info_contacto?.relacion_contacto_emergencia || "",
            })
          } else if (rol === "doctor") {
            setFormData({
              especialidad: profile.especialidad || "",
              cedula_profesional: profile.cedula_profesional || "",
              telefono: profile.telefono || "",
              direccion: profile.direccion || "",
            })
          }
        }

        console.log("✅ Datos del perfil cargados")
      } catch (error) {
        console.error("❌ Error cargando perfil:", error)
      } finally {
        setLoading(false)
      }
    }

    if (uid && rol) {
      loadProfileData()
    }
  }, [uid, rol])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const updatedFormData = {
        ...prev,
        [name]: value,
      }

      // Convertir campos numéricos
      if (name === "peso_kg" || name === "estatura_cm") {
        updatedFormData[name] = value === "" ? "" : Number.parseFloat(value)
        
        // Calcular IMC automáticamente
        const peso = name === "peso_kg" ? Number.parseFloat(value) : Number.parseFloat(prev.peso_kg)
        const estatura = name === "estatura_cm" ? Number.parseFloat(value) : Number.parseFloat(prev.estatura_cm)

        if (!isNaN(peso) && !isNaN(estatura) && peso > 0 && estatura > 0) {
          const estaturaM = estatura / 100
          const imc = (peso / (estaturaM * estaturaM)).toFixed(2)
          updatedFormData.IMC = imc
        } else {
          updatedFormData.IMC = ""
        }
      }

      return updatedFormData
    })
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setProfileImage(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e, formType) => {
    e.preventDefault()

    try {
      console.log(`📝 Guardando ${formType}:`, formData)

      let updateData = {}

      if (rol === "paciente") {
        if (formType === "personal") {
          updateData = {
            datos_personales: {
              edad: formData.edad,
              sexo: formData.sexo,
              peso_kg: formData.peso_kg,
              estatura_cm: formData.estatura_cm,
              IMC: formData.IMC,
            },
          }
        } else if (formType === "medical") {
          updateData = {
            datos_medicos: {
              tipo_sangre: formData.tipo_sangre,
              alergias: formData.alergias,
              medicamentos_actuales: formData.medicamentos_actuales,
              enfermedades_cronicas: formData.enfermedades_cronicas,
              antecedentes_familiares: formData.antecedentes_familiares,
              cirugias_previas: formData.cirugias_previas,
              vacunas: formData.vacunas,
              diagnostico_principal: formData.diagnostico_principal,
              condiciones_asociadas: formData.condiciones_asociadas
            }
          }
        } else if (formType === "contact") {
          updateData = {
            info_contacto: {
              telefono: formData.telefono,
              telefono_emergencia: formData.telefono_emergencia,
              direccion: formData.direccion,
              contacto_emergencia: formData.contacto_emergencia,
              relacion_contacto_emergencia: formData.relacion_contacto_emergencia
            },
          }
        }
      } else if (rol === "doctor") {
        updateData = {
          especialidad: formData.especialidad,
          cedula_profesional: formData.cedula_profesional,
          telefono: formData.telefono,
          direccion: formData.direccion,
        }
      }

      const response = await ProfileService.updateProfile(updateData)

      // Update local state
      setProfileData(response.data.profile)
      setCompletion(response.data.completion)

      console.log("✅ Perfil actualizado exitosamente")

      // Cerrar modal después de enviar
      switch (formType) {
        case "personal":
          dispatch({ type: "personalInfoModal" })
          break
        case "medical":
          dispatch({ type: "medicalInfoModal" })
          break
        case "contact":
          dispatch({ type: "contactInfoModal" })
          break
        default:
          break
      }
    } catch (error) {
      console.error("❌ Error guardando perfil:", error)
      alert("Error al guardar la información. Por favor, intente nuevamente.")
    }
  }

  const getCompletionStatus = () => {
    if (rol === "paciente") {
      const personalComplete = formData.edad && formData.sexo && formData.peso_kg && formData.estatura_cm
      const medicalComplete = formData.tipo_sangre && 
                            formData.alergias && 
                            formData.medicamentos_actuales && 
                            formData.enfermedades_cronicas && 
                            formData.antecedentes_familiares && 
                            formData.cirugias_previas && 
                            formData.vacunas
      const contactComplete = rol === "paciente" 
        ? formData.telefono && 
          formData.direccion && 
          formData.telefono_emergencia && 
          formData.contacto_emergencia && 
          formData.relacion_contacto_emergencia
        : formData.telefono && formData.direccion

      const completedSections = [personalComplete, medicalComplete, contactComplete].filter(Boolean).length
      const totalSections = 3
      const percentage = Math.round((completedSections / totalSections) * 100)

      return {
        personal: personalComplete,
        medical: medicalComplete,
        contact: contactComplete,
        percentage,
        completedSections,
        totalSections,
      }
    } else if (rol === "doctor") {
      const professionalComplete = formData.especialidad && formData.cedula_profesional
      const contactComplete = formData.telefono && formData.direccion

      const completedSections = [professionalComplete, contactComplete].filter(Boolean).length
      const totalSections = 2
      const percentage = Math.round((completedSections / totalSections) * 100)

      return {
        professional: professionalComplete,
        contact: contactComplete,
        percentage,
        completedSections,
        totalSections,
      }
    }

    return { percentage: 0, completedSections: 0, totalSections: 1 }
  }

  const completionStatus = getCompletionStatus()

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3 text-muted">Cargando perfil...</p>
      </div>
    )
  }

  return (
    <Fragment>
      {/* Header del Perfil */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="row align-items-center gy-3">

                {/* Información principal */}
                <div className="col-12 col-sm">
                  <h3 className="mb-1 text-dark text-center text-sm-start">
                    {rol === "doctor" ? "Doctor" : "Paciente"}
                  </h3>
                  <p className="text-muted mb-2 text-center text-sm-start">{email}</p>
                  <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center justify-content-sm-start">
                    <div className="progress me-sm-3 w-100" style={{ maxWidth: "200px", height: "8px" }}>
                      <div
                        className={`progress-bar ${completionStatus.percentage === 100 ? "bg-success" : "bg-primary"}`}
                        style={{ width: `${completionStatus.percentage}%` }}
                      ></div>
                    </div>
                    <span className="badge bg-light text-dark mt-2 mt-sm-0">
                      Perfil {completionStatus.percentage}% completo
                    </span>
                  </div>
                </div>

                {/* Organization info for doctors */}
                {rol === "doctor" && profileData?.organizacionNombre && (
                  <div className="col-12 col-sm-auto text-center text-sm-end">
                    <small className="text-muted d-block">Organización</small>
                    <strong className="text-dark d-block">{profileData.organizacionNombre}</strong>
                    {profileData.especialidad && (
                      <small className="text-primary d-block">{profileData.especialidad}</small>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {rol === "paciente" ? (
        // Patient status cards - only show incomplete sections
        <div className="row mb-4">
          {!completionStatus.personal && (
            <div className="col-xl-4 col-lg-6 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100 bg-light">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center">
                    <span
                      className="me-3 d-flex align-items-center justify-content-center rounded-circle bg-primary text-white"
                      style={{ width: "48px", height: "48px" }}
                    >
                      <i className="fas fa-user"></i>
                    </span>
                    <div className="flex-grow-1">
                      <h6 className="mb-1 text-dark">Datos Personales</h6>
                      <p className="mb-2 small text-muted">Complete su información básica: edad, sexo, peso y estatura</p>
                      <Button variant="primary" size="sm" onClick={() => dispatch({ type: "personalInfoModal" })}>
                        {formData.edad || formData.sexo || formData.peso_kg || formData.estatura_cm ? 'Completar Faltantes' : 'Completar'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!completionStatus.medical && (
            <div className="col-xl-4 col-lg-6 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm bg-light">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center">
                    <span
                      className="me-3 d-flex align-items-center justify-content-center rounded-circle bg-warning text-white"
                      style={{ width: "48px", height: "48px" }}
                    >
                      <i className="fas fa-notes-medical"></i>
                    </span>
                    
                    <div className="flex-grow-1">
                      <h6 className="mb-1 text-dark">Info. Médica</h6>
                      <p className="mb-2 small text-muted">Historial médico completo, alergias, medicamentos y más</p>
                      <Button variant="warning" size="sm" onClick={() => dispatch({ type: "medicalInfoModal" })}>
                        {formData.tipo_sangre || formData.alergias || formData.medicamentos_actuales ? 'Completar Faltantes' : 'Completar'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!completionStatus.contact && (
            <div className="col-xl-4 col-lg-6 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm bg-light">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center">
                    <span
                      className="me-3 d-flex align-items-center justify-content-center rounded-circle bg-secondary text-white"
                      style={{ width: "48px", height: "48px" }}
                    >
                      <i className="fas fa-address-book"></i>
                    </span>
                    <div className="flex-grow-1">
                      <h6 className="mb-1 text-dark">Contacto</h6>
                      <p className="mb-2 small text-muted">Contacto personal y de emergencia</p>
                      <Button variant="secondary" size="sm" onClick={() => dispatch({ type: "contactInfoModal" })}>
                        {formData.telefono || formData.direccion || formData.telefono_emergencia ? 'Completar Faltantes' : 'Completar'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {completionStatus.personal && completionStatus.medical && completionStatus.contact && (
            <div className="col-12">
              <div className="card border-0 shadow-sm bg-success text-white">
                <div className="card-body p-4 text-center">
                  <i className="fas fa-check-circle fa-3x mb-3"></i>
                  <h5 className="mb-2">¡Perfil Completado!</h5>
                  <p className="mb-0">Has completado toda la información de tu perfil.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Doctor status cards - only show incomplete sections
        <div className="row mb-4">
          {!completionStatus.professional && (
            <div className="col-xl-4 col-lg-6 col-sm-6 mb-3">
              <div
                className="card border-0 shadow-sm"
                style={{ background: "linear-gradient(135deg, #28a745, #20c997)" }}
              >
                <div className="card-body p-4">
                  <div className="d-flex align-items-center">
                    <span
                      className="me-3 d-flex align-items-center justify-content-center rounded-circle bg-white text-success"
                      style={{ width: "48px", height: "48px" }}
                    >
                      <i className="fas fa-user-md"></i>
                    </span>
                    <div className="flex-grow-1">
                      <h6 className="mb-1 text-white">Datos Profesionales</h6>
                      <p className="mb-2 small text-white-50">Especialidad, cédula profesional</p>
                      <Button variant="light" size="sm" onClick={() => dispatch({ type: "personalInfoModal" })}>
                        Completar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!completionStatus.contact && (
            <div className="col-xl-4 col-lg-6 col-sm-6 mb-3">
              <div
                className="card border-0 shadow-sm h-100"
                style={{ background: "linear-gradient(135deg, #17a2b8, #6f42c1)" }}
              >
                <div className="card-body p-4">
                  <div className="d-flex align-items-center">
                    <span
                      className="me-3 d-flex align-items-center justify-content-center rounded-circle bg-white text-info"
                      style={{ width: "48px", height: "48px" }}
                    >
                      <i className="fas fa-address-book"></i>
                    </span>
                    <div className="flex-grow-1">
                      <h6 className="mb-1 text-white">Contacto</h6>
                      <p className="mb-2 small text-white-50">Teléfono, dirección</p>
                      <Button variant="light" size="sm" onClick={() => dispatch({ type: "contactInfoModal" })}>
                        Completar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {completionStatus.professional && completionStatus.contact && (
            <div className="col-12">
              <div className="card border-0 shadow-sm bg-success text-white">
                <div className="card-body p-4 text-center">
                  <i className="fas fa-check-circle fa-3x mb-3"></i>
                  <h5 className="mb-2">¡Perfil Completado!</h5>
                  <p className="mb-0">Has completado toda la información profesional y de contacto.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ... existing code for the rest of the component ... */}
      {/* Contenido Principal */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <Tab.Container defaultActiveKey="Overview">
                <Nav variant="pills" className="nav-pills mb-4">
                  <Nav.Item>
                    <Nav.Link eventKey="Overview" className="me-2">
                      <i className="fas fa-chart-pie me-2"></i>Resumen
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="Personal" className="me-2">
                      <i className={`fas ${rol === "doctor" ? "fa-user-md" : "fa-user"} me-2`}></i>
                      {rol === "doctor" ? "Datos Profesionales" : "Datos Personales"}
                    </Nav.Link>
                  </Nav.Item>
                  {rol === "paciente" && (
                    <Nav.Item>
                      <Nav.Link eventKey="Medical" className="me-2">
                        <i className="fas fa-notes-medical me-2"></i>Info. Médica
                      </Nav.Link>
                    </Nav.Item>
                  )}
                  <Nav.Item>
                    <Nav.Link eventKey="Contact">
                      <i className="fas fa-address-book me-2"></i>
                      {rol === "paciente" ? "Contacto Personal y Emergencia" : "Contacto Profesional"}
                    </Nav.Link>
                  </Nav.Item>
                </Nav>

                <Tab.Content>
                  <Tab.Pane eventKey="Overview">
                    <div className="text-center py-5">
                      <div className="mb-4">
                        <div className="position-relative d-inline-block">
                          <svg width="120" height="120" className="me-3">
                            <circle cx="60" cy="60" r="50" fill="none" stroke="#e9ecef" strokeWidth="10" />
                            <circle
                              cx="60"
                              cy="60"
                              r="50"
                              fill="none"
                              stroke={completionStatus.percentage === 100 ? "#28a745" : "#007bff"}
                              strokeWidth="10"
                              strokeDasharray={`${completionStatus.percentage * 3.14} 314`}
                              strokeLinecap="round"
                              transform="rotate(-90 60 60)"
                            />
                          </svg>
                        </div>
                      </div>
                      <h4 className="text-dark mb-3">Estado del Perfil</h4>
                      <p className="text-muted mb-4">
                        Has completado {completionStatus.completedSections} de {completionStatus.totalSections}{" "}
                        secciones
                      </p>
                      {completionStatus.percentage === 100 && (
                        <div className="alert alert-success">
                          <i className="fas fa-trophy me-2"></i>
                          ¡Felicidades! Tu perfil está 100% completo.
                        </div>
                      )}
                    </div>
                  </Tab.Pane>

                  <Tab.Pane eventKey="Personal">
                    {rol === "doctor" ? (
                      // Doctor professional info
                      <div className="row">
                        <div className="col-md-8">
                          <h5 className="text-dark mb-3">Información Profesional</h5>
                          <div className="row g-3">
                            <div className="col-md-6">
                              <div className="border rounded p-3 bg-light">
                                <small className="text-muted d-block">Especialidad</small>
                                <strong className="text-dark">{formData.especialidad || "No especificada"}</strong>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="border rounded p-3 bg-light">
                                <small className="text-muted d-block">Cédula Profesional</small>
                                <strong className="text-dark">
                                  {formData.cedula_profesional || "No especificada"}
                                </strong>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="text-center">
                            <Button
                              variant="primary"
                              size="lg"
                              onClick={() => dispatch({ type: "personalInfoModal" })}
                              className="w-100"
                            >
                              <i className="fas fa-edit me-2"></i>
                              Editar Información
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Patient personal info (existing code)
                      <div className="row">
                        <div className="col-md-8">
                          <h5 className="text-dark mb-3">Información Personal</h5>
                          <div className="row g-3">
                            <div className="col-md-6">
                              <div className="border rounded p-3 bg-light">
                                <small className="text-muted d-block">Edad</small>
                                <strong className="text-dark">{formData.edad || "No especificada"}</strong>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="border rounded p-3 bg-light">
                                <small className="text-muted d-block">Sexo</small>
                                <strong className="text-dark">{formData.sexo || "No especificado"}</strong>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="border rounded p-3 bg-light">
                                <small className="text-muted d-block">Peso</small>
                                <strong className="text-dark">
                                  {formData.peso_kg ? `${formData.peso_kg} kg` : "No especificado"}
                                </strong>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="border rounded p-3 bg-light">
                                <small className="text-muted d-block">Estatura</small>
                                <strong className="text-dark">
                                  {formData.estatura_cm ? `${formData.estatura_cm} cm` : "No especificada"}
                                </strong>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="border rounded p-3 bg-light">
                                <small className="text-muted d-block">IMC</small>
                                <strong className="text-dark">{formData.IMC || "No calculado"}</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="text-center">
                            <Button
                              variant="primary"
                              size="lg"
                              onClick={() => dispatch({ type: "personalInfoModal" })}
                              className="w-100"
                            >
                              <i className="fas fa-edit me-2"></i>
                              Editar Información
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Tab.Pane>

                  {rol === "paciente" && (
                    <Tab.Pane eventKey="Medical">
                      <div className="row">
                        <div className="col-md-8">
                          <h5 className="text-dark mb-3">Información Médica</h5>
                          <div className="row g-3">
                            {/* Datos médicos básicos */}
                            <div className="col-md-6">
                              <div className="border rounded p-3 bg-light h-100">
                                <h6 className="text-primary mb-3">Datos Básicos</h6>
                                <small className="text-muted d-block mb-2">Tipo de Sangre</small>
                                <strong className="text-dark d-block">{formData.tipo_sangre || "No especificado"}</strong>
                                <small className="text-muted d-block mt-3 mb-2">Peso</small>
                                <strong className="text-dark d-block">{formData.peso_kg ? `${formData.peso_kg} kg` : "No especificado"}</strong>
                                <small className="text-muted d-block mt-3 mb-2">Estatura</small>
                                <strong className="text-dark d-block">{formData.estatura_cm ? `${formData.estatura_cm} cm` : "No especificado"}</strong>
                                <small className="text-muted d-block mt-3 mb-2">IMC</small>
                                <strong className="text-dark d-block">{formData.IMC || "No calculado"}</strong>
                              </div>
                            </div>
                            
                            {/* Alergias y medicamentos */}
                            <div className="col-md-6">
                              <div className="border rounded p-3 bg-light h-100">
                                <h6 className="text-danger mb-3">Alergias y Medicamentos</h6>
                                <small className="text-muted d-block mb-2">Alergias</small>
                                <strong className="text-dark d-block">{formData.alergias || "No especificadas"}</strong>
                                <small className="text-muted d-block mt-3 mb-2">Medicamentos Actuales</small>
                                <strong className="text-dark d-block">{formData.medicamentos_actuales || "Ninguno registrado"}</strong>
                              </div>
                            </div>
                            
                            {/* Historial médico */}
                            <div className="col-12">
                              <div className="border rounded p-3 bg-light">
                                <h6 className="text-info mb-3">Historial Médico</h6>
                                <small className="text-muted d-block mb-2">Enfermedades Crónicas</small>
                                <strong className="text-dark d-block">{formData.enfermedades_cronicas || "Ninguna registrada"}</strong>
                                <small className="text-muted d-block mt-3 mb-2">Antecedentes Familiares</small>
                                <strong className="text-dark d-block">{formData.antecedentes_familiares || "No especificados"}</strong>
                                <small className="text-muted d-block mt-3 mb-2">Cirugías Previas</small>
                                <strong className="text-dark d-block">{formData.cirugias_previas || "Ninguna registrada"}</strong>
                                <small className="text-muted d-block mt-3 mb-2">Vacunas</small>
                                <strong className="text-dark d-block">{formData.vacunas || "No especificadas"}</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="text-center">
                            <Button
                              variant="warning"
                              size="lg"
                              onClick={() => dispatch({ type: "medicalInfoModal" })}
                              className="w-100"
                            >
                              <i className="fas fa-edit me-2"></i>
                              Editar Información
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Tab.Pane>
                  )}

                  <Tab.Pane eventKey="Contact">
                    <div className="row">
                      <div className="col-md-8">
                        <h5 className="text-dark mb-3">Información de Contacto</h5>
                        <div className="row g-3">
                          {rol === "paciente" ? (
                            <>
                              {/* Información de contacto personal - Paciente */}
                              <div className="col-md-6">
                                <div className="border rounded p-3 bg-light h-100">
                                  <h6 className="text-primary mb-3">Contacto Personal</h6>
                                  <small className="text-muted d-block mb-2">Teléfono</small>
                                  <strong className="text-dark d-block">{formData.telefono || "No especificado"}</strong>
                                  <small className="text-muted d-block mt-3 mb-2">Dirección</small>
                                  <strong className="text-dark d-block">{formData.direccion || "No especificada"}</strong>
                                </div>
                              </div>
                              
                              {/* Información de contacto de emergencia - Solo Paciente */}
                              <div className="col-md-6">
                                <div className="border rounded p-3 bg-light h-100">
                                  <h6 className="text-danger mb-3">Contacto de Emergencia</h6>
                                  <small className="text-muted d-block mb-2">Nombre del Contacto</small>
                                  <strong className="text-dark d-block">{formData.contacto_emergencia || "No especificado"}</strong>
                                  <small className="text-muted d-block mt-3 mb-2">Relación</small>
                                  <strong className="text-dark d-block">{formData.relacion_contacto_emergencia || "No especificada"}</strong>
                                  <small className="text-muted d-block mt-3 mb-2">Teléfono de Emergencia</small>
                                  <strong className="text-dark d-block">{formData.telefono_emergencia || "No especificado"}</strong>
                                </div>
                              </div>
                            </>
                          ) : (
                            // Vista de contacto para Doctor
                            <div className="col-12">
                              <div className="border rounded p-3 bg-light">
                                <h6 className="text-primary mb-3">Datos de Contacto Profesional</h6>
                                <small className="text-muted d-block mb-2">Teléfono</small>
                                <strong className="text-dark d-block">{formData.telefono || "No especificado"}</strong>
                                <small className="text-muted d-block mt-3 mb-2">Dirección Profesional</small>
                                <strong className="text-dark d-block">{formData.direccion || "No especificada"}</strong>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="text-center">
                          <Button
                            variant="danger"
                            size="lg"
                            onClick={() => dispatch({ type: "contactInfoModal" })}
                            className="w-100"
                          >
                            <i className="fas fa-edit me-2"></i>
                            Editar Información
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Foto de Perfil */}
      <Modal show={state.profilePhoto} onHide={() => dispatch({ type: "profilePhoto" })} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cambiar Foto de Perfil</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <div className="mb-4">
            <img
              src={profileImage || "/placeholder.svg"}
              alt="Vista previa"
              className="rounded-circle border shadow"
              style={{ width: "150px", height: "150px", objectFit: "cover" }}
            />
          </div>
          <Form.Group>
            <Form.Control type="file" accept="image/*" onChange={handleImageUpload} className="mb-2" />
            <Form.Text className="text-muted">Formatos soportados: JPG, PNG, GIF (máx. 5MB)</Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => dispatch({ type: "profilePhoto" })}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => dispatch({ type: "profilePhoto" })}>
            Guardar Foto
          </Button>
        </Modal.Footer>
      </Modal>

      {rol === "doctor" ? (
        // Doctor professional info modal
        <Modal show={state.personalInfoModal} onHide={() => dispatch({ type: "personalInfoModal" })} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Información Profesional</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={(e) => handleSubmit(e, "professional")}>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Especialidad</Form.Label>
                    <Form.Control
                      type="text"
                      name="especialidad"
                      value={formData.especialidad}
                      onChange={handleInputChange}
                      placeholder="Ej: Cardiología, Pediatría..."
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Cédula Profesional</Form.Label>
                    <Form.Control
                      type="text"
                      name="cedula_profesional"
                      value={formData.cedula_profesional}
                      onChange={handleInputChange}
                      placeholder="Número de cédula profesional"
                    />
                  </Form.Group>
                </div>
              </div>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => dispatch({ type: "personalInfoModal" })}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={(e) => handleSubmit(e, "professional")}>
              Guardar Información
            </Button>
          </Modal.Footer>
        </Modal>
      ) : (
        // Patient personal info modal (existing)
        <Modal show={state.personalInfoModal} onHide={() => dispatch({ type: "personalInfoModal" })} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Información Personal</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={(e) => handleSubmit(e, "personal")}>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Edad</Form.Label>
                    <Form.Control
                      type="number"
                      name="edad"
                      value={formData.edad}
                      onChange={handleInputChange}
                      placeholder="Ingrese su edad"
                      min="1"
                      max="120"
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Sexo</Form.Label>
                    <Form.Select name="sexo" value={formData.sexo} onChange={handleInputChange}>
                      <option value="">Seleccionar...</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Peso (kg)</Form.Label>
                    <Form.Control
                      type="number"
                      name="peso_kg"
                      value={formData.peso_kg === "" ? "" : Number(formData.peso_kg)}
                      onChange={handleInputChange}
                      placeholder="70"
                      step="0.1"
                      min="1"
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Estatura (cm)</Form.Label>
                    <Form.Control
                      type="number"
                      name="estatura_cm"
                      value={formData.estatura_cm === "" ? "" : Number(formData.estatura_cm)}
                      onChange={handleInputChange}
                      placeholder="170"
                      min="50"
                      max="250"
                    />
                  </Form.Group>
                </div>
                {formData.IMC && (
                  <div className="col-12">
                    <div className="alert alert-info">
                      <strong>IMC Calculado: {formData.IMC}</strong>
                    </div>
                  </div>
                )}
              </div>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => dispatch({ type: "personalInfoModal" })}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={(e) => handleSubmit(e, "personal")}>
              Guardar Información
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Contact modal (same for both roles) */}
      <Modal show={state.contactInfoModal} onHide={() => dispatch({ type: "contactInfoModal" })} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Información de Contacto</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={(e) => handleSubmit(e, "contact")}>
            <div className="row">
              {/* Información de contacto */}
              <div className="col-12">
                {rol === "paciente" ? (
                  <>
                    <h6 className="text-primary mb-3">Contacto Personal</h6>
                    <Form.Group className="mb-3">
                      <Form.Label>Teléfono</Form.Label>
                      <Form.Control
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        placeholder="+52 33 1234 5678"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Dirección</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleInputChange}
                        placeholder="Calle, número, colonia, ciudad, código postal..."
                      />
                    </Form.Group>

                    {/* Información de contacto de emergencia - solo para pacientes */}
                    <hr className="my-4" />
                    <h6 className="text-danger mb-3">Contacto de Emergencia</h6>
                    <Form.Group className="mb-3">
                      <Form.Label>Nombre del Contacto de Emergencia</Form.Label>
                      <Form.Control
                        type="text"
                        name="contacto_emergencia"
                        value={formData.contacto_emergencia}
                        onChange={handleInputChange}
                        placeholder="Nombre completo del contacto de emergencia"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Relación con el Contacto</Form.Label>
                      <Form.Control
                        type="text"
                        name="relacion_contacto_emergencia"
                        value={formData.relacion_contacto_emergencia}
                        onChange={handleInputChange}
                        placeholder="Ej: Padre, Madre, Hijo/a, Cónyuge..."
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Teléfono de Emergencia</Form.Label>
                      <Form.Control
                        type="tel"
                        name="telefono_emergencia"
                        value={formData.telefono_emergencia}
                        onChange={handleInputChange}
                        placeholder="+52 33 1234 5678"
                      />
                    </Form.Group>
                  </>
                ) : (
                  <>
                    <h6 className="text-primary mb-3">Información de Contacto</h6>
                    <Form.Group className="mb-3">
                      <Form.Label>Teléfono</Form.Label>
                      <Form.Control
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        placeholder="+52 33 1234 5678"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Dirección</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleInputChange}
                        placeholder="Calle, número, colonia, ciudad, código postal..."
                      />
                    </Form.Group>
                  </>
                )}
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => dispatch({ type: "contactInfoModal" })}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={(e) => handleSubmit(e, "contact")}>
            Guardar Información
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Medical info modal (only for patients) */}
      {rol === "paciente" && (
        <Modal show={state.medicalInfoModal} onHide={() => dispatch({ type: "medicalInfoModal" })} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Información Médica</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={(e) => handleSubmit(e, "medical")}>
              <div className="row">
                {/* Datos médicos básicos */}
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Tipo de Sangre</Form.Label>
                    <Form.Select name="tipo_sangre" value={formData.tipo_sangre} onChange={handleInputChange}>
                      <option value="">Seleccionar...</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </Form.Select>
                  </Form.Group>
                </div>

                {/* Alergias y medicamentos */}
                <div className="col-12">
                  <hr className="my-4" />
                  <h6 className="text-danger mb-3">Alergias y Medicamentos</h6>
                  <Form.Group className="mb-3">
                    <Form.Label>Alergias</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="alergias"
                      value={formData.alergias}
                      onChange={handleInputChange}
                      placeholder="Describa alergias a medicamentos, alimentos, etc..."
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Medicamentos Actuales</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="medicamentos_actuales"
                      value={formData.medicamentos_actuales}
                      onChange={handleInputChange}
                      placeholder="Liste los medicamentos que toma actualmente..."
                    />
                  </Form.Group>
                </div>

                {/* Historial médico */}
                <div className="col-12">
                  <hr className="my-4" />
                  <h6 className="text-info mb-3">Historial Médico</h6>
                  <Form.Group className="mb-3">
                    <Form.Label>Enfermedades Crónicas</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="enfermedades_cronicas"
                      value={formData.enfermedades_cronicas}
                      onChange={handleInputChange}
                      placeholder="Liste enfermedades crónicas..."
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Antecedentes Familiares</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="antecedentes_familiares"
                      value={formData.antecedentes_familiares}
                      onChange={handleInputChange}
                      placeholder="Describa enfermedades importantes en su familia..."
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Cirugías Previas</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="cirugias_previas"
                      value={formData.cirugias_previas}
                      onChange={handleInputChange}
                      placeholder="Liste cirugías anteriores y fechas..."
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Vacunas</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="vacunas"
                      value={formData.vacunas}
                      onChange={handleInputChange}
                      placeholder="Liste sus vacunas y fechas de aplicación..."
                    />
                  </Form.Group>
                </div>


              </div>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => dispatch({ type: "medicalInfoModal" })}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={(e) => handleSubmit(e, "medical")}>
              Guardar Información
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Fragment>
  )
}

export default PatientProfileCompletion
