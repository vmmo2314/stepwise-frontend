// src/services/AnalysisService.js
import axiosInstance from './AxiosInstance';

const unwrap = (res) => res?.data;

const wrapError = (error) => {
  throw {
    message: error?.response?.data?.error || error?.message || 'Request error',
    status: error?.response?.status || 500,
  };
};

export const saveAnalysis = async (patientId, analysisData) => {
  try {
    const res = await axiosInstance.post(`/api/analyses/${patientId}`, analysisData);
    return unwrap(res);
  } catch (error) {
    console.error('Error en AnalysisService.saveAnalysis:', error);
    wrapError(error);
  }
};

export const getAnalyses = async (patientId, { limit } = {}) => {
  try {
    const res = await axiosInstance.get(`/api/analyses/${patientId}`, { params: { limit } });
    return unwrap(res) || [];
  } catch (error) {
    console.error('Error en AnalysisService.getAnalyses:', error);
    wrapError(error);
  }
};

export const getLatestAnalysis = async (patientId) => {
  try {
    const res = await axiosInstance.get(`/api/analyses/${patientId}/latest`);
    return unwrap(res);
  } catch (error) {
    console.error('Error en AnalysisService.getLatestAnalysis:', error);
    wrapError(error);
  }
};

export const getAnalysisById = async (patientId, analysisId) => {
  try {
    const res = await axiosInstance.get(`/api/analyses/${patientId}/${analysisId}`);
    return unwrap(res);
  } catch (error) {
    console.error('Error en AnalysisService.getAnalysisById:', error);
    wrapError(error);
  }
};

export const updateAnalysis = async (patientId, analysisId, partial) => {
  try {
    const res = await axiosInstance.put(`/api/analyses/${patientId}/${analysisId}`, partial);
    return unwrap(res);
  } catch (error) {
    console.error('Error en AnalysisService.updateAnalysis:', error);
    wrapError(error);
  }
};

export const deleteAnalysis = async (patientId, analysisId) => {
  try {
    const res = await axiosInstance.delete(`/api/analyses/${patientId}/${analysisId}`);
    return unwrap(res);
  } catch (error) {
    console.error('Error en AnalysisService.deleteAnalysis:', error);
    wrapError(error);
  }
};
