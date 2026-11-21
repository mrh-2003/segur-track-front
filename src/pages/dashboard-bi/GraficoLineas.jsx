import { formatearFecha } from '../../utils/fechas';

const COLORES = ['#2563EB', '#16A34A', '#D97706', '#DC2626', '#7C3AED', '#0891B2'];
const ALTO = 160;
const ALTO_SVG = 180;
const ANCHO_MIN = 320;

export default function GraficoLineas({ datos, cargando, series = [{campo:'turnos_pct',nombre:'Turnos',color:COLORES[0]},{campo:'servicios_pct',nombre:'Servicios',color:COLORES[1]}] }) {
  if (cargando || !datos.length) {
    return <div style={{ height: ALTO_SVG, background: 'var(--color-fondo-alt)', borderRadius: 'var(--radio-md)', animation: 'shimmer 1.5s infinite' }} />;
  }

  const maxVal = 100;
  const ancho = Math.max(ANCHO_MIN, datos.length * 60);
  const margenIzq = 36;
  const margenDer = 36;
  const margenTop = 12;
  const margenBot = 24;
  const areaAncho = ancho - margenIzq - margenDer;
  const areaAlto = ALTO - margenTop - margenBot;

  const puntoX = (i) => margenIzq + (i / Math.max(1,datos.length - 1)) * areaAncho;
  const puntoY = (val) => margenTop + (1 - val / maxVal) * areaAlto;

  const linea = (campo, color) => {
    if (!datos.some((d) => d[campo] != null)) return null;
    const trazo = datos.map((d, i) => d[campo] == null ? '' : `${i===0 || datos[i-1][campo]==null?'M':'L'}${puntoX(i)},${puntoY(d[campo])}`).join(' ');
    return (
      <>
        <path fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" d={trazo} />
        {datos.map((d, i) => d[campo] == null ? null : (
          <circle key={i} cx={puntoX(i)} cy={puntoY(d[campo])} r="4" fill={color} />
        ))}
      </>
    );
  };

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%', maxWidth: '100%' }}>
      <svg width="100%" height="220" viewBox={`0 0 ${ancho} ${ALTO_SVG}`} preserveAspectRatio="xMidYMid meet" style={{ minWidth: ANCHO_MIN }}>
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={margenIzq} x2={ancho - margenDer} y1={puntoY(v)} y2={puntoY(v)}
              stroke="var(--color-borde)" strokeDasharray="4 4" />
            <text x={margenIzq - 4} y={puntoY(v) + 4} textAnchor="end"
              fontSize="10" fill="var(--color-texto-tenue)">{v}</text>
          </g>
        ))}
        {series.map(s=><g key={s.campo}>{linea(s.campo,s.color)}</g>)}
        {datos.map((d, i) => (
          <text key={i} x={puntoX(i)} y={ALTO_SVG - 4} textAnchor="middle"
            fontSize="10" fill="var(--color-texto-tenue)">
            {d.mes ? d.mes.slice(5)+'/'+d.mes.slice(0,4) : d.semana ? formatearFecha(d.semana) : i + 1}
          </text>
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 'var(--tam-xs)' }}>
        {series.map(s=><span key={s.campo} style={{color:s.color}}>● {s.nombre}</span>)}
      </div>
    </div>
  );
}
