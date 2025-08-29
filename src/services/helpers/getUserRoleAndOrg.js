// services/userService.js (en el frontend, renombrado para evitar confusión)
import axiosInstance from '../AxiosInstance';

export async function getUserRoleAndOrgFromBackend() {
    try {
        const response = await axiosInstance.get('/api/users/role');
        return response.data;
    } catch (error) {
        console.error("Error al obtener rol y organización del usuario desde el backend:", error);
        throw error;
    }
}