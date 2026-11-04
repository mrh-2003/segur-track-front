import { get, post, patch, del, descargarArchivo } from './cliente';
export const catalogosOperativos = () => get('/operaciones/catalogos');
export const opcionesTurno = (p = {}) => get('/operaciones/opciones-turno?' + new URLSearchParams(p));
export const responsablesOperativos = () => get('/operaciones/responsables');
export const personalDisponible = (p = {}) =>
  get('/operaciones/disponibles?' + new URLSearchParams(p));
export const historialTurno = (id) =>
  get(`/operaciones/turnos/${id}/historial`);
export const registrarAsistencia = (id, d) =>
  patch(`/operaciones/turnos/${id}/asistencia`, d);
export const listarAusencias = () => get('/operaciones/ausencias');
export const crearAusencia = (d) => post('/operaciones/ausencias', d);
export const eliminarAusencia = (id) => del(`/operaciones/ausencias/${id}`);
export const prepararImportacion = (d) => post('/importaciones/preparar', d);
export const confirmarImportacion = (id) =>
  post(`/importaciones/${id}/confirmar`, {});
export const descargarPlantilla = () =>
  descargarArchivo('/importaciones/plantilla', 'Plantilla_tareaje.xlsx');

export const turnosServicio = (id) =>
  get(`/operaciones/servicios/${id}/turnos`);
