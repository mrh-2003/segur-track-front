export function formatearFecha(fechaStr) {
  if (!fechaStr) return '—';
  const str = String(fechaStr).trim();
  const partesIso = str.slice(0, 10).split('-');
  if (partesIso.length === 3 && partesIso[0].length === 4) {
    const [y, m, d] = partesIso;
    return `${d}/${m}/${y}`;
  }
  const f = new Date(fechaStr);
  if (isNaN(f.getTime())) return str;
  const d = String(f.getDate()).padStart(2, '0');
  const m = String(f.getMonth() + 1).padStart(2, '0');
  const y = f.getFullYear();
  return `${d}/${m}/${y}`;
}

export function formatearFechaHora(fechaStr) {
  if (!fechaStr) return '—';
  const f = new Date(fechaStr);
  if (isNaN(f.getTime())) return fechaStr;
  const d = String(f.getDate()).padStart(2, '0');
  const m = String(f.getMonth() + 1).padStart(2, '0');
  const y = f.getFullYear();
  const hh = String(f.getHours()).padStart(2, '0');
  const mm = String(f.getMinutes()).padStart(2, '0');
  return `${d}/${m}/${y} ${hh}:${mm}`;
}

export function obtenerTimestampDescarga() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dia = pad(d.getDate());
  const mes = pad(d.getMonth() + 1);
  const anio = d.getFullYear();
  const hora = pad(d.getHours());
  const min = pad(d.getMinutes());
  const seg = pad(d.getSeconds());
  return `${dia}-${mes}-${anio}_${hora}-${min}-${seg}`;
}
