// src/jsx/components/Dashboard/PatientDetails.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  User, Calendar, Droplets, BarChart3, Weight, Ruler, Activity,
  Target, FileText, TrendingUp, Clock, MapPin, Thermometer, Zap, Eye,
  Image as ImageIcon, X as CloseIcon, ZoomIn, ZoomOut, RotateCcw
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line,
  ScatterChart, Scatter, ZAxis,
} from 'recharts';

import { Dropdown, Spinner, Card, Badge, Row, Col } from "react-bootstrap";

import PendingAppointments from "../AppsMenu/Calendar/PendingAppointments";

import { useAuthUser } from '../../../services/CurrentAuth';


// Servicios (ajusta rutas si tus paths son distintos)
import { getAnalyses, getAnalysisById, getLatestAnalysis } from '../../../services/AnalysisService';
import { getPatientById } from '../../../services/patients/patientService';

// ================== Helpers ==================
const showDash = (v) => (v === null || v === undefined || v === '' ? '—' : v);

const predictionToText = (n) =>
  n === 2 ? 'Pie plano' : n === 1 ? 'Pie normal' : n === 3 ? 'Pie cavo' : '—';

const toDateObj = (ts) => {
  if (!ts) return null;
  if (typeof ts === 'object' && (ts.seconds || ts._seconds)) {
    const s = ts.seconds ?? ts._seconds;
    return new Date(s * 1000);
  }
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
};

const fmtDateTimeMX = (tsLike) => {
  const d = toDateObj(tsLike);
  if (!d) return '—';
  try {
    return d.toLocaleString('es-MX', {
      timeZone: 'America/Mexico_City',
      year: '2-digit', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const HH = String(d.getHours()).padStart(2, '0');
    const MM = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${String(yyyy).slice(-2)}, ${HH}:${MM}`;
  }
};

const asArray = (v) => {
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
};

const pick = (obj, keys, fallback = undefined) => {
  for (const k of keys) {
    const v = k.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return fallback;
};

const buildAnalysisLabel = (doc) => {
  const d =
    toDateObj(doc?.createdAt) ||
    toDateObj(doc?.creadoEn) ||
    toDateObj(doc?.timestamp) ||
    toDateObj(doc?.footPressure?.timestamp) ||
    toDateObj(doc?.posture?.timestamp);
  return d ? fmtDateTimeMX(d) : 'Análisis';
};

const avg = (arr) => {
  const v = (arr || []).map((x) => Number(x?.value ?? x)).filter((n) => Number.isFinite(n));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
};

const lastVal = (arr) => {
  const v = (arr || []).map((x) => Number(x?.value ?? x)).filter((n) => Number.isFinite(n));
  return v.length ? v[v.length - 1] : null;
};

const movingAvg = (series, k = 3) => {
  if (!Array.isArray(series)) return [];
  const res = [];
  for (let i = 0; i < series.length; i++) {
    const start = Math.max(0, i - (k - 1));
    const slice = series.slice(start, i + 1).map(p => p.v).filter(Number.isFinite);
    const m = slice.length ? slice.reduce((a,b)=>a+b,0) / slice.length : null;
    res.push({ ...series[i], m });
  }
  return res;
};

// ================== Componente ==================
const MedicalRecordSystem = () => {
  const [activeTab, setActiveTab] = useState('general');

// Resolver patient/analysis SIN URL
const { state } = useLocation();
const navigate = useNavigate();

// ⚡ Trae el usuario autenticado (uid y rol)
const { uid, rol } = useAuthUser(); // uid == auth.localId, rol del usuario

const statePatientId = state?.patientId ?? null;
const stateAnalysisId = state?.analysisId ?? null;

const storedPatientId =
  sessionStorage.getItem('currentPatientId') || localStorage.getItem('currentPatientId');
const storedAnalysisId =
  sessionStorage.getItem('currentAnalysisId') || localStorage.getItem('currentAnalysisId');

// ✅ Fallback: si no viene patientId de navegación ni de storage,
// y el usuario logeado ES PACIENTE, usa su propio uid como patientId
const patientIdInit =
  statePatientId
  || storedPatientId
  || (rol === 'patient' && uid ? uid : null);

const analysisIdInit = stateAnalysisId || storedAnalysisId || null;

// Guarda en sesión si acabamos de resolver por uid del paciente
useEffect(() => {
  if (!statePatientId && !storedPatientId && rol === 'patient' && uid) {
    sessionStorage.setItem('currentPatientId', uid);
  }
}, [statePatientId, storedPatientId, rol, uid]);

  useEffect(() => {
    if (statePatientId) sessionStorage.setItem('currentPatientId', statePatientId);
    if (stateAnalysisId) sessionStorage.setItem('currentAnalysisId', stateAnalysisId);
  }, [statePatientId, stateAnalysisId]);

  // 🔄 Sincroniza patientId cuando haya cambios en auth o storages
  useEffect(() => {
    // si resolvimos un nuevo candidate y es distinto al que está en estado, lo aplicamos
    const candidate =
      statePatientId ||
      storedPatientId ||
      ((rol === 'patient' || rol === 'paciente') && uid ? uid : null);

    if (candidate && candidate !== patientId) {
      setPatientId(candidate);
      sessionStorage.setItem('currentPatientId', candidate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statePatientId, storedPatientId, uid, rol]);

  const mightResolveWithAuth = (rol === 'patient' || rol === 'paciente') && !!uid;


  // Estados base
  const [patientId, setPatientId] = useState(patientIdInit);
  const [selectedId, setSelectedId] = useState(analysisIdInit || null);
  const [analyses, setAnalyses] = useState([]); // [{id, label}]
  const [loadingList, setLoadingList] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal de imagen (guard) con ZOOM
  const [modal, setModal] = useState({ open: false, src: '', title: '' });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });

  const openImageModal = (src, title = 'Imagen') => {
    setModal({ open: true, src, title });
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };
  const closeImageModal = () => {
    setModal({ open: false, src: '', title: '' });
  };
  const onWheelZoom = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((z) => Math.min(4, Math.max(1, +(z + delta).toFixed(2))));
  };
  const beginPan = (e) => {
    if (zoom === 1) return;
    setIsPanning(true);
    setStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const doPan = (e) => {
    if (!isPanning) return;
    setOffset({ x: e.clientX - start.x, y: e.clientY - start.y });
  };
  const endPan = () => setIsPanning(false);
  const zoomIn = () => setZoom((z) => Math.min(4, +(z + 0.2).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(1, +(z - 0.2).toFixed(2)));
  const resetZoom = () => { setZoom(1); setOffset({ x: 0, y: 0 }); };

  // Bloquear scroll fondo cuando modal abierto
  useEffect(() => {
    if (!modal.open) return;
    const { style } = document.body;
    const prevOverflow = style.overflow;
    const prevOB = style.overscrollBehavior;
    style.overflow = 'hidden';
    style.overscrollBehavior = 'contain';
    return () => {
      style.overflow = prevOverflow;
      style.overscrollBehavior = prevOB;
    };
  }, [modal.open]);

  // Crudos
  const [rawPatientDoc, setRawPatientDoc] = useState(null);
  const [rawAnalysisDoc, setRawAnalysisDoc] = useState(null);

  // Datos mostrados (tu estilo)
  const [patientData, setPatientData] = useState({
    nombre: '—',
    fecha_registro: '—',
    doctor_asignado: { nombre: '—' }, // por ahora deja UID si llega
    datos_personales: {
      edad: '—',
      sexo: '—',
      tipo_sangre: '—',
      peso_kg: '—',
      estatura_cm: '—',
      IMC: '—',
      info_contacto: { telefono: '—', direccion: '—', correo: '—' },
    },
    diagnostico_principal: '—',
    condiciones_asociadas: [],
    analisis_medicos: {
      tipo_pisada: '—',
      analisis_rodilla: { estado: '—' },
      bioimpedancia: { impedancia: '—', gsr: '—' },
    },
  });

  const [studies, setStudies] = useState([]);

  // ------- Lista de análisis -------
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!patientId) return;
      try {
        setLoadingList(true);
        const list = await getAnalyses(patientId, { limit: 10 });
        if (!alive) return;

        const mapped = (list || []).map((doc) => ({
          id: doc.id,
          label: buildAnalysisLabel(doc),
        }));
        setAnalyses(mapped);

        if (!selectedId && mapped[0]?.id) {
          setSelectedId(mapped[0].id);
          sessionStorage.setItem('currentAnalysisId', mapped[0].id);
        }
      } catch (e) {
        console.warn('No se pudo cargar lista de análisis:', e?.message || e);
      } finally {
        setLoadingList(false);
      }
    })();
    return () => { alive = false; };
  }, [patientId, selectedId]);

  // ------- Cargar paciente + análisis seleccionado -------
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!patientId) return;
      try {
        setLoading(true);
        setError(null);

        const [patientDoc, analysisDoc0] = await Promise.all([
          getPatientById(patientId).catch(() => null),
          (async () => {
            if (selectedId) {
              const one = await getAnalysisById(patientId, selectedId).catch(() => null);
              if (one) return one;
              const latest = await getLatestAnalysis(patientId);
              if (latest?.id) {
                setSelectedId(latest.id);
                sessionStorage.setItem('currentAnalysisId', latest.id);
              }
              return latest;
            }
            return await getLatestAnalysis(patientId);
          })(),
        ]);

        if (!alive) return;
        if (!analysisDoc0) throw new Error('No hay análisis disponibles');

        setRawPatientDoc(patientDoc);
        setRawAnalysisDoc(analysisDoc0);

        // Datos del paciente
        const dp = patientDoc?.datos_personales || {};
        const condiciones = asArray(patientDoc?.condiciones_asociadas);

        const nombrePaciente =
          pick({ ...(analysisDoc0 || {}), ...(patientDoc || {}) }, ['patientName', 'nombre'], '—');

        const createdAny =
          toDateObj(patientDoc?.creadoEn) ||
          toDateObj(patientDoc?.createdAt) ||
          toDateObj(analysisDoc0?.createdAt) ||
          toDateObj(analysisDoc0?.creadoEn) ||
          toDateObj(analysisDoc0?.timestamp) ||
          toDateObj(analysisDoc0?.footPressure?.timestamp) ||
          toDateObj(analysisDoc0?.posture?.timestamp);

        const tipo_pisada_txt = predictionToText(analysisDoc0?.footPressure?.prediction);
        const estado_rodilla = analysisDoc0?.posture?.deformity || '—';

        const diagPrincipal =
          pick(patientDoc || {}, ['diagnostico_principal'], null) ||
          pick(analysisDoc0 || {}, ['diagnostico_principal'], null) ||
          [tipo_pisada_txt, estado_rodilla].filter(Boolean).join(' + ') ||
          '—';

        const doctorDisplay =
          pick(analysisDoc0 || {}, ['doctorUid', 'doctor_uid', 'doctor']) ||
          pick(patientDoc || {}, ['doctorUid', 'doctor_uid', 'doctor']) ||
          pick(patientDoc || {}, ['doctor_asignado.nombre', 'doctor_nombre']) ||
          pick(analysisDoc0 || {}, ['doctorNombre']) ||
          '—';

        setPatientData((prev) => ({
          ...prev,
          nombre: nombrePaciente,
          fecha_registro: createdAny ? fmtDateTimeMX(createdAny) : prev.fecha_registro,
          diagnostico_principal: diagPrincipal,
          doctor_asignado: { nombre: doctorDisplay },

          datos_personales: {
            ...prev.datos_personales,
            IMC:         pick(dp, ['IMC', 'imc'], prev.datos_personales.IMC),
            edad:        pick(dp, ['edad'], prev.datos_personales.edad),
            estatura_cm: pick(dp, ['estatura_cm', 'estatura', 'estaturaCm'], prev.datos_personales.estatura_cm),
            peso_kg:     pick(dp, ['peso_kg', 'peso', 'pesoKg'], prev.datos_personales.peso_kg),
            sexo:        pick(dp, ['sexo'], prev.datos_personales.sexo),
            tipo_sangre: pick(dp, ['tipo_sangre', 'tipoSangre'], prev.datos_personales.tipo_sangre),
            info_contacto: {
              ...prev.datos_personales.info_contacto,
              telefono:  pick(dp, ['telefono', 'info_contacto.telefono'], prev.datos_personales.info_contacto.telefono),
              direccion: pick(dp, ['direccion', 'info_contacto.direccion'], prev.datos_personales.info_contacto.direccion),
              correo:    pick(dp, ['correo', 'info_contacto.correo'], prev.datos_personales.info_contacto.correo),
            },
          },

          analisis_medicos: {
            ...prev.analisis_medicos,
            tipo_pisada: tipo_pisada_txt || prev.analisis_medicos.tipo_pisada,
            analisis_rodilla: { ...prev.analisis_medicos.analisis_rodilla, estado: estado_rodilla || prev.analisis_medicos.analisis_rodilla.estado },
            bioimpedancia: {
              ...prev.analisis_medicos.bioimpedancia,
              impedancia:
                Array.isArray(analysisDoc0?.galvanic?.resistance) &&
                analysisDoc0.galvanic.resistance[0] &&
                analysisDoc0.galvanic.resistance[0].value !== undefined
                  ? Math.round(analysisDoc0.galvanic.resistance[0].value)
                  : prev.analisis_medicos.bioimpedancia.impedancia,
              gsr:
                Array.isArray(analysisDoc0?.galvanic?.us) &&
                analysisDoc0.galvanic.us[0] &&
                analysisDoc0.galvanic.us[0].value !== undefined
                  ? Number(analysisDoc0.galvanic.us[0].value).toFixed(1)
                  : analysisDoc0?.galvanic?.usPromedio
                  ? Number(analysisDoc0.galvanic.usPromedio).toFixed(1)
                  : prev.analisis_medicos.bioimpedancia.gsr,
            },
          },
          condiciones_asociadas: condiciones.length ? condiciones : prev.condiciones_asociadas,
        }));

        // ---- Estudios ----
        const s = [];

        // === Radiografía ===
        if (analysisDoc0?.radiography) {
          const rx = analysisDoc0.radiography;

          // Totales: preferimos longitudes si existen; si no, metadata.totalElements
          const totals = rx?.metadata?.totalElements || {};

          const rawAngles        = Array.isArray(rx.angles)        ? rx.angles.length        : totals.angles;
          const rawDistances     = Array.isArray(rx.distances)     ? rx.distances.length     : totals.distances;
          const rawPoints        = Array.isArray(rx.points)        ? rx.points.length        : totals.points;
          const rawSegments      = Array.isArray(rx.segments)      ? rx.segments.length      : totals.segments;
          const rawInfLines      = Array.isArray(rx.infiniteLines) ? rx.infiniteLines.length : totals.infiniteLines;
          const rawCircles       = Array.isArray(rx.circles)       ? rx.circles.length       : totals.circles;
          const rawRightAngleRef = Array.isArray(rx.rightAngleRefs)? rx.rightAngleRefs.length: totals.rightAngleRefs;
          const rawTexts         = Array.isArray(rx.texts)         ? rx.texts.length         : totals.texts;

          // Mostrar "—" si 0/undefined/null
          const totalAngles        = rawAngles        > 0 ? rawAngles        : null;
          const totalDistances     = rawDistances     > 0 ? rawDistances     : null;
          const totalPoints        = rawPoints        > 0 ? rawPoints        : null;
          const totalSegments      = rawSegments      > 0 ? rawSegments      : null;
          const totalInfiniteLines = rawInfLines      > 0 ? rawInfLines      : null;
          const totalCircles       = rawCircles       > 0 ? rawCircles       : null;
          const totalRightAngleRef = rawRightAngleRef > 0 ? rawRightAngleRef : null;
          const totalTexts         = rawTexts         > 0 ? rawTexts         : null;

          // Primeros valores si existen
          const angle1 =
            Array.isArray(rx?.angles) &&
            rx.angles[0] &&
            rx.angles[0].value !== undefined
              ? rx.angles[0].value
              : null;

          const dist1 =
            Array.isArray(rx?.distances) &&
            rx.distances[0] &&
            rx.distances[0].value !== undefined
              ? rx.distances[0].value
              : null;

          const img = rx?.metadata?.cloudinaryUrl || null;

          s.push({
            id: 'rx',
            tipo: 'Análisis Radiográfico Angular Completo',
            fecha: rx?.metadata?.exportDate ? fmtDateTimeMX(rx.metadata.exportDate) : '—',
            doctor: doctorDisplay,
            resultados: {
              angle1, dist1,
              totalAngles, totalDistances, totalPoints,
              totalSegments, totalInfiniteLines, totalCircles,
              totalRightAngleRef, totalTexts,
            },
            observaciones:
              `Elementos: puntos ${showDash(totalPoints)}, ángulos ${showDash(totalAngles)}, ` +
              `distancias ${showDash(totalDistances)}, segmentos ${showDash(totalSegments)}, ` +
              `líneas infinitas ${showDash(totalInfiniteLines)}, círculos ${showDash(totalCircles)}, ` +
              `refs 90° ${showDash(totalRightAngleRef)}, textos ${showDash(totalTexts)}`,
            img,
            canPreview: !!img,
          });
        }

        // === Bioimpedancia / GSR ===
        if (analysisDoc0?.galvanic) {
          const g = analysisDoc0.galvanic;
          const impedancia =
            Array.isArray(g?.resistance) && g.resistance[0] && g.resistance[0].value !== undefined
              ? Math.round(g.resistance[0].value)
              : undefined;
          const gsr =
            Array.isArray(g?.us) && g.us[0] && g.us[0].value !== undefined
              ? Number(g.us[0].value).toFixed(1)
              : g?.usPromedio
              ? Number(g.usPromedio).toFixed(1)
              : undefined;

          s.push({
            id: 'bio',
            tipo: 'Bioimpedancia Eléctrica y GSR',
            fecha: g?.timestamp ? fmtDateTimeMX(g.timestamp) : '—',
            doctor: doctorDisplay,
            resultados: {
              impedancia,
              gsr, // conductividad
              usActual: g?.usActual ?? null,
              usPromedio: g?.usPromedio ?? null,
              usMaximo: g?.usMaximo ?? null,
              resistenciaProm: avg(g?.resistance),
              voltajeProm: avg(g?.voltage),
            },
            observaciones: 'Valores medidos por el módulo GSR.',
            canPreview: false,
          });
        }

        // === Presión plantar ===
        if (analysisDoc0?.footPressure) {
          const fp = analysisDoc0.footPressure;
          s.push({
            id: 'fp',
            tipo: 'Análisis de Presión Plantar',
            fecha: fp?.timestamp ? fmtDateTimeMX(fp.timestamp) : '—',
            doctor: doctorDisplay,
            resultados: {
              prediccion: predictionToText(fp?.prediction),
              indiceArco: fp?.indiceArco,
              antepie: fp?.distribucionPeso?.antepie,
              mediopie: fp?.distribucionPeso?.mediopie,
              retropie: fp?.distribucionPeso?.retropie,
            },
            observaciones:
              Array.isArray(fp?.recomendaciones) && fp.recomendaciones.length > 0
                ? fp.recomendaciones.join(' · ')
                : fp?.message || '—',
            canPreview: false,
          });
        }

        // === Postura ===
        if (analysisDoc0?.posture) {
          const p = analysisDoc0.posture;
          const img = p?.cloudinary_url || null;
          s.push({
            id: 'posture',
            tipo: 'Análisis de Postura',
            fecha: p?.timestamp ? fmtDateTimeMX(p.timestamp) : '—',
            doctor: doctorDisplay,
            resultados: {
              deformidad: p?.deformity,
              cadera: p?.hip_distance,
              rodilla: p?.knee_distance,
              tobillo: p?.ankle_distance,
              angulo_rodilla_izq: p?.left_knee_angle,
              angulo_rodilla_der: p?.right_knee_angle,
            },
            observaciones: p?.deformity ? `Deformidad: ${p.deformity}` : '—',
            img,
            canPreview: !!img,
          });
        }

        setStudies(s);
      } catch (e) {
        console.error(e);
        setError(e?.message || 'Error cargando expediente');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [patientId, selectedId]);

  // ============== Datos para gráficas ==============
  const fpFeaturesPairs = useMemo(() => {
    const feats = rawAnalysisDoc?.footPressure?.features;
    if (!Array.isArray(feats) || feats.length < 14) return [];
    const out = [];
    for (let i = 0; i < 7; i++) {
      out.push({
        label: `S${i + 1}/S${i + 8}`,
        left: Number(feats[i]) || 0,
        right: Number(feats[i + 7]) || 0,
      });
    }
    return out;
  }, [rawAnalysisDoc?.footPressure?.features]);

  const radarPressureData = useMemo(() => {
    const d = rawAnalysisDoc?.footPressure?.distribucionPeso || {};
    return [
      { eje: 'Antepié', valor: Number(d.antepie ?? 0) },
      { eje: 'Mediopié', valor: Number(d.mediopie ?? 0) },
      { eje: 'Retropié', valor: Number(d.retropie ?? 0) },
    ];
  }, [rawAnalysisDoc?.footPressure?.distribucionPeso]);

  const galvanicSeries = useMemo(() => {
    const g = rawAnalysisDoc?.galvanic || {};
    const map = (arr) => (arr || [])
      .map((p) => ({
        t: toDateObj(p.timestamp),
        label: toDateObj(p.timestamp)
          ? toDateObj(p.timestamp).toLocaleTimeString('es-MX', { hour12: false })
          : String(p.timestamp ?? ''),
        v: Number(p.value),
      }))
      .filter((p) => Number.isFinite(p.v));
    const us = map(g.us);
    const resistance = map(g.resistance);
    const voltage = map(g.voltage);
    return {
      us,
      resistance,
      voltage,
      usMA: movingAvg(us, 3),
      resistanceMA: movingAvg(resistance, 3),
      voltageMA: movingAvg(voltage, 3),
      scatterUV: us.map((p, i) => ({ x: p.v, y: voltage[i]?.v ?? null, label: p.label })).filter(d => Number.isFinite(d.x) && Number.isFinite(d.y)),
      usActual: g.usActual ?? lastVal(us)?.v ?? null,
      usPromedio: g.usPromedio ?? (us.length ? Number((us.reduce((a,b)=>a+b.v,0)/us.length).toFixed(2)) : null),
      usMaximo: g.usMaximo ?? (us.length ? Math.max(...us.map(p=>p.v)) : null),
    };
  }, [rawAnalysisDoc?.galvanic]);

  // Selector label
  const selectedAnalysisLabel = useMemo(() => {
    const found = analyses.find((a) => a.id === (selectedId || ''));
    return found?.label || 'Último';
  }, [analyses, selectedId]);

  // ================== Secciones ==================
  const renderGeneralTab = () => (
    <Row className="g-4">
      {/* Columna izquierda */}
      <Col>
        <div className="d-flex flex-column h-100">
          {/* Info paciente */}
          <Card className="mb-4 flex-grow-1" style={{ overflow: "hidden" }}>
            <Card.Body className="p-3 d-flex flex-column">
              <div className="d-flex align-items-center mb-3 flex-wrap">
                <div className="me-3 mb-2 mb-md-0">
                  <div
                    className="rounded-circle bg-secondary d-flex align-items-center justify-content-center"
                    style={{ width: "80px", height: "80px", minWidth: "80px" }}
                  >
                    <User size={40} className="text-white" />
                  </div>
                </div>
                <div className="flex-grow-1 min-width-0">
                  <h4 className="mb-1">{patientData.nombre}</h4>
                  <div className="d-flex flex-wrap gap-2 mb-2">
                    <small className="text-muted">{patientData.fecha_registro}</small>
                  </div>
                  <div className="d-flex flex-wrap gap-1">
                    <Badge bg="primary">
                      <User size={12} className="me-1" />
                      {patientData.datos_personales.sexo}
                    </Badge>
                    <Badge bg="success">
                      <Calendar size={12} className="me-1" />
                      {patientData.datos_personales.edad}a
                    </Badge>
                    <Badge bg="danger">
                      <Droplets size={12} className="me-1" />
                      {patientData.datos_personales.tipo_sangre}
                    </Badge>
                    <Badge bg="warning" text="dark">
                      <BarChart3 size={12} className="me-1" />
                      IMC {patientData.datos_personales.IMC}
                    </Badge>
                    <Badge bg="info">
                      <Weight size={12} className="me-1" />
                      {patientData.datos_personales.peso_kg}kg
                    </Badge>
                    <Badge bg="secondary">
                      <Ruler size={12} className="me-1" />
                      {patientData.datos_personales.estatura_cm}cm
                    </Badge>
                  </div>
                </div>
              </div>

              <Row className="gx-2 gy-2 flex-grow-1" style={{ minWidth: 0 }}>
                <Col md={6}>
                  <div className="d-flex align-items-center p-2 bg-light border rounded h-200">
                    <Activity size={20} className="text-success me-2 flex-shrink-0" />
                    <div className="min-width-0">
                      <h6 className="mb-0 fs-6">Tipo de Pisada</h6>
                      <small className="text-muted">
                        {patientData.analisis_medicos.tipo_pisada}
                      </small>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-center border bg-light rounded p-2 h-200">
                    <Target size={20} className="text-primary me-2 flex-shrink-0" />
                    <div className="min-width-0">
                      <h6 className="mb-0 fs-6">Análisis de Rodilla</h6>
                      <small className="text-muted d-block">
                        {patientData.analisis_medicos.analisis_rodilla.estado}
                      </small>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Diagnóstico principal */}
          <Card>
            <Card.Header className="py-2">
              <h6 className="mb-0">Diagnóstico Principal</h6>
            </Card.Header>
            <Card.Body className="p-3 d-flex flex-column">
              <div className="alert alert-warning py-2 mb-3 flex-shrink-0">
                <h6 className="alert-heading d-flex align-items-center mb-2">
                  <Eye size={18} className="me-2" />
                  <span className="fs-6">{patientData.diagnostico_principal}</span>
                </h6>
              </div>

              <div className="flex-grow-1 d-flex flex-column justify-content-center">
                <h6 className="mb-2">Condiciones Asociadas:</h6>
                <div className="d-flex flex-wrap gap-1">
                  {patientData.condiciones_asociadas.length === 0 && (
                    <Badge bg="secondary">—</Badge>
                  )}
                  {patientData.condiciones_asociadas.map((cond, i) => (
                    <Badge key={i} bg="secondary">
                      {cond}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </Col>

      {/* Columna derecha */}
      <Col xl={4}>
        <div className="d-flex flex-column">
          {/* Parámetros biomecánicos */}
          <Card className="mb-3">
            <Card.Header className="py-2">
              <h6 className="mb-0">Parámetros Biomecánicos</h6>
            </Card.Header>
            <Card.Body className="p-3 d-flex flex-column gap-2">
              <Row className="g-2">
                <Col xs={6}>
                  <div className="text-center p-2 bg-light rounded d-flex flex-column justify-content-center">
                    <div className="fs-6 text-primary fw-bold">
                      {showDash(patientData.analisis_medicos.bioimpedancia.impedancia)}
                      {patientData.analisis_medicos.bioimpedancia.impedancia !== "—" ? "Ω" : ""}
                    </div>
                    <small className="text-muted">Impedancia</small>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="text-center p-2 bg-light rounded d-flex flex-column justify-content-center">
                    <div className="fs-6 text-success fw-bold">
                      {showDash(patientData.analisis_medicos.bioimpedancia.gsr)}
                      {patientData.analisis_medicos.bioimpedancia.gsr !== "—" ? "μS" : ""}
                    </div>
                    <small className="text-muted">Conductividad</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Doctor asignado */}
          <Card className="shadow-sm">
            <Card.Header className="py-2 text-center">
              <h6 className="mb-0 text-primary">Doctor Asignado</h6>
            </Card.Header>
            <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center p-4">
              <div
                className="mb-3 d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: "70px",
                  height: "70px",
                  background: "linear-gradient(135deg, #3f87a6, #ebf8e1)",
                }}
              >
                <User size={34} className="text-white" />
              </div>
              <h6 className="mb-1">{patientData.doctor_asignado.nombre}</h6>
            </Card.Body>
          </Card>
        </div>
      </Col>
    </Row>
  );

  const renderStudiesTab = () => (
    <>
      <div className="row">
        {studies.map((study) => (
          <div key={study.id} className="col-lg-6 mb-4">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h6 className="mb-0">{study.tipo}</h6>
                <span className="badge bg-primary">{study.fecha || '—'}</span>
              </div>
              <div className="card-body">
                <p className="text-muted mb-3">Dr. {study.doctor}</p>

                {/* Radiografía */}
                {study.id === 'rx' && (
                  <div className="mt-2">
                    <div className="text-center p-2 bg-light rounded">
                      <small className="text-muted d-block mb-2">Mediciones y elementos</small>

                      {/* 8 contadores + primeros valores */}
                      <div className="row g-2">
                        <div className="col-6 col-md-3">
                          <div className="text-center p-2 bg-white rounded border">
                            <small className="text-muted d-block">Puntos</small>
                            <strong>{showDash(study.resultados?.totalPoints)}</strong>
                          </div>
                        </div>

                        <div className="col-6 col-md-3">
                          <div className="text-center p-2 bg-white rounded border">
                            <small className="text-muted d-block">Ángulos</small>
                            <strong>{showDash(study.resultados?.totalAngles)}</strong>
                            {study.resultados?.angle1 != null && (
                              <div className="small text-muted">#1: {study.resultados.angle1}°</div>
                            )}
                          </div>
                        </div>

                        <div className="col-6 col-md-3">
                          <div className="text-center p-2 bg-white rounded border">
                            <small className="text-muted d-block">Distancias</small>
                            <strong>{showDash(study.resultados?.totalDistances)}</strong>
                            {study.resultados?.dist1 != null && (
                              <div className="small text-muted">#1: {study.resultados.dist1}</div>
                            )}
                          </div>
                        </div>

                        <div className="col-6 col-md-3">
                          <div className="text-center p-2 bg-white rounded border">
                            <small className="text-muted d-block">Segmentos</small>
                            <strong>{showDash(study.resultados?.totalSegments)}</strong>
                          </div>
                        </div>

                        <div className="col-6 col-md-3">
                          <div className="text-center p-2 bg-white rounded border">
                            <small className="text-muted d-block">Líneas infinitas</small>
                            <strong>{showDash(study.resultados?.totalInfiniteLines)}</strong>
                          </div>
                        </div>

                        <div className="col-6 col-md-3">
                          <div className="text-center p-2 bg-white rounded border">
                            <small className="text-muted d-block">Círculos</small>
                            <strong>{showDash(study.resultados?.totalCircles)}</strong>
                          </div>
                        </div>

                        <div className="col-6 col-md-3">
                          <div className="text-center p-2 bg-white rounded border">
                            <small className="text-muted d-block">Refs 90°</small>
                            <strong>{showDash(study.resultados?.totalRightAngleRef)}</strong>
                          </div>
                        </div>

                        <div className="col-6 col-md-3">
                          <div className="text-center p-2 bg-white rounded border">
                            <small className="text-muted d-block">Textos</small>
                            <strong>{showDash(study.resultados?.totalTexts)}</strong>
                          </div>
                        </div>
                      </div>

                      {study.canPreview && (
                        <div className="mt-3">
                          <button
                            className="btn btn-light btn-sm d-inline-flex align-items-center"
                            onClick={() => openImageModal(study.img, 'Radiografía')}
                          >
                            <ImageIcon size={16} className="me-2" />
                            Ver imagen
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bioimpedancia / GSR */}
                {study.id === 'bio' && (
                  <>
                    <div className="row g-2">
                      <div className="col-6">
                        <div className="text-center p-2 bg-light rounded">
                          <small className="text-muted d-block">Impedancia</small>
                          <strong>
                            {showDash(study.resultados?.impedancia)}
                            {study.resultados?.impedancia != null ? 'Ω' : ''}
                          </strong>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="text-center p-2 bg-light rounded">
                          <small className="text-muted d-block">Conductividad</small>
                          <strong>
                            {showDash(study.resultados?.gsr)}
                            {study.resultados?.gsr != null ? 'μS' : ''}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Extras GSR */}
                    <div className="row g-2 mt-2">
                      <div className="col-4">
                        <div className="text-center p-2 bg-white rounded border">
                          <small className="text-muted d-block">μS Actual</small>
                          <strong>{showDash(study.resultados?.usActual)}</strong>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="text-center p-2 bg-white rounded border">
                          <small className="text-muted d-block">μS Prom.</small>
                          <strong>{showDash(study.resultados?.usPromedio)}</strong>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="text-center p-2 bg-white rounded border">
                          <small className="text-muted d-block">μS Máx.</small>
                          <strong>{showDash(study.resultados?.usMaximo)}</strong>
                        </div>
                      </div>

                      <div className="col-6">
                        <div className="text-center p-2 bg-white rounded border">
                          <small className="text-muted d-block">Resistencia Prom.</small>
                          <strong>
                            {study.resultados?.resistenciaProm != null
                              ? Math.round(study.resultados.resistenciaProm)
                              : '—'}{study.resultados?.resistenciaProm != null ? 'Ω' : ''}
                          </strong>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="text-center p-2 bg-white rounded border">
                          <small className="text-muted d-block">Voltaje Prom.</small>
                          <strong>
                            {study.resultados?.voltajeProm != null
                              ? Number(study.resultados.voltajeProm).toFixed(2)
                              : '—'}{study.resultados?.voltajeProm != null ? ' V' : ''}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Presión plantar */}
                {study.id === 'fp' && (
                  <div className="row g-2">
                    <div className="col-6">
                      <div className="text-center p-2 bg-light rounded">
                        <small className="text-muted d-block">Índice de arco</small>
                        <strong>{showDash(study.resultados?.indiceArco)}</strong>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center p-2 bg-light rounded">
                        <small className="text-muted d-block">Clasificación</small>
                        <strong>{showDash(study.resultados?.prediccion)}</strong>
                      </div>
                    </div>
                    {(study.resultados?.antepie !== undefined ||
                      study.resultados?.mediopie !== undefined ||
                      study.resultados?.retropie !== undefined) && (
                      <div className="col-12">
                        <div className="text-center p-2 bg-white rounded border">
                          <small className="text-muted d-block">Distribución</small>
                          <strong>
                            Antepié {showDash(study.resultados?.antepie)}% · Mediopié {showDash(study.resultados?.mediopie)}% · Retropié {showDash(study.resultados?.retropie)}%
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Postura */}
                {study.id === 'posture' && (
                  <>
                    <div className="row g-2">
                      <div className="col-6">
                        <div className="text-center p-2 bg-light rounded">
                          <small className="text-muted d-block">Deformidad</small>
                          <strong>{showDash(study.resultados?.deformidad)}</strong>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="text-center p-2 bg-light rounded">
                          <small className="text-muted d-block">Cadera (px)</small>
                          <strong>{showDash(study.resultados?.cadera)}</strong>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="text-center p-2 bg-light rounded">
                          <small className="text-muted d-block">Rodilla (px)</small>
                          <strong>{showDash(study.resultados?.rodilla)}</strong>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="text-center p-2 bg-light rounded">
                          <small className="text-muted d-block">Tobillo (px)</small>
                          <strong>{showDash(study.resultados?.tobillo)}</strong>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="text-center p-2 bg-light rounded">
                          <small className="text-muted d-block">Ángulo rodilla izq.</small>
                          <strong>
                            {showDash(study.resultados?.angulo_rodilla_izq)}
                            {study.resultados?.angulo_rodilla_izq != null ? '°' : ''}
                          </strong>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="text-center p-2 bg-light rounded">
                          <small className="text-muted d-block">Ángulo rodilla der.</small>
                          <strong>
                            {showDash(study.resultados?.angulo_rodilla_der)}
                            {study.resultados?.angulo_rodilla_der != null ? '°' : ''}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {study.canPreview && (
                      <div className="mt-3">
                        <button
                          className="btn btn-light btn-sm d-inline-flex align-items-center"
                          onClick={() => openImageModal(study.img, 'Postura')}
                        >
                          <ImageIcon size={16} className="me-2" />
                          Ver captura
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ====== Visualizaciones útiles ====== */}
      {(fpFeaturesPairs.length > 0 || radarPressureData.some(d => d.valor) || galvanicSeries.us.length || galvanicSeries.resistance.length || galvanicSeries.voltage.length) && (
        <div className="row">
          {fpFeaturesPairs.length > 0 && (
            <div className="col-12 mb-4">
              <div className="card">
                <div className="card-header"><h6 className="mb-0">Comparación de Sensores</h6></div>
                <div className="card-body" style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fpFeaturesPairs}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="left" name="Pie Izquierdo" fill="#60a5fa" />
                      <Bar dataKey="right" name="Pie Derecho" fill="#34d399" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {radarPressureData.some(d => d.valor) && (
            <div className="col-12 mb-4">
              <div className="card">
                <div className="card-header"><h6 className="mb-0">Distribución de Presión (Radar)</h6></div>
                <div className="card-body" style={{ height: 360 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarPressureData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="eje" />
                      <PolarRadiusAxis />
                      <Radar name="Total" dataKey="valor" stroke="#3b82f6" fill="#93c5fd" fillOpacity={0.45} />
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {galvanicSeries.us.length > 0 && (
            <div className="col-12 mb-4">
              <div className="card">
                <div className="card-header"><h6 className="mb-0">Conductividad (μS) en el tiempo</h6></div>
                <div className="card-body" style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={galvanicSeries.usMA}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="v" name="μS" stroke="#10b981" dot={false} />
                      <Line type="monotone" dataKey="m" name="Media móvil" stroke="#065f46" dot={false} strokeDasharray="4 4" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {galvanicSeries.resistance.length > 0 && (
            <div className="col-12 mb-4">
              <div className="card">
                <div className="card-header"><h6 className="mb-0">Resistencia (Ω) en el tiempo</h6></div>
                <div className="card-body" style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={galvanicSeries.resistanceMA}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="v" name="Ω" stroke="#3b82f6" dot={false} />
                      <Line type="monotone" dataKey="m" name="Media móvil" stroke="#1e40af" dot={false} strokeDasharray="4 4" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {galvanicSeries.voltage.length > 0 && (
            <div className="col-12 mb-4">
              <div className="card">
                <div className="card-header"><h6 className="mb-0">Voltaje (V) en el tiempo</h6></div>
                <div className="card-body" style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={galvanicSeries.voltageMA}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="v" name="V" stroke="#f59e0b" dot={false} />
                      <Line type="monotone" dataKey="m" name="Media móvil" stroke="#92400e" dot={false} strokeDasharray="4 4" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {galvanicSeries.scatterUV.length > 0 && (
            <div className="col-12 mb-4">
              <div className="card">
                <div className="card-header"><h6 className="mb-0">Correlación Conductividad vs Voltaje</h6></div>
                <div className="card-body" style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" dataKey="x" name="Conductividad" unit=" μS" />
                      <YAxis type="number" dataKey="y" name="Voltaje" unit=" V" />
                      <ZAxis type="number" range={[60, 60]} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Legend />
                      <Scatter name="Puntos" data={galvanicSeries.scatterUV} fill="#ef4444" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );

  const renderEvolutionTab = () => (
    <div className="row">
      <div className="col-md-6 mb-4">
        <div className="card">
          <div className="card-header"><h5>Evolución de Ángulos</h5></div>
          <div className="card-body" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="text-center text-muted">
              <TrendingUp size={32} className="mb-2" />
              <div>Panel en construcción</div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-md-6 mb-4">
        <div className="card">
          <div className="card-header"><h5>Evolución Bioimpedancia</h5></div>
          <div className="card-body" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="text-center text-muted">
              <Zap size={32} className="mb-2" />
              <div>Panel en construcción</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppointmentsTab = () => (
    <div className="">
      {/* Completo */}
      <div className="d-flex flex-column gap-4">
        <div className="card">
          <div className="card-header">
            <h2>Citas</h2>
          </div>
          <div className="card-body">
            <PendingAppointments />
          </div>
        </div>
      </div>
    </div>
  );

  // ======= Contenedor Principal =======
  if (!patientId && !mightResolveWithAuth) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-warning">
          No se pudo determinar el paciente del expediente.
          <div className="mt-2">
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/pacientes')}>
              Ir a lista de pacientes
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="p-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-muted">
              Paciente: <strong>{patientData.nombre}</strong> · Análisis: <strong>{selectedAnalysisLabel}</strong>
            </h3>
          </div>

          {/* Selector de análisis */}
        <div style={{ minWidth: 280 }}>
          <label className="form-label mb-1 small">Cambiar análisis</label>

          <Dropdown
            align="end"
            onSelect={(eventKey /* string | null */, _e) => {
              const nextId = eventKey ? String(eventKey) : "";
              setSelectedId(nextId || null);
              sessionStorage.setItem("currentAnalysisId", nextId);
            }}
          >
            <Dropdown.Toggle
              id="analysis-switcher"
              variant="outline-primary"
              className="w-100 d-flex justify-content-between align-items-center"
              disabled={!patientId || loadingList}
            >
              <span className="text-truncate">
                {selectedAnalysisLabel || "Seleccionar análisis"}
              </span>
              {loadingList && <Spinner animation="border" size="sm" className="ms-2" />}
            </Dropdown.Toggle>

            <Dropdown.Menu className="w-100" style={{ maxHeight: 320, overflowY: "auto" }}>
              {analyses.length === 0 && (
                <Dropdown.Item disabled>Sin análisis</Dropdown.Item>
              )}

              {analyses.map((a) => (
                <Dropdown.Item
                  key={a.id}
                  eventKey={a.id}
                  active={selectedId === a.id}
                  className="d-flex justify-content-between align-items-center"
                >
                  <span className="text-truncate">{a.label}</span>
                  {selectedId === a.id && (
                    <span className="badge bg-light text-muted">Actual</span>
                  )}
                </Dropdown.Item>
              ))}

              {selectedId ? (
                <>
                  <Dropdown.Divider />
                  <Dropdown.Item eventKey="">Última cita</Dropdown.Item>
                </>
              ) : null}
            </Dropdown.Menu>
          </Dropdown>

          <small className="text-muted d-block mt-1">
            Se muestran los 10 más recientes
          </small>
        </div>

        </div>

        {/* Estado */}
        {loading && <div className="alert alert-info">Cargando expediente…</div>}
        {!loading && error && <div className="alert alert-danger">Error: {error}</div>}

        {/* Tabs */}
        <div className="card mb-4">
          <div className="card-body p-0">
            <nav className="nav nav-pills nav-fill">
              <button className={`nav-link ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
                <User size={16} className="me-1" /> General
              </button>
              <button className={`nav-link ${activeTab === 'studies' ? 'active' : ''}`} onClick={() => setActiveTab('studies')}>
                <Activity size={16} className="me-1" /> Estudios
              </button>
              <button className={`nav-link ${activeTab === 'evolution' ? 'active' : ''}`} onClick={() => setActiveTab('evolution')}>
                <TrendingUp size={16} className="me-1" /> Evolución
              </button>
              <button className={`nav-link ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}>
                <Calendar size={16} className="me-1" /> Citas
              </button>
            </nav>
          </div>
        </div>

        {/* Contenido */}
        <div className="tab-content">
          {activeTab === 'general' && renderGeneralTab()}
          {activeTab === 'studies' && renderStudiesTab()}
          {activeTab === 'evolution' && renderEvolutionTab()}
          {activeTab === 'appointments' && renderAppointmentsTab()}
        </div>
      </div>

      {/* ===== Modal (Guard) imágenes con Zoom & Centrar ===== */}
      {modal.open && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ background: 'rgba(0,0,0,.75)', zIndex: 1050, overscrollBehavior: 'contain', touchAction: 'none' }}
          onWheel={(e) => { e.preventDefault(); e.stopPropagation(); }}   // bloquea scroll de fondo
          onMouseMove={doPan}
          onMouseUp={endPan}
          onMouseLeave={endPan}
        >
          <div className="d-flex flex-column align-items-center justify-content-center h-100 p-3">
            <div className="bg-white rounded shadow" style={{ maxWidth: '92vw', maxHeight: '92vh' }}>
              <div className="d-flex align-items-center justify-content-between p-2 border-bottom">
                <strong className="small">{modal.title}</strong>
                <div className="d-flex align-items-center gap-2">
                  <button className="btn btn-sm btn-outline-secondary" onClick={zoomOut} title="Zoom -">
                    <ZoomOut size={16} />
                  </button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={zoomIn} title="Zoom +">
                    <ZoomIn size={16} />
                  </button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => setOffset({ x: 0, y: 0 })} title="Centrar">
                    <Target size={16} />
                  </button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={resetZoom} title="Restablecer">
                    <RotateCcw size={16} />
                  </button>
                  <button className="btn btn-sm btn-outline-secondary d-flex align-items-center" onClick={closeImageModal}>
                    <CloseIcon size={16} className="me-1" /> Cerrar
                  </button>
                </div>
              </div>

              <div
                className="p-2 d-flex align-items-center justify-content-center"
                style={{
                  overflow: 'hidden',
                  width: 'min(88vw, 1400px)',
                  height: 'min(82vh, 900px)',
                  cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
                  background: '#111',
                }}
                onWheel={onWheelZoom}
                onMouseDown={beginPan}
                onDoubleClick={() => setZoom((z) => (z === 1 ? 2 : 1))}
              >
                <img
                  src={modal.src}
                  alt={modal.title}
                  draggable={false}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    display: 'block',
                    userSelect: 'none',
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    transformOrigin: 'center center',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MedicalRecordSystem;
