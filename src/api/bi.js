import { get } from './cliente';

export const indicadoresBi         = (params = {}) => get('/bi/indicadores?' + new URLSearchParams(params));
export const evolucionCumplimiento  = ()            => get('/bi/evolucion-cumplimiento');
export const incidenciasPorTipo     = ()            => get('/bi/incidencias-por-tipo');
export const desempenoPorServicio   = ()            => get('/bi/desempeno-servicios');
export const embedBi                = ()            => get('/bi/embed');
