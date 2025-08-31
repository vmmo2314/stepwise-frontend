// src/components/GSR/GSR.jsx
import { useEffect, useRef, useState } from "react"
import Swal from "sweetalert2"
import { parseGsrLog, computeGsrMetrics } from "./GSR/gsrUtils"
import GSRResults from "./GSR/GSRResults"

let serialPort = null
let reader = null
let isConnecting = false

export default function GSR({ onAnalysisComplete }) {
  const [isConnected, setIsConnected] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [gsrValues, setGsrValues] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const gsrMapRef = useRef(new Map())
  const bufferRef = useRef("")

  useEffect(() => {
    return () => {
      try { reader?.cancel() } catch {}
      reader = null
      try { serialPort?.close() } catch {}
      serialPort = null
      setIsConnected(false)
    }
  }, [])

  const connectUSB = async () => {
    if (isConnecting || isConnected) return
    if (!("serial" in navigator)) {
      Swal.fire("Web Serial no disponible", "Usa Chrome/Edge en HTTPS.", "error")
      return
    }
    isConnecting = true
    try {
      if (reader) { try { await reader.cancel(); await new Promise(r=>setTimeout(r,100)) } catch {} ; reader = null }
      if (serialPort) { try { await serialPort.close(); await new Promise(r=>setTimeout(r,100)) } catch {}; serialPort = null }

      serialPort = await navigator.serial.requestPort()
      await serialPort.open({ baudRate: 115200 })

      const decoder = new TextDecoderStream()
      reader = serialPort.readable.pipeThrough(decoder).getReader()

      setIsConnected(true)
      Swal.fire({ icon: "success", title: "Conectado", text: "ESP32 conectado por USB", toast: true, position: "top-end", showConfirmButton: false, timer: 2000 })

      listenToSerial()
    } catch (err) {
      console.error("Error de conexión USB GSR:", err)
      Swal.fire("Error de conexión", err?.message || String(err), "error")
      setIsConnected(false)
    } finally {
      isConnecting = false
    }
  }

  const disconnectUSB = async () => {
    try { await reader?.cancel() } catch {}
    reader = null
    try { await serialPort?.close() } catch {}
    serialPort = null
    setIsConnected(false)
    Swal.fire({ icon: "info", title: "Desconectado", toast: true, position: "top-end", timer: 1500, showConfirmButton: false })
  }

  const listenToSerial = async () => {
    try {
      bufferRef.current = ""
      while (reader) {
        const { value, done } = await reader.read()
        if (done) break
        if (!value) continue
        bufferRef.current += value
        const lines = bufferRef.current.split("\n")
        for (let i = 0; i < lines.length - 1; i++) {
          consumeLine(lines[i].trim())
        }
        bufferRef.current = lines[lines.length - 1]
      }
    } catch (err) {
      console.warn("Lectura serial finalizada:", err)
    }
  }

  const consumeLine = (line) => {
    if (!line) return
    const { values, indices } = parseGsrLog(line)
    if (indices?.length) {
      indices.forEach((idx, i) => gsrMapRef.current.set(idx, values[i]))
      const merged = [...gsrMapRef.current.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v)
      setGsrValues(merged)
    }
    if (/FIN\s+DE\s+DATOS\s+GSR/i.test(line)) {
      Swal.fire({ icon: "success", title: "Dataset GSR recibido", text: `Muestras: ${gsrMapRef.current.size}`, timer: 1600, showConfirmButton: false })
    }
  }

  const handleAnalyze = () => {
    if (!gsrValues.length) {
      Swal.fire("Sin datos", "Conéctate y envía GSR desde el dispositivo.", "warning")
      return
    }
    setIsAnalyzing(true)
    try {
      const metrics = computeGsrMetrics(gsrValues) // ahora sólo métricas básicas
      const result = {
        timestamp: new Date().toISOString(),
        status: "success",
        samples: gsrValues.length,
        metrics,
        values: gsrValues
      }
      setAnalysis(result)
      localStorage.setItem("lastGsrAnalysis", JSON.stringify(result))
      onAnalysisComplete?.(result)
      Swal.fire({ icon: "success", title: "Listo", text: "Análisis actualizado.", timer: 1200, showConfirmButton: false })
    } catch (err) {
      console.error(err)
      Swal.fire("Error en el análisis", err?.message || String(err), "error")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetAll = () => {
    gsrMapRef.current = new Map()
    setGsrValues([])
    setAnalysis(null)
    Swal.fire({ icon: "info", title: "Limpio", toast: true, position: "top-end", timer: 900, showConfirmButton: false })
  }

  return (
    <div className="container my-4">
      <div className="row g-3">
        <div className="col-12">
          <div className={`alert ${isConnected ? "alert-success" : "alert-warning"} d-flex justify-content-between align-items-center`}>
            <span>{isConnected ? "ESP32 conectado (USB)" : "ESP32 no conectado"}</span>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-primary" onClick={connectUSB} disabled={isConnecting || isConnected}>
                {isConnecting ? "Conectando..." : "Conectar ESP32 (USB)"}
              </button>
              <button className="btn btn-sm btn-outline-secondary" onClick={disconnectUSB} disabled={!isConnected}>
                Desconectar
              </button>
              <button className="btn btn-sm btn-outline-danger" onClick={resetAll}>
                Limpiar
              </button>
              <button className="btn btn-sm btn-success" onClick={handleAnalyze} disabled={!gsrValues.length || isAnalyzing}>
                {isAnalyzing ? "Analizando..." : "Analizar"}
              </button>
            </div>
          </div>
        </div>

        {/* Gráfica + resultados minimalistas */}
        <div className="col-12">
          <GSRResults analysis={analysis} values={gsrValues} onReset={resetAll} />
        </div>
      </div>
    </div>
  )
}
