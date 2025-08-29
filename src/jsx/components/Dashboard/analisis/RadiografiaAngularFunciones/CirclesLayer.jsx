import { Circle } from "react-konva"

export default function CirclesLayer({ circles, points, mode, deleteElement }) {
  const handleCircleClick = (circleId, e) => {
    if (e) {
      e.cancelBubble = true
    }

    if (mode === "delete") {
      deleteElement("circle", circleId)
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
      {circles.map((circle) => {
        const [center, edge] = circle.pointIds.map((id) => points.find((p) => p.id === id))
        if (!center || !edge) return null

        const radius = Math.sqrt((edge.x - center.x) ** 2 + (edge.y - center.y) ** 2)

        return (
          <Circle
            key={circle.id}
            x={center.x}
            y={center.y}
            radius={radius}
            stroke={mode === "delete" ? "#ff6b6b" : "teal"}
            strokeWidth={mode === "delete" ? 3 : 2}
            dash={[6, 4]}
            listening={mode === "delete"} // Solo escucha eventos en modo delete
            onClick={mode === "delete" ? (e) => handleCircleClick(circle.id, e) : undefined}
            onTap={mode === "delete" ? (e) => handleCircleClick(circle.id, e) : undefined}
            onMouseEnter={mode === "delete" ? handleMouseEnter : undefined}
            onMouseLeave={mode === "delete" ? handleMouseLeave : undefined}
          />
        )
      })}
    </>
  )
}
