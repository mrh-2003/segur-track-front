export const formatearIndicador = (valor, sufijo = '') =>
  valor === null || valor === undefined || valor === '' || !Number.isFinite(Number(valor))
    ? '—'
    : `${Number(valor).toLocaleString('es-PE', { maximumFractionDigits: 1 })}${sufijo}`;
