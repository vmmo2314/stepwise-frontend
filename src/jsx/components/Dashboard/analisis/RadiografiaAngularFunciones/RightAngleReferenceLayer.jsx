import { Line } from "react-konva"

const RightAngleReferenceLayer = ({
  rightAngleRefs,
  setRightAngleRefs,
  mode,
  dimensions,
  refLineType,
  deleteElement,
  scale, // Nueva prop para el scale del zoom
}) => {
  const handleClick = (e) => {
    if (mode !== "rightAngleRef" || !refLineType) return

    e.cancelBubble = true
    
    // CORRECCIÓN: Obtener la posición correcta relativa al layer
    const layer = e.target.getLayer()
    if (!layer) return
    
    // Usar getRelativePointerPosition para obtener coordenadas correctas
    const pos = layer.getRelativePointerPosition()
    if (!pos) return

    // Crear nueva referencia con posición corregida
    const newRef = {
      id: Date.now(),
      type: refLineType,
      position: {
        x: pos.x,
        y: pos.y
      },
    }

    setRightAngleRefs((prev) => [...prev, newRef])
  }

  const handleRefLineClick = (refId, e) => {
    if (e) {
      e.cancelBubble = true
    }

    if (mode === "delete") {
      deleteElement("rightAngleRef", refId)
      return
    }
  }

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

  // Calcular el strokeWidth basado en el zoom para mantener grosor visual consistente
  const getStrokeWidth = () => {
    const baseStroke = mode === "delete" ? 2 : 1
    return Math.max(baseStroke / scale, 0.5) // Mínimo de 0.5px
  }

  // Calcular el dash pattern basado en el zoom
  const getDashPattern = () => {
    const baseDash = 5
    return [Math.max(baseDash / scale, 2), Math.max(baseDash / scale, 2)]
  }

  return (
    <>
      {/* Renderizar todas las líneas acumuladas */}
      {rightAngleRefs.map((ref, index) => {
        const refId = ref.id || `ref-${index}` // Compatibilidad con refs sin ID

        if (ref.type === "horizontal") {
          return (
            <Line
              key={`h-${refId}`}
              points={[0, ref.position.y, dimensions.width, ref.position.y]}
              stroke={mode === "delete" ? "#ff6b6b" : "red"}
              strokeWidth={getStrokeWidth()}
              dash={getDashPattern()}
              opacity={mode === "delete" ? 0.8 : 0.7}
              onClick={mode === "delete" ? (e) => handleRefLineClick(refId, e) : undefined}
              onTap={mode === "delete" ? (e) => handleRefLineClick(refId, e) : undefined}
              onMouseEnter={mode === "delete" ? handleMouseEnter : undefined}
              onMouseLeave={mode === "delete" ? handleMouseLeave : undefined}
              listening={mode === "delete"}
              // Añadir hitStrokeWidth para facilitar la selección
              hitStrokeWidth={mode === "delete" ? Math.max(10 / scale, 5) : 0}
            />
          )
        } else if (ref.type === "vertical") {
          return (
            <Line
              key={`v-${refId}`}
              points={[ref.position.x, 0, ref.position.x, dimensions.height]}
              stroke={mode === "delete" ? "#ff6b6b" : "blue"}
              strokeWidth={getStrokeWidth()}
              dash={getDashPattern()}
              opacity={mode === "delete" ? 0.8 : 0.7}
              onClick={mode === "delete" ? (e) => handleRefLineClick(refId, e) : undefined}
              onTap={mode === "delete" ? (e) => handleRefLineClick(refId, e) : undefined}
              onMouseEnter={mode === "delete" ? handleMouseEnter : undefined}
              onMouseLeave={mode === "delete" ? handleMouseLeave : undefined}
              listening={mode === "delete"}
              // Añadir hitStrokeWidth para facilitar la selección
              hitStrokeWidth={mode === "delete" ? Math.max(10 / scale, 5) : 0}
            />
          )
        }
        return null
      })}

      {/* Capa invisible mejorada solo cuando esté activo el modo */}
      {mode === "rightAngleRef" && refLineType && (
        <Line
          points={[0, 0, dimensions.width, 0, dimensions.width, dimensions.height, 0, dimensions.height, 0, 0]}
          stroke="transparent"
          strokeWidth={1}
          fill="transparent"
          closed={true}
          onClick={handleClick}
          onTap={handleClick}
          listening={true}
          // Asegurar que capture todos los clics en el área
          perfectDrawEnabled={false}
        />
      )}

      {/* Línea de preview cuando el mouse está sobre el canvas en modo rightAngleRef */}
      {mode === "rightAngleRef" && refLineType && (
        <Line
          key={`preview-${refLineType}`}
          points={
            refLineType === "horizontal" 
              ? [0, 0, dimensions.width, 0] 
              : [0, 0, 0, dimensions.height]
          }
          stroke={refLineType === "horizontal" ? "rgba(255, 0, 0, 0.3)" : "rgba(0, 0, 255, 0.3)"}
          strokeWidth={getStrokeWidth()}
          dash={getDashPattern()}
          listening={false}
          visible={false} // Se hará visible con mouse move si implementas esa funcionalidad
        />
      )}
    </>
  )
}

export default RightAngleReferenceLayer