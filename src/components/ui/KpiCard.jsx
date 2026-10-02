import './KpiCard.css';

export function KpiCard({ titulo, valor, variacion, icono, color = 'primario', cargando }) {
  const esPositiva = typeof variacion === 'number' ? variacion >= 0 : variacion?.startsWith('+');

  return (
    <div className={`kpi-card kpi-card-${color}`}>
      {cargando ? (
        <div className="kpi-skeleton" />
      ) : (
        <>
          <div className="kpi-encabezado">
            <p className="kpi-titulo">{titulo}</p>
            {icono && <span className="kpi-icono" aria-hidden="true">{icono}</span>}
          </div>
          <p className="kpi-valor">{valor ?? '—'}</p>
          {variacion !== undefined && variacion !== null && (
            <p className={`kpi-variacion ${esPositiva ? 'kpi-variacion-positiva' : 'kpi-variacion-negativa'}`}>
              <span aria-hidden="true">{esPositiva ? '↑' : '↓'}</span>
              {' '}{typeof variacion === 'number' ? Math.abs(variacion) : variacion.replace(/[+-]/, '')}
              <span className="kpi-variacion-label"> vs semana anterior</span>
            </p>
          )}
        </>
      )}
    </div>
  );
}
