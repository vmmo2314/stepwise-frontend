// useAuthUser.js (sin cambios, ya que es un hook de React/Redux)
import { useSelector } from 'react-redux';

export const useAuthUser = () => {
  const auth = useSelector(state => state.auth.auth);
  const organizacionId = auth?.organizacionId;
  const uid = auth?.localId;
  const email = auth?.email;
  const rol = auth?.rol;
  const nombre = auth?.nombre;

  return { organizacionId, uid, email, rol, nombre};
};