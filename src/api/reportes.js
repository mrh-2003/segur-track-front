import { get, post } from './cliente';

export const listarReportes   = ()      => get('/reportes');
export const historialReportes = ()     => get('/reportes/historial');
export const generarReporte   = (datos) => post('/reportes/generar', datos);
export const descargarReporte = (id)    => get(`/reportes/${id}/descargar`);
