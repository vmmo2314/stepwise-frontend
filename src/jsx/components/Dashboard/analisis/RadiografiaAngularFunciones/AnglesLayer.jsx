import { Line, Text, Arc } from "react-konva"
import React from "react"

function calculateAngleData(p1, p2, p3) {
  // p2 es el vértice
  const angle1 = Math.atan2(p1.y - p2.y, p1.x - p2.x)
  const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x)

  let angleRad = angle2 - angle1
  // Normalizar a 0 a 2*PI
  if (angleRad < 0) angleRad += 2 * Math.PI
  if (angleRad > 2 * Math.PI) angleRad -= 2 * Math.PI

  const internalAngleDegrees = (angleRad * 180) / Math.PI
  const externalAngleDegrees = 360 - internalAngleDegrees

  // Determinar el ángulo de inicio para el arco (rotación)
  const startAngleDegrees = (angle1 * 180) / Math.PI

  // Calcular el ángulo de la bisectriz para posicionar el texto
  let bisectorAngleRad = angle1 + angleRad / 2
  // Normalizar a 0 a 2*PI
  if (bisectorAngleRad < 0) bisectorAngleRad += 2 * Math.PI
  if (bisectorAngleRad > 2 * Math.PI) bisectorAngleRad -= 2 * Math.PI

  return {
    internal: internalAngleDegrees,
    external: externalAngleDegrees,
    startAngle: startAngleDegrees, // en grados
    bisectorAngleRad: bisectorAngleRad, // en radianes
  }
}

export default function AnglesLayer({ angles, points, mode, deleteElement }) {
  const handleAngleClick = (angleId, e) => {
    if (e) {
      e.cancelBubble = true
    }

    if (mode === "delete") {
      deleteElement("angle", angleId)
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

  return (
    <>
      {angles.map((angle) => {
        const [p1, p2, p3] = angle.pointIds.map((id) => points.find((p) => p.id === id))
        if (!p1 || !p2 || !p3) return null

        const angleData = calculateAngleData(p1, p2, p3)
        const displayValue = angle.displayType === "external" ? angleData.external : angleData.internal
        const arcSweepAngle = angle.displayType === "external" ? angleData.external : angleData.internal
        const baseRadius = 30 // Radio base para el arco

        // Calcular la posición del texto
        let textRadius = baseRadius + 15 // Distancia base del texto desde el vértice
        if (angle.displayType === "external") {
          textRadius += 25 // Mover el texto del ángulo externo un poco más lejos
        }

        const textX = p2.x + Math.cos(angleData.bisectorAngleRad) * textRadius
        const textY = p2.y + Math.sin(angleData.bisectorAngleRad) * textRadius

        return (
          <React.Fragment key={angle.id}>
            {/* Líneas del ángulo */}
            <Line
              points={[p1.x, p1.y, p2.x, p2.y]}
              stroke={mode === "delete" ? "#ff6b6b" : "green"}
              strokeWidth={mode === "delete" ? 3 : 2}
              onClick={mode === "delete" ? (e) => handleAngleClick(angle.id, e) : undefined}
              onTap={mode === "delete" ? (e) => handleAngleClick(angle.id, e) : undefined}
              onMouseEnter={mode === "delete" ? handleMouseEnter : undefined}
              onMouseLeave={mode === "delete" ? handleMouseLeave : undefined}
              listening={mode === "delete"}
            />
            <Line
              points={[p3.x, p3.y, p2.x, p2.y]}
              stroke={mode === "delete" ? "#ff6b6b" : "green"}
              strokeWidth={mode === "delete" ? 3 : 2}
              onClick={mode === "delete" ? (e) => handleAngleClick(angle.id, e) : undefined}
              onTap={mode === "delete" ? (e) => handleAngleClick(angle.id, e) : undefined}
              onMouseEnter={mode === "delete" ? handleMouseEnter : undefined}
              onMouseLeave={mode === "delete" ? handleMouseLeave : undefined}
              listening={mode === "delete"}
            />

            {/* Arco del ángulo */}
            <Arc
              x={p2.x}
              y={p2.y}
              innerRadius={baseRadius - 2}
              outerRadius={baseRadius + 2}
              angle={arcSweepAngle}
              rotation={angleData.startAngle}
              fill={mode === "delete" ? "#ff6b6b" : "rgba(0, 128, 0, 0.3)"} // Color de relleno para el arco
              stroke={mode === "delete" ? "#dc3545" : "darkgreen"}
              strokeWidth={mode === "delete" ? 2 : 1}
              onClick={mode === "delete" ? (e) => handleAngleClick(angle.id, e) : undefined}
              onTap={mode === "delete" ? (e) => handleAngleClick(angle.id, e) : undefined}
              onMouseEnter={mode === "delete" ? handleMouseEnter : undefined}
              onMouseLeave={mode === "delete" ? handleMouseLeave : undefined}
              listening={mode === "delete"}
            />

            {/* Texto del ángulo */}
            <Text
              x={textX}
              y={textY}
              text={`${displayValue.toFixed(1)}°`}
              fontSize={16}
              fill={mode === "delete" ? "#ff6b6b" : "black"}
              onClick={mode === "delete" ? (e) => handleAngleClick(angle.id, e) : undefined}
              onTap={mode === "delete" ? (e) => handleAngleClick(angle.id, e) : undefined}
              onMouseEnter={mode === "delete" ? handleMouseEnter : undefined}
              onMouseLeave={mode === "delete" ? handleMouseLeave : undefined}
              listening={mode === "delete"}
              offsetX={angle.displayType === "external" ? 0 : 0} // Ajuste fino si es necesario
              offsetY={angle.displayType === "external" ? 0 : 0} // Ajuste fino si es necesario
            />
          </React.Fragment>
        )
      })}
    </>
  )
}
