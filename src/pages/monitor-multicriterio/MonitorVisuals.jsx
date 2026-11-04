import { useState, useId } from 'react';

import { COLORES, CORTOS, porcentaje, NIVEL } from './monitor.presentacion';
export function IconoMonitor({ nombre, tamano = 20 }) {
  const trazos = {
    escudo: (
      <>
        <path d="M12 3 4 6v5c0 5 8 10 8 10s8-5 8-10V6z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    tendencia: (
      <>
        <path d="M3 17 9 11l4 4 8-10" />
        <path d="M15 5h6v6" />
      </>
    ),
    matriz: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    alerta: (
      <>
        <path d="m12 3 10 18H2z" />
        <path d="M12 9v5m0 3h.01" />
      </>
    ),
    reloj: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    personal: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 21v-3a6 6 0 0 1 12 0v3m2-16a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 4v2" />
      </>
    ),
    calculo: (
      <>
        <rect x="5" y="2" width="14" height="20" rx="3" />
        <path d="M8 6h8M8 11h1m5 0h2M8 15h1m5 0h2M8 19h1m5 0h2" />
      </>
    ),
    ayuda: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 3h.01" />
      </>
    ),
    flecha: (
      <>
        <path d="M4 12h16m-6-6 6 6-6 6" />
      </>
    ),
    guardar: (
      <>
        <path d="M5 3h12l4 4v14H3V3zM7 3v6h10V3M7 21v-7h10v7" />
      </>
    ),
    sol: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1" />
      </>
    ),
    luna: <path d="M20 14A9 9 0 0 1 10 3a9 9 0 1 0 10 11Z" />,
    metodo: (
      <>
        <path d="M9 3H4v18h16V3h-5M9 2h6v4H9zM7 10h10M7 14h10M7 18h6" />
      </>
    ),
  };
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {trazos[nombre] || trazos.escudo}
    </svg>
  );
}
export function Anillo({
  valor,
  tamano = 100,
  color = '#7de1c9',
  grosor = 7,
  children,
}) {
  const radio = (tamano - grosor) / 2,
    circ = 2 * Math.PI * radio;
  return (
    <div className="mv-anillo" style={{ width: tamano, height: tamano }}>
      <svg width={tamano} height={tamano} viewBox={`0 0 ${tamano} ${tamano}`}>
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          fill="none"
          stroke="currentColor"
          strokeWidth={grosor}
          opacity=".13"
        />
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          fill="none"
          stroke={color}
          strokeWidth={grosor}
          strokeDasharray={circ}
          strokeDashoffset={
            circ * (1 - Math.max(0, Math.min(100, valor || 0)) / 100)
          }
          strokeLinecap="round"
          transform={`rotate(-90 ${tamano / 2} ${tamano / 2})`}
        />
      </svg>
      <div>{children}</div>
    </div>
  );
}
export function Nivel({ nivel }) {
  return (
    <span className={`mv-nivel ${nivel}`}>
      <i />
      {NIVEL[nivel] || nivel}
    </span>
  );
}
export function MiniLinea({ valores, color = '#13b99a' }) {
  const puntos = valores.filter((v) => v !== null && v !== undefined);
  if (!puntos.length) return null;
  const min = Math.min(...puntos) - 3,
    max = Math.max(...puntos) + 3;
  const path = puntos
    .map(
      (v, i) =>
        `${i ? 'L' : 'M'}${(i * 96) / Math.max(1, puntos.length - 1)} ${32 - ((v - min) / (max - min)) * 27}`
    )
    .join(' ');
  return (
    <svg className="mv-minilinea" viewBox="0 0 100 36" aria-hidden="true">
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function GraficoEvolucion({ datos, criterios }) {
  const [indice, setIndice] = useState(0),
    uid = useId().replace(/:/g, ''),
    color = COLORES[indice];
  const puntos = datos.map((d) => d.criterios[indice]?.tasa ?? null),
    disponibles = puntos.filter((v) => v !== null),
    ultimo = disponibles.at(-1),
    cambio = disponibles.length > 1 ? ultimo - disponibles[0] : 0;
  const ancho = 900,
    alto = 230,
    x = (i) => 48 + (i * (ancho - 75)) / Math.max(1, datos.length - 1),
    y = (v) => 20 + ((100 - v) * (alto - 50)) / 100;
  const linea = puntos
    .map((v, i) =>
      v === null
        ? ''
        : `${i > 0 && puntos[i - 1] !== null ? 'L' : 'M'}${x(i)} ${y(v)}`
    )
    .join(' ');
  const area =
    disponibles.length === puntos.length && puntos.length
      ? `${linea} L${x(puntos.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z`
      : '';
  const etiquetas = [
    ...new Set([
      0,
      Math.floor((datos.length - 1) / 3),
      Math.floor(((datos.length - 1) * 2) / 3),
      datos.length - 1,
    ]),
  ].filter((i) => i >= 0);
  return (
    <section className="mv-panel mv-evolucion">
      <div className="mv-panel-heading">
        <div>
          <span className="mv-eyebrow">COMPORTAMIENTO OPERATIVO</span>
          <h2>Evolución de los indicadores</h2>
          <p>Compara el desempeño diario del periodo seleccionado.</p>
        </div>
        <span className="mv-fecha-chip">
          <IconoMonitor nombre="reloj" tamano={15} />
          {datos.length} días con actividad
        </span>
      </div>
      <div
        className="mv-series"
        role="group"
        aria-label="Indicador del gráfico"
      >
        {criterios.map((c, i) => (
          <button
            type="button"
            key={c.codigo}
            onClick={() => setIndice(i)}
            className={i === indice ? 'activo' : ''}
            style={{ '--serie': COLORES[i] }}
          >
            <i />
            {CORTOS[i]}
          </button>
        ))}
      </div>
      <div className="mv-chart-cifra">
        <strong style={{ color }}>{porcentaje(ultimo)}</strong>
        <span className={cambio >= 0 ? 'positivo' : 'negativo'}>
          {cambio >= 0 ? '+' : ''}
          {cambio.toFixed(1)} pp <small>respecto al primer día</small>
        </span>
      </div>
      {disponibles.length ? (
        <div className="mv-chart-wrap">
          <svg
            viewBox={`0 0 ${ancho} ${alto + 30}`}
            role="img"
            aria-label={`Evolución de ${criterios[indice]?.nombre}`}
          >
            <defs>
              <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity=".24" />
                <stop offset="100%" stopColor={color} stopOpacity=".01" />
              </linearGradient>
            </defs>
            {[0, 25, 50, 75, 100].map((v) => (
              <g key={v}>
                <line
                  x1="48"
                  x2={ancho - 26}
                  y1={y(v)}
                  y2={y(v)}
                  stroke="var(--color-borde)"
                  strokeDasharray="4 5"
                />
                <text
                  x="32"
                  y={y(v) + 4}
                  textAnchor="end"
                  fill="var(--color-texto-tenue)"
                  fontSize="10"
                >
                  {v}%
                </text>
              </g>
            ))}
            {area && <path d={area} fill={`url(#${uid})`} />}
            <path
              d={linea}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {puntos.map((v, i) =>
              v === null ? null : (
                <circle
                  key={i}
                  cx={x(i)}
                  cy={y(v)}
                  r="3.4"
                  fill="var(--color-superficie)"
                  stroke={color}
                  strokeWidth="2"
                >
                  <title>
                    {datos[i].dia}: {porcentaje(v)}
                  </title>
                </circle>
              )
            )}
            {etiquetas.map((i) => (
              <text
                key={i}
                x={x(i)}
                y={alto + 8}
                textAnchor={
                  i === 0 ? 'start' : i === datos.length - 1 ? 'end' : 'middle'
                }
                fill="var(--color-texto-tenue)"
                fontSize="11"
              >
                {datos[i].dia.slice(8, 10)}/{datos[i].dia.slice(5, 7)}
              </text>
            ))}
          </svg>
        </div>
      ) : (
        <p className="mv-vacio">
          No hay actividad para representar con estos filtros.
        </p>
      )}
      <div className="mv-chart-nota">
        <IconoMonitor nombre="ayuda" tamano={15} />
        <span>
          Las tasas se calculan con sus cantidades reales. Una tasa más alta
          indica mejor desempeño.
        </span>
      </div>
    </section>
  );
}
