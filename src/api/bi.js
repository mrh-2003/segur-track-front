import { get,post,put } from './cliente';

export const indicadoresBi         = (params = {}) => get('/bi/indicadores?' + new URLSearchParams(params));
export const evolucionCumplimiento  = ()            => get('/bi/evolucion-cumplimiento');
export const incidenciasPorTipo     = ()            => get('/bi/incidencias-por-tipo');
export const desempenoPorServicio   = ()            => get('/bi/desempeno-servicios');
export const embedBi                = ()            => get('/bi/embed');

export const resumenBi=(p={})=>get('/bi/resumen?'+new URLSearchParams(p));
export const catalogosBi=()=>get('/bi/catalogos');
export const estadoBi=()=>get('/bi/estado');
export const sincronizarBi=()=>post('/bi/sincronizar',{});
export const configuracionBi=()=>get('/bi/configuracion');
export const guardarMetasBi=d=>put('/bi/metas',d);
