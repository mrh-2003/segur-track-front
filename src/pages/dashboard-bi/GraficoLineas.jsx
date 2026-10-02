const COLORES = ['#2563EB', '#16A34A', '#D97706', '#DC2626', '#7C3AED', '#0891B2'];
const ALTO = 160;
const ALTO_SVG = 180;
const ANCHO_MIN = 320;

export default function GraficoLineas({ datos, cargando }) {
  if (cargando || !datos.length) {
    return <div style={{ height: ALTO_SVG, background: 'var(--color-fondo-alt)', borderRadius: 'var(--radio-md)', animation: 'shimmer 1.5s infinite' }} />;
  }

  const maxVal = 100;
  const ancho = Math.max(ANCHO_MIN, datos.length * 60);
  const margenIzq = 36;
  const margenDer = 12;
  const margenTop = 12;
  const margenBot = 24;
  const areaAncho = ancho - margenIzq - margenDer;
  const areaAlto = ALTO - margenTop - margenBot;

  const puntoX = (i) => margenIzq + (i / (datos.length - 1)) * areaAncho;
  const puntoY = (val) => margenTop + (1 - val / maxVal) * areaAlto;

  const linea = (campo, color) => {
    if (!datos.some((d) => d[campo] !== null)) return null;
    const pts = datos.map((d, i) => `${puntoX(i)},${puntoY(d[campo] ?? 0)}`).join(' ');
    return (
      <>
        <polyline fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" points={pts} />
        {datos.map((d, i) => (
          <circle key={i} cx={puntoX(i)} cy={puntoY(d[campo] ?? 0)} r="4" fill={color} />
        ))}
      </>
    );
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width="100%" viewBox={`0 0 ${ancho} ${ALTO_SVG}`} preserveAspectRatio="none" style={{ minWidth: ANCHO_MIN }}>
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={margenIzq} x2={ancho - margenDer} y1={puntoY(v)} y2={puntoY(v)}
              stroke="var(--color-borde)" strokeDasharray="4 4" />
            <text x={margenIzq - 4} y={puntoY(v) + 4} textAnchor="end"
              fontSize="10" fill="var(--color-texto-tenue)">{v}</text>
          </g>
        ))}
        {linea('turnos_pct', COLORES[0])}
        {linea('servicios_pct', COLORES[1])}
        {datos.map((d, i) => (
          <text key={i} x={puntoX(i)} y={ALTO_SVG - 4} textAnchor="middle"
            fontSize="10" fill="var(--color-texto-tenue)">
            {d.semana ? new Date(d.semana).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' }) : i + 1}
          </text>
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 'var(--tam-xs)' }}>
        <span style={{ color: COLORES[0] }}>● Turnos</span>
        <span style={{ color: COLORES[1] }}>● Servicios</span>
      </div>
    </div>
  );
}
