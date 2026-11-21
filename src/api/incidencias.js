import { get, post, put, patch, del } from './cliente';
export const listarIncidencias = (p={}) => get('/incidencias?'+new URLSearchParams(p));
export const resumenIncidencias = (p={}) => get('/incidencias/resumen?'+new URLSearchParams(p));
export const incidenciasRecientes = () => get('/incidencias/recientes');
export const recientesIncidencias = incidenciasRecientes;
export const obtenerIncidencia = id => get('/incidencias/'+id);
export const crearIncidencia = d => post('/incidencias',d);
export const actualizarIncidencia = (id,d) => put('/incidencias/'+id,d);
export const cambiarEstadoIncidencia = (id,estado,observacion,evidencias=[]) => patch(`/incidencias/${id}/estado`,{estado,observacion,evidencias});
export const registrarObservacionIncidencia = (id,observacion,evidencias=[]) => patch(`/incidencias/${id}/observacion`,{observacion,evidencias});
export const eliminarIncidencia = id => del('/incidencias/'+id);
export const listarTiposIncidencia = () => get('/tipos-incidencia');
export const responsablesIncidencia = servicioId => get('/incidencias/responsables?'+new URLSearchParams({servicioId}));
export const actuarIncidencia = (id,d) => post(`/incidencias/${id}/acciones`,d);
export const solicitarAmpliacion = (id,d) => post(`/incidencias/${id}/ampliaciones`,d);
export const decidirAmpliacion = (id,solicitudId,d) => patch(`/incidencias/${id}/ampliaciones/${solicitudId}`,d);

export const asignarResponsableIncidencia = (id,responsableId) => patch(`/incidencias/${id}/responsable`,{responsableId});
