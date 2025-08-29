import { useEffect, useRef, useState } from "react"
import { Pose } from "@mediapipe/pose" // Import Pose from MediaPipe
import cloudinaryService from "../../../../services/helpers/Claudinaryservices" // Import the Cloudinary service

const CameraComponent = ({ onAnalysisComplete }) => {
  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: "100%",
      maxWidth: "800px",
      margin: "0 auto",
      padding: "20px",
      backgroundColor: "#ffffff",
      borderRadius: "8px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      marginBottom: "20px",
      color: "#333",
      textAlign: "center",
    },
    videoContainer: {
      width: "100%",
      position: "relative",
      backgroundColor: "#333",
      borderRadius: "8px",
      overflow: "hidden",
      marginBottom: "20px",
    },
    canvas: {
      width: "100%",
      display: "block",
    },
    anglesContainer: {
      display: "flex",
      justifyContent: "space-between",
      width: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      padding: "8px 12px",
      color: "white",
      fontSize: "16px",
    },
    toleranceContainer: {
      width: "100%",
      marginBottom: "15px",
    },
    toleranceLabel: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "5px",
      fontSize: "14px",
    },
    toleranceSlider: {
      width: "100%",
      height: "8px",
    },
    resultContainer: {
      width: "100%",
      padding: "12px",
      backgroundColor: "#f7f7f7",
      borderRadius: "8px",
      marginBottom: "15px",
      textAlign: "center",
    },
    resultLabel: {
      fontSize: "14px",
      color: "#666",
      marginBottom: "5px",
    },
    resultValue: {
      fontSize: "18px",
      fontWeight: "bold",
    },
    buttonContainer: {
      display: "flex",
      flexDirection: "column",
      width: "100%",
      gap: "10px",
    },
    primaryButton: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#3b82f6",
      color: "white",
      padding: "10px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      fontWeight: "bold",
      gap: "8px",
    },
    secondaryButtonsContainer: {
      display: "flex",
      gap: "10px",
      width: "100%",
    },
    secondaryButton: {
      flex: "1",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "10px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      fontWeight: "bold",
      gap: "8px",
    },
    downloadJsonButton: {
      backgroundColor: "#10b981",
      color: "white",
    },
    downloadImageButton: {
      backgroundColor: "#f59e0b",
      color: "white",
    },
    disabledButton: {
      backgroundColor: "#d1d5db",
      color: "#6b7280",
      cursor: "not-allowed",
    },
  }

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const canvasCtx = useRef(null)

  const [results, setResults] = useState(null)
  const [capturedData, setCapturedData] = useState(null)
  const [capturedImageUrl, setCapturedImageUrl] = useState(null) // This is the local data URL
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null) // New state for Cloudinary URL
  const [tolerancePercentage, setTolerancePercentage] = useState(0.1)
  const [deformity, setDeformity] = useState("Normal")
  const [leftKneeAngle, setLeftKneeAngle] = useState(0)
  const [rightKneeAngle, setRightKneeAngle] = useState(0)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isUploading, setIsUploading] = useState(false) // New state for upload loading
  const [isPoseDetected, setIsPoseDetected] = useState(false)

  // Variables para almacenar las medidas actuales (como en script.js)
  const [hipDistance, setHipDistance] = useState(0)
  const [kneeDistance, setKneeDistance] = useState(0)
  const [ankleDistance, setAnkleDistance] = useState(0)

  const leftKneeAngleRef = useRef(null)
  const rightKneeAngleRef = useRef(null)
  const deformityResultRef = useRef(null)
  const toleranceValueRef = useRef(null)

  const [isCameraOn, setIsCameraOn] = useState(false)
  const gifRef = useRef(null)

  const toleranceRef = useRef(tolerancePercentage)

  const [feetNotVisible, setFeetNotVisible] = useState(false)

  // Initialize MediaPipe Pose outside useEffect to avoid re-initialization
  const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
  })

  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  })

  useEffect(() => {
    if (canvasRef.current) {
      canvasCtx.current = canvasRef.current.getContext("2d")
      if (isCameraOn) {
        setupCamera()
      }
    }
  }, [isCameraOn])

  // Actualizar tolerancia cuando cambia el input
  const handleToleranceChange = (e) => {
    const tolerance = Number.parseFloat(e.target.value) / 100
    setTolerancePercentage(tolerance)
    toleranceRef.current = tolerance

    if (toleranceValueRef.current) {
      toleranceValueRef.current.textContent = `${e.target.value}%`
    }
  }

  // Función para calcular ángulo entre tres puntos (igual que script.js)
  const calculateAngle = (a, b, c) => {
    const ba = [a.x - b.x, a.y - b.y]
    const bc = [c.x - b.x, c.y - b.y]
    const cosineAngle =
      (ba[0] * bc[0] + ba[1] * bc[1]) / (Math.sqrt(ba[0] ** 2 + ba[1] ** 2) * Math.sqrt(bc[0] ** 2 + bc[1] ** 2))
    return Math.acos(cosineAngle) * (180 / Math.PI)
  }

  // Configuración de la cámara
  const setupCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 16 / 9 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        videoRef.current.onloadedmetadata = async () => {
          await videoRef.current.play()
          canvasRef.current.width = videoRef.current.videoWidth
          canvasRef.current.height = videoRef.current.videoHeight

          // Start sending frames to MediaPipe Pose
          pose.send({ image: videoRef.current })
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Error al acceder a la cámara. Asegúrate de que esté conectada y permitas el acceso.")
    }
  }

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
      videoRef.current.pause() // Añadido: Pausar el elemento de video
    }
  }

  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera()
    } else {
      setupCamera()
    }
    setIsCameraOn(!isCameraOn)
  }

  // Procesar resultados de Mediapipe Pose (implementación igual que script.js)
  pose.onResults((currentResults) => {
    setResults(currentResults)

    // Limpiar canvas anterior
    if (canvasCtx.current && canvasRef.current && videoRef.current) {
      canvasCtx.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

      // Dibujar el video actual como fondo
      canvasCtx.current.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)

      if (currentResults.poseLandmarks) {
        setIsPoseDetected(true)
        const landmarks = currentResults.poseLandmarks

        // Función para dibujar líneas entre puntos (igual que script.js)
        const drawLine = (a, b, color) => {
          canvasCtx.current.beginPath()
          canvasCtx.current.moveTo(landmarks[a].x * canvasRef.current.width, landmarks[a].y * canvasRef.current.height)
          canvasCtx.current.lineTo(landmarks[b].x * canvasRef.current.width, landmarks[b].y * canvasRef.current.height)
          canvasCtx.current.strokeStyle = color
          canvasCtx.current.lineWidth = 3
          canvasCtx.current.stroke()
        }

        // Dibujar puntos clave (igual que script.js)
        landmarks.forEach((landmark) => {
          canvasCtx.current.beginPath()
          canvasCtx.current.arc(
            landmark.x * canvasRef.current.width,
            landmark.y * canvasRef.current.height,
            5,
            0,
            2 * Math.PI,
          )
          canvasCtx.current.fillStyle = "red"
          canvasCtx.current.fill()
        })

        // Conectar puntos clave relevantes (igual que script.js)
        drawLine(23, 25, "green") // Cadera izquierda a rodilla izquierda
        drawLine(25, 27, "green") // Rodilla izquierda a tobillo izquierdo
        drawLine(24, 26, "green") // Cadera derecha a rodilla derecha
        drawLine(26, 28, "green") // Rodilla derecha a tobillo derecho

        // Obtener coordenadas (igual que script.js)
        const leftHip = landmarks[23]
        const leftKnee = landmarks[25]
        const leftAnkle = landmarks[27]
        const rightHip = landmarks[24]
        const rightKnee = landmarks[26]
        const rightAnkle = landmarks[28]

        // Verifica si los tobillos están fuera del área visible
        if (leftAnkle.y > 1.0 || rightAnkle.y > 1.0 || leftAnkle.visibility < 0.5 || rightAnkle.visibility < 0.5) {
          setFeetNotVisible(true)
        } else {
          setFeetNotVisible(false)
        }

        // Calcular distancias horizontales (igual que script.js)
        const currentHipDistance = Math.abs(leftHip.x * canvasRef.current.width - rightHip.x * canvasRef.current.width)
        const currentKneeDistance = Math.abs(
          leftKnee.x * canvasRef.current.width - rightKnee.x * canvasRef.current.width,
        )
        const currentAnkleDistance = Math.abs(
          leftAnkle.x * canvasRef.current.width - rightAnkle.x * canvasRef.current.width,
        )

        setHipDistance(currentHipDistance)
        setKneeDistance(currentKneeDistance)
        setAnkleDistance(currentAnkleDistance)

        // Calcular tolerancia (igual que script.js)
        const tolerance = currentHipDistance * toleranceRef.current

        // Calcular ángulos (igual que script.js)
        const leftKneeAngleCalc = calculateAngle(leftHip, leftKnee, leftAnkle)
        const rightKneeAngleCalc = calculateAngle(rightHip, rightKnee, rightAnkle)

        setLeftKneeAngle(leftKneeAngleCalc)
        setRightKneeAngle(rightKneeAngleCalc)

        // Actualizar elementos HTML con resultados (igual que script.js)
        if (leftKneeAngleRef.current) {
          leftKneeAngleRef.current.textContent = `${Math.round(leftKneeAngleCalc)}°`
        }
        if (rightKneeAngleRef.current) {
          rightKneeAngleRef.current.textContent = `${Math.round(rightKneeAngleCalc)}°`
        }

        // Clasificación con tolerancia (EXACTAMENTE igual que script.js)
        let newDeformity = "Normal"
        let deformityColor = "#10b981" // green

        if (
          currentKneeDistance < currentHipDistance - tolerance &&
          currentKneeDistance < currentAnkleDistance - tolerance
        ) {
          newDeformity = "Genu Valgo"
          deformityColor = "#ef4444" // red
        } else if (
          currentKneeDistance > currentHipDistance + tolerance &&
          currentKneeDistance > currentAnkleDistance + tolerance
        ) {
          newDeformity = "Genu Varo"
          deformityColor = "#ef4444" // red
        }

        setDeformity(newDeformity)

        // Actualizar diagnóstico con color (igual que script.js)
        if (deformityResultRef.current) {
          deformityResultRef.current.textContent = newDeformity
          deformityResultRef.current.style.color = deformityColor
        }
      } else {
        setIsPoseDetected(false)
      }
    }

    // Solicitar siguiente fotograma (igual que script.js)
    if (videoRef.current && isCameraOn) {
      // Only send if camera is on
      videoRef.current.requestVideoFrameCallback(() => {
        pose.send({ image: videoRef.current })
      })
    }
  })

  // Manejo de captura y subida a Cloudinary
  const handleCapture = async () => {
    if (!results || !results.poseLandmarks) {
      alert("No se detectaron puntos de referencia. Por favor, asegúrese de estar en el cuadro de la cámara.")
      return
    }

    setIsCapturing(true)
    setIsUploading(true) // Start upload loading
    setUploadedImageUrl(null) // Clear previous upload URL

    try {
      if (canvasRef.current && videoRef.current) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-")

        // Crear un canvas temporal para capturar solo el video sin puntos
        const tempCanvas = document.createElement("canvas")
        const tempCtx = tempCanvas.getContext("2d")

        // Configurar el canvas temporal con las mismas dimensiones
        tempCanvas.width = canvasRef.current.width
        tempCanvas.height = canvasRef.current.height

        // Dibujar solo el video en el canvas temporal (sin puntos ni líneas)
        tempCtx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height)

        // Obtener la imagen del canvas temporal (imagen limpia)
        const capturedDataUrl = tempCanvas.toDataURL("image/png")
        setCapturedImageUrl(capturedDataUrl) // Keep local data URL for download button

        // Convertir Data URL a Blob y luego a File para la subida
        const response = await fetch(capturedDataUrl)
        const blob = await response.blob()
        const file = new File([blob], `postura_${timestamp}.png`, { type: "image/png" })

        // Subir a Cloudinary
        console.log("Subiendo imagen a Cloudinary...")
        const uploadResult = await cloudinaryService.uploadImage(file)
        console.log("Resultado de subida a Cloudinary:", uploadResult)

        if (uploadResult && uploadResult.url) {
          setUploadedImageUrl(uploadResult.url)
          // Guardar en localStorage (simulando caché de página)
          localStorage.setItem("lastUploadedImageUrl", uploadResult.url)
          // alert("Imagen capturada y subida a Cloudinary con éxito!") // Eliminado: Alerta de éxito
        } else {
          throw new Error("La subida a Cloudinary no devolvió una URL.")
        }

        // Preparar datos para JSON (igual que script.js)
        const capturedData = {
          timestamp,
          hip_distance: hipDistance,
          knee_distance: kneeDistance,
          ankle_distance: ankleDistance,
          left_knee_angle: Math.round(leftKneeAngle),
          right_knee_angle: Math.round(rightKneeAngle),
          deformity: deformity,
          cloudinary_url: uploadResult ? uploadResult.url : null, // Añadir URL de Cloudinary al JSON
        }

        setCapturedData(capturedData)
        localStorage.setItem("lastCapturedJsonData", JSON.stringify(capturedData)) // Save JSON to localStorage
        if (onAnalysisComplete) {
          onAnalysisComplete(capturedData)
        }
      }
    } catch (error) {
      console.error("Error durante la captura o subida:", error)
      alert(`Error al capturar o subir la imagen: ${error.message}`)
    } finally {
      setIsCapturing(false)
      setIsUploading(false) // End upload loading
    }
  }

  return (
    <div
      style={{
        padding: "20px",
        display: "flex",
        justifyContent: "center",
        backgroundColor: "#f5f7fa",
        minHeight: "100vh",
      }}
    >
      <div style={styles.container}>
        <h2 style={styles.title}>Análisis de Postura</h2>
        {isCameraOn && feetNotVisible && (
          <div
            style={{
              color: "#b91c1c",
              backgroundColor: "#fee2e2",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "10px",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            Asegúrate de que tus pies estén completamente visibles en la cámara
          </div>
        )}

        <div style={styles.videoContainer}>
          <video ref={videoRef} style={{ display: "none" }}></video>
          <canvas ref={canvasRef} style={styles.canvas}></canvas>
          {!isCameraOn && (
            <img
              ref={gifRef}
              src="/placeholder.svg?height=400&width=600" // Replaced local GIF path
              alt="Camera Off"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
          )}
          <div style={styles.anglesContainer}>
            <div>
              <span>L:</span>
              <span ref={leftKneeAngleRef}>0°</span>
            </div>
            <div>
              <span>R:</span>
              <span ref={rightKneeAngleRef}>0°</span>
            </div>
          </div>
        </div>

        <div style={styles.toleranceContainer}>
          <div style={styles.toleranceLabel}>
            <span>Tolerancia:</span>
            <span ref={toleranceValueRef}>{tolerancePercentage * 100}%</span>
          </div>
          <input
            type="range"
            id="tolerance-input"
            min="0"
            max="100"
            defaultValue="10"
            onChange={handleToleranceChange}
            style={styles.toleranceSlider}
          />
          <div
            style={{
              fontSize: "13px",
              color: "#555",
              marginTop: "4px",
              textAlign: "right",
            }}
          >
            ≈ {Math.round(hipDistance * toleranceRef.current)} px
          </div>
        </div>
        <div style={styles.resultContainer}>
          <div style={styles.resultLabel}>Resultado:</div>
          <div
            ref={deformityResultRef}
            style={{
              ...styles.resultValue,
              color: deformity === "Normal" ? "#10b981" : "#ef4444",
            }}
          >
            {deformity}
          </div>
        </div>

        <div style={styles.buttonContainer}>
          <button onClick={toggleCamera} style={{ ...styles.primaryButton }}>
            {isCameraOn ? "Apagar Cámara" : "Encender Cámara"}
          </button>

          <button
            onClick={handleCapture}
            style={{
              ...styles.primaryButton,
              ...(isPoseDetected && !isUploading && !feetNotVisible ? {} : styles.disabledButton),
            }}
            disabled={!isPoseDetected || isCapturing || isUploading || feetNotVisible}
          >
            {isCapturing || isUploading ? "Subiendo..." : "Capturar y Subir"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CameraComponent
