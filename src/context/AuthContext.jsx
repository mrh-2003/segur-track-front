import { useState, useEffect } from 'react';
import { obtenerPerfil } from '../api/auth';
import { AuthContext } from './auth.context';

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(() => Boolean(localStorage.getItem('token')));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    obtenerPerfil()
      .then((u) => setUsuario(u))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setCargando(false));
  }, []);

  const iniciarSesion = (token, datos) => {
    localStorage.setItem('token', token);
    setUsuario(datos);
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}
