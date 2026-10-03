import { get, post, put, patch, del } from './cliente';

export const listarTurnos = (params = {}) => get('/turnos/semana?' + new URLSearchParams(params));
export const resumenTurnos = () => get('/turnos/resumen');
export const alertasTurnos = () => get('/turnos/alertas');
export const crearTurno = (datos) => post('/turnos', datos);
export const actualizarTurno = (id, datos) => put(`/turnos/${id}`, datos);
export const confirmarTurno = (id) => patch(`/turnos/${id}/confirmar`, {});
export const rechazarTurno = (id, motivo) => patch(`/turnos/${id}/rechazar`, { motivo });
export const reasignarTurno = (id, personalId) => patch(`/turnos/${id}/reasignar`, { personalId });
export const eliminarTurno = (id) => del(`/turnos/${id}`);
export const listarSedesTurnos = () => get('/sedes');
