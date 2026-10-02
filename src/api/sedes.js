import { get, post, put, del } from './cliente';

export const listarSedes = (params = {}) => {
  const q = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  ).toString();
  return get(`/sedes${q ? `?${q}` : ''}`);
};

export const resumenSedes = () => get('/sedes/resumen');
export const obtenerSede = (id) => get(`/sedes/${id}`);
export const crearSede = (datos) => post('/sedes', datos);
export const actualizarSede = (id, datos) => put(`/sedes/${id}`, datos);
export const eliminarSede = (id) => del(`/sedes/${id}`);
