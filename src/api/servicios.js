import { get, post, put, patch, del } from './cliente';

export const listarServicios = (params = {}) => get('/servicios?' + new URLSearchParams(params));
export const resumenServicios = (params = {}) => get('/servicios/resumen?' + new URLSearchParams(params));
export const obtenerServicio = (id) => get(`/servicios/${id}`);
export const crearServicio = (datos) => post('/servicios', datos);
export const actualizarServicio = (id, datos) => put(`/servicios/${id}`, datos);
export const cambiarEstadoServicio = (id, estado) => patch(`/servicios/${id}/estado`, { estado });
export const eliminarServicio = (id) => del(`/servicios/${id}`);
export const listarClientes = () => get('/clientes');

export const listarProtocolosServicio = (servicioId) => get(`/servicios/${servicioId}/protocolos`);
export const asociarProtocolosServicio = (servicioId, datos) => post(`/servicios/${servicioId}/protocolos`, datos);
export const desasociarProtocoloServicio = (servicioId, protocoloId) => del(`/servicios/${servicioId}/protocolos/${protocoloId}`);

export const listarRequerimientosServicio = (servicioId) => get(`/servicios/${servicioId}/requerimientos`);
export const crearRequerimientoServicio = (servicioId, datos) => post(`/servicios/${servicioId}/requerimientos`, datos);
export const eliminarRequerimientoServicio = (servicioId, reqId) => del(`/servicios/${servicioId}/requerimientos/${reqId}`);

export const obtenerDetalleOperativo = (servicioId) => get(`/servicios/${servicioId}/detalle-operativo`);
