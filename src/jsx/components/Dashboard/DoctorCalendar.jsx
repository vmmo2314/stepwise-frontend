import { Component } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Spinner,
  Badge,
  Button,
  ListGroup,
  Modal,
  Pagination,
  Dropdown,
} from "react-bootstrap";

import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  Send,
  Eye,
  Activity,
  Users,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import Swal from "sweetalert2";
import "./dashboardCss/appointment-response.css"; 

import { 
  getMyAppointments, 
  acceptAppointment, 
  rejectAppointment, 
  rescheduleAppointment 
} from "../../../services/citas/AppointmentService";

class AppointmentResponseWindow extends Component {
    _successTimer = null;

    hideSuccessAfter = (ms = 1200) => {
    clearTimeout(this._successTimer);
    this._successTimer = setTimeout(() => {
        this.setState({ showSuccessAnimation: false });
    }, ms);
    };


    state = {
      pendingAppointments: [],
      loadingAppointments: false,

      showResponseModal: false,
      showRescheduleModal: false,
      showDetailsModal: false,
      selectedAppointment: null,
      responseType: null,

      alternativeDates: [],
      selectedAlternativeDate: "",
      selectedAlternativeTime: "",
      doctorNotes: "",

      availableTimeSlots: [
        "08:00",
        "08:30",
        "09:00",
        "09:30",
        "10:00",
        "10:30",
        "11:00",
        "11:30",
        "12:00",
        "12:30",
        "14:00",
        "14:30",
        "15:00",
        "15:30",
        "16:00",
        "16:30",
        "17:00",
        "17:30",
      ],

      isProcessing: false,
      loadingAppointments: false,
      animatingCard: null,
      showSuccessAnimation: false,

      filterStatus: "all",
      filterPriority: "all",
      searchTerm: "",
      sortBy: "createdAt",
      sortOrder: "desc",

      sidebarCollapsed: false,
      showNotifications: true,
    };

    handleAppointmentResponse = (appointment, responseType) => {
      this.setState({
        selectedAppointment: appointment,
        responseType,
        showResponseModal: true,
        doctorNotes: "",
        animatingCard: appointment.id,
      });
      setTimeout(() => this.setState({ animatingCard: null }), 1000);
    };

    rowAnimTimer = null;

    triggerRowAnimation = (id, kind = "accept") => {
    clearTimeout(this.rowAnimTimer);
    this.setState({ rowAnim: { id, kind } });
    this.rowAnimTimer = setTimeout(() => {
        this.setState({ rowAnim: null });
    }, 900); // duración de la animación
    };

    componentWillUnmount() {
      clearTimeout(this._successTimer);
      clearTimeout(this.rowAnimTimer);
    }

    componentDidMount() {
      this.loadAppointments();
      this.generateAlternativeDates();
      this.animateInitialLoad();
    }

    loadAppointments = async () => {
      try {
        this.setState({ loadingAppointments: true });

        // Puedes filtrar solo "pending" o traer todas y filtrarlas en front
        const clinicaId = "clinica_uno"; // aquí usas la que tengas en sesión o contexto
        const citas = await getMyAppointments(clinicaId, "all");

        this.setState({
          pendingAppointments: citas,
          loadingAppointments: false,
        });
      } catch (error) {
        console.error("Error cargando citas:", error);
        this.setState({ loadingAppointments: false });
      }
    };

  animateInitialLoad = () => {
    // Evita manipular el DOM directamente para animaciones.
    // Si quieres animación, hazlo con una clase fija en CSS que termine en opacity:1.
    // Aquí lo dejamos no-op para que NO desaparezcan las citas.
    return;
  };

  generateAlternativeDates = () => {
    const dates = [];
    const today = new Date();

    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push({
          value: date.toISOString().split("T")[0],
          label: date.toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        });
      }
    }

    this.setState({ alternativeDates: dates });
  };

  confirmAcceptAppointment = async () => {
    const { selectedAppointment, doctorNotes } = this.state;
    this.setState({ isProcessing: true });

    try {
      const updated = await acceptAppointment({
        appointmentId: selectedAppointment.id,
        doctorNotes
      });

      this.setState(prev => ({
        pendingAppointments: prev.pendingAppointments.map(a =>
          a.id === updated.id ? updated : a
        ),
        showResponseModal: false,
        isProcessing: false,
        showSuccessAnimation: true
      }), () => this.hideSuccessAfter(1200));

      Swal.fire("¡Cita confirmada!", "La cita fue aceptada correctamente", "success");
    } catch (e) {
      this.setState({ isProcessing: false });
      Swal.fire("Error", e, "error");
    }
  };

  handleRejectAndReschedule = () => {
    this.setState({
      showResponseModal: false,
      showRescheduleModal: true,
      selectedAlternativeDate: "",
      selectedAlternativeTime: "",
    });
  };

  confirmRejectWithAlternatives = async () => {
    const { selectedAppointment, selectedAlternativeDate, selectedAlternativeTime, doctorNotes } = this.state;

    if (!selectedAlternativeDate || !selectedAlternativeTime) {
      Swal.fire("Advertencia", "Selecciona fecha y hora", "warning");
      return;
    }

    this.setState({ isProcessing: true });

    try {
      const updated = await rescheduleAppointment({
        appointmentId: selectedAppointment.id,
        alternativeDate: selectedAlternativeDate,
        alternativeTime: selectedAlternativeTime,
        doctorNotes
      });

      this.setState(prev => ({
        pendingAppointments: prev.pendingAppointments.map(a =>
          a.id === updated.id ? updated : a
        ),
        showRescheduleModal: false,
        isProcessing: false
      }));

      Swal.fire("Propuesta enviada", "Se envió la nueva fecha/hora al paciente", "info");
    } catch (e) {
      this.setState({ isProcessing: false });
      Swal.fire("Error", e, "error");
    }
  };

  confirmRejectAppointment = async () => {
    const { selectedAppointment, doctorNotes } = this.state;
    this.setState({ isProcessing: true });

    try {
      const updated = await rejectAppointment({
        appointmentId: selectedAppointment.id,
        doctorNotes
      });

      this.setState(prev => ({
        pendingAppointments: prev.pendingAppointments.map(a =>
          a.id === updated.id ? updated : a
        ),
        showResponseModal: false,
        isProcessing: false
      }));

      Swal.fire("Cita rechazada", "La cita ha sido rechazada.", "info");
      this.triggerRowAnimation(selectedAppointment.id, "reject");
    } catch (e) {
      this.setState({ isProcessing: false });
      Swal.fire("Error", e, "error");
    }
  };


  closeModals = () => {
    this.setState({
      showResponseModal: false,
      showRescheduleModal: false,
      showDetailsModal: false,
      selectedAppointment: null,
      responseType: null,
    });
  };

  getFilteredAppointments = () => {
    const { filterStatus, filterPriority, searchTerm, sortBy, sortOrder } = this.state;

    let filtered = Array.isArray(this.state.pendingAppointments)
      ? [...this.state.pendingAppointments]
      : [];

    // 1) Filtro por estado (default "all")
    if (filterStatus && filterStatus !== "all") {
      filtered = filtered.filter((a) => a.status === filterStatus);
    }

    // 2) Filtro por prioridad (si lo usas)
    if (filterPriority && filterPriority !== "all") {
      filtered = filtered.filter((a) => a.priority === filterPriority);
    }

    // 3) Búsqueda (evita crashear si hay campos nulos)
    const q = (searchTerm || "").trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((a) => {
        const name = (a.patientName || "").toLowerCase();
        const mail = (a.patientEmail || "").toLowerCase();
        const notes = (a.notes || "").toLowerCase();
        return name.includes(q) || mail.includes(q) || notes.includes(q);
      });
    }

    // 4) Orden final (por fecha/creación) — descendente por defecto
    filtered.sort((a, b) => {
      const av = a?.[sortBy];
      const bv = b?.[sortBy];
      if (av === bv) return 0;
      return sortOrder === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

    return filtered;
  };


  getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: "warning", text: "Pendiente", icon: Clock },
      accepted: { variant: "success", text: "Aceptada", icon: CheckCircle },
      rejected: { variant: "danger", text: "Rechazada", icon: XCircle },
      rescheduled: { variant: "info", text: "Reprogramada", icon: RefreshCw },
    };
    const c = statusConfig[status] || statusConfig.pending;
    const Icon = c.icon;
    return (
      <Badge bg={c.variant} className="d-inline-flex align-items-center gap-1">
        <Icon size={12} />
        {c.text}
      </Badge>
    );
  };

  getPriorityBadge = (priority) => {
    const priorityConfig = {
      high: { variant: "danger", text: "Alta", icon: AlertCircle },
      medium: { variant: "warning", text: "Media", icon: Activity },
      low: { variant: "secondary", text: "Baja", icon: TrendingUp },
    };
    const c = priorityConfig[priority] || priorityConfig.medium;
    const Icon = c.icon;
    return (
      <Badge bg={c.variant} className="d-inline-flex align-items-center gap-1 badge-glow">
        <Icon size={10} />
        {c.text}
      </Badge>
    );
  };

  render() {
    const {
      showResponseModal,
      showRescheduleModal,
      showDetailsModal,
      selectedAppointment,
      responseType,
      alternativeDates,
      selectedAlternativeDate,
      selectedAlternativeTime,
      availableTimeSlots,
      doctorNotes,
      isProcessing,
      loadingAppointments,
      animatingCard,
      showSuccessAnimation,
      filterStatus,
      searchTerm,
    } = this.state;

    const filteredAppointments = this.getFilteredAppointments();

    function mostrarFechaProcesada(fecha) {
      if (!fecha) return "Fecha desconocida";
      // Si es un objeto tipo Timestamp de Firebase
      if (typeof fecha === "object" && typeof fecha.toDate === "function") {
        return fecha.toDate().toLocaleDateString("es-ES");
      }
      // Si es un string
      if (typeof fecha === "string") {
        // Extrae solo la parte de la fecha antes de la coma
        return fecha.split(",")[0];
      }
      // Si es un número (timestamp en ms)
      if (typeof fecha === "number") {
        return new Date(fecha).toLocaleDateString("es-ES");
      }
      return "Fecha desconocida";
    }

    return (
      <div className="appointment-response-container px-4 md:px-6 py-4 space-y-4">
        {/* Overlay éxito */}
        {this.state.showSuccessAnimation && <div className="success-overlay" />}

        <Row className="g-4">
          {/* Sidebar */}
          <Col xl={3} xxl={4}>
            <Card className="shadow-sm border-0 mb-4 card-lift">
              <Card.Header className="border-0 bg-gradient-primary text-white d-flex align-items-center justify-content-between">
                <h5 className="mb-0 d-flex align-items-center gap-2">Filtros</h5>
                {this.state.loadingAppointments && <Spinner size="sm" />}
              </Card.Header>

              <Card.Body>
                {/* Buscar */}
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-muted d-flex align-items-center gap-1">
                    <Search size={14} /> BUSCAR PACIENTE
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nombre, email o notas..."
                    value={this.state.searchTerm || ""}
                    onChange={(e) =>
                      this.setState({ searchTerm: e.target.value, currentPage: 1 })
                    }
                    className="border-0 bg-light search-input"
                  />
                </Form.Group>

                {/* Estado → Dropdown (en lugar de combobox rancio 😅) */}
                <Form.Group className="mb-0">
                  <Form.Label className="small fw-semibold text-muted d-flex align-items-center gap-1">
                    <Filter size={14} /> ESTADO
                  </Form.Label>

                  <Dropdown
                    onSelect={(key) =>
                      this.setState({ filterStatus: key, currentPage: 1 })
                    }
                  >
                    <Dropdown.Toggle
                      className="w-100 text-start border-0 bg-light text-dark"
                      id="dropdown-status"
                      variant="light"
                    >
                      {{
                        all: "Todos los estados",
                        pending: "Pendientes",
                        accepted: "Aceptadas",
                        rejected: "Rechazadas",
                        rescheduled: "Reprogramadas",
                      }[this.state.filterStatus || "all"] || "Todos los estados"}
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="w-100">
                      <Dropdown.Item eventKey="all">Todos los estados</Dropdown.Item>
                      <Dropdown.Item eventKey="pending">Pendientes</Dropdown.Item>
                      <Dropdown.Item eventKey="accepted">Aceptadas</Dropdown.Item>
                      <Dropdown.Item eventKey="rescheduled">Reprogramadas</Dropdown.Item>
                      <Dropdown.Item eventKey="rejected">Rechazadas</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          {/* Main */}
          <Col xl={9} xxl={8}>
            <Card className="shadow-sm border-0">
              <div className="card-header bg-white border-bottom">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <h4 className="mb-0 d-flex align-items-center gap-2 text-slate-800">
                    <Users size={24} /> Gestión de Citas Médicas
                  </h4>
                  <div className="d-flex align-items-center gap-3">
                      <Badge bg="primary" className="fs-6">
                        {filteredAppointments.length} citas
                      </Badge>
                    {this.state.loadingAppointments && (
                      <Spinner animation="border" size="sm" variant="primary" />
                    )}
                  </div>
                </div>
              </div>

              <Card.Body className="p-0">
                {(() => {
                  // === ORDEN INTELIGENTE + PAGINACIÓN ===
                  // 1) ordenar por estado: pendientes → aceptadas → reprogramadas → culminadas → rechazadas
                  const ORDER = {
                    pending: 0,
                    accepted: 1,
                    rescheduled: 2,
                    completed: 3,
                    culminated: 3,
                    rejected: 4,
                    canceled: 4,
                  };

                  const base = filteredAppointments;

                  const ordered = [...base].sort((a, b) => {
                    const oa = ORDER[a.status] ?? 99;
                    const ob = ORDER[b.status] ?? 99;
                    if (oa !== ob) return oa - ob;
                    // dentro del mismo estado: más recientes primero
                    const da = new Date(a.createdAt || 0).getTime();
                    const db = new Date(b.createdAt || 0).getTime();
                    return db - da;
                  });

                  // 2) paginación (5 por página)
                  const pageSize = 5;
                  const currentPage = Math.max(1, this.state.currentPage || 1);
                  const total = ordered.length;
                  const pageCount = Math.max(1, Math.ceil(total / pageSize));
                  const start = (currentPage - 1) * pageSize;
                  const pageItems = ordered.slice(start, start + pageSize);

                  if (total === 0) {
                    return (
                      <div className="text-center py-5">
                        <div className="mb-4 d-inline-flex">
                          <Calendar size={56} className="opacity-50" />
                        </div>
                        <h5 className="text-muted">No hay citas que mostrar</h5>
                        <p className="text-muted">
                          {Array.isArray(this.state.pendingAppointments) &&
                          this.state.pendingAppointments.length === 0
                            ? "No hay citas cargadas. Conecta tu API para ver las citas."
                            : "No se encontraron citas con los filtros aplicados."}
                        </p>
                        <Button
                          variant="outline-primary"
                          onClick={() =>
                            this.setState({
                              filterStatus: "all",
                              searchTerm: "",
                              currentPage: 1,
                            })
                          }
                          className="btn-hover-scale"
                        >
                          Limpiar Filtros
                        </Button>
                      </div>
                    );
                  }

                  // rango de páginas visibles (máx 5)
                  const left = Math.max(1, currentPage - 2);
                  const right = Math.min(pageCount, currentPage + 2);
                  const pages = Array.from(
                    { length: right - left + 1 },
                    (_, i) => left + i
                  );

                  return (
                    <>
                      <ListGroup variant="flush">
                        {pageItems.map((appointment, index) => (
                          <ListGroup.Item
                            key={appointment.id}
                            className={`border-0 border-bottom appointment-card ${
                              this.state.rowAnim?.id === appointment.id
                                ? this.state.rowAnim.kind === "accept"
                                  ? "row-anim-accept"
                                  : this.state.rowAnim.kind === "reject"
                                  ? "row-anim-reject"
                                  : "row-anim-reschedule"
                                : ""
                            }`}
                            style={{ animationDelay: `${index * 0.08}s` }}
                          >
                            <Row className="align-items-center gy-3">
                              {/* prioridad / avatar */}
                              <Col xs={2} sm={1} className="text-center">
                                <div
                                  className={`d-inline-flex align-items-center justify-content-center rounded-circle text-white ${
                                    appointment.priority === "high"
                                      ? "bg-danger"
                                      : appointment.priority === "medium"
                                      ? "bg-warning"
                                      : "bg-secondary"
                                  }`}
                                  style={{ width: 36, height: 36, minWidth: 36 }}
                                >
                                  <User size={16} />
                                </div>
                              </Col>

                              {/* info */}
                              <Col md={7} className="col-12 col-sm-7 col-md-7">
                                <div className="d-flex align-items-start gap-3">
                                  <div className="flex-grow-1">
                                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                                      <h6 className="mb-0 text-slate-800">
                                        {appointment.patientName}
                                      </h6>
                                      {this.getStatusBadge(appointment.status)}
                                    </div>

                                    <div className="d-flex align-items-center gap-3 text-muted small mb-2 flex-wrap">
                                      <span className="d-flex align-items-center gap-1">
                                        <Calendar size={12} />{" "}
                                        {appointment.requestedDate}
                                      </span>
                                      <span className="d-flex align-items-center gap-1">
                                        <Clock size={12} />{" "}
                                        {appointment.requestedTime}
                                      </span>

                                    </div>
                                      <span className="d-flex align-items-center gap-6">
                                        <Mail size={14} />{" "}
                                        {appointment.patientEmail}
                                      </span>
                                    {appointment.alternativeDate && (
                                      <div className="mt-2 p-2 bg-light bg-opacity-10 rounded">
                                        <small className="text-info d-flex align-items-center gap-1">
                                          <RefreshCw size={12} />
                                          <strong>Nueva propuesta:</strong>{" "}
                                          {appointment.alternativeDate} -{" "}
                                          {appointment.alternativeTime}
                                        </small>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Col>
                              {/* acciones */}
                              <Col
                                md={4}
                                className="text-end d-flex justify-content-end align-items-center"
                              >
                                {appointment.status === "pending" ? (
                                  // ▶️ FORZAMOS FILA HORIZONTAL CON btn-group
                                  <div className="btn-group d-flex justify-content-end" style={{ gap: "0.02rem" }} >
                                    <Button
                                      variant="outline-info"
                                      size="md"
                                      onClick={() =>
                                        this.setState({
                                          selectedAppointment: appointment,
                                          showDetailsModal: true,
                                        })
                                      }
                                      // quitar `btn-wide` y forzar ancho auto
                                      className="btn-pill d-inline-flex align-items-center gap-2"
                                      style={{ width: "auto", flex: "0 0 auto" }}
                                    >
                                      <Eye size={16} /> Ver
                                    </Button>

                                    <Button
                                      variant="success"
                                      size="md"
                                      onClick={() => this.handleAppointmentResponse(appointment, "accept")}
                                      className="btn-pill d-inline-flex align-items-center gap-2"
                                      style={{ width: "auto", flex: "0 0 auto" }}
                                    >
                                      <CheckCircle size={16} /> Aceptar
                                    </Button>

                                    <Button
                                      variant="outline-warning"
                                      size="md"
                                      onClick={() => this.handleAppointmentResponse(appointment, "reject")}
                                      className="btn-pill d-inline-flex align-items-center gap-2"
                                      style={{ width: "auto", flex: "0 0 auto" }}
                                    >
                                      <XCircle size={16} /> Rechazar
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="text-end">
                                    <small className="text-muted d-block">
                                      Procesada el{" "}
                                      {mostrarFechaProcesada(appointment.processedAt || appointment.createdAt)}
                                    </small>
                                    <Button
                                      variant="outline-secondary"
                                      size="md"
                                      onClick={() =>
                                        this.setState({
                                          selectedAppointment: appointment,
                                          showDetailsModal: true,
                                        })
                                      }
                                      className="btn-pill mt-2 d-inline-flex align-items-center gap-2"
                                      style={{ width: "auto", flex: "0 0 auto" }}
                                    >
                                      <Eye size={16} /> Detalles
                                    </Button>
                                  </div>
                                )}
                              </Col>
                            </Row>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>

                      {/* Pie + Paginación */}
                      <div className="p-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <small className="text-muted">
                          Mostrando <strong>{start + 1}</strong>–
                          <strong>{Math.min(start + pageSize, total)}</strong> de{" "}
                          <strong>{total}</strong>
                        </small>

                        <Pagination className="mb-0">
                          <Pagination.First
                            disabled={currentPage === 1}
                            onClick={() => this.setState({ currentPage: 1 })}
                          />
                          <Pagination.Prev
                            disabled={currentPage === 1}
                            onClick={() =>
                              this.setState({ currentPage: currentPage - 1 })
                            }
                          />
                          {pages.map((p) => (
                            <Pagination.Item
                              key={p}
                              active={p === currentPage}
                              onClick={() => this.setState({ currentPage: p })}
                            >
                              {p}
                            </Pagination.Item>
                          ))}
                          <Pagination.Next
                            disabled={currentPage === pageCount}
                            onClick={() =>
                              this.setState({ currentPage: currentPage + 1 })
                            }
                          />
                          <Pagination.Last
                            disabled={currentPage === pageCount}
                            onClick={() =>
                              this.setState({ currentPage: pageCount })
                            }
                          />
                        </Pagination>
                      </div>
                    </>
                  );
                })()}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Modal Respuesta */}
        <Modal
          show={this.state.showResponseModal}
          onHide={this.closeModals}
          size="lg"
          centered
          className="appointment-modal"
        >
          <Modal.Header
            closeButton
            className={`${
              this.state.responseType === "accept"
                ? "bg-success text-white"
                : "bg-warning text-dark"
            } border-0`}
          >
            <Modal.Title className="d-flex align-items-center gap-2">
              {this.state.responseType === "accept" ? (
                <>
                  <CheckCircle size={20} /> Confirmar Cita
                </>
              ) : (
                <>
                  <XCircle size={20} /> Rechazar Cita
                </>
              )}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {this.state.selectedAppointment && (
              <div>
                <div className="bg-light p-4 rounded-3 mb-4 border">
                  <h6 className="text-primary mb-3 d-flex align-items-center gap-2">
                    <FileText size={16} /> Detalles Completos de la Cita
                  </h6>
                  <Row>
                    <Col md={6}>
                      <div className="mb-3">
                        <strong className="text-muted small">PACIENTE</strong>
                        <p className="mb-1 h6">
                          {this.state.selectedAppointment.patientName}
                        </p>
                        <p className="mb-1 small text-muted">
                          <Mail size={12} className="me-1" />{" "}
                          {this.state.selectedAppointment.patientEmail}
                        </p>
                        <p className="mb-0 small text-muted">
                          <Phone size={12} className="me-1" />{" "}
                          {this.state.selectedAppointment.patientPhone}
                        </p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <strong className="text-muted small">CITA SOLICITADA</strong>
                        <p className="mb-1 h6">
                          <Calendar size={14} className="me-1" />{" "}
                          {this.state.selectedAppointment.requestedDate}
                        </p>
                        <p className="mb-1">
                          <Clock size={14} className="me-1" />{" "}
                          {this.state.selectedAppointment.requestedTime}
                        </p>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <div className="mb-3">
                        <strong className="text-muted small">ESPECIALIDAD</strong>
                        <p className="mb-0">
                          {this.state.selectedAppointment.specialty}
                        </p>
                      </div>
                    </Col>
                  </Row>
                  <div>
                    <strong className="text-muted small">Comentarios del paciente</strong>
                    <p className="mb-0 p-2 bg-white rounded border">
                      {this.state.selectedAppointment.notes}
                    </p>
                  </div>
                </div>

                <Form.Group>
                  <Form.Label className="fw-bold">
                    {this.state.responseType === "accept" ? (
                      <>
                        <CheckCircle size={16} className="me-1 text-success" />{" "}
                        Notas de confirmación (opcional)
                      </>
                    ) : (
                      <>
                        <XCircle size={16} className="me-1 text-warning" /> Motivo
                        del rechazo *
                      </>
                    )}
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder={
                      this.state.responseType === "accept"
                        ? "Instrucciones especiales para el paciente, preparación previa, etc..."
                        : "Explica brevemente el motivo del rechazo para informar al paciente..."
                    }
                    value={this.state.doctorNotes || ""}
                    onChange={(e) =>
                      this.setState({ doctorNotes: e.target.value })
                    }
                    className="border-0 bg-light"
                  />
                </Form.Group>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button
              variant="secondary"
              onClick={this.closeModals}
              disabled={this.state.isProcessing}
              className="btn-hover-scale"
            >
              Cancelar
            </Button>
            {this.state.responseType === "accept" ? (
              <Button
                variant="success"
                onClick={this.confirmAcceptAppointment}
                disabled={this.state.isProcessing}
                className="btn-hover-scale d-inline-flex align-items-center gap-2"
              >
                {this.state.isProcessing ? (
                  <>
                    <Spinner size="sm" /> Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} /> Confirmar Cita
                  </>
                )}
              </Button>
            ) : (
              <div className="d-flex gap-2">
                <Button
                  variant="outline-primary"
                  onClick={this.handleRejectAndReschedule}
                  disabled={this.state.isProcessing}
                  className="btn-hover-scale d-inline-flex align-items-center gap-1"
                >
                  <RefreshCw size={14} /> Proponer Nueva Fecha
                </Button>
                <Button
                  variant="danger"
                  onClick={this.confirmRejectAppointment}
                  disabled={this.state.isProcessing}
                  className="btn-hover-scale d-inline-flex align-items-center gap-2"
                >
                  {this.state.isProcessing ? (
                    <>
                      <Spinner size="sm" /> Procesando...
                    </>
                  ) : (
                    <>
                      <XCircle size={16} /> Rechazar Definitivamente
                    </>
                  )}
                </Button>
              </div>
            )}
          </Modal.Footer>
        </Modal>

        {/* Modal Reprogramar */}
        <Modal
          show={this.state.showRescheduleModal}
          onHide={this.closeModals}
          size="xl"
          centered
          className="reschedule-modal"
        >
          <Modal.Header closeButton className="bg-info text-white border-0">
            <Modal.Title className="d-flex align-items-center gap-2">
              <RefreshCw size={20} /> Proponer Nueva Fecha y Hora
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {this.state.selectedAppointment && (
              <div>
                <div className="alert alert-info border-0 shadow-sm">
                  <h6 className="alert-heading d-flex align-items-center gap-2">
                    <Calendar size={16} /> Propuesta Original
                  </h6>
                  <p className="mb-0">
                    <strong>{this.state.selectedAppointment.patientName}</strong>{" "}
                    solicitó cita para el{" "}
                    <strong>{this.state.selectedAppointment.requestedDate}</strong>{" "}
                    a las{" "}
                    <strong>{this.state.selectedAppointment.requestedTime}</strong>
                  </p>
                </div>

                <h6 className="text-primary mb-4 d-flex align-items-center gap-2">
                  <Plus size={16} /> Selecciona fechas y horas alternativas:
                </h6>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">
                        <Calendar size={14} className="me-1" /> Nueva Fecha{" "}
                        <span className="text-danger">*</span>
                      </Form.Label>

                      {/* Dropdown para fecha */}
                      <Dropdown
                        onSelect={(key) =>
                          this.setState({ selectedAlternativeDate: key })
                        }
                      >
                        <Dropdown.Toggle
                          className="w-100 text-start border-0 bg-light text-dark"
                          variant="light"
                        >
                          {(() => {
                            const d = (this.state.alternativeDates || []).find(
                              (x) => x.value === this.state.selectedAlternativeDate
                            );
                            return d ? d.label : "Seleccionar fecha...";
                          })()}
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="w-100">
                          {(this.state.alternativeDates || []).map((d) => (
                            <Dropdown.Item eventKey={d.value} key={d.value}>
                              {d.label}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">
                        <Clock size={14} className="me-1" /> Nueva Hora{" "}
                        <span className="text-danger">*</span>
                      </Form.Label>

                      {/* Dropdown para hora */}
                      <Dropdown
                        onSelect={(key) =>
                          this.setState({ selectedAlternativeTime: key })
                        }
                        disabled={!this.state.selectedAlternativeDate}
                      >
                        <Dropdown.Toggle
                          className="w-100 text-start border-0 bg-light text-dark"
                          variant="light"
                          disabled={!this.state.selectedAlternativeDate}
                        >
                          {this.state.selectedAlternativeTime || "Seleccionar hora..."}
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="w-100">
                          {(this.state.availableTimeSlots || []).map((t) => (
                            <Dropdown.Item eventKey={t} key={t}>
                              {t}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">
                    <FileText size={14} className="me-1" /> Mensaje para el paciente
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Motivo del cambio, instrucciones adicionales, etc."
                    value={this.state.doctorNotes || ""}
                    onChange={(e) => this.setState({ doctorNotes: e.target.value })}
                    className="border-0 bg-light"
                  />
                </Form.Group>

                {this.state.selectedAlternativeDate &&
                  this.state.selectedAlternativeTime && (
                    <div className="alert alert-success border-0 shadow-sm">
                      <h6 className="alert-heading d-flex align-items-center gap-2">
                        <Send size={16} /> Vista Previa de la Propuesta
                      </h6>
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <p className="mb-1">
                            <strong>Paciente:</strong>{" "}
                            {this.state.selectedAppointment.patientName}
                          </p>
                          <p className="mb-0">
                            Se enviará propuesta para el{" "}
                            <strong>
                              {(this.state.alternativeDates || []).find(
                                (d) =>
                                  d.value === this.state.selectedAlternativeDate
                              )?.label}
                            </strong>{" "}
                            a las{" "}
                            <strong>{this.state.selectedAlternativeTime}</strong>
                          </p>
                        </div>
                        <ArrowRight size={20} className="text-success" />
                      </div>
                    </div>
                  )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button
              variant="secondary"
              onClick={this.closeModals}
              disabled={this.state.isProcessing}
              className="btn-hover-scale"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={this.confirmRejectWithAlternatives}
              disabled={
                this.state.isProcessing ||
                !this.state.selectedAlternativeDate ||
                !this.state.selectedAlternativeTime
              }
              className="btn-hover-scale d-inline-flex align-items-center gap-2"
            >
              {this.state.isProcessing ? (
                <>
                  <Spinner size="sm" /> Enviando...
                </>
              ) : (
                <>
                  <Send size={16} /> Enviar Propuesta
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal Detalles */}
        <Modal
          show={this.state.showDetailsModal}
          onHide={this.closeModals}
          size="lg"
          centered
        >
          <Modal.Header closeButton className="bg-primary text-white border-0">
            <Modal.Title className="d-flex align-items-center gap-2">
              <Eye size={20} /> Detalles Completos de la Cita
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {this.state.selectedAppointment && (
              <div>
                <Row>
                  <Col md={6}>
                    <Card className="border-0 bg-light mb-3">
                      <Card.Body>
                        <h6 className="text-primary mb-3">Información del Paciente</h6>
                        <p>
                          <strong>Nombre:</strong>{" "}
                          {this.state.selectedAppointment.patientName}
                        </p>
                        <p>
                          <strong>Email:</strong>{" "}
                          {this.state.selectedAppointment.patientEmail}
                        </p>
                        <p>
                          <strong>Teléfono:</strong>{" "}
                          {this.state.selectedAppointment.patientPhone}
                        </p>
                        <p>
                          <strong>Edad:</strong>{" "}
                          {this.state.selectedAppointment.patientAge} años
                        </p>
                        <p>
                          <strong>Género:</strong>{" "}
                          {this.state.selectedAppointment.patientGender === "M"
                            ? "Masculino"
                            : "Femenino"}
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="border-0 bg-light mb-3">
                      <Card.Body>
                        <h6 className="text-primary mb-3">Detalles de la Cita</h6>
                        <p>
                          <strong>Fecha:</strong>{" "}
                          {this.state.selectedAppointment.requestedDate}
                        </p>
                        <p>
                          <strong>Hora:</strong>{" "}
                          {this.state.selectedAppointment.requestedTime}
                        </p>
                        <p>
                          <strong>Estado:</strong>{" "}
                          {this.getStatusBadge(this.state.selectedAppointment.status)}
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <h6 className="text-primary mb-3">Comentarios del paciente</h6>
                    <p>{this.state.selectedAppointment.notes}</p>
                    {this.state.selectedAppointment.doctorResponse && (
                      <>
                        <h6 className="text-primary mb-3 mt-4">Respuesta del Doctor</h6>
                        <p className="bg-white p-3 rounded border">
                          {this.state.selectedAppointment.doctorResponse}
                        </p>
                      </>
                    )}
                  </Card.Body>
                </Card>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" onClick={this.closeModals} className="btn-hover-scale">
              Cerrar
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

export default AppointmentResponseWindow;