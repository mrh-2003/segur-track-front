import { get, post, put, del } from './cliente';

export const listarClientes = (params = {}) => {
  const q = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  ).toString();
  return get(`/clientes${q ? `?${q}` : ''}`);
};

export const resumenClientes = () => get('/clientes/resumen');
export const obtenerCliente = (id) => get(`/clientes/${id}`);
export const crearCliente = (datos) => post('/clientes', datos);
export const actualizarCliente = (id, datos) => put(`/clientes/${id}`, datos);
export const eliminarCliente = (id) => del(`/clientes/${id}`);
