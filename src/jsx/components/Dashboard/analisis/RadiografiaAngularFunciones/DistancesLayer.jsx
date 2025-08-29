import { Line, Text } from "react-konva"
import React from "react"

function calculateDistance(a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy).toFixed(2)
}

export default function DistancesLayer({ distances, points, mode, deleteElement }) {
  const handleDistanceClick = (distanceId, e) => {
    if (e) {
      e.cancelBubble = true
    }

    if (mode === "delete") {
      deleteElement("distance", distanceId)
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
      {distances.map((dist) => {
        const [a, b] = dist.pointIds.map((id) => points.find((p) => p.id === id))
        if (!a || !b) return null

        const distValue = calculateDistance(a, b)
        const midX = (a.x + b.x) / 2
        const midY = (a.y + b.y) / 2

        return (
          <React.Fragment key={dist.id}>
            <Line
              points={[a.x, a.y, b.x, b.y]}
              stroke={mode === "delete" ? "#ff6b6b" : "orange"}
              strokeWidth={mode === "delete" ? 3 : 2}
              dash={[4, 4]}
              onClick={mode === "delete" ? (e) => handleDistanceClick(dist.id, e) : undefined}
              onTap={mode === "delete" ? (e) => handleDistanceClick(dist.id, e) : undefined}
              onMouseEnter={mode === "delete" ? handleMouseEnter : undefined}
              onMouseLeave={mode === "delete" ? handleMouseLeave : undefined}
              listening={mode === "delete"}
            />
            <Text
              x={midX + 10}
              y={midY - 10}
              text={`Dist: ${distValue}px`}
              fontSize={16}
              fill={mode === "delete" ? "#ff6b6b" : "orange"}
              onClick={mode === "delete" ? (e) => handleDistanceClick(dist.id, e) : undefined}
              onTap={mode === "delete" ? (e) => handleDistanceClick(dist.id, e) : undefined}
              onMouseEnter={mode === "delete" ? handleMouseEnter : undefined}
              onMouseLeave={mode === "delete" ? handleMouseLeave : undefined}
              listening={mode === "delete"}
            />
          </React.Fragment>
        )
      })}
    </>
  )
}
