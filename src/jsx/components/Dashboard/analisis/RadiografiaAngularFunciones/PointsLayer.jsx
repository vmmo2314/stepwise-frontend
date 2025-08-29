import { Circle } from "react-konva"

export default function PointsLayer({
  points,
  setPoints,
  mode,
  selectedPoints,
  setSelectedPoints,
  setAngles,
  setDistances,
  setSegments,
  setInfiniteLines,
  setCircles,
  setRightAngleRefs,
  deletePoint,
  angleDisplayType, // Nueva prop
  scale, // Prop para el scale del zoom
}) {
  const handlePointClick = (id, e) => {
    // Prevenir que el evento se propague al Stage
    if (e) {
      e.cancelBubble = true
    }

    // Nuevo: Manejar modo eliminar
    if (mode === "delete") {
      deletePoint(id)
      return
    }

    // Cambio: usar movePoints en lugar de move
    if (mode === "movePoints") return // No hacer nada al hacer click en modo mover puntos
    if (mode === "pan") return // No hacer nada al hacer click en modo navegación
    if (selectedPoints.includes(id)) return

    if (mode === "angle") {
      const next = [...selectedPoints, id]
      if (next.length === 3) {
        setAngles((prevAngles) => [
          ...prevAngles,
          {
            id: Date.now(),
            pointIds: next,
            displayType: angleDisplayType, // Guardar el tipo de ángulo
          },
        ])
        setSelectedPoints([])
      } else {
        setSelectedPoints(next)
      }
      return
    }

    if (mode === "segment") {
      const next = [...selectedPoints, id]
      if (next.length === 2) {
        setSegments((prevSegments) => [...prevSegments, { id: Date.now(), pointIds: next }])
        setSelectedPoints([])
      } else {
        setSelectedPoints(next)
      }
      return
    }

    if (mode === "infiniteLine") {
      const next = [...selectedPoints, id]
      if (next.length === 2) {
        setInfiniteLines((prevLines) => [...prevLines, { id: Date.now(), pointIds: next }])
        setSelectedPoints([])
      } else {
        setSelectedPoints(next)
      }
      return
    }

    if (mode === "distance") {
      const next = [...selectedPoints, id]
      if (next.length === 2) {
        setDistances((prevDists) => [...prevDists, { id: Date.now(), pointIds: next }])
        setSelectedPoints([])
      } else {
        setSelectedPoints(next)
      }
      return
    }

    if (mode === "circle") {
      const next = [...selectedPoints, id]
      if (next.length === 2) {
        setCircles((prevCircles) => [...prevCircles, { id: Date.now(), pointIds: next }])
        setSelectedPoints([])
      } else {
        setSelectedPoints(next)
      }
      return
    }

    if (mode === "rightAngleRef") {
      setSelectedPoints((prev) => {
        if (prev.includes(id)) return prev
        const next = [...prev, id]
        if (next.length === 2) {
          setRightAngleRefs((prevRefs) => [...prevRefs, { id: Date.now(), pointIds: next }])
          return []
        }
        return next
      })
      return
    }
  }

  const handlePointDrag = (e, id) => {
    const { x, y } = e.target.position()
    setPoints((prev) => prev.map((p) => (p.id === id ? { ...p, x, y } : p)))
  }

  // Función para manejar el hover en modo eliminar
  const handleMouseEnter = (e) => {
    if (mode === "delete") {
      e.target.getStage().container().style.cursor = "pointer"
    }
  }

  const handleMouseLeave = (e) => {
    if (mode === "delete") {
      e.target.getStage().container().style.cursor = "crosshair"
    }
  }

  // Calcular el radio del punto basado en el zoom para mantener tamaño visual consistente
  const getPointRadius = () => {
    const baseRadius = 6
    // Ajustar el radio inversamente al zoom para mantener tamaño visual
    return Math.max(baseRadius / scale, 3) // Mínimo de 3px
  }

  // Calcular el strokeWidth basado en el zoom
  const getStrokeWidth = () => {
    const baseStroke = mode === "delete" ? 2 : 1
    return Math.max(baseStroke / scale, 0.5) // Mínimo de 0.5px
  }

  return (
    <>
      {points.map((point) => (
        <Circle
          key={point.id}
          name="point"
          x={point.x}
          y={point.y}
          radius={getPointRadius()}
          fill={
            selectedPoints.includes(point.id)
              ? "red"
              : mode === "movePoints"
                ? "#0088ff" // Cambio: usar movePoints
                : mode === "delete"
                  ? "#ff6b6b" // Color especial para modo eliminar
                  : "blue"
          }
          stroke={mode === "delete" ? "#dc3545" : "black"}
          strokeWidth={getStrokeWidth()}
          draggable={mode === "movePoints"} // Cambio: usar movePoints
          onClick={(e) => handlePointClick(point.id, e)}
          onTap={(e) => handlePointClick(point.id, e)}
          onDragMove={(e) => handlePointDrag(e, point.id)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          // Añadir efecto visual en modo eliminar
          scaleX={mode === "delete" ? 1.2 : 1}
          scaleY={mode === "delete" ? 1.2 : 1}
          // Mejorar la interactividad visual
          shadowColor={mode === "movePoints" ? "#0088ff" : mode === "delete" ? "#dc3545" : "transparent"}
          shadowBlur={mode === "movePoints" || mode === "delete" ? 5 / scale : 0}
          shadowOpacity={mode === "movePoints" || mode === "delete" ? 0.5 : 0}
        />
      ))}
    </>
  )
}