import { get, post, put, patch, del } from './cliente';

export const listarPersonal     = (params = {}) => get('/personal?' + new URLSearchParams(params));
export const resumenPersonal    = ()             => get('/personal/resumen');
export const obtenerPersonal    = (id)           => get(`/personal/${id}`);
export const crearPersonal      = (datos)        => post('/personal', datos);
export const actualizarPersonal = (id, datos)    => put(`/personal/${id}`, datos);
export const cambiarEstadoPersonal = (id, estado) => patch(`/personal/${id}/estado`, { estado });
export const eliminarPersonal   = (id)           => del(`/personal/${id}`);
export const reiniciarClavePersonal = (id)        => post(`/personal/${id}/reiniciar-clave`, {});
export const listarSedes        = ()             => get('/sedes');
