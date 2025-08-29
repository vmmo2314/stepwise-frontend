// src/services/OrganizationService.js
import axiosInstance from "../AxiosInstance"

export const getOrganizations = async () => {
  try {
    const { data } = await axiosInstance.get("/api/organizations")
    // Normaliza a { id, name } y deja passthrough de otros campos
    return (Array.isArray(data) ? data : []).map((o) => ({
      id: o.id || o.organizacionId || o.uid || o._id || "",
      name: o.nombre || o.name || "Sin nombre",
      ...o,
    }))
  } catch (error) {
    console.error("OrganizationService.getOrganizations:", error)
    throw error.response?.data?.error || error.message
  }
}