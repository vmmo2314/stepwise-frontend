import { Line } from "react-konva"

export default function SegmentsLayer({ segments, points, mode, deleteElement }) {
  const handleSegmentClick = (segmentId, e) => {
    if (e) {
      e.cancelBubble = true
    }

    if (mode === "delete") {
      deleteElement("segment", segmentId)
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
      {segments.map((segment) => {
        const [p1, p2] = segment.pointIds.map((id) => points.find((p) => p.id === id))
        if (!p1 || !p2) return null

        return (
          <Line
            key={segment.id}
            points={[p1.x, p1.y, p2.x, p2.y]}
            stroke={mode === "delete" ? "#ff6b6b" : "purple"}
            strokeWidth={mode === "delete" ? 4 : 3}
            lineCap="round"
            onClick={mode === "delete" ? (e) => handleSegmentClick(segment.id, e) : undefined}
            onTap={mode === "delete" ? (e) => handleSegmentClick(segment.id, e) : undefined}
            onMouseEnter={mode === "delete" ? handleMouseEnter : undefined}
            onMouseLeave={mode === "delete" ? handleMouseLeave : undefined}
            listening={mode === "delete"}
          />
        )
      })}
    </>
  )
}
