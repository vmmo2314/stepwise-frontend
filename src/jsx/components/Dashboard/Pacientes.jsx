import { useState, useEffect } from "react"
import { Users, ChevronLeft, ChevronRight, Search, X, UserPlus } from 'lucide-react'
import { Modal, Button } from "react-bootstrap"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"

import "./dashboardCss/patientList.css"
import "./dashboardCss/patientTable.css"

import { createPatient, getMyPatients, deletePatient } from "../../../services/patients/patientService" // Importar deletePatient
import { useAuthUser } from "../../../services/CurrentAuth"
import { getDoctorById, getAllDoctors } from "../../../services/DocInfo/doctorService" // Importar getAllDoctors

const PatientList = ({ onSelectPatient }) => {
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([]) // Nuevo estado para almacenar la lista de doctores
  const [showModal, setShowModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [patientsPerPage] = useState(4)
  const [newPatientId, setNewPatientId] = useState(null)
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
  const navigate = useNavigate()
  const { uid, organizacionId } = useAuthUser()
  const [doctor, setDoctor] = useState(null) // Este es el doctor logueado

  useEffect(() => {
    const fetchPatients = async () => {
      if (!uid) return
      try {
        setLoading(true)
        // getMyPatients ya no necesita el UID como parámetro si lo obtiene del token
        const response = await getMyPatients()
        setPatients(response.data) // Asumiendo que la respuesta de Axios tiene un campo .data
      } finally {
        setLoading(false)
      }
    }
    fetchPatients()
  }, [uid])

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

  // Cargar la lista de todos los doctores para el dropdown
  useEffect(() => {
    const fetchAllDoctors = async () => {
      if (!organizacionId) return; // Necesitas el organizacionId para obtener doctores
      try {
        const allDocs = await getAllDoctors(organizacionId);
        setDoctors(allDocs);
      } catch (e) {
        console.error("Error cargando la lista de doctores:", e);
      }
    };
    if (organizacionId) { // Solo si organizacionId está disponible
      fetchAllDoctors();
    }
  }, [organizacionId]);

  const clearSearch = () => {
    setSearchTerm("")
  }

  useEffect(() => {
    const heading = document.querySelector("h3")
    if (heading) {
      heading.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [])

  const onSubmit = async (data) => {
    // No generes el ID aquí, el backend lo hará
    const patientData = {
      name: data.name,
      email: data.email,
      doctor: data.doctor, // data.doctor ahora es el UID del doctor seleccionado
      pathology: "Pendiente", // Puedes hacer esto dinámico si lo necesitas
      lastVisit: new Date().toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      // Añadir organizacionId si es relevante para el paciente
      organizacionId: organizacionId, // Asumiendo que el paciente pertenece a la misma organización que el doctor que lo crea
    }
    try {
      const response = await createPatient(patientData)
      // Usa el ID devuelto por el backend
      setPatients([response.data, ...patients]) // response.data contendrá el nuevo paciente con su ID
      setNewPatientId(response.data.id) // Usa el ID real del paciente
      setTimeout(() => setNewPatientId(null), 2000)
      reset()
      setShowModal(false)
      setCurrentPage(1)
    } catch (error) {
      console.error("Error al crear paciente:", error)
      // Manejar el error, quizás mostrar un mensaje al usuario
    }
  }

  const handleDelete = async () => {
    if (!selectedPatient || !selectedPatient.id) return; // Asegurarse de que haya un paciente seleccionado y tenga ID
    setLoading(true);
    try {
      await deletePatient(selectedPatient.id);
      setPatients(patients.filter(p => p.id !== selectedPatient.id)); // Eliminar el paciente del estado
      setSelectedPatient(null); // Deseleccionar paciente después de eliminar
      localStorage.removeItem("selectedPatient"); // Limpiar del localStorage
    } catch (error) {
      console.error("Error al eliminar paciente:", error);
      // Aquí podrías añadir un estado de error para mostrar un mensaje al usuario
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter((patient) =>
    [patient.name, patient.email, patient.doctor].some((field) =>
      field.toLowerCase().includes(searchTerm.toLowerCase()),
    ),
  )

  const indexOfLastPatient = currentPage * patientsPerPage
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient)
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  return (
    <div className="container-fluid px-4 py-5">
      <div className="search-container mb-4">
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
          <div className="search-border-animation"></div>
        </div>
        {searchTerm && (
          <div className="search-results-indicator">
            {filteredPatients.length} resultado{filteredPatients.length !== 1 ? "s" : ""} encontrado
            {filteredPatients.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
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
        <button
          className="btn btn-primary btn-lg px-4 py-2 rounded-3 shadow-sm hover-lift"
          onClick={() => setShowModal(true)}
        >
          <UserPlus size={18} className="me-2" /> Añadir Paciente
        </button>
      </div>

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
                  className={`${newPatientId === patient.id ? "new-patient" : ""} ${selectedPatient?.id === patient.id ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedPatient(patient)
                    localStorage.setItem("selectedPatient", JSON.stringify(patient))
                    if (onSelectPatient) {
                      // Asegurarse de que la prop exista antes de llamarla
                      onSelectPatient(patient)
                    }
                  }}
                >
                  <td className="d-none">
                    <div className="patient-id">{patient.id}</div>
                  </td>
                  <td>
                    <div className="patient-name">
                      {patient.name}
                      <span className={`selected-tag ms-2 ${selectedPatient?.id === patient.id ? "visible" : ""}`}>
                        Seleccionado
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="patient-email">{patient.email}</div>
                  </td>
                  <td>
                    <div className="patient-doctor">{doctor?.nombre}</div>
                  </td>
                  <td>
                    <div className="patient-visit">{patient.lastVisit}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div className="text-muted small">
            Mostrando {indexOfFirstPatient + 1} a {Math.min(indexOfLastPatient, patients.length)} de {patients.length}{" "}
            pacientes
          </div>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link border-0 rounded-3"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                >
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
                <button
                  className="page-link border-0 rounded-3"
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      <Modal className="fade" show={showModal} onHide={() => setShowModal(false)} centered>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold">Registrar Nuevo Paciente</Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-2">
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-semibold text-dark">
                  Nombre Completo <span className="text-danger">*</span>
                </label>
                <input
                  {...register("name", {
                    required: "El nombre es obligatorio",
                    minLength: { value: 2, message: "El nombre debe tener al menos 2 caracteres" },
                  })}
                  className={`form-control form-control-lg rounded-3 ${errors.name ? "is-invalid" : ""}`}
                  placeholder="Ingrese el nombre completo del paciente"
                />
                {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold text-dark">
                  Correo Electrónico <span className="text-danger">*</span>
                </label>
                <input
                  {...register("email", {
                    required: "El email es obligatorio",
                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Ingrese un email válido" },
                  })}
                  type="email"
                  className={`form-control form-control-lg rounded-3 ${errors.email ? "is-invalid" : ""}`}
                  placeholder="ejemplo@correo.com"
                />
                {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold text-dark">
                  Doctor Asignado <span className="text-danger">*</span>
                </label>
                <select
                  {...register("doctor", { required: "Seleccione un doctor" })}
                  className={`form-select form-select-lg rounded-3 ${errors.doctor ? "is-invalid" : ""}`}
                >
                  <option value="">Seleccionar un doctor...</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}> {/* El valor debe ser el UID del doctor */}
                      {doc.nombre}
                    </option>
                  ))}
                </select>
                {errors.doctor && <div className="invalid-feedback">{errors.doctor.message}</div>}
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-2">
            <Button variant="light" className="rounded-3 px-4" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" className="rounded-3 px-4" type="submit">
              <UserPlus size={18} className="me-2" />
              Registrar Paciente
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}

export default PatientList
