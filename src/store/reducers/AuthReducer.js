// Importa los tipos de acción desde el archivo centralizado ActionTypes
import {
  LOADING_TOGGLE_ACTION,
  LOGIN_CONFIRMED_ACTION,
  LOGIN_FAILED_ACTION,
  LOGOUT_ACTION,
  SIGNUP_CONFIRMED_ACTION,
  SIGNUP_FAILED_ACTION,
  CLEAR_MESSAGES,
} from "../actions/ActionTypes"

const initialState = {
  auth: {
    email: "",
    idToken: "",
    localId: "",
    expiresIn: "",
    refreshToken: "",
    rol: null,
    organizacionId: null,
  },
  errorMessage: "",
  successMessage: "",
  showLoading: false, // Asegúrate de que esto esté en false inicialmente
}

export function AuthReducer(state = initialState, action) {
  if (action.type === SIGNUP_CONFIRMED_ACTION) {
    return {
      ...state,
      auth: {
        ...state.auth,
        ...action.payload,
        rol: action.payload.rol,
        organizacionId: action.payload.organizacionId,
      },
      errorMessage: "",
      successMessage: "Signup Successfully Completed",
      showLoading: false,
    }
  }
  if (action.type === LOGIN_CONFIRMED_ACTION) {
    return {
      ...state,
      auth: {
        ...state.auth,
        ...action.payload,
        rol: action.payload.rol,
        organizacionId: action.payload.organizacionId,
      },
      errorMessage: "",
      successMessage: "Login Successfully Completed",
      showLoading: false,
    }
  }
  if (action.type === LOGOUT_ACTION) {
    return {
      ...state,
      errorMessage: "",
      successMessage: "",
      auth: {
        email: "",
        idToken: "",
        localId: "",
        expiresIn: "",
        refreshToken: "",
        rol: null,
        organizacionId: null,
      },
      showLoading: false, // *** CAMBIO CLAVE AQUÍ: Asegura que showLoading sea false al hacer logout ***
    }
  }

  if (action.type === SIGNUP_FAILED_ACTION || action.type === LOGIN_FAILED_ACTION) {
    return {
      ...state,
      errorMessage: action.payload,
      successMessage: "",
      showLoading: false,
    }
  }

  if (action.type === LOADING_TOGGLE_ACTION) {
    return {
      ...state,
      showLoading: action.payload,
    }
  }

  if (action.type === CLEAR_MESSAGES) {
    return {
      ...state,
      errorMessage: "",
      successMessage: "",
    }
  }
  return state
}

export default AuthReducer
