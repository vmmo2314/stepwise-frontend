"use client"

import { lazy, Suspense, useEffect, useState } from "react"
import { connect, useDispatch } from "react-redux"
import { Route, Routes, useLocation, useNavigate } from "react-router-dom"

// Tus componentes y estilos
import Index from "./jsx/index"
import "./assets/css/style.css"

// Importa el nuevo servicio y las acciones de Redux
import { onAuthChange } from "./services/AuthService"
import { loginConfirmedAction, Logout } from "./store/actions/AuthActions"
import { isAuthenticated } from "./store/selectors/AuthSelectors"

// Importa la función para obtener el rol y la organización desde el backend
import { getUserRoleAndOrgFromBackend } from "./services/userServiceFrontend"

// --- Componentes Lazy ---
const SignUp = lazy(() => import("./jsx/pages/Registration"))
const Login = lazy(() => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(import("./jsx/pages/Login")), 500)
  })
})

// --- Componente App ---
function App(props) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setIsLoadingAuth(true)
      setAuthError(null)

      if (user) {
        const token = await user.getIdToken()

        dispatch(
          loginConfirmedAction({
            idToken: token,
            localId: user.uid,
            email: user.email,
            rol: null,
            organizacionId: null,
          }),
        )

        try {
          const roleInfo = await getUserRoleAndOrgFromBackend()

          if (!roleInfo?.rol) {
            console.warn("El usuario no tiene rol asignado en el backend. Cerrando sesión.")
            setAuthError("Tu cuenta no tiene un rol asignado. Contacta al administrador.")
            dispatch(Logout(navigate))
            return
          }

          dispatch(
            loginConfirmedAction({
              idToken: token,
              localId: user.uid,
              email: user.email,
              rol: roleInfo.rol,
              organizacionId: roleInfo.organizacionId,
            }),
          )
        } catch (error) {
          console.error("Error al obtener rol/organización desde el backend:", error)
          setAuthError("Error al cargar la información del usuario. Por favor, intenta de nuevo.")
          dispatch(Logout(navigate))
        } finally {
          setIsLoadingAuth(false)
        }
      } else {
        setIsLoadingAuth(false)
        if (location.pathname !== "/login" && location.pathname !== "/page-register") {
          // No es necesario despachar Logout aquí de nuevo.
        }
      }
    })

    return () => unsubscribe()
  }, [dispatch, navigate, location.pathname])

  // Las rutas de autenticación ahora se definen con Suspense para cada componente lazy
  const authRoutes = (
    <Routes>
      <Route
        path="/login"
        element={
          <Suspense
            fallback={
              <div id="preloader">
                <div className="sk-three-bounce">
                  <div className="sk-child sk-bounce1"></div>
                  <div className="sk-child sk-bounce2"></div>
                  <div className="sk-child sk-bounce3"></div>
                </div>
              </div>
            }
          >
            <Login />
          </Suspense>
        }
      />
      <Route
        path="/page-register"
        element={
          <Suspense
            fallback={
              <div id="preloader">
                <div className="sk-three-bounce">
                  <div className="sk-child sk-bounce1"></div>
                  <div className="sk-child sk-bounce2"></div>
                  <div className="sk-child sk-bounce3"></div>
                </div>
              </div>
            }
          >
            <SignUp />
          </Suspense>
        }
      />
      {/* Ruta por defecto que redirige a login */}
      <Route path="*" element={<Login />} />
    </Routes>
  )

  if (isLoadingAuth) {
    return (
      <div id="preloader">
        <div className="sk-three-bounce">
          <div className="sk-child sk-bounce1"></div>
          <div className="sk-child sk-bounce2"></div>
          <div className="sk-child sk-bounce3"></div>
        </div>
        <p style={{ textAlign: "center", marginTop: "20px", color: "#fff" }}>Cargando sesión...</p>
      </div>
    )
  }

  if (authError) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "#f8d7da",
          color: "#721c24",
          padding: "20px",
          borderRadius: "8px",
          margin: "20px",
          textAlign: "center",
        }}
      >
        <h2>Error de Autenticación</h2>
        <p>{authError}</p>
        <button
          onClick={() => dispatch(Logout(navigate))}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Volver al Login
        </button>
      </div>
    )
  }

  if (props.isAuthenticated) {
    return (
      <Suspense
        fallback={
          <div id="preloader">
            <div className="sk-three-bounce">
              <div className="sk-child sk-bounce1"></div>
              <div className="sk-child sk-bounce2"></div>
              <div className="sk-child sk-bounce3"></div>
            </div>
          </div>
        }
      >
        <Index />
      </Suspense>
    )
  } else {
    return (
      <div className="vh-100">
        {authRoutes}
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    isAuthenticated: isAuthenticated(state),
  }
}

export default connect(mapStateToProps)(App)
