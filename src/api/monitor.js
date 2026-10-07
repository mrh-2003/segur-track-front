import { get } from './cliente';

export const listarMonitor = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/monitor?${q}`);
};

export const detalleMonitor = (id) => get(`/monitor/${id}/detalle`);

export const indicadoresOperativos = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/monitor/indicadores?${q}`);
};

export const historialIndicadores = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/monitor/historial?${q}`);
};

export const indicadoresPorServicio = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/monitor/por-servicio?${q}`);
};
