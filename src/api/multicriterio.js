import { get, put, post } from './cliente';

export const listarCriterios = () => get('/multicriterio/criterios');
export const actualizarPesosCriterios = (datos) =>
  put('/multicriterio/criterios', datos);
export const evaluarServicio = (servicioId, filtros = {}) =>
  post('/multicriterio/evaluar', {
    ...filtros,
    ...(servicioId ? { servicioId } : {}),
  });
export const resultadoMulticriterio = (filtros = {}) =>
  get('/multicriterio/resultado?' + new URLSearchParams(filtros));
export const obtenerIndicadoresMulticriterio = () =>
  get('/multicriterio/indicadores');
export const detalleServicioMcda = (id, filtros = {}) =>
  get(`/multicriterio/servicios/${id}?` + new URLSearchParams(filtros));

export const detalleAgenteMcda = (servicioId,personalId,filtros={}) => get(`/multicriterio/servicios/${servicioId}/agentes/${personalId}?`+new URLSearchParams(filtros));
