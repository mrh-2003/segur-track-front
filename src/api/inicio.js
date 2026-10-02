import { get } from './cliente';

export const resumenInicio          = ()  => get('/inicio/resumen');
export const actividadOperativa     = ()  => get('/inicio/actividad-operativa');
export const actividadReciente      = ()  => get('/inicio/actividad-reciente');
