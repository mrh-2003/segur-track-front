const ALTO = 140;

export default function GraficoActividadOperativa({ datos, cargando }) {
  if (cargando || !datos.length) {
    return <div style={{ height: ALTO, background: 'var(--color-fondo-alt)', borderRadius: 'var(--radio-md)' }} />;
  }

  const maxVal = Math.max(...datos.map((d) => parseInt(d.eventos, 10)), 1);
  const ancho = Math.max(400, datos.length * 36);

  return (
    <div style={{ overflowX: 'auto', marginTop: 12 }}>
      <svg viewBox={`0 0 ${ancho} ${ALTO + 30}`} style={{ width: '100%', minWidth: 300 }}>
        {datos.map((d, i) => {
          const alto = (parseInt(d.eventos, 10) / maxVal) * ALTO;
          const x = (ancho / datos.length) * i + 4;
          const barAncho = (ancho / datos.length) - 8;
          const y = ALTO - alto;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barAncho} height={alto} rx="3"
                fill="var(--color-primario)" opacity="0.85" />
              <text x={x + barAncho / 2} y={ALTO + 16} textAnchor="middle"
                fontSize="10" fill="var(--color-texto-tenue)">
                {d.hora ? new Date(d.hora).getHours() + 'h' : i}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
