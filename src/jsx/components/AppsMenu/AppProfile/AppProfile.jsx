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
    tipo_sangre: "",
    peso_kg: "",
    estatura_cm: "",
    IMC: "",
    // Info contacto
    telefono: "",
    direccion: "",
    // Médicos (solo para pacientes)
    diagnostico_principal: "",
    condiciones_asociadas: "",
    // Doctor específico
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
              edad: profile.datos_personales?.edad || "",
              sexo: profile.datos_personales?.sexo || "",
              tipo_sangre: profile.datos_personales?.tipo_sangre || "",
              peso_kg: profile.datos_personales?.peso_kg || "",
              estatura_cm: profile.datos_personales?.estatura_cm || "",
              IMC: profile.datos_personales?.IMC || "",
              telefono: profile.info_contacto?.telefono || "",
              direccion: profile.info_contacto?.direccion || "",
              diagnostico_principal: profile.diagnostico_principal || "",
              condiciones_asociadas: profile.condiciones_asociadas || "",
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

      // Calcular IMC automáticamente
      if (name === "peso_kg" || name === "estatura_cm") {
        const peso = name === "peso_kg" ? Number.parseFloat(value) : Number.parseFloat(prev.peso_kg)
        const estatura = name === "estatura_cm" ? Number.parseFloat(value) : Number.parseFloat(prev.estatura_cm)

        if (peso > 0 && estatura > 0) {
          const estaturaM = estatura / 100
          const imc = (peso / (estaturaM * estaturaM)).toFixed(2)
          updatedFormData.IMC = imc
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
            datos_personales: {
              ...profileData?.datos_personales,
              tipo_sangre: formData.tipo_sangre,
            },
            diagnostico_principal: formData.diagnostico_principal,
            condiciones_asociadas: formData.condiciones_asociadas,
          }
        } else if (formType === "contact") {
          updateData = {
            info_contacto: {
              telefono: formData.telefono,
              direccion: formData.direccion,
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
      const medicalComplete = formData.tipo_sangre && formData.diagnostico_principal
      const contactComplete = formData.telefono && formData.direccion

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
                {/* Imagen de perfil */}
                <div className="col-auto mx-auto mx-sm-0">
                  <div
                    className="position-relative"
                    style={{ width: "clamp(64px, 18vw, 80px)", height: "clamp(64px, 18vw, 80px)" }}
                  >
                    <img
                      src={profileImage || "/placeholder.svg"}
                      className="rounded-circle border border-3 border-light shadow w-100 h-100 img-fluid"
                      alt="Foto de perfil del usuario"
                      style={{ objectFit: "cover" }}
                    />
                    <button
                      className="btn btn-primary btn-sm position-absolute rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: "24px",
                        height: "24px",
                        bottom: "0",
                        right: "0",
                        transform: "translate(25%, 25%)",
                      }}
                      onClick={() => dispatch({ type: "profilePhoto" })}
                    >
                      <i className="fas fa-camera" style={{ fontSize: "12px" }}></i>
                    </button>
                  </div>
                </div>

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
                      <p className="mb-2 small text-muted">Edad, sexo, peso, estatura</p>
                      <Button variant="primary" size="sm" onClick={() => dispatch({ type: "personalInfoModal" })}>
                        Completar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!completionStatus.medical && (
            <div className="col-xl-4 col-lg-6 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100 bg-light">
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
                      <p className="mb-2 small text-muted">Tipo sangre, diagnóstico</p>
                      <Button variant="warning" size="sm" onClick={() => dispatch({ type: "medicalInfoModal" })}>
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
              <div className="card border-0 shadow-sm h-100 bg-light">
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
                      <p className="mb-2 small text-muted">Teléfono, dirección</p>
                      <Button variant="secondary" size="sm" onClick={() => dispatch({ type: "contactInfoModal" })}>
                        Completar
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
                className="card border-0 shadow-sm h-100"
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
                      <i className="fas fa-address-book me-2"></i>Contacto
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
                            <div className="col-12">
                              <div className="border rounded p-3 bg-light">
                                <small className="text-muted d-block">Tipo de Sangre</small>
                                <strong className="text-dark">{formData.tipo_sangre || "No especificado"}</strong>
                              </div>
                            </div>
                            <div className="col-12">
                              <div className="border rounded p-3 bg-light">
                                <small className="text-muted d-block">Diagnóstico Principal</small>
                                <strong className="text-dark">
                                  {formData.diagnostico_principal || "No especificado"}
                                </strong>
                              </div>
                            </div>
                            <div className="col-12">
                              <div className="border rounded p-3 bg-light">
                                <small className="text-muted d-block">Condiciones Asociadas</small>
                                <strong className="text-dark">
                                  {formData.condiciones_asociadas || "Ninguna registrada"}
                                </strong>
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
                          <div className="col-12">
                            <div className="border rounded p-3 bg-light">
                              <small className="text-muted d-block">Teléfono</small>
                              <strong className="text-dark">{formData.telefono || "No especificado"}</strong>
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="border rounded p-3 bg-light">
                              <small className="text-muted d-block">Dirección</small>
                              <strong className="text-dark">{formData.direccion || "No especificada"}</strong>
                            </div>
                          </div>
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
                      value={formData.peso_kg}
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
                      value={formData.estatura_cm}
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
              <div className="col-12">
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
              </div>
              <div className="col-12">
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
                <div className="col-12">
                  <Form.Group className="mb-3">
                    <Form.Label>Diagnóstico Principal</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="diagnostico_principal"
                      value={formData.diagnostico_principal}
                      onChange={handleInputChange}
                      placeholder="Describa el diagnóstico principal..."
                    />
                  </Form.Group>
                </div>
                <div className="col-12">
                  <Form.Group className="mb-3">
                    <Form.Label>Condiciones Asociadas</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="condiciones_asociadas"
                      value={formData.condiciones_asociadas}
                      onChange={handleInputChange}
                      placeholder="Describa condiciones médicas asociadas..."
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
