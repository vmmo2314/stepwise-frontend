import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { connect, useDispatch } from "react-redux"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { clearMessages } from "../../store/actions/AuthActions"
import { loadingToggleAction, signupAction, signupPatientAction } from "../../store/actions/AuthActions"
import axiosInstance from "../../services/AxiosInstance" // Import axiosInstance

import "leaflet/dist/leaflet.css"

function Register(props) {
  // Estados existentes
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Nuevos estados para el flujo multi-paso
  const [currentStep, setCurrentStep] = useState(1)
  const [organizationName, setOrganizationName] = useState("")
  const [esp32Id, setEsp32Id] = useState("")
  const [doctorName, setDoctorName] = useState("")
  const [isAnimating, setIsAnimating] = useState(false)
  const [isPatientSubmit, setIsPatientSubmit] = useState(false)
  const [esp32Status, setEsp32Status] = useState({
    checking: false,
    exists: false,
    orgName: null,
    error: null,
    asked: false, // para no repetir el Swal sin necesidad
    canJoin: false,
    canCreate: false,
  })
  // === GEO STATE ===
  const [address, setAddress] = useState("") // texto visible
  const [coords, setCoords] = useState({
    // coord. exactas
    lat: 19.4326, // CDMX por defecto
    lng: -99.1332,
  })
  const mapRef = useRef(null) // se guarda la instancia del mapa
  const markerRef = useRef(null) // marcador draggable
  const [searchResults, setSearchResults] = useState([])

  const dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    dispatch(clearMessages())
  }, [dispatch])

  useEffect(() => {
    // Solo en paso 4
    if (currentStep !== 4) return

    const code = esp32Id.trim()
    const orgName = organizationName.trim()

    if (code.length < 4 || orgName.length < 2) {
      setEsp32Status((s) => ({ ...s, checking: false, exists: false, orgName: null, error: null }))
      return
    }

    let cancelled = false
    setEsp32Status((s) => ({ ...s, checking: true, error: null }))

    const timer = setTimeout(async () => {
      try {

        // *** CAMBIO CLAVE AQUÍ: Llamada al backend para verificar ESP32 ID ***
        const response = await axiosInstance.post("/api/organizations/check-esp32", {
          esp32Id: code,
          organizationName: orgName,
        })  
        const { exists, orgName: detectedOrgName, canJoin, canCreate, message } = response.data

        if (cancelled) {  
          return
        }

        if (exists && canJoin && detectedOrgName) {
          setEsp32Status((s) => ({
            ...s,
            checking: false,
            exists: true,
            orgName: detectedOrgName,
            canJoin: true,
            canCreate: false,
          }))
        } else if (exists && canCreate) {
          setEsp32Status((s) => ({
            ...s,
            checking: false,
            exists: true,
            orgName: null,
            canJoin: false,
            canCreate: true,
          }))
        } else if (exists && !canJoin && !canCreate && detectedOrgName) {
          setEsp32Status((s) => ({
            ...s,
            checking: false,
            exists: true,
            orgName: detectedOrgName,
            canJoin: false,
            canCreate: false,
            error: message,
          }))
        } else {
          setEsp32Status((s) => ({
            ...s,
            checking: false,
            exists: false,
            orgName: null,
            error: message || "ESP32 ID no encontrado",
          }))
        }
      } catch (e) {
        if (!cancelled) {
          // Check if it's an Axios error with a response from the backend
          if (e.response && e.response.data && e.response.data.error) {
            setEsp32Status((s) => ({ ...s, checking: false, error: e.response.data.error }))
          } else {
            setEsp32Status((s) => ({ ...s, checking: false, error: "Error de verificación" }))
          }
        }
      }
    }, 500) // debounce 500ms

    return () => {
      cancelled = true
      clearTimeout(timer)   
    }
  }, [esp32Id, organizationName, currentStep])

  useEffect(() => {
    ;(async () => {
      if (currentStep === 4 && esp32Status.exists && !esp32Status.asked) {
        const Swal = (await import("sweetalert2")).default
        const result = await Swal.fire({
          title: "Código ya registrado",
          html: `Ese código ya pertenece a <strong>${esp32Status.orgName}</strong>.<br/>¿Deseas unirte?`,
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Sí, unirme",
          cancelButtonText: "Cancelar",
        })
        if (!result.isConfirmed) {
          setEsp32Id("")
          setOrganizationName("")
        }
        setEsp32Status((s) => ({ ...s, asked: true }))
      }
    })()
  }, [esp32Status.exists, esp32Status.orgName, esp32Status.asked, currentStep, esp32Id, organizationName])

  useEffect(() => {
    if (currentStep !== 6) return

    const init = async () => {
      const L = await import("leaflet")

      // Check if map is already initialized
      const mapContainer = document.getElementById("map")
      if (mapRef.current || mapContainer?._leaflet_id) {
        console.log("Map already initialized, skipping...")
        return
      }

      // Clear any existing content
      if (mapContainer) {
        mapContainer.innerHTML = ""
      }

      try {
        mapRef.current = L.map("map").setView([coords.lat, coords.lng], 13)
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(mapRef.current)

        markerRef.current = L.marker([coords.lat, coords.lng], { draggable: true }).addTo(mapRef.current)

        const setPoint = async ({ lat, lng }) => {
          setCoords({ lat, lng })

          // *** CAMBIO CLAVE AQUÍ: Usar el proxy del backend para Nominatim reverse ***
          const url = `${import.meta.env.VITE_BACKEND_API_URL}/nominatim/reverse?lat=${lat}&lon=${lng}`
          try {
            const res = await fetch(url)
            const data = await res.json()
            if (data.display_name) setAddress(data.display_name)
          } catch (error) {
            console.error("Error fetching Nominatim reverse geocode:", error)
          }
        }

        mapRef.current.on("click", (e) => {
          markerRef.current.setLatLng(e.latlng)
          setPoint(e.latlng)
        })

        markerRef.current.on("dragend", (e) => {
          const { lat, lng } = e.target.getLatLng()
          setPoint({ lat, lng })
        })
      } catch (error) {
        console.error("Error initializing map:", error)
      }
    }

    init()

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      if (markerRef.current) {
        markerRef.current = null
      }
    }
  }, [currentStep, coords.lat, coords.lng])

  // --- BUSCAR DIRECCIÓN CADA 800 ms ---
  useEffect(() => {
    const t = setTimeout(async () => {
      if (address.length < 4) return

      // *** CAMBIO CLAVE AQUÍ: Usar el proxy del backend para Nominatim search ***
      const url = `${import.meta.env.VITE_BACKEND_API_URL}/nominatim/search?q=${encodeURIComponent(address)}`
      try {
        const res = await fetch(url)
        const data = await res.json()

        if (Array.isArray(data)) {
          setSearchResults(data.slice(0, 5)) // Limita a 5 sugerencias
        }
      } catch (error) {
        console.error("Error fetching Nominatim search results:", error)
        setSearchResults([])
      }
    }, 800)

    return () => clearTimeout(t)
  }, [address])

  const errorsObj = {
    email: "",
    username: "",
    password: "",
    organizationName: "",
    esp32Id: "",
    doctorName: "",
  }
  const [errors, setErrors] = useState(errorsObj)

  const steps = [
    { number: 1, title: "Registro", description: "Información básica" },
    { number: 2, title: "Registro", description: "Confirmar datos" },
    { number: 3, title: "Nombre organización", description: "Datos de la organización" },
    { number: 4, title: "ID del ESP32", description: "Configuración del dispositivo" },
    { number: 5, title: "Nombre del doctor", description: "Credenciales médicas" },
    { number: 6, title: "Ubicación", description: "Ubicación de la organización" },
  ]

  function validateCurrentStep() {
    const errorObj = { ...errorsObj }
    let error = false

    switch (currentStep) {
      case 1:
        if (email === "") {
          errorObj.email = "Correo electrónico es requerido"
          error = true
        }
        if (username === "") {
          errorObj.username = "Usuario es requerido"
          error = true
        }
        if (password === "") {
          errorObj.password = "Contraseña es requerida"
          error = true
        }
        break
      case 3:
        if (organizationName === "") {
          errorObj.organizationName = "Nombre de la organización es requerido"
          error = true
        }
        break
      case 4:
        if (esp32Id === "") {
          errorObj.esp32Id = "ID del ESP32 es requerido"
          error = true
        }
        break
      case 5:
        if (doctorName === "") {
          errorObj.doctorName = "Nombre del doctor es requerido"
          error = true
        }
    }

    setErrors(errorObj)
    return !error
  }

  function nextStep() {
    if (!validateCurrentStep()) return

    setIsAnimating(true)
    setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, 6))
      setIsAnimating(false)
    }, 300)
  }

  function prevStep() {
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentStep((prev) => Math.max(prev - 1, 1))
      setIsAnimating(false)
    }, 300)
  }

  function onSignUp(e) {
    e.preventDefault()

    if (!validateCurrentStep()) return

    // Si el usuario presionó el botón de paciente, registrar y resetear el flag
    if (currentStep === 2 && isPatientSubmit) {
      setIsPatientSubmit(false) // Limpieza
      dispatch(loadingToggleAction(true))

      const registrationData = {
        email,
        username,
        password,
      }

      dispatch(signupPatientAction(email, password, navigate, registrationData))
      return
    }

    // Si no es envío paciente, continuar pasos normales
    if (currentStep < 6) {
      nextStep()
    } else {
      const registrationData = {
        email,
        username,
        password,
        organizationName,
        esp32Id,
        doctorName,
        location: {
          direccion: address,
          lat: coords.lat,
          lng: coords.lng,
        },
      }

      dispatch(loadingToggleAction(true))
      dispatch(signupAction(email, password, navigate, registrationData))
    }
  }

  function renderStepContent() {
    switch (currentStep) {
      case 1:
        return (
          <>
            <div className="form-group">
              <label className="mb-1">
                <strong>Usuario</strong>
                <span className="required text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
              {errors.username && <div className="text-danger fs-12">{errors.username}</div>}
            </div>

            <div className="form-group">
              <label className="mb-1">
                <strong>Correo electrónico</strong>
                <span className="required text-danger">*</span>
              </label>
              <input
                type="email"
                placeholder="correoelectronico@correo.com"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              {errors.email && <div className="text-danger fs-12">{errors.email}</div>}
            </div>

            <div className="form-group position-relative">
              <label className="mb-1">
                <strong>Contraseña</strong>
                <span className="required text-danger">*</span>
              </label>
              <div className="position-relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  className="form-control pr-5"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="position-absolute top-50 end-0 translate-middle-y me-3 border-0 bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                ></button>
              </div>
              {errors.password && <div className="text-danger fs-12">{errors.password}</div>}
            </div>
          </>
        )

      case 2:
        return (
          <div className="text-center">
            <div className="mb-4">
              <div className="bg-light p-4 rounded">
                <h5 className="mb-3">Confirma tus datos</h5>
                <div className="text-start">
                  <p>
                    <strong>Usuario:</strong> {username}
                  </p>
                  <p>
                    <strong>Email:</strong> {email}
                  </p>
                  <p>
                    <strong>Contraseña:</strong> {"*".repeat(password.length)}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-muted mb-3">¿Los datos son correctos?</p>

            <div className="d-grid gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={props.showLoading}
                onClick={() => setIsPatientSubmit(true)}
              >
                {props.showLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Procesando...
                  </>
                ) : (
                  "Crear cuenta"
                )}
              </button>

              <button type="button" className="btn btn-outline-secondary" onClick={nextStep}>
                ¿Eres doctor?
              </button>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="form-group">
            <label className="mb-1">
              <strong>Nombre de la Organización</strong>
              <span className="required text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej: Hospital General, Clínica San José"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
            />
            {errors.organizationName && <div className="text-danger fs-12">{errors.organizationName}</div>}
            <small className="form-text text-muted">Ingresa el nombre completo de tu organización médica</small>
          </div>
        )

      case 4:
        return (
          <div className="form-group">
            <label className="mb-1">
              <strong>ID del ESP32</strong>
              <span className="required text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej: ESP32-001, DEVICE-ABC123"
              value={esp32Id}
              onChange={(e) => setEsp32Id(e.target.value)}
            />
            {esp32Status.checking && <small className="text-info d-block mt-1">Verificando código...</small>}
            {esp32Status.exists && esp32Status.canJoin && esp32Status.orgName && (
              <div className="alert alert-info">
                <strong>Código ya registrado</strong>
                <br />
                Ese código ya pertenece a <strong>{esp32Status.orgName}</strong>.
                <br />
                ¿Deseas unirte?
              </div>
            )}
            {esp32Status.exists && esp32Status.canCreate && (
              <div className="alert alert-success">
                <strong>ESP32 disponible</strong>
                <br />
                Este código está disponible para crear tu nueva organización.
              </div>
            )}
            {!esp32Status.checking && esp32Status.exists && !esp32Status.canJoin && !esp32Status.canCreate && (
              <div className="alert alert-danger mt-2 p-2">{esp32Status.error}</div>
            )}
            {esp32Status.error && !esp32Status.exists && (
              <div className="text-danger fs-12 mt-1">{esp32Status.error}</div>
            )}

            {errors.esp32Id && <div className="text-danger fs-12">{errors.esp32Id}</div>}
            <small className="form-text text-muted">Ingresa el identificador único de tu dispositivo ESP32</small>
          </div>
        )

      case 5:
        return (
          <>
            <div className="form-group">
              <label className="mb-1">
                <strong>Nombre del Doctor</strong>
                <span className="required text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Dr. Juan Pérez"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
              />
              {errors.doctorName && <div className="text-danger fs-12">{errors.doctorName}</div>}
            </div>
          </>
        )

      case 6:
        return (
          <div className="form-group relative z-50">
            <label className="mb-1">
              <strong>Dirección de la organización</strong>
              <span className="required text-danger">*</span>
            </label>

            <div className="relative">
              <input
                type="text"
                className="form-control"
                placeholder="Escribe o elige en el mapa"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value)
                  setSearchResults([]) // limpiar si el usuario escribe
                }}
              />

              {searchResults.length > 0 && (
                <ul
                  className="absolute left-0 w-full bg-white border border-gray-300 rounded shadow z-50 mt-1"
                  style={{ maxHeight: 180, overflowY: "auto" }}
                >
                  {searchResults.map((item, i) => (
                    <li
                      key={i}
                      className="px-3 py-2 hover:bg-gray-100 border-b border-gray-200 cursor-pointer text-sm text-gray-700"
                      onClick={() => {
                        setAddress(item.display_name)
                        setCoords({ lat: +item.lat, lng: +item.lon })
                        setSearchResults([])
                        setTimeout(() => {
                          if (mapRef.current) {
                            mapRef.current.setView([+item.lat, +item.lon], 16)
                            markerRef.current?.setLatLng([+item.lat, +item.lon])
                          }
                        }, 100)
                      }}
                    >
                      {item.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <small className="form-text text-muted mt-2 mb-1">
              Puedes escribir para buscar o hacer clic/arrastrar el marcador.
            </small>

            <div id="map" style={{ height: "300px" }} className="z-10 relative" />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="authincation h-100 p-meddle">
      <div className="container h-100">
        <div className="row justify-content-center h-100 align-items-center">
          <div className="col-md-8 col-lg-6">
            <div className="authincation-content">
              <div className="row no-gutters">
                <div className="col-xl-12">
                  <div className="auth-form">
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        {steps.map((step, index) => (
                          <div key={step.number} className="d-flex align-items-center">
                            <div
                              className={`rounded-circle d-flex align-items-center justify-content-center ${
                                currentStep > step.number
                                  ? "bg-success text-white"
                                  : currentStep === step.number
                                    ? "bg-primary text-white"
                                    : "bg-light text-muted"
                              }`}
                              style={{ width: "30px", height: "30px", fontSize: "12px" }}
                            >
                              {currentStep > step.number ? <Check size={16} /> : step.number}
                            </div>
                            {index < steps.length - 1 && (
                              <div
                                className={`mx-2 ${currentStep > step.number ? "bg-success" : "bg-light"}`}
                                style={{ height: "2px", width: "20px" }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="text-center">
                        <h6 className="mb-1">{steps[currentStep - 1].title}</h6>
                        <small className="text-muted">{steps[currentStep - 1].description}</small>
                      </div>
                    </div>

                    <h4 className="text-center mb-4">
                      {currentStep === 1 ? "Registra tu cuenta!" : `Paso ${currentStep} de 6`}
                    </h4>

                    {props.errorMessage && (
                      <div className="bg-red-300 text-red-900 border border-red-900 p-1 my-2 rounded">
                        {props.errorMessage}
                      </div>
                    )}
                    {props.successMessage && (
                      <div className="bg-green-300 text-green-900 border border-green-900 p-1 my-2 rounded">
                        {props.successMessage}
                      </div>
                    )}

                    <form onSubmit={onSignUp}>
                      <div
                        className={`transition-all duration-300 ${
                          isAnimating ? "opacity-50 transform translate-x-2" : "opacity-100 transform translate-x-0"
                        }`}
                        style={{
                          transition: "all 0.3s ease-in-out",
                          opacity: isAnimating ? 0.5 : 1,
                          transform: isAnimating ? "translateX(10px)" : "translateX(0)",
                        }}
                      >
                        {renderStepContent()}
                      </div>

                      <div className="d-flex justify-content-between align-items-center mt-4">
                        {currentStep > 1 ? (
                          <button
                            type="button"
                            className="btn btn-outline-secondary d-flex align-items-center"
                            onClick={prevStep}
                          >
                            <ArrowLeft size={16} className="me-1" />
                            Anterior
                          </button>
                        ) : (
                          <div></div>
                        )}

                        <button
                          type="submit"
                          className="btn btn-primary d-flex align-items-center"
                          disabled={props.showLoading}
                        >
                          {props.showLoading ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              Procesando...
                            </>
                          ) : currentStep === 6 ? (
                            <>
                              <Check size={16} className="me-1" />
                              Completar Registro
                            </>
                          ) : (
                            <>
                              Siguiente
                              <ArrowRight size={16} className="ms-1" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>

                    {currentStep === 1 && (
                      <div className="new-account mt-3">
                        <p>
                          ¿Ya tienes cuenta?{" "}
                          <Link className="text-primary" to="/login">
                            Iniciar Sesión
                          </Link>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const mapStateToProps = (state) => {
  return {
    errorMessage: state.auth.errorMessage,
    successMessage: state.auth.successMessage,
    showLoading: state.auth.showLoading,
  }
}

export default connect(mapStateToProps)(Register)
