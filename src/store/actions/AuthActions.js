// Importa todos los tipos de acción desde el archivo centralizado
import {
  SIGNUP_CONFIRMED_ACTION,
  SIGNUP_FAILED_ACTION,
  LOGIN_CONFIRMED_ACTION,
  LOGIN_FAILED_ACTION,
  LOADING_TOGGLE_ACTION,
  LOGOUT_ACTION,
  NAVTOGGLE,
  CLEAR_MESSAGES,
} from "./ActionTypes"

import { formatError, login, signUp, logout } from "../../services/AuthService"

// Acción de registro de doctor
export function signupAction(email, password, navigate, registrationData) {
  return async (dispatch) => {
    try {
      dispatch(loadingToggleAction(true))
      await signUp(email, password, registrationData, "doctor") // No necesitamos la respuesta del backend aquí directamente

      // Intentar iniciar sesión con el usuario recién creado
      const loginResponse = await login(email, password)
      const user = loginResponse.user
      const backendData = loginResponse.backendData

      const payload = {
        idToken: await user.getIdToken(),
        localId: user.uid,
        email: user.email,
        rol: backendData.rol,
        organizacionId: backendData.organizacionId || null,
      }

      dispatch(confirmedSignupAction(payload))
      dispatch(loadingToggleAction(false))
      navigate("/dashboard")
    } catch (error) {
      dispatch(loadingToggleAction(false))
      // *** CAMBIO AQUÍ: Log más detallado para el error de login después del registro ***
      console.error("Error en signupAction (después de signUp exitoso, durante login):", error)
      const errorMessage = formatError(error)
      dispatch(signupFailedAction(errorMessage))
    }
  }
}

// Acción de cierre de sesión
export function Logout() {
  localStorage.removeItem("userDetails")
  logout() // Llama a la función logout de Firebase para cerrar sesión

  return {
    type: LOGOUT_ACTION,
  }
}

// Acción de login
export const loginAction = (email, password, navigate) => {
  return async (dispatch) => {
    try {
      dispatch(loadingToggleAction(true))
      const response = await login(email, password)
      const user = response.user
      const backendData = response.backendData

      if (!backendData?.rol) {
        dispatch(loginFailedAction("Este usuario no tiene un rol asignado."))
        dispatch(loadingToggleAction(false))
        return
      }

      dispatch(
        loginConfirmedAction({
          idToken: await user.getIdToken(),
          localId: user.uid,
          rol: backendData.rol,
          organizacionId: backendData.organizacionId || null,
          email: user.email,
        }),
      )
      dispatch(loadingToggleAction(false))
      // Redirección según el rol
      if (backendData.rol === "paciente") {
        navigate("/Panel-Paciente")
      } else {
        navigate("/dashboard")
      }
    } catch (error) {
      dispatch(loadingToggleAction(false))
      const errorMessage = formatError(error)
      dispatch(loginFailedAction(errorMessage))
    }
  }
}

// Acción para manejar el fallo del login
export function loginFailedAction(data) {
  return {
    type: LOGIN_FAILED_ACTION,
    payload: data,
  }
}

// Acción para manejar el login exitoso
export function loginConfirmedAction(data) {
  return {
    type: LOGIN_CONFIRMED_ACTION,
    payload: data,
  }
}

// Acción para manejar el registro exitoso
export function confirmedSignupAction(payload) {
  return {
    type: SIGNUP_CONFIRMED_ACTION,
    payload,
  }
}

// Acción para manejar el fallo del registro
export function signupFailedAction(message) {
  return {
    type: SIGNUP_FAILED_ACTION,
    payload: message,
  }
}

// Acción para manejar el estado de carga
export function loadingToggleAction(status) {
  return {
    type: LOADING_TOGGLE_ACTION,
    payload: status,
  }
}

// Acción para alternar el estado de navegación
export const navtoggle = () => {
  return {
    type: NAVTOGGLE,
  }
}

// Acción para limpiar mensajes
export const clearMessages = () => {
  return {
    type: CLEAR_MESSAGES,
  }
}

// Acción de registro de paciente
export function signupPatientAction(email, password, navigate, registrationData) {
  return async (dispatch) => {
    try {
      dispatch(loadingToggleAction(true))
      await signUp(email, password, registrationData, "paciente") // No necesitamos la respuesta del backend aquí directamente

      // Similar al registro de doctor, intentar iniciar sesión para obtener el idToken
      const loginResponse = await login(email, password)
      const user = loginResponse.user
      const backendData = loginResponse.backendData

      const payload = {
        idToken: await user.getIdToken(),
        localId: user.uid,
        email: user.email,
        rol: backendData.rol,
        organizacionId: backendData.organizacionId || null,
      }

      dispatch(confirmedSignupAction(payload))
      dispatch(loadingToggleAction(false))
      navigate("/dashboard")
    } catch (error) {
      dispatch(loadingToggleAction(false))
      // *** CAMBIO AQUÍ: Log más detallado para el error de login después del registro ***
      console.error("Error en signupPatientAction (después de signUp exitoso, durante login):", error)
      const errorMessage = formatError(error)
      dispatch(signupFailedAction(errorMessage))
    }
  }
}
