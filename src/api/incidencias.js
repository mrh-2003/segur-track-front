import { get, post, put, patch, del } from './cliente';

export const listarIncidencias     = (params = {}) => get('/incidencias?' + new URLSearchParams(params));
export const resumenIncidencias    = ()             => get('/incidencias/resumen');
export const incidenciasRecientes  = ()             => get('/incidencias/recientes');
export const obtenerIncidencia     = (id)           => get(`/incidencias/${id}`);
export const crearIncidencia       = (datos)        => post('/incidencias', datos);
export const actualizarIncidencia  = (id, datos)    => put(`/incidencias/${id}`, datos);
export const cambiarEstadoIncidencia = (id, estado) => patch(`/incidencias/${id}/estado`, { estado });
export const eliminarIncidencia    = (id)           => del(`/incidencias/${id}`);
export const listarTiposIncidencia = ()             => get('/tipos-incidencia');
