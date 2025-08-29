import axios from "axios"
import { store } from "../store/store" // Asegúrate de que esta ruta sea correcta

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
})

axiosInstance.interceptors.request.use(
  async (config) => {
    const state = store.getState()
    const idToken = state.auth.auth.idToken // Accede al idToken desde el estado de Redux

    if (idToken) {
      config.headers.Authorization = `Bearer ${idToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

export default axiosInstance
