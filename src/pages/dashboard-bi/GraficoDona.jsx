const COLORES = ['#2563EB', '#16A34A', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#059669'];

export default function GraficoDona({ datos, cargando }) {
  if (cargando || !datos.length) {
    return <div style={{ height: 200, background: 'var(--color-fondo-alt)', borderRadius: 'var(--radio-md)' }} />;
  }

  const total = datos.reduce((s, d) => s + parseInt(d.cantidad, 10), 0);
  const radio = 70;
  const cx = 90;
  const cy = 90;
  const interior = 40;

  let angulo = -Math.PI / 2;
  const segmentos = datos.map((d, i) => {
    const frac = parseInt(d.cantidad, 10) / total;
    const ini = angulo;
    angulo += frac * 2 * Math.PI;
    const x1 = cx + radio * Math.cos(ini);
    const y1 = cy + radio * Math.sin(ini);
    const x2 = cx + radio * Math.cos(angulo);
    const y2 = cy + radio * Math.sin(angulo);
    const xi1 = cx + interior * Math.cos(ini);
    const yi1 = cy + interior * Math.sin(ini);
    const xi2 = cx + interior * Math.cos(angulo);
    const yi2 = cy + interior * Math.sin(angulo);
    const grande = frac > 0.5 ? 1 : 0;
    const d_path = `M${xi1},${yi1} L${x1},${y1} A${radio},${radio} 0 ${grande},1 ${x2},${y2} L${xi2},${yi2} A${interior},${interior} 0 ${grande},0 ${xi1},${yi1} Z`;
    return { path: d_path, color: COLORES[i % COLORES.length], tipo: d.tipo, cantidad: d.cantidad, pct: (frac * 100).toFixed(1) };
  });

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
      <svg viewBox="0 0 180 180" style={{ width: 180, height: 180, flexShrink: 0 }}>
        {segmentos.map((s, i) => <path key={i} d={s.path} fill={s.color} />)}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
          fontSize="20" fontWeight="700" fill="var(--color-texto-principal)">{total}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="10" fill="var(--color-texto-tenue)">total</text>
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {segmentos.map((s, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--tam-xs)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, display: 'inline-block' }} />
              {s.tipo}
            </span>
            <span style={{ fontWeight: 600 }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
