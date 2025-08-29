import axiosInstance from "./AxiosInstance"

/**
 * Obtiene el rol y la organización del usuario desde el backend.
 * El backend usa el token de autenticación para identificar al usuario.
 * @returns {Promise<object>} Objeto con { rol, organizacionId } del usuario.
 */
export async function getUserRoleAndOrgFromBackend() {
  try {
    const response = await axiosInstance.get("/api/users/role")
    return response.data // Debería contener { rol, organizacionId }
  } catch (error) {
    console.error("Error al obtener rol y organización del usuario desde el backend:", error)
    // Puedes lanzar el error o devolver un valor por defecto/null
    throw error
  }
}
