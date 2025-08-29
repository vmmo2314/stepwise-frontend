// PersonalRecommendations.jsx

import { useState, useEffect, useMemo } from "react"
import {
  Card,
  Button,
  Badge,
  Spinner,
  Dropdown,
  Toast,
  ToastContainer,
  Row,
  Col,
  Form,
} from "react-bootstrap"

import {
  Plus,
  X,
  Edit3,
  Save,
  Target,
  Clipboard,
  User,
  Activity,
  Settings,
  Heart,
  Stethoscope,
  Pill,
  Calendar,
  Clock,
  Check,
  Trash2,
} from "lucide-react"

import { getPersonalRecommendations, savePersonalRecommendations, getLatestPersonalRecommendations } from "../../../services/PersonalRecommendationsService"
import { useParams, useNavigate } from "react-router-dom";
import { useAuthUser } from "../../../services/CurrentAuth"; // hook que te da { uid, ... }


/**
 * Props esperadas:
 * - patientId: string
 * - analysisId: string | number (última cita)
 * - analysisTimestamp?: number | string
 * - apiRecommendations?: {
 *     planTratamiento?: Array<{ id:string; titulo:string; subtitulo?:string; descripcion?:string; icon?:string; priority?:"primary"|"success"|"warning"|"danger" }>,
 *     proximasRevisiones?: Array<{ id:string; titulo:string; subtitulo?:string; fecha?:string; hora?:string }>,
 *     objetivos?: Array<{ id:string; titulo:string; subtitulo?:string; icon?:string }>,
 *     status?: "success"|"pending"|"error",
 *     message?: string,
 *     timestamp?: number | string
 *   }
 * - onUpdateRecommendations: (patientId, analysisId, payload) => Promise<void>
 * - readOnly?: boolean
 */

const PersonalRecommendations = ({
  patientId,
  analysisId,
  analysisTimestamp,
  apiRecommendations,
  onUpdateRecommendations,
  readOnly = false,
}) => {
  // =================== Estado ===================
  const [recommendations, setRecommendations] = useState({
    planTratamiento: [],
    proximasRevisiones: [],
    objetivos: [],
    status: "success",
    message: "",
    timestamp: null,
  })
  const [editMode, setEditMode] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("treatment")
  const [showIconPicker, setShowIconPicker] = useState(null)
  const canEdit = !readOnly;
  const isReadOnly = readOnly || !editMode;
  const navigate = useNavigate();


  // feedback visual
  const [showSavedToast, setShowSavedToast] = useState(false)
  const [pulseSaved, setPulseSaved] = useState(false)

  const { patientId: pidFromRoute, analysisId: aidFromRoute } = useParams();
  
  // UID del usuario autenticado desde Redux (tu CurrentAuth expone este hook)
  const { uid: authUid } = (typeof useAuthUser === "function" ? useAuthUser() : {}) || {};

  // Resolución final de IDs:
  // 1) props del padre  → 2) params de la URL  → 3) UID logeado
  const effectivePatientId = patientId ?? pidFromRoute ?? authUid ?? null;
  const effectiveAnalysisId = analysisId ?? aidFromRoute ?? null; 
  // hay IDs resueltos?
  const hasValidIds = Boolean(effectivePatientId && effectiveAnalysisId);

  // Si NO viene analysisId, resolveremos la última cita => modo solo lectura
  const [latestAnalysisId, setLatestAnalysisId] = useState(null);
  const analysisIdToUse = effectiveAnalysisId || latestAnalysisId;

  // editable SOLO si vino analysisId explícito en URL/props
  const isEditable = !readOnly && Boolean(effectiveAnalysisId);


  // =================== Funciones ===================
  // NUEVA función para cargar datos desde la API
  const loadRecommendations = async () => {
    if (!effectivePatientId || !analysisIdToUse) return;

    setIsLoading(true);
    try {
      console.log('🔍 Cargando recomendaciones para:', { patientId: effectivePatientId, analysisId: effectiveAnalysisId });
      const response = await getPersonalRecommendations(effectivePatientId, analysisIdToUse);
      console.log('📥 Respuesta del backend:', response);

      const ts = response?.personalRecommendations?.timestamp ?? response?.timestamp ?? null;

      // --- 1) Preferir "personalRecommendations" SOLO si trae contenido real ---
      const pr = response?.personalRecommendations || {};
      const prHasContent =
        (Array.isArray(pr.planTratamiento) && pr.planTratamiento.length > 0) ||
        (Array.isArray(pr.proximasRevisiones) && pr.proximasRevisiones.length > 0) ||
        (Array.isArray(pr.objetivos) && pr.objetivos.length > 0);

      if (prHasContent) {
        setRecommendations({
          planTratamiento: pr.planTratamiento || [],
          proximasRevisiones: pr.proximasRevisiones || [],
          objetivos: pr.objetivos || [],
          status: pr.status || response?.status || "success",
          message: pr.message || response?.message || "",
          timestamp: ts,
        });
        setIsLoading(false);
        return;
      }

      // --- 2) Fallback: usar "recomendaciones" (legacy) si viene con elementos ---
      if (Array.isArray(response?.recomendaciones) && response.recomendaciones.length > 0) {
        setRecommendations({
          planTratamiento: response.recomendaciones.map((texto) => ({
            id: crypto.randomUUID(),
            titulo: texto,
            subtitulo: "",
            descripcion: "",
            icon: "Clipboard",
            priority: "primary",
          })),
          proximasRevisiones: [],
          objetivos: [],
          status: response?.status || "success",
          message: response?.message || "",
          timestamp: ts,
        });
        setIsLoading(false);
        return;
      }

      // --- 3) Sin contenido: limpiar pero conservar timestamp si vino ---
      console.log('ℹ️ Sin recomendaciones para esta cita (PR vacío y "recomendaciones" vacío)');
      setRecommendations((prev) => ({
        ...prev,
        planTratamiento: [],
        proximasRevisiones: [],
        objetivos: [],
        status: response?.status || prev.status || "success",
        message: response?.message || prev.message || "",
        timestamp: ts,
      }));
    } catch (error) {
      console.error("❌ Error loading recommendations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // =================== Effects ===================
  // Cargar recomendaciones al montar el componente
  useEffect(() => {
    console.log('🔄 useEffect disparado con (resuelto):', { patientId: effectivePatientId, analysisId: analysisIdToUse });

    // Solo cargamos si VIENE analysisId EN LA URL (modo edición).
    if (effectivePatientId && effectiveAnalysisId) {
      loadRecommendations();
    }
    // deps: si cambian los ids, re-evaluamos la condición
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectivePatientId, effectiveAnalysisId]);

  useEffect(() => {
    // ¡No vuelvas a llamar useParams aquí! (causa "Invalid hook call")
    // Usa los valores que ya obtuviste arriba:
    //   const { patientId: pidFromRoute, analysisId: aidFromRoute } = useParams();

    if (!aidFromRoute && pidFromRoute && latestAnalysisId) {
      navigate(`/Plan/${pidFromRoute}/${latestAnalysisId}`, { replace: true });
    }
  }, [pidFromRoute, aidFromRoute, latestAnalysisId, navigate]); // (useParams ya se “engancha” internamente)

  // Manejar apiRecommendations (mantener compatibilidad)
  useEffect(() => {
    if (apiRecommendations) {
      console.log('📨 Recibidas apiRecommendations:', apiRecommendations)
      setRecommendations((prev) => ({
        ...prev,
        ...apiRecommendations,
        planTratamiento: apiRecommendations.planTratamiento || [],
        proximasRevisiones: apiRecommendations.proximasRevisiones || [],
        objetivos: apiRecommendations.objetivos || [],
      }))
    }
  }, [apiRecommendations])

  useEffect(() => {
    if (!effectiveAnalysisId) {
      setEditMode(false); // sólo lectura cuando usamos "latest"
    } else {
      setEditMode(true);  // edición cuando hay analysisId específico
    }
  }, [effectiveAnalysisId]);

  // NUEVO: cuando NO hay analysisId, pedir la última cita y cargarla (solo lectura)
  useEffect(() => {
    const run = async () => {
      if (!effectivePatientId || effectiveAnalysisId) return; // si ya hay analysisId, no hacemos nada
      setIsLoading(true);
      try {
        const resp = await getLatestPersonalRecommendations(effectivePatientId);
        // resp trae { ok, patientId, analysisId, ...data }
        setLatestAnalysisId(resp.analysisId);

        // Usar la misma lógica de normalización que loadRecommendations:
        const ts = resp?.personalRecommendations?.timestamp ?? resp?.timestamp ?? null;
        const pr = resp?.personalRecommendations || {};
        const prHasContent =
          (Array.isArray(pr.planTratamiento) && pr.planTratamiento.length > 0) ||
          (Array.isArray(pr.proximasRevisiones) && pr.proximasRevisiones.length > 0) ||
          (Array.isArray(pr.objetivos) && pr.objetivos.length > 0);

        if (prHasContent) {
          setRecommendations({
            planTratamiento: pr.planTratamiento || [],
            proximasRevisiones: pr.proximasRevisiones || [],
            objetivos: pr.objetivos || [],
            status: pr.status || resp?.status || "success",
            message: pr.message || resp?.message || "",
            timestamp: ts,
          });
          return;
        }

        if (Array.isArray(resp?.recomendaciones) && resp.recomendaciones.length > 0) {
          setRecommendations({
            planTratamiento: resp.recomendaciones.map((texto) => ({
              id: crypto.randomUUID(),
              titulo: texto,
              subtitulo: "",
              descripcion: "",
              icon: "Clipboard",
              priority: "primary",
            })),
            proximasRevisiones: [],
            objetivos: [],
            status: resp?.status || "success",
            message: resp?.message || "",
            timestamp: ts,
          });
          return;
        }

        // sin contenido
        setRecommendations((prev) => ({
          ...prev,
          planTratamiento: [],
          proximasRevisiones: [],
          objetivos: [],
          status: resp?.status || prev.status || "success",
          message: resp?.message || prev.message || "",
          timestamp: ts,
        }));
      } catch (e) {
        console.error('❌ Error resolving latest analysis:', e);
      } finally {
        setIsLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectivePatientId, effectiveAnalysisId]);


  // =================== Iconos ===================
  const iconOptions = [
    { name: "Clipboard", icon: Clipboard, color: "text-primary", bg: "bg-primary bg-opacity-10" },
    { name: "Activity", icon: Activity, color: "text-success", bg: "bg-success bg-opacity-10" },
    { name: "Heart", icon: Heart, color: "text-danger", bg: "bg-danger bg-opacity-10" },
    { name: "Settings", icon: Settings, color: "text-secondary", bg: "bg-secondary bg-opacity-10" },
    { name: "User", icon: User, color: "text-info", bg: "bg-info bg-opacity-10" },
    { name: "Stethoscope", icon: Stethoscope, color: "text-warning", bg: "bg-warning bg-opacity-10" },
    { name: "Pill", icon: Pill, color: "text-pink", bg: "bg-light" },
    { name: "Target", icon: Target, color: "text-dark", bg: "bg-light" },
  ]

  const getIconData = (name) => {
    const found = iconOptions.find((o) => o.name === name)
    return found || iconOptions[0]
  }

  ////////////////////// =================== Helpers =================== //////////////////////
  const lastLabelResolved = useMemo(() => {
    const ts =
      recommendations?.timestamp ??
      apiRecommendations?.timestamp ??
      analysisTimestamp ??
      null;

    if (ts) {
      try {
        if (typeof ts === "number") {
          return new Date(ts).toLocaleString("es-MX");
        }
        if (ts?.seconds ?? ts?._seconds) {
          const s = ts.seconds ?? ts._seconds;
          return new Date(s * 1000).toLocaleString("es-MX");
        }
        const d = new Date(String(ts));
        if (!Number.isNaN(d.getTime())) return d.toLocaleString("es-MX");
      } catch { /* ignore */ }
    }

    // Fallback: parte del ID del análisis resuelto
    const anyId = effectiveAnalysisId ?? analysisIdToUse ?? null;
    return anyId ? `ID: ${String(anyId).slice(0, 10)}…` : "—";
  }, [
    recommendations?.timestamp,
    apiRecommendations?.timestamp,
    analysisTimestamp,
    effectiveAnalysisId,
    analysisIdToUse,
  ]);

  const lastLabelReady = !!lastLabelResolved && lastLabelResolved !== "—";

  const getPriorityBadge = (p) =>
    p === "success" ? "success" : p === "warning" ? "warning" : p === "danger" ? "danger" : "primary"

  const addItem = (key) => {
    const id = crypto.randomUUID()
    setRecommendations((prev) => {
      const next = { ...prev }
      if (key === "planTratamiento") {
        next.planTratamiento = [
          ...(prev.planTratamiento || []),
          { id, titulo: "", subtitulo: "", descripcion: "", icon: "Clipboard", priority: "primary" },
        ]
      } else if (key === "proximasRevisiones") {
        next.proximasRevisiones = [
          ...(prev.proximasRevisiones || []),
          { id, titulo: "", subtitulo: "", fecha: "", hora: "" },
        ]
      } else if (key === "objetivos") {
        next.objetivos = [
          ...(prev.objetivos || []),
          { id, titulo: "", subtitulo: "", icon: "Target" },
        ]
      }
      return next
    })
  }

  const updateItem = (key, id, field, value) => {
    setRecommendations((prev) => {
      const next = { ...prev }
      next[key] = (prev[key] || []).map((it) => (it.id === id ? { ...it, [field]: value } : it))
      return next
    })
  }

  const removeItem = (key, id) => {
    setRecommendations((prev) => {
      const next = { ...prev }
      next[key] = (prev[key] || []).filter((it) => it.id !== id)
      return next
    })
  }

  const handleSaveRecommendations = async () => {
    if (readOnly || !effectivePatientId || !effectiveAnalysisId) return;

    setIsUpdating(true);
    try {
      const payload = {
        ...recommendations,
        timestamp: Date.now(),
      };

      console.log('💾 Guardando recomendaciones:', { patientId: effectivePatientId, analysisId: effectiveAnalysisId, payload });

      if (onUpdateRecommendations) {
        await onUpdateRecommendations(effectivePatientId, effectiveAnalysisId, payload);
      } else {
        const result = await savePersonalRecommendations(effectivePatientId, effectiveAnalysisId, payload);
        console.log('✅ Guardado exitoso:', result);
      }

      setRecommendations(prev => ({ ...prev, timestamp: payload.timestamp }));

      setPulseSaved(true);
      setShowSavedToast(true);
      setTimeout(() => setPulseSaved(false), 1100);
    } catch (err) {
      console.error("❌ Error updating recommendations:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  // =================== Subcomponentes ===================
  const IconPicker = ({ currentIcon, onSelect, onClose }) => {
    // Estado local para controlar la animación fade-in
    const [show, setShow] = useState(false);

    useEffect(() => {
      // Activa la clase 'show' después de montar el componente
      const timer = setTimeout(() => setShow(true), 10);
      return () => clearTimeout(timer);
    }, []);

    // Al cerrar, primero remueve la clase 'show' y luego ejecuta onClose
    const handleClose = () => {
      setShow(false);
      setTimeout(onClose, 200); // 200ms coincide con el fade de Bootstrap
    };

    return (
      <div
        className={`position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center fade${show ? " show" : ""}`}
        style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050, transition: "opacity 0.2s" }}
        tabIndex={-1}
        onClick={handleClose}
      >
        <div 
          className="bg-white rounded-3 shadow-lg mx-3 my-3 w-100 position-relative"
          style={{ maxWidth: "600px", maxHeight: "80vh" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con botón de cerrar */}
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
            <h6 className="mb-0 fw-semibold">Selecciona un icono</h6>
            <Button variant="outline-secondary" size="sm" onClick={handleClose} className="p-1">
              <X size={18} />
            </Button>
          </div>

          {/* Contenido scrolleable */}
          <div className="p-3" style={{ maxHeight: "calc(80vh - 120px)", overflowY: "auto" }}>
            <div className="row g-2">
              {iconOptions.map((opt) => {
                const ActiveIcon = opt.icon;
                const active = currentIcon === opt.name;
                return (
                  <div key={opt.name} className="col-6 col-sm-4 col-md-3">
                    <Button
                      variant={active ? "primary" : "light"}
                      className="w-100 d-flex flex-column align-items-center justify-content-center p-2 border"
                      style={{ minHeight: "80px" }}
                      onClick={() => {
                        onSelect(opt.name);
                        handleClose();
                      }}
                    >
                      <ActiveIcon size={24} className="mb-1" />
                      <small className="text-truncate w-100 text-center" title={opt.name}>
                        {opt.name}
                      </small>
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =================== UI ===================
  const hasRecommendations =
    (recommendations.planTratamiento || []).length > 0 ||
    (recommendations.proximasRevisiones || []).length > 0 ||
    (recommendations.objetivos || []).length > 0

  if (isLoading) {
    return (
      <div className="px-4 py-4">
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <p className="text-muted mb-0">Cargando recomendaciones...</p>
          </Card.Body>
        </Card>
      </div>
    )
  }

  // Loading vacío + crear
  if (!hasRecommendations && !editMode) {
    return (
      <div className="px-4 py-4">
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center">
            {isLoading ? (
              <>
                <Spinner animation="border" variant="primary" className="mb-3" />
                <p className="text-muted mb-0">Cargando recomendaciones…</p>
              </>
            ) : (
              <>
                <p className="text-muted mb-3">No hay recomendaciones aún</p>
                {isEditable ? (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setEditMode(true);
                      if ((recommendations?.planTratamiento?.length ?? 0) === 0) {
                        // si entras a editar con todo vacío, crea el primer ítem para que aparezca el formulario
                        addItem("planTratamiento");
                      }
                    }}
                    className="d-inline-flex gap-2"
                    title="Crear recomendaciones para esta cita"
                  >
                    <Plus size={16} />
                    Crear Recomendaciones
                  </Button>
                ) : (
                  <div className="small text-muted">
                    Vista de solo lectura (última cita). Selecciona una cita específica para editar.
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className={`px-4 py-4 ${pulseSaved ? "pulse-saved" : ""}`}>
      {/* Pulso “guardado” */}
      <style>{`
        @keyframes pulseSaved {
          0%   { box-shadow: 0 0 0 0 rgba(25,135,84,.55); }
          70%  { box-shadow: 0 0 0 22px rgba(25,135,84,0); }
          100% { box-shadow: 0 0 0 0 rgba(25,135,84,0); }
        }
        .pulse-saved .header-gradient { animation: pulseSaved 1.1s ease-out 1; border-radius: .75rem; }
      `}</style>

      {/* ===== Header con gradiente + Dropdown (Basic de Bootstrap) ===== */}
      <Card
        className="mb-4 border-0 header-gradient text-white position-relative overflow-visible"
        style={{ background: "linear-gradient(90deg, #4e73df, #1cc88a)" }}
      >
        <Card.Body className="p-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <div className="flex-grow-1">
            <h2 className="mb-1 fw-bold">Recomendaciones Personalizadas</h2>
            <div className="small text-white-50">
              Se guardarán para el <strong>último análisis</strong>{" "}
            </div>
          </div>

          {!readOnly && (
            <div className="d-flex align-items-center gap-2 ms-md-auto">
              <span className="small text-white-50 text-nowrap">Último análisis</span>

              <div
                className="d-flex align-items-center justify-content-end"
                style={{ minWidth: 180, height: 32 }}
              >
                {!lastLabelReady ? (
                  <span className="placeholder-glow w-100 h-100 d-inline-block">
                    <span
                      className="placeholder bg-light rounded-pill d-inline-block w-100 h-100"
                      style={{ lineHeight: "32px" }}
                    />
                  </span>
                ) : (
                  <span
                    className="badge bg-light text-dark d-inline-flex align-items-center justify-content-center gap-2 px-3 py-2 rounded-pill w-100"
                    style={{ height: 32 }}
                  >
                    <Calendar size={16} />
                    <span className="fw-semibold text-truncate">{lastLabelResolved}</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* ===== Tabs Superiores (mantener forma original) ===== */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="border-0">
          <div className="d-flex gap-2 flex-wrap">
            {[
              { id: "treatment", label: "Plan de Tratamiento", icon: Clipboard },
              { id: "follow", label: "Seguimiento", icon: Calendar },
              { id: "objectives", label: "Objetivos", icon: Target },
            ].map((tab) => {
              const IconComponent = tab.icon
              const isActive = activeTab === tab.id
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "primary" : "outline-secondary"}
                  onClick={() => setActiveTab(tab.id)}
                  className="d-inline-flex align-items-center gap-2"
                >
                  <IconComponent size={16} />
                  {tab.label}
                </Button>
              )
            })}
          </div>
        </Card.Header>

        <Card.Body className="p-4">
          {/* ===== Plan de Tratamiento ===== */}
          {activeTab === "treatment" && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <Clipboard size={18} />
                <h6 className="mb-0">Plan de Tratamiento</h6>
                <Badge bg="secondary" pill>
                  {(recommendations.planTratamiento || []).length}
                </Badge>
              </div>
              {isEditable && editMode && (
                <Button variant="outline-primary" size="sm" onClick={() => addItem("planTratamiento")} className="d-inline-flex gap-2">
                  <Plus size={16} />
                  <span className="d-none d-sm-inline">Agregar Tratamiento</span>
                  <span className="d-sm-none">Agregar</span>
                </Button>
              )}
            </div>

            {(recommendations.planTratamiento || []).length === 0 ? (
              <div className="text-center py-4">
                <Clipboard size={48} className="text-muted opacity-50 mb-3" />
                <p className="text-muted">No hay tratamientos definidos</p>
              </div>
            ) : (
              <Row className="g-3">
                {recommendations.planTratamiento.map((item) => {
                  const iconData = getIconData(item.icon)
                  const IconComponent = iconData.icon
                  return (
                    <Col md={6} key={item.id}>
                      <Card className={`h-100 border-2 border-${getPriorityBadge(item.priority)} position-relative`}>
                        <Card.Body className="pe-5">
                          <div className="d-flex align-items-start gap-2 gap-md-3">
                            {/* Bloque de Ícono (click para elegir ícono en modo edición) */}
                            <div
                              title="Cambiar icono"
                              onClick={() => editMode && setShowIconPicker(item.id)}
                              className={`rounded-3 d-flex align-items-center justify-content-center ${iconData.bg} ${iconData.color} ${editMode ? "cursor-pointer" : ""} flex-shrink-0`}
                              style={{ minWidth: 50, minHeight: 50, width: 50, height: 50 }}
                            >
                              <IconComponent size={24} />
                            </div>

                            <div className="flex-grow-1 min-w-0">
                              {editMode ? (
                                <div className="d-grid gap-2">
                                  <Form.Control
                                    type="text"
                                    value={item.titulo}
                                    placeholder="Título"
                                    onChange={(e) => updateItem("planTratamiento", item.id, "titulo", e.target.value)}
                                  />
                                  <Form.Control
                                    type="text"
                                    value={item.subtitulo}
                                    placeholder="Subtítulo"
                                    onChange={(e) => updateItem("planTratamiento", item.id, "subtitulo", e.target.value)}
                                  />
                                  <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={item.descripcion}
                                    placeholder="Descripción / instrucciones"
                                    onChange={(e) => updateItem("planTratamiento", item.id, "descripcion", e.target.value)}
                                  />
                                  <div className="d-flex flex-wrap gap-1 align-items-center">
                                    <span className="me-2 fw-semibold">Prioridad:</span>
                                    {[, "success", "warning", "danger"].map((p) => {
                                      const label =
                                        p === "success"
                                          ? "Baja"
                                          : p === "warning"
                                          ? "Media"
                                          : p === "danger"
                                          ? "Alta"
                                          : "";
                                      return (
                                        <Button
                                          key={p}
                                          size="sm"
                                          variant={item.priority === p ? p : "outline-" + p}
                                          onClick={() => updateItem("planTratamiento", item.id, "priority", p)}
                                          className="flex-fill"
                                          style={{ minWidth: "auto" }}
                                        >
                                          <span className="d-none d-sm-inline">{label}</span>
                                          <span className="d-sm-none text-uppercase">{label.charAt(0)}</span>
                                        </Button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <h6 className="mb-1 text-break">{item.titulo || <span className="text-muted">Sin título</span>}</h6>
                                  <div className="text-muted small mb-2 text-break">{item.subtitulo || "—"}</div>
                                  <div className="text-break">{item.descripcion || <em className="text-muted">Sin descripción</em>}</div>
                                </>
                              )}
                            </div>
                          </div>
                        </Card.Body>

                        {isEditable && editMode && (
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => removeItem("planTratamiento", item.id)} 
                            title="Eliminar"
                            className="position-absolute top-0 end-0 m-2 p-1 d-flex align-items-center justify-content-center"
                            style={{ width: '32px', height: '32px', minWidth: '32px' }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </Card>
                    </Col>
                  )
                })}
              </Row>
            )}
          </div>
          )}

          {/* ===== Seguimiento (Próximas Revisiones) ===== */}
          {activeTab === "follow" && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <Calendar size={18} />
                  <h6 className="mb-0">Próximas Revisiones</h6>
                  <Badge bg="secondary" pill>
                    {(recommendations.proximasRevisiones || []).length}
                  </Badge>
                </div>
                {isEditable && editMode && (
                  <Button variant="outline-primary" size="sm" onClick={() => addItem("proximasRevisiones")} className="d-inline-flex gap-2">
                    <Plus size={16} />
                    Agregar Revisión
                  </Button>
                )}
              </div>

              {(recommendations.proximasRevisiones || []).length === 0 ? (
                <div className="text-center py-4">
                  <Clock size={48} className="text-muted opacity-50 mb-3" />
                  <p className="text-muted">Sin revisiones próximas</p>
                </div>
              ) : (
                <div className="d-grid gap-3">
                  {(recommendations.proximasRevisiones || []).map((rev) => (
                    <Card key={rev.id} className="border-warning bg-warning bg-opacity-10">
                      <Card.Body>
                        <div className="d-flex align-items-center gap-3">
                          <div className="bg-warning text-white p-3 rounded-3">
                            <Clock size={24} />
                          </div>

                          <div className="flex-grow-1">
                            {editMode ? (
                              <Row className="g-2">
                                <Col md={4}>
                                  <Form.Control
                                    type="text"
                                    value={rev.titulo}
                                    placeholder="Título de la revisión"
                                    onChange={(e) => updateItem("proximasRevisiones", rev.id, "titulo", e.target.value)}
                                  />
                                </Col>
                                <Col md={4}>
                                  <Form.Control
                                    type="text"
                                    value={rev.subtitulo}
                                    placeholder="Subtítulo"
                                    onChange={(e) => updateItem("proximasRevisiones", rev.id, "subtitulo", e.target.value)}
                                  />
                                </Col>
                                <Col md={2}>
                                  <Form.Control
                                    type="date"
                                    value={rev.fecha}
                                    onChange={(e) => updateItem("proximasRevisiones", rev.id, "fecha", e.target.value)}
                                  />
                                </Col>
                                <Col md={2}>
                                  <Form.Control
                                    type="time"
                                    value={rev.hora}
                                    onChange={(e) => updateItem("proximasRevisiones", rev.id, "hora", e.target.value)}
                                  />
                                </Col>
                              </Row>
                            ) : (
                              <>
                                <h6 className="mb-1">{rev.titulo || <span className="text-muted">Sin título</span>}</h6>
                                <div className="text-muted small">{rev.subtitulo || "—"}</div>
                                <div className="small mt-1">
                                  {rev.fecha || "Fecha —"} {rev.hora ? `· ${rev.hora}` : ""}
                                </div>
                              </>
                            )}
                          </div>

                          {isEditable && editMode && (
                            <Button variant="outline-danger" onClick={() => removeItem("proximasRevisiones", rev.id)} title="Eliminar">
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== Objetivos ===== */}
          {activeTab === "objectives" && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <Target size={18} />
                  <h6 className="mb-0">Objetivos</h6>
                  <Badge bg="secondary" pill>
                    {(recommendations.objetivos || []).length}
                  </Badge>
                </div>
                {isEditable && editMode && (
                  <Button variant="outline-primary" size="sm" onClick={() => addItem("objetivos")} className="d-inline-flex gap-2">
                    <Plus size={16} />
                    Agregar Objetivo
                  </Button>
                )}
              </div>

              {(recommendations.objetivos || []).length === 0 ? (
                <div className="text-center py-4">
                  <Target size={48} className="text-muted opacity-50 mb-3" />
                  <p className="text-muted">Sin objetivos</p>
                </div>
              ) : (
                <Row className="g-3">
                  {(recommendations.objetivos || []).map((obj) => {
                    const iconData = getIconData(obj.icon)
                    const IconComponent = iconData.icon
                    return (
                      <Col md={6} key={obj.id}>
                        <Card className="h-100">
                          <Card.Body>
                            <div className="d-flex align-items-start gap-3">
                              {/* Bloque de ícono (editable) */}
                              <div
                                title="Cambiar icono"
                                onClick={() => editMode && setShowIconPicker(obj.id)}
                                className={`rounded-3 d-flex align-items-center justify-content-center ${iconData.bg} ${iconData.color} ${editMode ? "cursor-pointer" : ""}`}
                                style={{ minWidth: 60, minHeight: 60 }}
                              >
                                <IconComponent size={28} />
                              </div>

                              <div className="flex-grow-1">
                                {editMode ? (
                                  <div className="d-grid gap-2">
                                    <Form.Control
                                      type="text"
                                      value={obj.titulo}
                                      placeholder="Título del objetivo"
                                      onChange={(e) => updateItem("objetivos", obj.id, "titulo", e.target.value)}
                                    />
                                    <Form.Control
                                      type="text"
                                      value={obj.subtitulo}
                                      placeholder="Subtítulo"
                                      onChange={(e) => updateItem("objetivos", obj.id, "subtitulo", e.target.value)}
                                    />
                                  </div>
                                ) : (
                                  <>
                                    <h6 className="mb-1">{obj.titulo || <span className="text-muted">Sin título</span>}</h6>
                                    <div className="text-muted small">{obj.subtitulo || "—"}</div>
                                  </>
                                )}
                              </div>

                              {isEditable && editMode && (
                                <Button variant="outline-danger" onClick={() => removeItem("objetivos", obj.id)} title="Eliminar">
                                  <Trash2 size={16} />
                                </Button>
                              )}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    )
                  })}
                </Row>
              )}
            </div>
          )}
        </Card.Body>

        {/* Footer de acciones */}
        {isEditable && editMode && (
          <Card.Footer className="d-flex justify-content-end">
            <Button
              variant="success"
              className="d-inline-flex align-items-center gap-2"
              onClick={handleSaveRecommendations}
              disabled={isUpdating}
              title={!hasValidIds ? "Selecciona una cita válida" : "Guardar"}
            >
              {isUpdating ? <Spinner size="sm" /> : <Save size={16} />}
              {isUpdating ? "Guardando…" : "Guardar (última cita)"}
            </Button>
          </Card.Footer>
        )}
      </Card>

      {/* Toast confirmación */}
      <ToastContainer position="bottom-end" className="p-3" containerPosition="fixed">
        <Toast bg="success" onClose={() => setShowSavedToast(false)} show={showSavedToast} delay={2200} autohide>
          <Toast.Header closeButton>
            <strong className="me-auto d-flex align-items-center gap-2">
              <Check size={16} />
              Guardado
            </strong>
            <small>Última cita</small>
          </Toast.Header>
          <Toast.Body className="text-white">Recomendaciones guardadas correctamente ({lastLabelResolved}).</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Modal IconPicker (Plan de Tratamiento u Objetivos) */}
      {showIconPicker && (
        <IconPicker
          currentIcon={
            (recommendations.planTratamiento.find((i) => i.id === showIconPicker) ||
              recommendations.objetivos.find((i) => i.id === showIconPicker) ||
              { icon: "Clipboard" }
            ).icon
          }
          onSelect={(iconName) => {
            if (recommendations.planTratamiento.find((i) => i.id === showIconPicker)) {
              updateItem("planTratamiento", showIconPicker, "icon", iconName)
            } else {
              updateItem("objetivos", showIconPicker, "icon", iconName)
            }
            setShowIconPicker(null)
          }}
          onClose={() => setShowIconPicker(null)}
        />
      )}
    </div>
  )
}

export default PersonalRecommendations
