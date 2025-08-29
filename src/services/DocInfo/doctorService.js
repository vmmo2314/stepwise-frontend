import axiosInstance from '../AxiosInstance';

export async function getAllDoctors(organizacionId) {
    try {
        // La URL final será http://localhost:3001/api/doctors/organization/:organizacionId
        const response = await axiosInstance.get(`/api/doctors/organization/${organizacionId}`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener doctores:", error);
        throw error;
    }
}

export async function getDoctorById(organizacionId, doctorUid) {
    try {
        // La URL final será http://localhost:3001/api/doctors/organization/:organizacionId/doctor/:doctorUid
        const response = await axiosInstance.get(`/api/doctors/organization/${organizacionId}/doctor/${doctorUid}`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener doctor por ID:", error);
        throw error;
    }
}

export const getDoctorsByOrg = async (organizacionId) => {
  try {
    const { data } = await axiosInstance.get(`/api/doctors/organization/${organizacionId}`)
    return data
  } catch (error) {
    console.error("DoctorService.getDoctorsByOrg:", error)
    throw error.response?.data?.error || error.message
  }
}