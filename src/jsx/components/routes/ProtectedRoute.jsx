import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

// rolesPermitidos: array de roles válidos para esa ruta
const ProtectedRoute = ({ children, rolesPermitidos }) => {
  const auth = useSelector((state) => state.auth.auth);

  if (!auth.rol) {
    // aún no se ha cargado el rol, muestra loading
    return <p>Cargando...</p>;
  }

  if (!rolesPermitidos.includes(auth.rol)) {
    // Redireccionar si no tiene permiso
    return <Navigate to="/page-error-403" replace />;
  }

  return children;
};

export default ProtectedRoute;
