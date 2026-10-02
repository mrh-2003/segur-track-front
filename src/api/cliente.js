const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

class ErrorApi extends Error {
  constructor(mensaje, codigo, errores = []) {
    super(mensaje);
    this.codigo = codigo;
    this.errores = errores;
  }
}

async function solicitar(ruta, opciones = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...opciones.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${ruta}`, { ...opciones, headers });

  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new ErrorApi('Sesión expirada', 401);
  }

  const datos = await res.json();

  if (!datos.ok) {
    throw new ErrorApi(datos.mensaje || 'Error del servidor', res.status, datos.errores || []);
  }

  return datos.datos;
}

export const get    = (ruta)          => solicitar(ruta);
export const post   = (ruta, cuerpo)  => solicitar(ruta, { method: 'POST',   body: JSON.stringify(cuerpo) });
export const put    = (ruta, cuerpo)  => solicitar(ruta, { method: 'PUT',    body: JSON.stringify(cuerpo) });
export const patch  = (ruta, cuerpo)  => solicitar(ruta, { method: 'PATCH',  body: JSON.stringify(cuerpo) });
export const del    = (ruta)          => solicitar(ruta, { method: 'DELETE' });
export { ErrorApi };
