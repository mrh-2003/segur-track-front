import './Badge.css';

const VARIANTES = {
  activo:        'exito',
  inactivo:      'neutro',
  en_curso:      'primario',
  programado:    'advertencia',
  finalizado:    'neutro',
  abierta:       'peligro',
  en_atencion:   'advertencia',
  cerrada:       'exito',
  alta:          'peligro',
  media:         'advertencia',
  baja:          'exito',
  completado:    'exito',
  procesando:    'primario',
  error:         'peligro',
  confirmado:    'exito',
  sin_confirmar: 'advertencia',
  cumplido:      'exito',
  pendiente:     'peligro',
};

const ETIQUETAS = {
  en_curso:      'En curso',
  programado:    'Programado',
  finalizado:    'Finalizado',
  abierta:       'Abierta',
  en_atencion:   'En atención',
  cerrada:       'Cerrada',
  alta:          'Alta',
  media:         'Media',
  baja:          'Baja',
  completado:    'Completado',
  procesando:    'Procesando',
  confirmado:    'Confirmado',
  sin_confirmar: 'Sin confirmar',
  cumplido:      'Cumplido',
  pendiente:     'Pendiente',
};

export function Badge({ valor, variante, children }) {
  const v = variante || VARIANTES[valor] || 'neutro';
  const etiqueta = children || ETIQUETAS[valor] || valor;
  return <span className={`badge badge-${v}`}>{etiqueta}</span>;
}
