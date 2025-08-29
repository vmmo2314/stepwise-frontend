import React, { Component } from "react"
import { Col, Row, Card, Modal, Button, Form, Alert } from "react-bootstrap"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import Swal from "sweetalert2"

import { getOrganizations } from "../../../../services/citas/OrganizationService"
import { getDoctorsByOrg } from "../../../../services/DocInfo/DoctorService"
import { createAppointment, getDoctorAppointments } from "../../../../services/citas/AppointmentService"

// Estados válidos en la UI del doctor: pending / accepted / rejected / rescheduled
const classForStatus = (status) => (status === "accepted" ? "bg-primary" : "bg-warning")

export default class EventCalendar extends Component {
  state = {
    // data
    organizations: [],
    doctors: [],
    calendarEvents: [],

    // ui selections
    selectedOrgId: "",
    selectedDoctorId: "",
    selectedDate: null,
    selectedTime: "",
    patientNotes: "",

    // modal
    showModal: false,
    loading: false,
    loadingDoctors: false,
    loadingEvents: false,
    noHospitals: false,

    // times
    timeSlots: [
      "08:00","08:30","09:00","09:30","10:00","10:30",
      "11:00","11:30","12:00","12:30","14:00","14:30",
      "15:00","15:30","16:00","16:30","17:00","17:30",
    ],
  }

  async componentDidMount() {
    await this.loadOrganizations()
  }

  loadOrganizations = async () => {
    this.setState({ loading: true })
    try {
      const orgs = await getOrganizations()
      this.setState({ organizations: orgs, noHospitals: orgs.length === 0 })
    } catch (e) {
      console.error(e)
      this.setState({ noHospitals: true })
    } finally {
      this.setState({ loading: false })
    }
  }

  onSelectOrganization = async (orgId) => {
    this.setState({
      selectedOrgId: orgId,
      selectedDoctorId: "",
      doctors: [],
      calendarEvents: [],
    })
    if (!orgId) return

    this.setState({ loadingDoctors: true })
    try {
      const doctors = await getDoctorsByOrg(orgId)
      this.setState({ doctors })
    } catch (e) {
      console.error(e)
      this.setState({ doctors: [] })
    } finally {
      this.setState({ loadingDoctors: false })
    }
  }

  onSelectDoctor = async (doctorId) => {
    this.setState({ selectedDoctorId: doctorId, calendarEvents: [] })
    const { selectedOrgId } = this.state
    if (!doctorId || !selectedOrgId) return

    this.setState({ loadingEvents: true })
    try {
      const items = await getDoctorAppointments(selectedOrgId, doctorId, "all")
      const events = items.map((apt) => ({
        id: apt.id,
        title: `Cita - ${apt.doctorName} - ${apt.organizationName}`,
        start: new Date(`${apt.requestedDate}T${apt.requestedTime}:00`),
        status: apt.status,
        doctor: apt.doctorName,
        organization: apt.organizationName,
        patient: apt.patientName,
        notes: apt.notes,
        classNames: [classForStatus(apt.status)],
      }))
      this.setState({ calendarEvents: events })
    } catch (e) {
      console.error(e)
      this.setState({ calendarEvents: [] })
    } finally {
      this.setState({ loadingEvents: false })
    }
  }

  // abrir modal al hacer click en el calendario
  handleDateClick = (info) => {
    if (!this.state.selectedOrgId) {
      Swal.fire("Selecciona una organización", "Primero elige un hospital/clinica.", "info")
      return
    }
    if (!this.state.selectedDoctorId) {
      Swal.fire("Selecciona un doctor", "Necesitas elegir un doctor antes de proponer una cita.", "info")
      return
    }
    this.setState({
      showModal: true,
      selectedDate: info.date,
      selectedTime: "",
      patientNotes: "",
    })
  }

  closeModal = () => this.setState({ showModal: false })

  // crear propuesta -> API -> pintar
  handleSubmitAppointment = async () => {
    const { selectedDate, selectedTime, selectedOrgId, selectedDoctorId, patientNotes, organizations, doctors } =
      this.state

    if (!selectedDate || !selectedTime || !selectedOrgId || !selectedDoctorId) {
      Swal.fire("Datos incompletos", "Elige fecha, hora, organización y doctor.", "warning")
      return
    }

    const [h, m] = selectedTime.split(":")
    const start = new Date(selectedDate)
    start.setHours(parseInt(h), parseInt(m))

    const org = organizations.find((o) => (o.id || o.organizacionId) === selectedOrgId) || {}
    const doc = doctors.find((d) => (d.id || d.uid) === selectedDoctorId) || {}

      const payload = {
      clinicaId: selectedOrgId,
      doctorId: selectedDoctorId,

      // denormalizados
      organizationName: org.name || org.nombre || "",
      doctorName: doc.name || doc.nombre || "",
      specialty: doc.specialty || doc.especialidad || "",

      // propuesta
      requestedDate: start.toISOString().slice(0, 10), // YYYY-MM-DD
      requestedTime: selectedTime,                      // HH:mm
      notes: patientNotes,
      }
    try {
      const created = await createAppointment(payload)

      const newEvent = {
        id: created.id,
        title: `Cita - ${created.doctorName} - ${created.organizationName}`,
        start,
        status: created.status, // "pending" al crear
        doctor: created.doctorName,
        organization: created.organizationName,
        patient: created.patientName,
        notes: created.notes,
        classNames: [classForStatus(created.status)],
      }

      this.setState((prev) => ({
        calendarEvents: [...prev.calendarEvents, newEvent],
        showModal: false,
      }))

      Swal.fire("¡Propuesta enviada!", "Tu cita fue enviada al doctor para aprobación.", "success")
    } catch (e) {
      console.error(e)
      Swal.fire("Error", e.message || "No se pudo crear la cita.", "error")
    }
  }

  render() {
    const {
      organizations,
      doctors,
      calendarEvents,
      selectedOrgId,
      selectedDoctorId,
      selectedDate,
      selectedTime,
      patientNotes,
      showModal,
      noHospitals,
      loading,
      loadingDoctors,
      loadingEvents,
      timeSlots,
    } = this.state

    return (
      <div className="animated fadeIn demo-app">
        <Row>
          <Col xl={3} xxl={4}>
            <Card>
              <div className="card-header border-0 pb-0">
                <h4 className="text-black fs-20 mb-0">Panel de Citas</h4>
              </div>
              <Card.Body>
                {noHospitals && (
                  <Alert variant="warning" className="mb-3">
                    No hay hospitales/organizaciones disponibles.
                  </Alert>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Organización</Form.Label>
                  <Form.Select
                    value={selectedOrgId}
                    onChange={(e) => this.onSelectOrganization(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Seleccionar organización...</option>
                    {organizations.map((o) => (
                      <option key={o.id || o.organizacionId} value={o.id || o.organizacionId}>
                        {o.name || o.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Doctor</Form.Label>
                  <Form.Select
                    value={selectedDoctorId}
                    onChange={(e) => this.onSelectDoctor(e.target.value)}
                    disabled={!selectedOrgId || loadingDoctors}
                  >
                    <option value="">Seleccionar doctor...</option>
                    {doctors.map((d) => (
                      <option key={d.id || d.uid} value={d.id || d.uid}>
                        {(d.name || d.nombre) + (d.specialty || d.especialidad ? ` — ${d.specialty || d.especialidad}` : "")}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

               <p className="small text-muted mb-0">
               • Haz clic en cualquier día para proponer una cita. <br />
               • Aceptadas = azul, Pendientes = amarillo.
               </p>
              </Card.Body>
            </Card>
          </Col>

          <Col xl={9} xxl={8}>
            <Card>
              <div className="card-header border-0 pb-0 d-flex justify-content-between">
                <h4 className="text-black fs-20 mb-0">Calendario de Citas</h4>
                {(loadingEvents || loading || loadingDoctors) && <span className="text-muted small">Cargando…</span>}
              </div>
              <Card.Body>
                <div className="demo-app-calendar" id="mycalendartest">
                  <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
                    initialView="dayGridMonth"
                    editable={false}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    weekends={true}
                    events={calendarEvents}
                    dateClick={this.handleDateClick}
                    eventClassNames={(info) => classForStatus(info.event.extendedProps.status)} // accepted→azul, demás→amarillo
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Modal: Proponer Cita */}
        <Modal show={showModal} onHide={this.closeModal} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Proponer Nueva Cita</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Fecha Seleccionada</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedDate ? selectedDate.toLocaleDateString() : ""}
                      disabled
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Hora <span className="text-danger">*</span></Form.Label>
                    <Form.Select value={selectedTime} onChange={(e) => this.setState({ selectedTime: e.target.value })}>
                      <option value="">Seleccionar hora...</option>
                      {timeSlots.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Notas para el doctor (opcional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={patientNotes}
                  onChange={(e) => this.setState({ patientNotes: e.target.value })}
                  placeholder="Motivo de la consulta, síntomas, etc."
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.closeModal}>Cancelar</Button>
            <Button variant="primary" onClick={this.handleSubmitAppointment}>Proponer Cita</Button>
          </Modal.Footer>
        </Modal>
        
      </div>
    )
  }
}