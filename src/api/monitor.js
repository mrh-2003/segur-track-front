import { get } from './cliente';

export const historialIndicadores = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/monitor/historial?${q}`);
};

export const indicadoresPorServicio = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/monitor/por-servicio?${q}`);
};
