// src/jsx/components/Dashboard/PatientList.jsx
import { useState, useEffect } from "react"
import {
  Users, ChevronLeft, ChevronRight, Search, X, UserPlus,
  User as UserIcon, FileText, ClipboardList, Calendar, Mail, Activity,
  ShieldAlert, ChevronDown, ChevronUp
} from "lucide-react"
import { Modal, Button, Offcanvas, Badge, Collapse} from "react-bootstrap"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"


import "./dashboardCss/patientList.css"
import "./dashboardCss/patientTable.css"

import { createPatient, getMyPatients, deletePatient } from "../../../services/patients/patientService"
import { useAuthUser } from "../../../services/CurrentAuth"
import { getDoctorById, getAllDoctors } from "../../../services/DocInfo/doctorService"

const PROFILE_ROUTE = "/expediente" // Ajusta si tu ruta es distinta

const PatientList = ({ onSelectPatient }) => {
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [patientsPerPage] = useState(4)
  const [newPatientId, setNewPatientId] = useState(null)
  const [showAdvanced, setShowAdvanced] = useState(false)


  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  const [selectedPatient, setSelectedPatient] = useState(() => {
    const stored = localStorage.getItem("selectedPatient")
    return stored ? JSON.parse(stored) : null
  })

  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [showPanel, setShowPanel] = useState(false) // ⬅️ Panel lateral

  const navigate = useNavigate()
  const { uid, organizacionId } = useAuthUser()
  const [doctor, setDoctor] = useState(null)

  // Carga pacientes
  useEffect(() => {
    const fetchPatients = async () => {
      if (!uid) return
      try {
        setLoading(true)
        const response = await getMyPatients()
        setPatients(response.data)
      } finally {
        setLoading(false)
      }
    }
    fetchPatients()
  }, [uid])

  // Carga doctor logueado
  useEffect(() => {
    if (!organizacionId || !uid) return
    const fetchDoctor = async () => {
      try {
        const doc = await getDoctorById(organizacionId, uid)
        setDoctor(doc)
      } catch (e) {
        console.error("Error cargando doctor:", e)
      }
    }
    fetchDoctor()
  }, [organizacionId, uid])

  // Carga doctores para el selector
  useEffect(() => {
    const fetchAllDoctors = async () => {
      if (!organizacionId) return
      try {
        const allDocs = await getAllDoctors(organizacionId)
        setDoctors(allDocs)
      } catch (e) {
        console.error("Error cargando la lista de doctores:", e)
      }
    }
    if (organizacionId) fetchAllDoctors()
  }, [organizacionId])

  // Búsqueda
  const clearSearch = () => setSearchTerm("")
  useEffect(() => {
    const heading = document.querySelector("h3")
    if (heading) heading.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  // Crear paciente
  const onSubmit = async (data) => {
    const patientData = {
      name: data.name,
      email: data.email,
      doctor: data.doctor,
      pathology: "Pendiente",
      lastVisit: new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" }),
      organizacionId,
    }
    try {
      const response = await createPatient(patientData)
      setPatients([response.data, ...patients])
      setNewPatientId(response.data.id)
      setTimeout(() => setNewPatientId(null), 2000)
      reset()
      setShowModal(false)
      setCurrentPage(1)
    } catch (error) {
      console.error("Error al crear paciente:", error)
    }
  }

  // Eliminar paciente
  const handleDelete = async () => {
    if (!selectedPatient?.id) return
    setLoading(true)
    try {
      await deletePatient(selectedPatient.id)
      setPatients(patients.filter((p) => p.id !== selectedPatient.id))
      setSelectedPatient(null)
      localStorage.removeItem("selectedPatient")
      setShowPanel(false)
    } catch (error) {
      console.error("Error al eliminar paciente:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filtro + paginación
  const filteredPatients = patients.filter((patient) =>
    [patient.name, patient.email, patient.doctor]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const indexOfLastPatient = currentPage * patientsPerPage
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient)
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage)
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // Handlers de navegación
  const goToProfile = () => {
    if (!selectedPatient?.id) return
    navigate(PROFILE_ROUTE, { state: { patientId: selectedPatient.id } }) // Compatible con PatientDetails.jsx:contentReference[oaicite:2]{index=2}
  }
  const goToPlan = () => {
    if (!selectedPatient?.id) return
    navigate(`/plan/${selectedPatient.id}`)
  }

  return (
    <div className="container-fluid px-4 py-5">
      {/* Buscador */}
      <div className="mb-4">
        <div className={`search-wrapper ${isSearchFocused ? "focused" : ""} ${searchTerm ? "has-content" : ""}`}>
          <div className="search-icon-left">
            <Search size={20} />
          </div>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar paciente por nombre, correo o doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {searchTerm && (
            <button className="search-clear-btn" onClick={clearSearch} type="button">
              <X size={18} />
            </button>
          )}
          <div className="search-border-animation" />
        </div>
        {searchTerm && (
          <div className="search-results-indicator">
            {filteredPatients.length} resultado{filteredPatients.length !== 1 ? "s" : ""} encontrado
            {filteredPatients.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex items-center">
          <div className="header-icon-container me-3">
            <Users className="header-icon" size={28} />
          </div>
          <div>
            <h3 className="mb-1 text-dark fw-bold">Lista de Pacientes</h3>
            <p className="text-muted mb-0">
              {patients.length} paciente{patients.length !== 1 ? "s" : ""} registrado{patients.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="patient-table-container">
        <div className="table-responsive">
          <table className="table patient-table mb-0">
            <thead>
              <tr>
                <th className="d-none">ID</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Doctor</th>
                <th>Última Visita</th>
              </tr>
            </thead>
            <tbody>
              {currentPatients.map((patient) => (
                <tr
                  key={patient.id}
                  className={`${newPatientId === patient.id ? "new-patient" : ""} ${selectedPatient?.id === patient.id ? "selected" : ""} cursor-pointer`}
                  onClick={() => {
                    setSelectedPatient(patient)
                    localStorage.setItem("selectedPatient", JSON.stringify(patient))
                    setShowPanel(true) // ⬅️ Abre panel lateral
                    if (onSelectPatient) onSelectPatient(patient)
                  }}
                  onDoubleClick={() => {
                    setSelectedPatient(patient)
                    navigate(PROFILE_ROUTE, { state: { patientId: patient.id } }) // acceso rápido con doble clic
                  }}
                >
                  <td className="d-none">
                    <div className="patient-id">{patient.id}</div>
                  </td>
                  <td>
                    <div className="patient-name d-flex align-items-center gap-2">
                      <span className="rounded-circle bg-primary/90 text-white d-inline-flex justify-content-center align-items-center"
                        style={{ width: 28, height: 28 }}>
                        <UserIcon size={16} />
                      </span>
                      <span>{patient.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="patient-email text-muted d-flex align-items-center gap-1">
                      <Mail size={14} /> {patient.email}
                    </div>
                  </td>
                  <td>
                    <div className="patient-doctor">{doctor?.nombre}</div>
                  </td>
                  <td>
                    <div className="patient-visit d-flex align-items-center gap-1">
                      <Calendar size={14} /> {patient.lastVisit}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div className="text-muted small">
            Mostrando {indexOfFirstPatient + 1} a {Math.min(indexOfLastPatient, patients.length)} de {patients.length} pacientes
          </div>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button className="page-link border-0 rounded-3" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
                  <ChevronLeft size={16} />
                </button>
              </li>
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1
                return (
                  <li key={pageNumber} className={`page-item ${currentPage === pageNumber ? "active" : ""}`}>
                    <button className="page-link border-0 rounded-3 mx-1" onClick={() => paginate(pageNumber)}>
                      {pageNumber}
                    </button>
                  </li>
                )
              })}
              <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                <button className="page-link border-0 rounded-3" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>
                  <ChevronRight size={16} />
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Offcanvas: Acciones del paciente seleccionado */}
      <Offcanvas
        show={showPanel}
        onHide={() => setShowPanel(false)}
        placement="end"
        className="max-w-full sm:max-w-md"
      >
        <Offcanvas.Header closeButton className="">
          <Offcanvas.Title className="">
            <div className="d-flex align-items-center gap-2">
              <span
                className="rounded-circle d-inline-flex justify-content-center align-items-center"
                style={{ width: 40, height: 40, background: "linear-gradient(135deg,#2563eb,#22c55e)" }}
              >
                <UserIcon size={20} className="text-white" />
              </span>
              <div className="d-flex flex-column">
                <strong className="text-truncate">{selectedPatient?.name || "Paciente"}</strong>
                <small className="text-muted">{selectedPatient?.email}</small>
              </div>
            </div>
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body className="p-3">
          {/* Chip de última visita */}
          <div className="mb-3">
            <div className="d-inline-flex align-items-center gap-2 bg-light rounded px-2 py-1">
              <Activity size={14} />
              <small>Última visita: {selectedPatient?.lastVisit || "—"}</small>
            </div>
          </div>

          {/* Acciones principales */}
          <div className="card border-0 -sm mb-3">
            <div className="card-body p-3">
              <div className="d-grid gap-2">
                <Button
                  variant="success"
                  className="rounded-3 py-2 d-flex align-items-center justify-content-center gap-2"
                  onClick={goToProfile}
                >
                  <FileText size={18} /> Ver expediente
                </Button>
                <Button
                  variant="success"
                  className="rounded-3 py-2 d-flex align-items-center justify-content-center gap-2"
                  onClick={goToPlan}
                >
                  <ClipboardList size={18} /> Recomendaciones personales
                </Button>
              </div>
            </div>
            {/* Toggle visible desde el primer vistazo */}
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="w-100 btn btn-light border d-flex align-items-center justify-content-between rounded-3 px-3 py-2 mb-2"
            >
              <span className="d-flex align-items-center gap-2">
                <ShieldAlert size={18} className="text-danger" />
                <span className="text-danger">Opciones avanzadas</span>
              </span>
              {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {/* Contenido avanzado colapsable */}
            <Collapse in={showAdvanced}>
              <div>
                <div className="border rounded-3 p-2 bg-white mb-2">
                  <small className="text-muted d-block mb-2">
                    Estas acciones no se pueden deshacer.
                  </small>
                  <Button
                    variant="outline-danger"
                    className="w-100 rounded-3"
                    disabled={loading || !selectedPatient?.id}
                    onClick={handleDelete}
                  >
                    Eliminar paciente
                  </Button>
                </div>
              </div>
            </Collapse>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  )
}

export default PatientList
