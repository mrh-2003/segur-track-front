import { get, post, put, patch, del } from './cliente';

export const listarServicios     = (params = {}) => get('/servicios?' + new URLSearchParams(params));
export const resumenServicios    = ()             => get('/servicios/resumen');
export const obtenerServicio     = (id)           => get(`/servicios/${id}`);
export const crearServicio       = (datos)        => post('/servicios', datos);
export const actualizarServicio  = (id, datos)    => put(`/servicios/${id}`, datos);
export const cambiarEstadoServicio = (id, estado) => patch(`/servicios/${id}/estado`, { estado });
export const eliminarServicio    = (id)           => del(`/servicios/${id}`);
export const listarClientes      = ()             => get('/clientes');
