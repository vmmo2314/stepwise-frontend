// src/services/patients/patientService.js
import axiosInstance from '../AxiosInstance';

export function createPatient(patientData) {
  return axiosInstance.post(`/api/patients`, patientData);
}

export function getAllPatients() {
  return axiosInstance.get(`/api/patients`);
}

export function getAllPatientsByOrg(organizacionId) {
  return axiosInstance.get(`/api/patients/organization/${organizacionId}`);
}

export function getMyPatients() {
  return axiosInstance.get(`/api/patients/my-patients`);
}

export function deletePatient(id) {
  return axiosInstance.delete(`/api/patients/${id}`);
}

// 👇 NUEVO: usado por el expediente
export async function getPatientById(patientId) {
  if (!patientId) throw new Error('patientId requerido');
  const { data } = await axiosInstance.get(`/api/patients/${encodeURIComponent(patientId)}`);
  return data;
}
