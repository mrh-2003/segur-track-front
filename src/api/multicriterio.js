import { get, put, post } from './cliente';

export const listarCriterios          = ()      => get('/multicriterio/criterios');
export const actualizarPesosCriterios = (datos) => put('/multicriterio/criterios', datos);
export const evaluarServicio          = (servicioId) => post('/multicriterio/evaluar', { servicioId });
export const resultadoMulticriterio   = ()      => get('/multicriterio/resultado');
export const detalleServicioMcda      = (id)    => get(`/multicriterio/servicios/${id}`);
