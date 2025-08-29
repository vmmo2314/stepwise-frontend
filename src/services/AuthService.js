import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth"
import swal from "sweetalert"
import { auth } from "./firebaseConfig"
import axiosInstance from "./AxiosInstance"

export const signUp = async (email, password, registrationData, role) => {
  try {
    let response
    if (role === "doctor") {
      response = await axiosInstance.post("/api/auth/register/doctor", { email, password, registrationData })
    } else if (role === "paciente") {
      response = await axiosInstance.post("/api/auth/register/patient", { email, password, registrationData }) // Changed 'paciente' to 'patient'
    } else {
      throw new Error("Rol de usuario no válido.")
    }
    return response.data
  } catch (error) {
    console.error("Error en AuthService.signUp (llamada al backend):", error)
    // Lanza el mensaje de error del backend o el mensaje general
    throw error.response?.data?.error || error.message
  }
}

export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const idToken = await userCredential.user.getIdToken()

    const response = await axiosInstance.post("/api/auth/login", { idToken })
    return { user: userCredential.user, backendData: response.data.user }
  } catch (error) {
    console.error("Error en AuthService.login:", error)
    // Lanza el mensaje de error del backend o el mensaje general
    throw error.response?.data?.error || error.message
  }
}

export const logout = () => {
  return signOut(auth)
}

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback)
}

export function formatError(error) {
  // Si el error es una cadena, asumimos que viene del backend
  if (typeof error === "string") {
    swal("Error", error, "error")
    return error
  }

  // Si es un objeto, asumimos que es un error de Firebase cliente
  const errorCode = error.code
  switch (errorCode) {
    case "auth/email-already-in-use":
      swal("Oops", "Ese email ya está registrado.", "error")
      break
    case "auth/user-not-found":
      swal("Oops", "Usuario no encontrado.", "error", { button: "Intenta registrarte" })
      break
    case "auth/wrong-password":
    case "auth/invalid-credential":
      swal("Oops", "Correo o contraseña incorrectos.", "error", { button: "Revisar datos" })
      break
    case "auth/user-disabled":
      swal("Oops", "Este usuario ha sido deshabilitado.", "error")
      break
    case "auth/invalid-email":
      swal("Oops", "El formato del correo no es válido.", "error")
      break
    default:
      swal("Error", "Algo salió mal. Inténtalo más tarde.", "error")
      console.error("Error no manejado de Firebase:", error)
      break
  }
  return error.message
}
