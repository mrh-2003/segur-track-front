export default function TablaDesempeno({ datos, cargando }) {
  if (cargando) return <div style={{ height: 80, background: 'var(--color-fondo-alt)', borderRadius: 'var(--radio-md)' }} />;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--tam-sm)' }}>
        <thead>
          <tr>
            {['Servicio', 'Cumplimiento %', 'Incidencias', 'T. prom. atención'].map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 'var(--tam-xs)', textTransform: 'uppercase', color: 'var(--color-texto-secundario)', background: 'var(--color-fondo-alt)', borderBottom: '1px solid var(--color-borde)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {datos.map((d, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--color-borde-suave)' }}>
              <td style={{ padding: '10px 12px' }}>{d.servicio}</td>
              <td style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 6, background: 'var(--color-fondo-alt)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${d.cumplimiento_pct || 0}%`, height: '100%', background: 'var(--color-primario)', borderRadius: 99 }} />
                  </div>
                  <span style={{ fontWeight: 600, minWidth: 36 }}>{d.cumplimiento_pct ?? '—'}%</span>
                </div>
              </td>
              <td style={{ padding: '10px 12px', color: d.incidencias > 0 ? 'var(--color-peligro)' : 'var(--color-exito)', fontWeight: 600 }}>{d.incidencias}</td>
              <td style={{ padding: '10px 12px' }}>{d.tiempo_prom_atencion ? `${d.tiempo_prom_atencion} min` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
