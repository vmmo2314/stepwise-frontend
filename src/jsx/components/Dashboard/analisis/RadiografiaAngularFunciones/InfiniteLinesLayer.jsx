import { Line } from "react-konva"

// Función para obtener los puntos extendidos de la línea
const getExtendedLinePoints = (point1, point2, width, height) => {
  const dx = point2.x - point1.x
  const dy = point2.y - point1.y

  if (dx === 0) {
    // Línea vertical
    return [point1.x, 0, point1.x, height]
  }

  const m = dy / dx
  const b = point1.y - m * point1.x

  const x0 = 0
  const y0 = m * x0 + b

  const x1 = width
  const y1 = m * x1 + b

  return [x0, y0, x1, y1]
}

export default function InfiniteLinesLayer({ infiniteLines, points, width, height, mode, deleteElement }) {
  const handleLineClick = (lineId, e) => {
    if (e) {
      e.cancelBubble = true
    }

    if (mode === "delete") {
      deleteElement("infiniteLine", lineId)
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
      {infiniteLines.map((line) => {
        const [p1, p2] = line.pointIds.map((id) => points.find((p) => p.id === id))
        if (!p1 || !p2) return null

        const extended = getExtendedLinePoints(p1, p2, width, height)

        return (
          <Line
            key={line.id}
            points={extended}
            stroke={mode === "delete" ? "#ff6b6b" : "orange"}
            strokeWidth={mode === "delete" ? 3 : 2}
            dash={[8, 4]}
            onClick={mode === "delete" ? (e) => handleLineClick(line.id, e) : undefined}
            onTap={mode === "delete" ? (e) => handleLineClick(line.id, e) : undefined}
            onMouseEnter={mode === "delete" ? handleMouseEnter : undefined}
            onMouseLeave={mode === "delete" ? handleMouseLeave : undefined}
            listening={mode === "delete"}
          />
        )
      })}
    </>
  )
}
