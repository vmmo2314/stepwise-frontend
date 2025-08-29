import React, { Component } from "react"
import { Col, Row, Card, Button, Form, Badge } from "react-bootstrap"
import Swal from "sweetalert2" // Renamed Alert to Swal for consistency

class GalvanicSensorPage extends Component {
  state = {
    isConnected: false,
    isRecording: false,
    currentReading: 0, // µS Actual
    maxReading: 0, // µS Máximo
    averageReading: 0, // µS Promedio
    sessionDuration: 0, // Duración
    // Separate arrays for each type of reading for graphs
    usReadings: [], // Stores { value: us, timestamp: Date.now() }
    resistanceReadings: [], // Stores { value: resistance, timestamp: Date.now() }
    voltageReadings: [], // Stores { value: voltage, timestamp: Date.now() }
    patientInfo: {
      name: "",
      id: "",
    },
    sensorStatus: "disconnected", // disconnected, connected, calibrating, ready
  }

  sensorInterval = null
  sessionTimer = null

  componentDidMount() {
    // Simular lecturas del sensor cada segundo cuando está grabando
    this.sensorInterval = setInterval(() => {
      if (this.state.isRecording) {
        this.generateSensorReading()
      }
    }, 1000)

    // Contador de duración de sesión
    this.sessionTimer = setInterval(() => {
      if (this.state.isRecording) {
        this.setState((prevState) => ({
          sessionDuration: prevState.sessionDuration + 1,
        }))
      }
    }, 1000)
  }

  componentWillUnmount() {
    if (this.sensorInterval) clearInterval(this.sensorInterval)
    if (this.sessionTimer) clearInterval(this.sessionTimer)
  }

  generateSensorReading = () => {
    // Simulate galvanic sensor reading (0-100 µS)
    const baseReadingUs = 40 + Math.sin(Date.now() / 1000) * 10
    const noiseUs = (Math.random() - 0.5) * 20
    const newReadingUs = Math.max(0, Math.min(100, baseReadingUs + noiseUs))

    // Simulate resistance (e.g., inversely related to conductance)
    const newResistance = Math.max(1000, 10000 - newReadingUs * 80 + (Math.random() - 0.5) * 500) // in Ohms
    // Simulate voltage (e.g., a simple fluctuating value)
    const newVoltage = Math.max(0.5, 3 + Math.cos(Date.now() / 2000) * 1 + (Math.random() - 0.5) * 0.5) // in Volts

    const timestamp = Date.now()

    this.setState((prevState) => {
      const updatedUsReadings = [...prevState.usReadings, { value: newReadingUs, timestamp }].slice(-60)
      const updatedResistanceReadings = [...prevState.resistanceReadings, { value: newResistance, timestamp }].slice(
        -60,
      )
      const updatedVoltageReadings = [...prevState.voltageReadings, { value: newVoltage, timestamp }].slice(-60)

      // Calculate average and max for µS only, as per request
      const usValues = updatedUsReadings.map((r) => r.value)
      const averageUs = usValues.length > 0 ? usValues.reduce((sum, val) => sum + val, 0) / usValues.length : 0
      const maxUs = usValues.length > 0 ? Math.max(...usValues) : 0

      return {
        currentReading: newReadingUs,
        usReadings: updatedUsReadings,
        resistanceReadings: updatedResistanceReadings,
        voltageReadings: updatedVoltageReadings,
        averageReading: averageUs,
        maxReading: maxUs,
      }
    })
  }

  handleConnect = () => {
    this.setState({ sensorStatus: "calibrating" })

    setTimeout(() => {
      this.setState({
        isConnected: true,
        sensorStatus: "ready",
      })

      Swal.fire({
        title: "Sensor Conectado",
        text: "El sensor galvánico se ha conectado exitosamente y está listo para usar.",
        icon: "success",
        timer: 2000,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
      })
    }, 2000)
  }

  handleDisconnect = () => {
    this.setState({
      isConnected: false,
      isRecording: false,
      sensorStatus: "disconnected",
      currentReading: 0,
      sessionDuration: 0,
      usReadings: [], // Clear readings on disconnect
      resistanceReadings: [], // Clear readings on disconnect
      voltageReadings: [], // Clear readings on disconnect
      maxReading: 0,
      averageReading: 0,
    })

    Swal.fire({
      title: "Sensor Desconectado",
      text: "El sensor se ha desconectado correctamente.",
      icon: "info",
      timer: 2000,
      toast: true,
      position: "top-end",
      showConfirmButton: false,
    })
  }

  handleStartRecording = () => {
    if (!this.props.patient || !this.props.patient.name || !this.props.patient.id) {
      Swal.fire({
        title: "Paciente no seleccionado",
        text: "Por favor, selecciona un paciente en el primer paso antes de iniciar la grabación.",
        icon: "warning",
      })
      return
    }

    this.setState({
      isRecording: true,
      sessionDuration: 0,
      usReadings: [], // Clear previous readings for new session
      resistanceReadings: [], // Clear previous readings for new session
      voltageReadings: [], // Clear previous readings for new session
      currentReading: 0,
      maxReading: 0,
      averageReading: 0,
    })

    Swal.fire({
      title: "Grabación Iniciada",
      text: "Se ha iniciado la sesión de monitoreo galvánico.",
      icon: "success",
      timer: 2000,
      toast: true,
      position: "top-end",
      showConfirmButton: false,
    })
  }

  handleStopRecording = () => {
    this.setState({ isRecording: false })

    Swal.fire({
      title: "Sesión Completada",
      html: `
        <div class="text-left">
          <p><strong>Duración:</strong> ${this.formatDuration(this.state.sessionDuration)}</p>
          <p><strong>Lectura Promedio (µS):</strong> ${this.state.averageReading.toFixed(1)} µS</p>
          <p><strong>Lectura Máxima (µS):</strong> ${this.state.maxReading.toFixed(1)} µS</p>
          <p><strong>Total de Lecturas:</strong> ${this.state.usReadings.length}</p>
        </div>
      `,
      icon: "success",
      showCancelButton: true,
      confirmButtonText: "Guardar Análisis",
      cancelButtonText: "Descartar",
    }).then((result) => {
      if (result.isConfirmed) {
        this.saveAnalysis()
      }
    })
  }

  saveAnalysis = () => {
    const { onAnalysisComplete } = this.props
    const {
      currentReading,
      maxReading,
      averageReading,
      sessionDuration,
      usReadings,
      resistanceReadings,
      voltageReadings,
    } = this.state

    const analysisData = {
      timestamp: new Date().toISOString(),
      duration: sessionDuration,
      usActual: currentReading,
      usPromedio: averageReading,
      usMaximo: maxReading,
      graphData: {
        us: usReadings,
        resistance: resistanceReadings,
        voltage: voltageReadings,
      }, // Now contains separate arrays
    }

    if (onAnalysisComplete) {
      onAnalysisComplete(analysisData)
    }

    Swal.fire("Guardado", "El análisis se ha guardado exitosamente.", "success")
  }

  formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  getSensorStatusBadge = () => {
    const statusConfig = {
      disconnected: { variant: "secondary", text: "Desconectado" },
      calibrating: { variant: "warning", text: "Calibrando..." },
      connected: { variant: "success", text: "Conectado" },
      ready: { variant: "success", text: "Listo" },
    }

    const config = statusConfig[this.state.sensorStatus]
    return <Badge bg={config.variant}>{config.text}</Badge>
  }

  // Updated renderChart to work with arrays of { value, timestamp } objects
  renderChart = (data, unit, color) => {
    if (data.length === 0) {
      return (
        <div className="text-center py-4 text-muted">
          <p>No hay datos para mostrar el gráfico.</p>
        </div>
      )
    }

    // Normalize data for visualization (e.g., scale to 10-100% of container height)
    const values = data.map((d) => d.value)
    const maxValue = Math.max(...values)
    const minValue = Math.min(...values)
    const range = maxValue - minValue

    return (
      <div className="d-flex align-items-end justify-content-around h-75" style={{ height: "150px" }}>
        {data.map((reading, index) => {
          const normalizedHeight = range > 0 ? ((reading.value - minValue) / range) * 90 + 10 : 50 // Scale to 10-100%
          return (
            <div
              key={index}
              className="rounded-top"
              style={{
                width: "8px",
                height: `${normalizedHeight}%`,
                minHeight: "2px",
                backgroundColor: color,
                margin: "0 1px",
              }}
              title={`${reading.value.toFixed(1)} ${unit}`}
            ></div>
          )
        })}
      </div>
    )
  }

  render() {
    const { patient } = this.props // Get patient from props
    const {
      isConnected,
      isRecording,
      currentReading,
      averageReading,
      maxReading,
      sessionDuration,
      usReadings,
      resistanceReadings,
      voltageReadings,
    } = this.state

    return (
      <div className="animated fadeIn">
        <Row>
          {/* Panel de Control del Sensor */}
          <Col xl={4} lg={6} className="mb-4">
            <Card>
              <div className="card-header border-0 pb-0 d-flex justify-content-between align-items-center">
                <h4 className="text-black fs-20 mb-0">Control del Sensor</h4>
                {this.getSensorStatusBadge()}
              </div>
              <Card.Body>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Estado de Conexión:</span>
                    <span className={isConnected ? "text-success" : "text-danger"}>
                      {isConnected ? "●" : "●"}
                      {isConnected ? " Conectado" : " Desconectado"}
                    </span>
                  </div>

                  {!isConnected ? (
                    <Button
                      variant="primary"
                      className="w-100 mb-2"
                      onClick={this.handleConnect}
                      disabled={this.state.sensorStatus === "calibrating"}
                    >
                      {this.state.sensorStatus === "calibrating" ? "Calibrando..." : "Conectar Sensor"}
                    </Button>
                  ) : (
                    <Button variant="outline-danger" className="w-100 mb-2" onClick={this.handleDisconnect}>
                      Desconectar
                    </Button>
                  )}
                </div>

                {isConnected && (
                  <div>
                    <div className="d-grid gap-2">
                      {!isRecording ? (
                        <Button
                          variant="success"
                          onClick={this.handleStartRecording}
                          disabled={!patient || !patient.name || !patient.id} // Disable if no patient selected
                        >
                          Iniciar Monitoreo
                        </Button>
                      ) : (
                        <Button variant="danger" onClick={this.handleStopRecording}>
                          Detener Monitoreo
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Lecturas en Tiempo Real y Gráficos */}
          <Col xl={8} lg={6} className="mb-4">
            <Card>
              <div className="card-header border-0 pb-0">
                <h4 className="text-black fs-20 mb-0">Lecturas en Tiempo Real</h4>
              </div>
              <Card.Body>
                {isConnected ? (
                  <div>
                    <Row className="mb-4">
                      <Col md={3} className="text-center">
                        <div className="border rounded p-3">
                          <h2 className="text-primary mb-0">{currentReading.toFixed(1)}</h2>
                          <small className="text-muted">µS Actual</small>
                        </div>
                      </Col>
                      <Col md={3} className="text-center">
                        <div className="border rounded p-3">
                          <h2 className="text-success mb-0">{averageReading.toFixed(1)}</h2>
                          <small className="text-muted">µS Promedio</small>
                        </div>
                      </Col>
                      <Col md={3} className="text-center">
                        <div className="border rounded p-3">
                          <h2 className="text-warning mb-0">{maxReading.toFixed(1)}</h2>
                          <small className="text-muted">µS Máximo</small>
                        </div>
                      </Col>
                      <Col md={3} className="text-center">
                        <div className="border rounded p-3">
                          <h2 className="text-info mb-0">{this.formatDuration(sessionDuration)}</h2>
                          <small className="text-muted">Duración</small>
                        </div>
                      </Col>
                    </Row>

                    <Row className="g-3">
                      {/* Gráfico de Conductancia (µS) */}
                      <Col md={4}>
                        <div className="bg-light rounded p-3 h-100">
                          <h6>Conductancia de la Piel (µS)</h6>
                          {this.renderChart(usReadings, "µS", "#0d6efd")}
                        </div>
                      </Col>
                      {/* Gráfico de Resistencia (Ω) */}
                      <Col md={4}>
                        <div className="bg-light rounded p-3 h-100">
                          <h6>Resistencia (Ω)</h6>
                          {this.renderChart(resistanceReadings, "Ω", "#198754")}
                        </div>
                      </Col>
                      {/* Gráfico de Voltaje (V) */}
                      <Col md={4}>
                        <div className="bg-light rounded p-3 h-100">
                          <h6>Voltaje de Salida (V)</h6>
                          {this.renderChart(voltageReadings, "V", "#ffc107")}
                        </div>
                      </Col>
                    </Row>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="fas fa-plug fa-3x text-muted mb-3"></i>
                    <h5 className="text-muted">Sensor Desconectado</h5>
                    <p className="text-muted">Conecte el sensor para ver las lecturas en tiempo real</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    )
  }
}

export default GalvanicSensorPage
