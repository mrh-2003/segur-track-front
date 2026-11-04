export const COLORES = ['#5684ff', '#a78bfa', '#13b99a', '#f0ad4e', '#f17983'];
export const CORTOS = [
  'Cumplimiento',
  'Puntualidad',
  'Cobertura',
  'Evidencias',
  'Atención',
];
export const porcentaje = (n) =>
  n === null || n === undefined ? '—' : `${Number(n).toFixed(1)}%`;
export const NIVEL = {
  alta: 'Prioridad alta',
  media: 'En seguimiento',
  baja: 'Bajo control',
  sin_datos: 'Por evaluar',
};
