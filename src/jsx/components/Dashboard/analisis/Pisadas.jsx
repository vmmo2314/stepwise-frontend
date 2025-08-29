import { useState, useEffect } from "react"
import Swal from "sweetalert2"

//Se importa la pestaña para los resultados del diagnóstico
import DiagnosticResults from "../DiagnosticResults"
import {
  calcularIndiceArco,
  determinarDistribucion,
  interpretarTipoPie,
  generarRecomendaciones,
} from "../footAnalysisUtils" // Ajusta la ruta según donde esté tu archivo

// Importamos las funciones de conexión del ESP32
let serialPort
let reader
let bluetoothDevice
let isConnecting = false

const DiagnosticWindow = ({ onAnalysisComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [leftFootData, setLeftFootData] = useState({
    feature1: null,
    feature2: null,
    feature3: null,
    feature4: null,
    feature5: null,
    feature6: null,
    feature7: null,
  })
  const [rightFootData, setRightFootData] = useState({
    feature8: null,
    feature9: null,
    feature10: null,
    feature11: null,
    feature12: null,
    feature13: null,
    feature14: null,
  })

  const [analysisResult, setAnalysisResult] = useState(null)

  // Verificar si todos los datos del pie izquierdo están completos
  const isLeftFootComplete = () => {
    return Object.values(leftFootData).every((value) => value !== null)
  }

  // Verificar si todos los datos del pie derecho están completos
  const isRightFootComplete = () => {
    return Object.values(rightFootData).every((value) => value !== null)
  }

  useEffect(() => {
    // Cargar el último resultado de análisis guardado en localStorage al montar el componente
    // Si quieres cargar los datos de análisis de pisada desde localStorage al inicio,
    // puedes descomentar y adaptar esta parte.
    // const storedResult = localStorage.getItem("lastFootAnalysisResult");
    // if (storedResult) {
    //   setAnalysisResult(JSON.parse(storedResult));
    // }
  }, [])

  // Procesar datos recibidos del ESP32
  const processESPData = (data) => {
    console.log("Datos recibidos:", data)

    // Expresión regular para capturar todos los features (tanto pie izquierdo como derecho)
    const match = data.match(/feature(\d+):\s*([\d.]+)/g)
    console.log("Datos crudos del ESP32:", data)

    if (match) {
      const newLeftFootData = {}
      const newRightFootData = {}

      // Asignar los valores a leftFootData y rightFootData
      match.forEach((item, index) => {
        const [feature, value] = item.split(":").map((val) => val.trim()) // Dividir la coincidencia y eliminar espacios
        const featureNumber = Number.parseInt(feature.replace("feature", "")) // Extraer el número del feature

        if (featureNumber <= 7) {
          newLeftFootData[`feature${featureNumber}`] = Number.parseFloat(value) // Asignar valores al pie izquierdo
        } else {
          newRightFootData[`feature${featureNumber}`] = Number.parseFloat(value) // Asignar valores al pie derecho
        }
      })

      // Actualizar los estados con los nuevos datos
      setLeftFootData(newLeftFootData)
      setRightFootData(newRightFootData)

      console.log("Datos asignados correctamente al estado.")

      // Mostrar notificación de datos recibidos
      Swal.fire({
        icon: "success",
        title: "Datos recibidos",
        text: "Se han recibido datos del sensor",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      })
    } else {
      console.error("No se encontraron todos los features en los datos recibidos. Verifica el formato de entrada.")
    }
  }

  // Conectar a ESP32 via USB
  const connectUSB = async () => {
    if (isConnecting) {
      console.log("Ya hay un intento de conexión en proceso")
      return
    }

    isConnecting = true

    try {
      // Limpiar conexión previa
      if (reader) {
        try {
          await reader.cancel()
          await new Promise((resolve) => setTimeout(resolve, 100))
        } catch (error) {
          console.log("Error al cancelar reader:", error)
        }
        reader = null
      }

      if (serialPort) {
        try {
          await serialPort.close()
          await new Promise((resolve) => setTimeout(resolve, 100))
        } catch (error) {
          console.log("Error al cerrar puerto:", error)
        }
        serialPort = null
      }

      // Nueva conexión
      serialPort = await navigator.serial.requestPort()

      if (!serialPort) {
        throw new Error("No se seleccionó ningún puerto")
      }

      await serialPort.open({ baudRate: 115200 })

      // Verificar que el puerto se abrió correctamente
      if (!serialPort.readable) {
        throw new Error("Error al abrir el puerto serial")
      }

      const decoder = new TextDecoderStream()
      reader = serialPort.readable.pipeThrough(decoder).getReader()

      // Mostrar alerta de conexión exitosa
      Swal.fire({
        icon: "success",
        title: "Conectado",
        text: "ESP32 conectado por USB",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      })

      console.log("Conexión USB establecida exitosamente")
      setIsConnected(true)

      // Iniciar lectura de datos
      listenToSerial()
    } catch (error) {
      console.error("Error al conectar ESP32 por USB:", error)
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: error.message,
      })

      // Limpiar recursos en caso de error
      if (reader) {
        try {
          await reader.cancel()
        } catch (e) {
          console.log("Error al limpiar reader:", e)
        }
        reader = null
      }

      if (serialPort) {
        try {
          await serialPort.close()
        } catch (e) {
          console.log("Error al limpiar puerto:", e)
        }
        serialPort = null
      }
      setIsConnected(false)
    } finally {
      isConnecting = false // Permitir nuevos intentos de conexión
    }
  }

  // Escuchar datos del ESP32
  let buffer = "" // Variable para acumular datos entrantes
  const listenToSerial = async () => {
    try {
      while (reader) {
        const { value, done } = await reader.read()
        if (done) {
          console.log("Conexión USB cerrada normalmente")
          break
        }
        if (value) {
          buffer += value
          // Separamos por salto de línea
          const lines = buffer.split("\n")
          // Procesamos todas las líneas completas excepto la última (que puede estar incompleta)
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim()
            if (line) {
              processESPData(line)
            }
          }
          // Guardamos lo que sobra (la línea incompleta, si existe)
          buffer = lines[lines.length - 1]
        }
      }
    } catch (error) {
      console.error("Error en la lectura serial:", error)
    } finally {
      console.log("Finalizando lectura serial")
      if (reader) {
        try {
          await reader.cancel()
        } catch (error) {
          console.log("Error al cerrar reader en finally:", error)
        }
        reader = null
      }
      setIsConnected(false)
    }
  }

  // Analizar los datos recibidos
  const handleAnalyze = async () => {
    if (!isLeftFootComplete()) {
      Swal.fire({
        icon: "error",
        title: "Datos incompletos",
        text: "No se han recibido todos los datos necesarios para el análisis.",
        confirmButtonText: "Entendido",
      })
      return
    }

    setIsAnalyzing(true)

    Swal.fire({
      title: "Analizando...",
      text: "Procesando datos de presión plantar",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      },
    })

    try {
      // Crear un array con los valores de ambos pies
      const allFeatures = [
        leftFootData.feature1,
        leftFootData.feature2,
        leftFootData.feature3,
        leftFootData.feature4,
        leftFootData.feature5,
        leftFootData.feature6,
        leftFootData.feature7,
        rightFootData.feature8,
        rightFootData.feature9,
        rightFootData.feature10,
        rightFootData.feature11,
        rightFootData.feature12,
        rightFootData.feature13,
        rightFootData.feature14,
      ]

      // Convertir los valores a números y verificar que todos sean válidos
      const allValid = allFeatures.every((feature) => {
        const parsedFeature = Number.parseFloat(feature)
        console.log(`Feature: ${feature}, Parsed: ${parsedFeature}, IsNaN: ${isNaN(parsedFeature)}`)
        return !isNaN(parsedFeature) // Asegurarse de que sea un número válido
      })

      if (!allValid) {
        Swal.fire({
          icon: "error",
          title: "Error de datos",
          text: "Todos los valores deben ser números válidos.",
          confirmButtonText: "Aceptar",
        })
        return
      }

      // Verificar que se tengan exactamente 14 datos
      if (allFeatures.length !== 14) {
        throw new Error("Debe haber exactamente 14 características.")
      }

      const response = await fetch("https://testapi-hb3q.onrender.com/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ features: allFeatures }), // Enviar los datos en el formato correcto
      })

      if (!response.ok) {
        throw new Error("Error en la respuesta del servidor")
      }

      const results = await response.json()
      // Solo obtener el valor de 'prediction'
      const predictionValue = results.prediction

      // Transformar el resultado simple (1, 2 o 3) en un objeto completo
      const análisisCompletado = {
        timestamp: new Date().toISOString(), // Añadir timestamp para identificar el análisis
        status: "success",
        message: "Análisis completado con éxito",
        prediction: predictionValue, // El valor 1, 2 o 3 que devuelve la API
        indiceArco: calcularIndiceArco(allFeatures), // Usar allFeatures
        distribucionPeso: determinarDistribucion(allFeatures), // Usar allFeatures
        tipoPie: interpretarTipoPie(calcularIndiceArco(allFeatures)), // Interpretar usando allFeatures
        recomendaciones: generarRecomendaciones({
          indiceArco: calcularIndiceArco(allFeatures),
          distribucionPeso: determinarDistribucion(allFeatures),
        }),
        features: allFeatures, // <-- ¡Añadir los features aquí!
      }

      // Aquí asignas el resultado al estado de React
      setAnalysisResult(análisisCompletado)

      // Guardar el resultado completo en localStorage
      localStorage.setItem("lastFootAnalysisResult", JSON.stringify(análisisCompletado))
      if (onAnalysisComplete) {
        onAnalysisComplete(análisisCompletado)
      }

      Swal.fire({
        icon: "success",
        title: "Análisis completado",
        text: "Los resultados del análisis de presión plantar están listos",
        confirmButtonText: "Ver resultados",
      })
    } catch (error) {
      console.error("Error al enviar los datos:", error)
      Swal.fire({
        icon: "error",
        title: "Error en el análisis",
        text: error.message,
        confirmButtonText: "Aceptar",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="container">
      <div className="row mt-4">
        {/* Status connection */}
        <div className="col-12 mb-3">
          <div
            className={`alert ${
              isConnected ? "alert-success" : "alert-warning"
            } d-flex justify-content-between align-items-center`}
          >
            <span>{isConnected ? "ESP32 conectado" : "ESP32 no conectado"}</span>
            <button className="btn btn-sm btn-primary" onClick={connectUSB} disabled={isConnecting || isConnected}>
              {isConnecting ? "Conectando..." : "Conectar ESP32 (USB)"}
            </button>
          </div>
        </div>

        {/* Left foot section */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom-0">
              <h5 className="mb-0">Pie Izquierdo</h5>
            </div>
            <div className="card-body d-flex justify-content-center align-items-center">
              {/* Left foot SVG icon */}
              <svg width="150" height="150" viewBox="0 0 200 400">
                <path
                  d="M100,50 C140,50 150,100 150,150 C150,200 150,250 140,300 C130,350 120,365 105,380 C90,395 70,400 50,370 C30,340 20,300 30,250 C40,200 50,150 60,120 C70,90 80,50 100,50 Z"
                  fill={isLeftFootComplete() ? "#a3e635" : "#ef4444"}
                  stroke="#333"
                  strokeWidth="2"
                  id="leftFootPath"
                />
              </svg>
            </div>
            <div className="card-footer bg-white border-top-0">
              <p className="text-center mb-0">
                <small className="text-muted">{isLeftFootComplete() ? "Datos completos" : "Esperando datos..."}</small>
              </p>
            </div>
          </div>
        </div>

        {/* Right foot section */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom-0">
              <h5 className="mb-0">Pie Derecho</h5>
            </div>
            <div className="card-body d-flex justify-content-center align-items-center">
              {/* Right foot SVG icon */}
              <svg width="150" height="150" viewBox="0 0 200 400">
                <path
                  d="M100,50 C60,50 50,100 50,150 C50,200 50,250 60,300 C70,350 80,365 95,380 C110,395 130,400 150,370 C170,340 180,300 170,250 C160,200 150,150 140,120 C130,90 120,50 100,50 Z"
                  fill={isRightFootComplete() ? "#a3e635" : "#ef4444"}
                  stroke="#333"
                  strokeWidth="2"
                  id="rightFootPath"
                />
              </svg>
            </div>
            <div className="card-footer bg-white border-top-0">
              <p className="text-center mb-0">
                <small className="text-muted">Pendiente de implementación</small>
              </p>
            </div>
          </div>
        </div>

        {/* 3D foot chart section */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom-0">
              <h5 className="mb-0">Modelo 3D</h5>
            </div>
            <div className="card-body d-flex justify-content-center align-items-center">
              <div className="text-center">
                <div
                  style={{
                    height: "200px",
                    width: "100%",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <p className="text-muted">Área para modelo 3D interactivo</p>
                </div>
                <p className="text-muted mt-2">
                  <small>Modelo interactivo del pie</small>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden form for sensor data */}
      <div style={{ display: "none" }}>
        <form id="sensorDataForm">
          <input type="hidden" id="feature1" value={leftFootData.feature1 || ""} />
          <input type="hidden" id="feature2" value={leftFootData.feature2 || ""} />
          <input type="hidden" id="feature3" value={leftFootData.feature3 || ""} />
          <input type="hidden" id="feature4" value={leftFootData.feature4 || ""} />
          <input type="hidden" id="feature5" value={leftFootData.feature5 || ""} />
          <input type="hidden" id="feature6" value={leftFootData.feature6 || ""} />
          <input type="hidden" id="feature7" value={leftFootData.feature7 || ""} />
          <input type="hidden" id="feature8" value={rightFootData.feature8 || ""} />
          <input type="hidden" id="feature9" value={rightFootData.feature9 || ""} />
          <input type="hidden" id="feature10" value={rightFootData.feature10 || ""} />
          <input type="hidden" id="feature11" value={rightFootData.feature11 || ""} />
          <input type="hidden" id="feature12" value={rightFootData.feature12 || ""} />
          <input type="hidden" id="feature13" value={rightFootData.feature13 || ""} />
          <input type="hidden" id="feature14" value={rightFootData.feature14 || ""} />
        </form>
      </div>

      {/* Analyze button - centered */}
      <div className="row mt-4 mb-4">
        <div className="col-12 d-flex justify-content-center">
          <button className="btn btn-primary btn-lg px-5" onClick={handleAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? "Analizando..." : "Analizar"}
          </button>
        </div>
      </div>

      {/* Results section */}
      <div className="row">
        <div className="col-12">
          <DiagnosticResults analysisResult={analysisResult} />
        </div>
      </div>
    </div>
  )
}

export default DiagnosticWindow
