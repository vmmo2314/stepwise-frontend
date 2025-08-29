import { Text } from "react-konva"

export default function TextsLayer({ texts, setTexts, mode, deleteElement }) {
  const handleDragEnd = (e, id) => {
    const { x, y } = e.target.position()
    setTexts((prev) => prev.map((t) => (t.id === id ? { ...t, x, y } : t)))
  }

  const handleTextClick = (textId, e) => {
    if (e) {
      e.cancelBubble = true
    }

    if (mode === "delete") {
      deleteElement("text", textId)
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
      {texts.map((text) => (
        <Text
          key={text.id}
          x={text.x}
          y={text.y}
          text={text.text}
          fontSize={18}
          fill={mode === "delete" ? "#ff6b6b" : "black"}
          stroke={mode === "delete" ? "#dc3545" : undefined}
          strokeWidth={mode === "delete" ? 0.5 : 0}
          draggable={mode !== "delete"}
          onDragEnd={mode !== "delete" ? (e) => handleDragEnd(e, text.id) : undefined}
          onClick={mode === "delete" ? (e) => handleTextClick(text.id, e) : undefined}
          onTap={mode === "delete" ? (e) => handleTextClick(text.id, e) : undefined}
          onMouseEnter={mode === "delete" ? handleMouseEnter : undefined}
          onMouseLeave={mode === "delete" ? handleMouseLeave : undefined}
          scaleX={mode === "delete" ? 1.1 : 1}
          scaleY={mode === "delete" ? 1.1 : 1}
        />
      ))}
    </>
  )
}
