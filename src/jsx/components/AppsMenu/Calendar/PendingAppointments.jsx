import React, { useEffect, useState } from "react"
import { getPatientAppointments } from "../../../../services/citas/AppointmentService"
import { Search, CalendarDays, Clock, CalendarX2 } from "lucide-react"
import {
  Dropdown,
} from 'react-bootstrap'

const PendingAppointments = () => {
  const [statusFilter, setStatusFilter] = useState("all")
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(4)

  const fetchAppointments = async (status = "pending") => {
    try {
      setLoading(true)
      setErr("")
      const data = await getPatientAppointments(status)
      setItems(Array.isArray(data) ? data : [])
      setCurrentPage(1)
    } catch (e) {
      setErr(e.message || "Error al cargar citas del paciente.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments(statusFilter)
  }, [statusFilter])

  const filteredItems = React.useMemo(() => {
    let filtered = items
    if (searchTerm) {
      filtered = items.filter(
        (item) =>
          (item.doctorName || item.doctorId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.clinicaName || item.clinicaId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.doctorResponse || "").toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    return filtered
  }, [items, searchTerm])

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage)

  const badgeClass = (status) => {
    switch (status) {
      case "pending":
        return "badge bg-warning text-dark"
      case "accepted":
        return "badge bg-success"
      case "rejected":
        return "badge bg-danger"
      case "rescheduled":
        return "badge bg-info text-dark"
      default:
        return "badge bg-secondary"
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Pendiente"
      case "accepted":
        return "Aceptada"
      case "rejected":
        return "Rechazada"
      case "rescheduled":
        return "Reprogramada"
      default:
        return status
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "—"
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const formatDateTime = (createdAt) => {
    if (!createdAt) return "—"
    try {
      let date
      if (createdAt._seconds) {
        date = new Date(createdAt._seconds * 1000)
      } else if (createdAt.toDate) {
        date = createdAt.toDate()
      } else {
        date = new Date(createdAt)
      }
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "—"
    }
  }

  return (
    <div className="w-full p-4 md:p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
      {/* Header con título, buscador y dropdown en una sola fila */}
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-lg-between gap-3 mb-4">
        {/* Título */}
        <h2 className="text-xl font-semibold mb-3 mb-lg-0">Historial</h2>

        {/* Controles: buscador y dropdown */}
        <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-3 flex-shrink-0">
          {/* Buscador */}
          <div className="position-relative" style={{ minWidth: "250px" }}>
            <Search className="position-absolute top-50 translate-middle-y ms-3" style={{ width: "16px", height: "16px", color: "#6c757d", zIndex: 1 }} />
            <input
              type="text"
              className="form-control form-control-sm ps-5 pe-3"
              placeholder="Buscar por doctor, clínica..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: "2.5rem" }}
            />
          </div>

          {/* Dropdown de filtros */}
          <div className="d-flex">
            <Dropdown>
              <Dropdown.Toggle variant="outline-primary" size="sm" id="dropdown-status" className="text-nowrap">
                {statusFilter === "all" ? "Todas" : getStatusText(statusFilter)}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setStatusFilter("pending")}>Pendientes</Dropdown.Item>
                <Dropdown.Item onClick={() => setStatusFilter("accepted")}>Aceptadas</Dropdown.Item>
                <Dropdown.Item onClick={() => setStatusFilter("rescheduled")}>Reprogramadas</Dropdown.Item>
                <Dropdown.Item onClick={() => setStatusFilter("rejected")}>Rechazadas</Dropdown.Item>
                <Dropdown.Item onClick={() => setStatusFilter("all")}>Todas</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-10 text-center text-gray-500">
          <div className="spinner-border text-primary me-2" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          Cargando citas…
        </div>
      )}

      {/* Error */}
      {err && !loading && (
        <div className="alert alert-danger" role="alert">
          {err}
        </div>
      )}

      {/* Content */}
      {!loading && !err && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <small className="text-muted">
              Mostrando {paginatedItems.length} de {filteredItems.length} citas
              {searchTerm && ` para "${searchTerm}"`}
            </small>
          </div>

          {paginatedItems.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <CalendarX2 className="mx-auto mb-3 w-10 h-10 text-gray-400" />
              <h5>No hay citas para mostrar</h5>
              <p className="text-muted">
                {searchTerm
                  ? `No se encontraron citas que coincidan con "${searchTerm}"`
                  : statusFilter === "all"
                  ? "No tienes citas registradas"
                  : `No tienes citas ${getStatusText(statusFilter).toLowerCase()}`}
              </p>
            </div>
          ) : (
            <>
              <div className="row g-3">
                {paginatedItems.map((appointment) => (
                  <div key={appointment.id} className="col-12 col-md-6 col-xl-3">
                    <div className="card h-100 shadow-sm border-0 hover:shadow-md transition rounded-lg">
                      <div className="card-body">
                        {/* Card Header */}
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="flex-grow-1">
                            <h6 className="card-title mb-1 fw-semibold">
                              {appointment.doctorName || appointment.doctorId}
                            </h6>
                            <p className="card-text text-muted small mb-0">
                              {appointment.clinicaName || appointment.clinicaId}
                            </p>
                          </div>
                          <span className={badgeClass(appointment.status)}>{getStatusText(appointment.status)}</span>
                        </div>

                        {/* Appointment Details */}
                        <div className="mb-3">
                          <div className="d-flex align-items-center mb-2">
                            <CalendarDays className="me-2 w-4 h-4 text-gray-500" />
                            <div>
                              <div className="fw-medium small">{formatDate(appointment.requestedDate)}</div>
                              <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                                Fecha solicitada
                              </div>
                            </div>
                          </div>

                          <div className="d-flex align-items-center mb-2">
                            <Clock className="me-2 w-4 h-4 text-gray-500" />
                            <div>
                              <div className="fw-medium small">{appointment.requestedTime}</div>
                              <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                                Hora solicitada
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Doctor Response */}
                        {appointment.doctorResponse && (
                          <div className="bg-light rounded p-2 mb-3">
                            <div className="text-muted small fw-medium mb-1">Respuesta del doctor:</div>
                            <div className="small">{appointment.doctorResponse}</div>
                          </div>
                        )}

                        {/* Alternative Date */}
                        {appointment.alternativeDate && appointment.alternativeTime && (
                          <div className="alert alert-info py-2 mb-3">
                            <div className="text-muted small fw-medium mb-1">Fecha alternativa:</div>
                            <div className="small">
                              {formatDate(appointment.alternativeDate)} a las {appointment.alternativeTime}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="card-footer bg-transparent border-top-0 pt-0">
                        <small className="text-muted">Creada: {formatDateTime(appointment.createdAt)}</small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="mt-4">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </button>
                    </li>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <li key={page} className={`page-item ${currentPage === page ? "active" : ""}`}>
                        <button className="page-link" onClick={() => setCurrentPage(page)}>
                          {page}
                        </button>
                      </li>
                    ))}

                    <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Siguiente
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

export default PendingAppointments