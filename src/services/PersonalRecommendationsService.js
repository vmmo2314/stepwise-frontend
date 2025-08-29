// src/services/PersonalRecommendationsService.js
import axiosInstance from "./AxiosInstance"

/**
 * GET: Recomendaciones personales por CITA
 * @returns {Promise<{
 *  ok: boolean,
 *  patientId: string,
 *  analysisId: string,
 *  path: string,
 *  recomendaciones?: string[],
 *  status?: string,
 *  timestamp?: string|number,
 *  recomendacionesDetalle?: any[],
 *  personalRecommendations?: {
 *    planTratamiento: any[],
 *    proximasRevisiones: any[],
 *    objetivos: any[],
 *    status: string,
 *    message: string,
 *    timestamp: string|number
 *  }
 * }>}
 */
export async function getPersonalRecommendations(patientId, analysisId) {
  const url = `/api/analyses/${encodeURIComponent(patientId)}/${encodeURIComponent(
    analysisId
  )}/recommendations`
  const { data } = await axiosInstance.get(url)
  return data
}

/**
 * PUT: Guarda/actualiza recomendaciones personales por CITA
 * - Envía bloque completo `personalRecommendations`
 * - Mantiene compatibilidad rellenando `recomendaciones` (array de strings)
 */
export async function savePersonalRecommendations(patientId, analysisId, personalRecommendations) {
  const url = `/api/analyses/${encodeURIComponent(patientId)}/${encodeURIComponent(
    analysisId
  )}/recommendations`

  // Compatibilidad con tu backend: derivamos 'recomendaciones' (strings) del planTratamiento
  const legacy =
    Array.isArray(personalRecommendations?.planTratamiento)
      ? personalRecommendations.planTratamiento
          .map((it) => it?.titulo || it?.descripcion || it?.subtitulo || it?.texto)
          .filter(Boolean)
      : []

  const payload = {
    personalRecommendations,
    recomendaciones: legacy,
    status: personalRecommendations?.status ?? "success",
    timestamp:
      typeof personalRecommendations?.timestamp === "number" ||
      typeof personalRecommendations?.timestamp === "string"
        ? personalRecommendations.timestamp
        : new Date().toISOString(),
  }

  const { data } = await axiosInstance.put(url, payload)
  return data
}

/**
 * PATCH (opcional): actualización parcial
 */
export async function patchPersonalRecommendations(patientId, analysisId, partial) {
  const url = `/api/analyses/${encodeURIComponent(patientId)}/${encodeURIComponent(
    analysisId
  )}/recommendations`
  const { data } = await axiosInstance.patch(url, partial)
  return data
}

// NUEVO: obtener recomendaciones de la ÚLTIMA cita (solo lectura)
export async function getLatestPersonalRecommendations(patientId) {
  const url = `/api/analyses/${encodeURIComponent(patientId)}/latest/recommendations`;
  const { data } = await axiosInstance.get(url);
  return data;
}