import { useState, useEffect, useRef } from "react"
import { Button, Badge, Form, Modal, Offcanvas } from "react-bootstrap"
import { Stage, Layer, Image, Group } from "react-konva"

import PointsLayer from "./RadiografiaAngularFunciones/PointsLayer"
import AnglesLayer from "./RadiografiaAngularFunciones/AnglesLayer"
import DistancesLayer from "./RadiografiaAngularFunciones/DistancesLayer"
import SegmentsLayer from "./RadiografiaAngularFunciones/SegmentsLayer"
import InfiniteLinesLayer from "./RadiografiaAngularFunciones/InfiniteLinesLayer"
import CirclesLayer from "./RadiografiaAngularFunciones/CirclesLayer"
import TextsLayer from "./RadiografiaAngularFunciones/TextsLayer"
import RightAngleReferenceLayer from "./RadiografiaAngularFunciones/RightAngleReferenceLayer"

// Import the Cloudinary service at the top of the file
import cloudinaryService from "../../../../services/helpers/Claudinaryservices"

export default function RadiografiaAngular({ onAnalysisComplete }) {
  const [mode, setMode] = useState("place")
  const [points, setPoints] = useState([])
  const [angles, setAngles] = useState([])
  const [distances, setDistances] = useState([])
  const [segments, setSegments] = useState([])
  const [infiniteLines, setInfiniteLines] = useState([])
  const [circles, setCircles] = useState([])
  const [texts, setTexts] = useState([])
  const [rightAngleRefs, setRightAngleRefs] = useState([])

  // Estados para responsividad
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [showMobileToolbar, setShowMobileToolbar] = useState(false)
  const [viewportDimensions, setViewportDimensions] = useState({ width: 0, height: 0 })

  // Nuevo estado para el tipo de ángulo a mostrar
  const [angleDisplayType, setAngleDisplayType] = useState("internal") // 'internal' o 'external'

  // Estados para el modal de texto
  const [showTextModal, setShowTextModal] = useState(false)
  const [textModalPosition, setTextModalPosition] = useState({ x: 0, y: 0 })
  const [newTextValue, setNewTextValue] = useState("")

  // History state for undo functionality
  const [history, setHistory] = useState([
    {
      points: [],
      angles: [],
      distances: [],
      segments: [],
      infiniteLines: [],
      circles: [],
      texts: [],
      rightAngleRefs: [],
    },
  ])
  const [currentStateIndex, setCurrentStateIndex] = useState(0)

  const [selectedPoints, setSelectedPoints] = useState([])
  const [imageObj, setImageObj] = useState(null)
  const [originalImageDimensions, setOriginalImageDimensions] = useState({ width: 0, height: 0 })
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [refLineType, setRefLineType] = useState(null)
  const stageRef = useRef(null)

  // Estados para zoom y pan
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  // Estado para mostrar/ocultar toolbar (desktop)
  const [showToolbar, setShowToolbar] = useState(true)

  // Add new state variables for upload status
  const [isUploading, setIsUploading] = useState(false)
  // Removed uploadedImageUrl state as per user request

  // Detectar tamaño de pantalla y actualizar estados
  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      setViewportDimensions({ width, height })
      setIsMobile(width < 768) // Bootstrap md breakpoint
      setIsTablet(width >= 768 && width < 1200) // Between md and xl

      // En móvil, ocultar toolbar por defecto para más espacio
      if (width < 768) {
        setShowToolbar(false)
      }
    }

    updateViewport()
    window.addEventListener("resize", updateViewport)
    return () => window.removeEventListener("resize", updateViewport)
  }, [])

  // Save current state to history when any drawing element changes
  useEffect(() => {
    const currentState = {
      points: [...points],
      angles: [...angles],
      distances: [...distances],
      segments: [...segments],
      infiniteLines: [...infiniteLines],
      circles: [...circles],
      texts: [...texts],
      rightAngleRefs: [...rightAngleRefs],
    }

    // Only add to history if there's an actual change
    const lastState = history[currentStateIndex]
    if (JSON.stringify(currentState) !== JSON.stringify(lastState)) {
      // Remove any future history if we're not at the end
      const newHistory = history.slice(0, currentStateIndex + 1)
      setHistory([...newHistory, currentState])
      setCurrentStateIndex(newHistory.length)
    }
  }, [points, angles, distances, segments, infiniteLines, circles, texts, rightAngleRefs])

  // Add keyboard event listener for Ctrl+Z and Delete key
  useEffect(() => {
    const handleKeyDown = (e) => {
      // No procesar atajos de teclado si estamos en un input o modal
      const isTyping =
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable ||
        showTextModal ||
        showMobileToolbar

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !isTyping) {
        e.preventDefault()
        if (currentStateIndex > 0) {
          const previousState = history[currentStateIndex - 1]
          setPoints(previousState.points)
          setAngles(previousState.angles)
          setDistances(previousState.distances)
          setSegments(previousState.segments)
          setInfiniteLines(previousState.infiniteLines)
          setCircles(previousState.circles)
          setTexts(previousState.texts)
          setRightAngleRefs(previousState.rightAngleRefs)
          setCurrentStateIndex(currentStateIndex - 1)
        }
      } else if ((e.key === "Delete" || e.key === "Backspace") && !isTyping) {
        e.preventDefault()
        setMode("delete")
      } else if ((e.key === "t" || e.key === "T") && !isTyping && !isMobile) {
        e.preventDefault()
        setShowToolbar(!showToolbar)
      } else if (e.key === "Escape") {
        // Escape siempre debe funcionar para cerrar modales
        if (showTextModal) {
          e.preventDefault()
          setShowTextModal(false)
          setNewTextValue("")
        } else if (showMobileToolbar) {
          e.preventDefault()
          setShowMobileToolbar(false)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [currentStateIndex, history, showToolbar, showTextModal, showMobileToolbar, isMobile])

  useEffect(() => {
    // Load last saved image data from localStorage
    // Removed loading lastRadiografiaCloudinaryUrl from localStorage as per user request
  }, [])

  // Actualizar dimensiones del canvas de forma responsiva
  useEffect(() => {
    const updateSize = () => {
      let availableWidth, availableHeight

      if (isMobile) {
        // En móvil, usar casi toda la pantalla
        availableWidth = viewportDimensions.width - 20 // 10px margin cada lado
        availableHeight = viewportDimensions.height - 120 // Header + toolbar bottom
      } else if (isTablet) {
        // En tablet, dejar más espacio para interfaz
        availableWidth = viewportDimensions.width - 60
        availableHeight = viewportDimensions.height - 140
      } else {
        // Desktop
        availableWidth = viewportDimensions.width - 100
        availableHeight = viewportDimensions.height - 160
      }

      if (imageObj && originalImageDimensions.width && originalImageDimensions.height) {
        // Si hay imagen, usar sus dimensiones proporcionalmente
        const imageAspectRatio = originalImageDimensions.width / originalImageDimensions.height

        let newWidth = originalImageDimensions.width
        let newHeight = originalImageDimensions.height

        // Escalar si la imagen es muy grande
        if (newWidth > availableWidth) {
          newWidth = availableWidth
          newHeight = newWidth / imageAspectRatio
        }

        if (newHeight > availableHeight) {
          newHeight = availableHeight
          newWidth = newHeight * imageAspectRatio
        }

        setDimensions({ width: Math.round(newWidth), height: Math.round(newHeight) })
      } else {
        // Sin imagen, usar dimensiones responsivas
        const width = Math.min(availableWidth, 800)
        const height = Math.min(availableHeight, 600)
        setDimensions({ width, height })
      }
    }

    if (viewportDimensions.width > 0) {
      updateSize()
    }
  }, [imageObj, originalImageDimensions, isMobile, isTablet, viewportDimensions])

  // Function to delete a point and all elements that depend on it
  const deletePoint = (pointId) => {
    // Remove the point
    setPoints((prev) => prev.filter((p) => p.id !== pointId))

    // Remove angles that use this point
    setAngles((prev) => prev.filter((angle) => !angle.pointIds.includes(pointId)))

    // Remove distances that use this point
    setDistances((prev) => prev.filter((distance) => !distance.pointIds.includes(pointId)))

    // Remove segments that use this point
    setSegments((prev) => prev.filter((segment) => !segment.pointIds.includes(pointId)))

    // Remove infinite lines that use this point
    setInfiniteLines((prev) => prev.filter((line) => !line.pointIds.includes(pointId)))

    // Remove circles that use this point
    setCircles((prev) => prev.filter((circle) => !circle.pointIds.includes(pointId)))
  }

  // Function to delete specific elements
  const deleteElement = (elementType, elementId) => {
    switch (elementType) {
      case "angle":
        setAngles((prev) => prev.filter((angle) => angle.id !== elementId))
        break
      case "distance":
        setDistances((prev) => prev.filter((distance) => distance.id !== elementId))
        break
      case "segment":
        setSegments((prev) => prev.filter((segment) => segment.id !== elementId))
        break
      case "infiniteLine":
        setInfiniteLines((prev) => prev.filter((line) => line.id !== elementId))
        break
      case "circle":
        setCircles((prev) => prev.filter((circle) => circle.id !== elementId))
        break
      case "text":
        setTexts((prev) => prev.filter((text) => text.id !== elementId))
        break
      case "rightAngleRef":
        setRightAngleRefs((prev) => prev.filter((ref) => ref.id !== elementId))
        break
      default:
        break
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file || !file.type.startsWith("image/")) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new window.Image()
      img.src = ev.target.result
      img.onload = () => {
        // Guardar dimensiones originales de la imagen
        setOriginalImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
        })
        setImageObj(img)
        // Resetear zoom y posición al cargar nueva imagen
        setScale(1)
        setPosition({ x: 0, y: 0 })
      }
    }
    reader.readAsDataURL(file)
  }

  const resetAll = () => {
    setPoints([])
    setAngles([])
    setDistances([])
    setSegments([])
    setInfiniteLines([])
    setCircles([])
    setTexts([])
    setRightAngleRefs([])
    setSelectedPoints([])
    setRefLineType(null)
    setImageObj(null)
    setOriginalImageDimensions({ width: 0, height: 0 })
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setShowTextModal(false)
    setNewTextValue("")

    // Limpiar el input de archivo para permitir cargar la misma imagen u otras
    const fileInput = document.querySelector('input[type="file"][accept="image/*"]')
    if (fileInput) {
      fileInput.value = ""
    }

    // Reset history when clearing all
    setHistory([
      {
        points: [],
        angles: [],
        distances: [],
        segments: [],
        infiniteLines: [],
        circles: [],
        texts: [],
        rightAngleRefs: [],
      },
    ])
    setCurrentStateIndex(0)
  }

  const handleStageClick = (e) => {
    if (isDragging) return

    const stage = e.target.getStage()
    if (!stage) return
    const pos = stage.getPointerPosition()

    // Ajustar posición por zoom y pan
    const adjustedPos = {
      x: (pos.x - position.x) / scale,
      y: (pos.y - position.y) / scale,
    }

    if (mode === "place") {
      setPoints((prev) => [...prev, { x: adjustedPos.x, y: adjustedPos.y, id: Date.now() }])
    } else if (mode === "text") {
      // Mostrar modal para insertar texto
      setTextModalPosition(adjustedPos)
      setShowTextModal(true)
      setNewTextValue("")
    }
  }

  // Función para confirmar la inserción de texto
  const handleTextConfirm = () => {
    if (newTextValue.trim()) {
      setTexts((prev) => [
        ...prev,
        {
          id: Date.now(),
          x: textModalPosition.x,
          y: textModalPosition.y,
          text: newTextValue.trim(),
        },
      ])
    }
    setShowTextModal(false)
    setNewTextValue("")
  }

  // Funciones de zoom (adaptadas para móviles)
  const handleWheel = (e) => {
    e.evt.preventDefault()

    const scaleBy = isMobile ? 1.05 : 1.1 // Zoom más suave en móvil
    const stage = e.target.getStage()
    const pointer = stage.getPointerPosition()
    const mousePointTo = {
      x: (pointer.x - position.x) / scale,
      y: (pointer.y - position.y) / scale,
    }

    const newScale = e.evt.deltaY > 0 ? scale / scaleBy : scale * scaleBy
    const maxScale = isMobile ? 3 : 5 // Menos zoom máximo en móvil
    const clampedScale = Math.max(0.1, Math.min(maxScale, newScale))

    setScale(clampedScale)
    setPosition({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    })
  }

  const zoomIn = () => {
    const maxScale = isMobile ? 3 : 5
    const newScale = Math.min(scale * (isMobile ? 1.15 : 1.2), maxScale)
    setScale(newScale)
  }

  const zoomOut = () => {
    const newScale = Math.max(scale / (isMobile ? 1.15 : 1.2), 0.1)
    setScale(newScale)
  }

  const resetZoom = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const centerCanvas = () => {
    if (imageObj) {
      const stageWidth = dimensions.width
      const stageHeight = dimensions.height
      const imageWidth = originalImageDimensions.width * scale
      const imageHeight = originalImageDimensions.height * scale

      setPosition({
        x: (stageWidth - imageWidth) / 2,
        y: (stageHeight - imageHeight) / 2,
      })
    }
  }

  const getModeDisplayName = (currentMode) => {
    const modeNames = {
      place: "Puntos",
      movePoints: "Mover",
      pan: "Navegar",
      delete: "Eliminar",
      angle: "Ángulos",
      distance: "Distancias",
      segment: "Segmentos",
      infiniteLine: "Líneas",
      circle: "Círculos",
      text: "Texto",
      rightAngleRef: "Referencias",
    }
    return modeNames[currentMode] || currentMode
  }

  const getElementsCount = () => {
    return {
      points: points.length,
      angles: angles.length,
      distances: distances.length,
      segments: segments.length,
      infiniteLines: infiniteLines.length,
      circles: circles.length,
      texts: texts.length,
      rightAngleRefs: rightAngleRefs.length,
    }
  }

  const elementsCount = getElementsCount()

  // Modified the `exportImage` function to upload to Cloudinary AND save JSON data
  const exportImage = async (format = "png", quality = 1) => {
    if (!stageRef.current) return

    setIsUploading(true)

    try {
      const stage = stageRef.current

      const exportOptions = {
        mimeType: `image/${format}`,
        quality: quality,
        pixelRatio: isMobile ? 1.5 : 2,
      }

      const dataURL = stage.toDataURL(exportOptions)

      // Convert Data URL to Blob and then to File for upload
      const response = await fetch(dataURL)
      const blob = await response.blob()
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
      const file = new File([blob], `radiografia_${timestamp}.${format}`, { type: `image/${format}` })

      console.log("Subiendo imagen de radiografía a Cloudinary...")
      const uploadResult = await cloudinaryService.uploadImage(file)
      console.log("Resultado de subida a Cloudinary:", uploadResult)

      if (uploadResult && uploadResult.url) {
        localStorage.setItem("lastRadiografiaCloudinaryUrl", uploadResult.url)
        // alert("Imagen de radiografía subida a Cloudinary con éxito!")
      } else {
        throw new Error("La subida a Cloudinary no devolvió una URL.")
      }

      // Save JSON data to localStorage after successful image upload
      const dataToSave = {
        metadata: {
          exportDate: new Date().toISOString(),
          imageInfo: originalImageDimensions,
          totalElements: elementsCount,
          deviceType: isMobile ? "mobile" : isTablet ? "tablet" : "desktop",
          cloudinaryUrl: uploadResult ? uploadResult.url : null, // Include Cloudinary URL in JSON
        },
        points,
        angles,
        distances,
        segments,
        infiniteLines,
        circles,
        texts,
        rightAngleRefs,
      }

      const dataStr = JSON.stringify(dataToSave, null, 2)
      localStorage.setItem("lastRadiografiaData", dataStr)
      console.log(`Datos JSON guardados en localStorage: radiografia_datos_${timestamp}.json`)

      if (onAnalysisComplete) {
        onAnalysisComplete(dataToSave)
      }

      // Removed local download logic for JSON as per user request
      // Removed local download logic for image as per user request
    } catch (error) {
      console.error("Error al subir imagen o guardar datos:", error)
      alert(`Error al subir la imagen o guardar los datos: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  // Removed exportData function as its logic is now integrated into exportImage

  // Modified importData function to load from localStorage

  // Función para cambiar modo y cerrar toolbar móvil
  const changeMode = (newMode) => {
    setMode(newMode)
    setSelectedPoints([])
    setRefLineType(null)

    // En móvil, cerrar toolbar después de seleccionar herramienta
    if (isMobile) {
      setShowMobileToolbar(false)
    }
  }

  // Componente del header responsivo
  const renderHeader = () => (
    <div className={`border-bottom ${isMobile ? "px-2 py-2" : "px-3 py-2"}`} style={{ zIndex: 1 }}>
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          {!isMobile && (
            <h5 className="mb-0 text-primary me-3">
              <i className="fas fa-x-ray me-2"></i>
              Radiografía Angular
            </h5>
          )}
          {isMobile && (
            <h6 className="mb-0 text-primary me-2">
              <i className="fas fa-x-ray me-1"></i>
              RadAngular
            </h6>
          )}
        </div>

        <div className="d-flex align-items-center gap-3 p-3 bg-body-secondary rounded-3 border shadow-sm">
        <div className="position-relative">
          <Form.Control
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ 
              width: isMobile ? "130px" : "200px",
              borderRadius: '10px'
            }}
            size="sm"
            className="border-2 border-dashed"
          />
          {imageObj && (
            <Badge 
              bg="success" 
              className="position-absolute top-0 start-100 translate-middle rounded-pill px-2 shadow-sm"
              style={{ fontSize: '0.7rem' }}
            >
              <i className="fas fa-check me-1"></i>
              {isMobile ? "OK" : "Imagen OK"}
            </Badge>
          )}
        </div>

        <div className="d-flex gap-2">
          <Button
            variant={isUploading ? "success" : "outline-success"}
            size="sm"
            onClick={() => exportImage("png")}
            title="Subir imagen a Cloudinary y guardar datos de análisis"
            disabled={(!imageObj && points.length === 0) || isUploading}
            className="rounded-pill px-3 border-2 fw-medium shadow-sm"
          >
            <i className={`fas ${isUploading ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'} me-2`}></i>
            <span className={isMobile ? "d-none" : ""}>
              {isUploading ? "Subiendo..." : "Subir Análisis"}
            </span>
          </Button>

          {isMobile && (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setShowMobileToolbar(true)}
              title="Herramientas"
              className="rounded-circle border-2 shadow-sm d-flex align-items-center justify-content-center"
              style={{ width: '40px', height: '40px' }}
            >
              <i className="fas fa-tools"></i>
            </Button>
          )}

          {!isMobile && (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setShowToolbar(!showToolbar)}
              title="Mostrar/Ocultar herramientas (T)"
              className="rounded-circle border-2 shadow-sm d-flex align-items-center justify-content-center"
              style={{ width: '40px', height: '40px' }}
            >
              <i className={`fas fa-${showToolbar ? "eye-slash" : "eye"}`}></i>
            </Button>
          )}
        </div>
        </div>
      </div>
    </div>
  )

  // Componente de toolbar para móviles (Offcanvas)
  const renderMobileToolbar = () => (
    <Offcanvas
      show={showMobileToolbar}
      onHide={() => setShowMobileToolbar(false)}
      placement="bottom"
      className="h-auto"
      style={{ maxHeight: "70vh" }}
    >
      <Offcanvas.Header closeButton className="pb-2">
        <Offcanvas.Title>
          <i className="fas fa-tools me-2"></i>
          Herramientas
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body className="pt-2">
        {/* Herramientas principales */}
        <div className="mb-3">
          <h6 className="text-muted mb-2">Herramientas Principales</h6>
          <div className="d-grid gap-2" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <Button
              variant={mode === "place" ? "primary" : "outline-primary"}
              onClick={() => changeMode("place")}
              className="d-flex align-items-center justify-content-start"
            >
              <i className="fas fa-plus-circle me-2"></i>
              Puntos
            </Button>
            <Button
              variant={mode === "movePoints" ? "primary" : "outline-primary"}
              onClick={() => changeMode("movePoints")}
              className="d-flex align-items-center justify-content-start"
            >
              <i className="fas fa-arrows-alt me-2"></i>
              Mover
            </Button>
            <Button
              variant={mode === "angle" ? "success" : "outline-success"}
              onClick={() => {
                changeMode("angle")
                setAngleDisplayType("internal")
              }}
              className="d-flex align-items-center justify-content-start"
            >
              <i className="fas fa-angle-right me-2"></i>
              Ángulos
            </Button>
            <Button
              variant={mode === "distance" ? "success" : "outline-success"}
              onClick={() => changeMode("distance")}
              className="d-flex align-items-center justify-content-start"
            >
              <i className="fas fa-ruler me-2"></i>
              Distancias
            </Button>
            <Button
              variant={mode === "segment" ? "info" : "outline-info"}
              onClick={() => changeMode("segment")}
              className="d-flex align-items-center justify-content-start"
            >
              <i className="fas fa-minus me-2"></i>
              Segmentos
            </Button>
            <Button
              variant={mode === "infiniteLine" ? "info" : "outline-info"}
              onClick={() => changeMode("infiniteLine")}
              className="d-flex align-items-center justify-content-start"
            >
              <i className="fas fa-arrows-alt-h me-2"></i>
              Líneas
            </Button>
            <Button
              variant={mode === "circle" ? "warning" : "outline-warning"}
              onClick={() => changeMode("circle")}
              className="d-flex align-items-center justify-content-start"
            >
              <i className="fas fa-circle me-2"></i>
              Círculos
            </Button>
            <Button
              variant={mode === "text" ? "warning" : "outline-warning"}
              onClick={() => changeMode("text")}
              className="d-flex align-items-center justify-content-start"
            >
              <i className="fas fa-font me-2"></i>
              Texto
            </Button>
          </div>
        </div>

        {/* Referencias */}
        <div className="mb-3">
          <h6 className="text-muted mb-2">Referencias</h6>
          <div className="d-grid gap-2" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <Button
              variant={mode === "rightAngleRef" && refLineType === "horizontal" ? "secondary" : "outline-secondary"}
              onClick={() => {
                changeMode("rightAngleRef")
                setRefLineType("horizontal")
              }}
              className="d-flex align-items-center justify-content-start"
            >
              <i className="fas fa-arrows-alt-h me-2"></i>
              Horizontal
            </Button>
            <Button
              variant={mode === "rightAngleRef" && refLineType === "vertical" ? "secondary" : "outline-secondary"}
              onClick={() => {
                changeMode("rightAngleRef")
                setRefLineType("vertical")
              }}
              className="d-flex align-items-center justify-content-start"
            >
              <i className="fas fa-arrows-alt-v me-2"></i>
              Vertical
            </Button>
          </div>
        </div>

        {/* Navegación y acciones */}
        <div className="mb-3">
          <h6 className="text-muted mb-2">Navegación y Acciones</h6>
          <div className="d-grid gap-2" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <Button
              variant={mode === "pan" ? "info" : "outline-info"}
              onClick={() => changeMode("pan")}
              className="d-flex align-items-center justify-content-start"
            >
              <i className="fas fa-hand-paper me-2"></i>
              Navegar
            </Button>
            <Button
              variant={mode === "delete" ? "danger" : "outline-danger"}
              onClick={() => changeMode("delete")}
              className="d-flex align-items-center justify-content-start"
            >
              <i className="fas fa-trash me-2"></i>
              Eliminar
            </Button>
            <Button
              variant="outline-warning"
              onClick={() => {
                if (currentStateIndex > 0) {
                  const previousState = history[currentStateIndex - 1]
                  setPoints(previousState.points)
                  setAngles(previousState.angles)
                  setDistances(previousState.distances)
                  setSegments(previousState.segments)
                  setInfiniteLines(previousState.infiniteLines)
                  setCircles(previousState.circles)
                  setTexts(previousState.texts)
                  setRightAngleRefs(previousState.rightAngleRefs)
                  setCurrentStateIndex(currentStateIndex - 1)
                }
                setShowMobileToolbar(false)
              }}
              disabled={currentStateIndex <= 0}
              className="d-flex align-items-center justify-content-start"
            >
              <i className="fas fa-undo me-2"></i>
              Deshacer
            </Button>
            <Button
              variant="outline-danger"
              onClick={() => {
                resetAll()
                setShowMobileToolbar(false)
              }}
              className="d-flex align-items-center justify-content-start"
            >
              <i className="fas fa-broom me-2"></i>
              Limpiar
            </Button>
          </div>
        </div>

        {/* Zoom controls para móvil */}
        <div>
          <h6 className="text-muted mb-2">Zoom</h6>
          <div className="d-grid gap-2" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <Button variant="outline-primary" onClick={zoomIn}>
              <i className="fas fa-plus me-1"></i>
              Acercar
            </Button>
            <Button variant="outline-primary" onClick={zoomOut}>
              <i className="fas fa-minus me-1"></i>
              Alejar
            </Button>
            <Button variant="outline-secondary" onClick={resetZoom}>
              <i className="fas fa-compress-arrows-alt me-1"></i>
              Reset
            </Button>
          </div>
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  )

  // Componente de toolbar para desktop
  const renderDesktopToolbar = () =>
    showToolbar &&
    !isMobile && (
      <div
        className="position-absolute bg-white shadow-lg rounded-3 p-2"
        style={{
          top: "20px",
          left: "20px",
          zIndex: 1,
          minWidth: "60px",
        }}
      >
        {/* Herramientas principales en grid compacto */}
        <div className="d-grid gap-1" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          <Button
            variant={mode === "place" ? "primary" : "outline-primary"}
            size="sm"
            onClick={() => changeMode("place")}
            title="Colocar Puntos"
            className="d-flex align-items-center justify-content-center"
            style={{ minHeight: "35px" }}
          >
            <i className="fas fa-plus-circle"></i>
          </Button>
          <Button
            variant={mode === "movePoints" ? "primary" : "outline-primary"}
            size="sm"
            onClick={() => changeMode("movePoints")}
            title="Mover Puntos"
            className="d-flex align-items-center justify-content-center"
            style={{ minHeight: "35px" }}
          >
            <i className="fas fa-arrows-alt"></i>
          </Button>
          <Button
            variant={mode === "angle" ? "success" : "outline-success"}
            size="sm"
            onClick={() => {
              changeMode("angle")
              setAngleDisplayType("internal")
            }}
            title="Medir Ángulos"
            className="d-flex align-items-center justify-content-center"
            style={{ minHeight: "35px" }}
          >
            <i className="fas fa-angle-right"></i>
          </Button>
          <Button
            variant={mode === "distance" ? "success" : "outline-success"}
            size="sm"
            onClick={() => changeMode("distance")}
            title="Medir Distancias"
            className="d-flex align-items-center justify-content-center"
            style={{ minHeight: "35px" }}
          >
            <i className="fas fa-ruler"></i>
          </Button>
          <Button
            variant={mode === "segment" ? "info" : "outline-info"}
            size="sm"
            onClick={() => changeMode("segment")}
            title="Dibujar Segmentos"
            className="d-flex align-items-center justify-content-center"
            style={{ minHeight: "35px" }}
          >
            <i className="fas fa-minus"></i>
          </Button>
          <Button
            variant={mode === "infiniteLine" ? "info" : "outline-info"}
            size="sm"
            onClick={() => changeMode("infiniteLine")}
            title="Líneas Infinitas"
            className="d-flex align-items-center justify-content-center"
            style={{ minHeight: "35px" }}
          >
            <i className="fas fa-arrows-alt-h"></i>
          </Button>
          <Button
            variant={mode === "circle" ? "warning" : "outline-warning"}
            size="sm"
            onClick={() => changeMode("circle")}
            title="Circunferencias"
            className="d-flex align-items-center justify-content-center"
            style={{ minHeight: "35px" }}
          >
            <i className="fas fa-circle"></i>
          </Button>
          <Button
            variant={mode === "text" ? "warning" : "outline-warning"}
            size="sm"
            onClick={() => changeMode("text")}
            title="Texto Libre"
            className="d-flex align-items-center justify-content-center"
            style={{ minHeight: "35px" }}
          >
            <i className="fas fa-font"></i>
          </Button>
        </div>

        <hr className="my-2" />

        {/* Referencias */}
        <div className="d-grid gap-1" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          <Button
            variant={mode === "rightAngleRef" && refLineType === "horizontal" ? "secondary" : "outline-secondary"}
            size="sm"
            onClick={() => {
              changeMode("rightAngleRef")
              setRefLineType("horizontal")
            }}
            title="Línea Horizontal (90°)"
            className="d-flex align-items-center justify-content-center"
            style={{ minHeight: "35px" }}
          >
            <i className="fas fa-arrows-alt-h"></i>
          </Button>
          <Button
            variant={mode === "rightAngleRef" && refLineType === "vertical" ? "secondary" : "outline-secondary"}
            size="sm"
            onClick={() => {
              changeMode("rightAngleRef")
              setRefLineType("vertical")
            }}
            title="Línea Vertical (180°)"
            className="d-flex align-items-center justify-content-center"
            style={{ minHeight: "35px" }}
          >
            <i className="fas fa-arrows-alt-v"></i>
          </Button>
        </div>

        <hr className="my-2" />

        {/* Acciones */}
        <div className="d-grid gap-1" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          <Button
            variant={mode === "delete" ? "danger" : "outline-danger"}
            size="sm"
            onClick={() => changeMode("delete")}
            title="Eliminar Elemento (Del)"
            className="d-flex align-items-center justify-content-center"
            style={{ minHeight: "35px" }}
          >
            <i className="fas fa-trash"></i>
          </Button>
          <Button
            variant="outline-warning"
            size="sm"
            onClick={() => {
              if (currentStateIndex > 0) {
                const previousState = history[currentStateIndex - 1]
                setPoints(previousState.points)
                setAngles(previousState.angles)
                setDistances(previousState.distances)
                setSegments(previousState.segments)
                setInfiniteLines(previousState.infiniteLines)
                setCircles(previousState.circles)
                setTexts(previousState.texts)
                setRightAngleRefs(previousState.rightAngleRefs)
                setCurrentStateIndex(currentStateIndex - 1)
              }
            }}
            disabled={currentStateIndex <= 0}
            title="Deshacer (Ctrl+Z)"
            className="d-flex align-items-center justify-content-center"
            style={{ minHeight: "35px" }}
          >
            <i className="fas fa-undo"></i>
          </Button>
        </div>
      </div>
    )

  // Controles de navegación y zoom para desktop/tablet
  const renderNavigationControls = () =>
    !isMobile && (
      <div
        className="position-absolute bg-white shadow rounded-3 p-2"
        style={{
          top: "20px",
          right: "20px",
          zIndex: 1,
        }}
      >
        <div className="d-grid gap-1">
          <Button
            variant={mode === "pan" ? "info" : "outline-info"}
            size="sm"
            onClick={() => changeMode("pan")}
            title="Navegar por la imagen"
          >
            <i className="fas fa-hand-paper"></i>
          </Button>
          <hr className="my-1" />
          <Button variant="outline-primary" size="sm" onClick={zoomIn} title="Zoom In">
            <i className="fas fa-plus"></i>
          </Button>
          <Button variant="outline-primary" size="sm" onClick={zoomOut} title="Zoom Out">
            <i className="fas fa-minus"></i>
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={resetZoom} title="Reset Zoom">
            <i className="fas fa-compress-arrows-alt"></i>
          </Button>
          <Button variant="outline-info" size="sm" onClick={centerCanvas} title="Centrar">
            <i className="fas fa-crosshairs"></i>
          </Button>
        </div>
      </div>
    )

  // Panel de información inferior responsivo
  const renderInfoPanel = () => (
    <div
      className={`position-absolute ${isMobile ? "px-2 py-2" : "px-3 py-2"}`}
      style={{
        bottom: isMobile ? "10px" : "30px",
        left: isMobile ? "10px" : "20px",
        right: isMobile ? "10px" : "20px",
        zIndex: 1050,
        maxWidth: "calc(100vw - 20px)",
        maxHeight: "30vh",
        overflowY: "auto"
      }}
    >
      <div
        className={`d-flex justify-content-between align-items-start ${isMobile ? "flex-column gap-2" : "flex-wrap"}`}
      >
        <div className={`d-flex align-items-center flex-wrap ${isMobile ? "gap-2" : "gap-3"}`}>
          <Badge bg={mode === "delete" ? "danger" : mode === "pan" ? "info" : "primary"}>
            {getModeDisplayName(mode)}
          </Badge>
          {!isMobile && <small className="text-muted">Zoom: {Math.round(scale * 100)}%</small>}
          {imageObj && !isMobile && (
            <small className="text-muted">
              {originalImageDimensions.width} × {originalImageDimensions.height}px
            </small>
          )}
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <Badge bg="info" className="small">
            P:{elementsCount.points}
          </Badge>
          <Badge bg="warning" className="small">
            ∠:{elementsCount.angles}
          </Badge>
          <Badge bg="success" className="small">
            D:{elementsCount.distances}
          </Badge>
          {!isMobile && (
            <div className="d-flex gap-1">
              <Button variant="outline-danger" size="sm" onClick={resetAll} title="Limpiar Todo">
                <i className="fas fa-broom"></i>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Controles de zoom para móvil en el panel inferior */}
      {isMobile && (
        <div className="d-flex justify-content-center align-items-center gap-2 mt-2 pt-2 border-top flex-wrap">
          <Button variant="outline-primary" size="sm" onClick={zoomOut} title="Alejar">
            <i className="fas fa-minus"></i>
          </Button>
          <span className="small text-muted px-2 text-nowrap">{Math.round(scale * 100)}%</span>
          <Button variant="outline-primary" size="sm" onClick={zoomIn} title="Acercar">
            <i className="fas fa-plus"></i>
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={resetZoom} title="Reset">
            <i className="fas fa-compress-arrows-alt"></i>
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <div className="position-relative" style={{ height: "100vh", overflow: "hidden" }}>
      {/* Header responsivo */}
      {renderHeader()}

      {/* Canvas principal */}
      <div
        className="position-relative d-flex justify-content-center align-items-center"
        style={{
          height: "calc(100vh - 60px)",
          backgroundColor: "#f8f9fa",
          padding: isMobile ? "10px" : "20px",
        }}
      >
        {/* Toolbars */}
        {renderDesktopToolbar()}
        {renderMobileToolbar()}
        {renderNavigationControls()}

        {/* Canvas */}
        <Stage
          width={dimensions.width}
          height={dimensions.height}
          scaleX={scale}
          scaleY={scale}
          x={position.x}
          y={position.y}
          onWheel={handleWheel}
          onClick={handleStageClick}
          onTap={handleStageClick}
          ref={stageRef}
          draggable={mode === "pan"}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(e) => {
            setIsDragging(false)
            if (mode === "pan") {
              setPosition({ x: e.target.x(), y: e.target.y() })
            }
          }}
          style={{
            border: "2px solid #dee2e6",
            borderRadius: "8px",
            backgroundColor: "#ffffff",
            cursor: mode === "delete" ? "crosshair" : mode === "pan" ? "grab" : mode === "text" ? "text" : "default",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            maxWidth: "100%",
            maxHeight: "100%",
          }}
        >
          <Layer>
            <Group>
              {imageObj && (
                <Image
                  image={imageObj}
                  x={0}
                  y={0}
                  width={originalImageDimensions.width}
                  height={originalImageDimensions.height}
                />
              )}

              <PointsLayer
                points={points}
                setPoints={setPoints}
                mode={mode}
                selectedPoints={selectedPoints}
                setSelectedPoints={setSelectedPoints}
                setAngles={setAngles}
                setDistances={setDistances}
                setSegments={setSegments}
                setInfiniteLines={setInfiniteLines}
                setCircles={setCircles}
                setTexts={setTexts}
                setRightAngleRefs={setRightAngleRefs}
                deletePoint={deletePoint}
                angleDisplayType={angleDisplayType}
                scale={scale}
              />

              <AnglesLayer angles={angles} points={points} mode={mode} deleteElement={deleteElement} scale={scale} />
              <DistancesLayer
                distances={distances}
                points={points}
                mode={mode}
                deleteElement={deleteElement}
                scale={scale}
              />
              <SegmentsLayer
                segments={segments}
                points={points}
                mode={mode}
                deleteElement={deleteElement}
                scale={scale}
              />
              <InfiniteLinesLayer
                infiniteLines={infiniteLines}
                points={points}
                width={originalImageDimensions.width || dimensions.width}
                height={originalImageDimensions.height || dimensions.height}
                mode={mode}
                deleteElement={deleteElement}
                scale={scale}
              />
              <CirclesLayer circles={circles} points={points} mode={mode} deleteElement={deleteElement} scale={scale} />
              <TextsLayer texts={texts} setTexts={setTexts} mode={mode} deleteElement={deleteElement} scale={scale} />
              <RightAngleReferenceLayer
                rightAngleRefs={rightAngleRefs}
                setRightAngleRefs={setRightAngleRefs}
                mode={mode}
                dimensions={originalImageDimensions.width ? originalImageDimensions : dimensions}
                refLineType={refLineType}
                deleteElement={deleteElement}
                scale={scale}
              />
            </Group>
          </Layer>
        </Stage>

        {/* Overlay cuando no hay imagen */}
        {!imageObj && (
          <div
            className="position-absolute top-50 start-50 translate-middle text-center"
            style={{ pointerEvents: "none", zIndex: 5 }}
          >
            <i className="fas fa-upload text-muted" style={{ fontSize: isMobile ? "3rem" : "4rem" }}></i>
            <p className={`text-muted mt-3 mb-0 ${isMobile ? "fs-6" : "fs-5"}`}>
              {isMobile ? "Sube una radiografía" : "Arrastra una radiografía aquí o usa el botón superior"}
            </p>
            <small className="text-muted">Formatos: JPG, PNG, GIF</small>
          </div>
        )}

        {/* Panel de información */}
        {renderInfoPanel()}
      </div>

      {/* Modal para insertar texto */}
      <Modal show={showTextModal} onHide={() => setShowTextModal(false)} centered size={isMobile ? "sm" : "md"}>
        <Modal.Header closeButton>
          <Modal.Title className={isMobile ? "fs-6" : "fs-5"}>
            <i className="fas fa-font me-2"></i>
            Insertar Texto
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Texto a insertar:</Form.Label>
            <Form.Control
              type="text"
              placeholder="Escribe tu texto aquí..."
              value={newTextValue}
              onChange={(e) => setNewTextValue(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleTextConfirm()
                } else if (e.key === "Escape") {
                  e.preventDefault()
                  setShowTextModal(false)
                  setNewTextValue("")
                }
              }}
            />
            <Form.Text className="text-muted">Presiona Enter para confirmar o Escape para cancelar</Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            size={isMobile ? "sm" : "md"}
            onClick={() => {
              setShowTextModal(false)
              setNewTextValue("")
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size={isMobile ? "sm" : "md"}
            onClick={handleTextConfirm}
            disabled={!newTextValue.trim()}
          >
            <i className="fas fa-check me-2"></i>
            Insertar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Mode Alert flotante */}
      {mode === "delete" && (
        <div
          className={`position-absolute alert alert-warning alert-dismissible shadow ${isMobile ? "mx-2" : ""}`}
          style={{
            top: isMobile ? "70px" : "80px",
            left: isMobile ? "10px" : "50%",
            right: isMobile ? "10px" : "auto",
            transform: isMobile ? "none" : "translateX(-50%)",
            zIndex: 25,
            minWidth: isMobile ? "auto" : "400px",
          }}
        >
          <i className="fas fa-exclamation-triangle me-2"></i>
          <strong>Modo Eliminar:</strong>{" "}
          {isMobile ? "Toca para eliminar" : "Haz clic en cualquier elemento para eliminarlo"}
          <button
            type="button"
            className="btn-close"
            onClick={() => setMode("place")}
            title="Salir del modo eliminar"
          ></button>
        </div>
      )}

      {/* Pan Mode Alert flotante */}
      {mode === "pan" && (
        <div
          className={`position-absolute alert alert-info alert-dismissible shadow ${isMobile ? "mx-2" : ""}`}
          style={{
            top: isMobile ? "70px" : "80px",
            left: isMobile ? "10px" : "50%",
            right: isMobile ? "10px" : "auto",
            transform: isMobile ? "none" : "translateX(-50%)",
            zIndex: 25,
            minWidth: isMobile ? "auto" : "400px",
          }}
        >
          <i className="fas fa-hand-paper me-2"></i>
          <strong>Modo Navegación:</strong>{" "}
          {isMobile ? "Arrastra para navegar" : "Arrastra para mover la vista de la imagen"}
          <button
            type="button"
            className="btn-close"
            onClick={() => setMode("place")}
            title="Salir del modo navegación"
          ></button>
        </div>
      )}
    </div>
  )
}