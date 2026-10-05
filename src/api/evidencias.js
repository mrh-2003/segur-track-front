import { get, post, patch, del } from './cliente';

export const listarEvidencias = (params = {}) => get('/evidencias?' + new URLSearchParams(params));
export const obtenerEvidencia = (id) => get(`/evidencias/${id}`);
export const crearEvidencia = (datos) => post('/evidencias', datos);
export const revisarEvidencia = (id, datos) => patch(`/evidencias/${id}/revisar`, datos);
export const eliminarEvidencia = (id) => del(`/evidencias/${id}`);
