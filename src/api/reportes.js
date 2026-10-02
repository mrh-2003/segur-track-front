import { get, post, descargarArchivo } from './cliente';

export const listarReportes   = ()      => get('/reportes');
export const historialReportes = ()     => get('/reportes/historial');
export const generarReporte   = (datos) => post('/reportes/generar', datos);
export const descargarReporte = (id, nombreSugerido) =>
  descargarArchivo(`/reportes/${id}/descargar`, nombreSugerido);
export const descargarDirecto = (tipo, formato) =>
  descargarArchivo(`/reportes/descargar-directo?tipo=${tipo}&formato=${formato}`, `reporte_${tipo}.${formato}`);
