import { get, post, put, del } from './cliente';

export const listarProtocolos = (params = {}) => get('/protocolos?' + new URLSearchParams(params));
export const obtenerProtocolo = (id) => get(`/protocolos/${id}`);
export const crearProtocolo = (datos) => post('/protocolos', datos);
export const actualizarProtocolo = (id, datos) => put(`/protocolos/${id}`, datos);
export const eliminarProtocolo = (id) => del(`/protocolos/${id}`);
