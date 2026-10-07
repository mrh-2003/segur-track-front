import { useState, useEffect, useCallback, useMemo } from 'react';
import { historialIndicadores, indicadoresPorServicio } from '../../api/monitor';
import { listarClientes } from '../../api/servicios';
import { listarSedes } from '../../api/sedes';
import { useModal } from '../../hooks/useModal';
import { KpiCard } from '../../components/ui/KpiCard';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Icono } from '../../components/ui/Icono';
import './AnalisisHistoricoPage.css';

const PERIODOS = [
  { valor: '3', label: 'Últimos 3 meses' },
  { valor: '6', label: 'Últimos 6 meses' },
  { valor: '12', label: 'Últimos 12 meses' },
];

function GraficoTendencia({ datos, campo, titulo, sufijo = '', colorHex, gradienteId }) {
  if (!datos || datos.length === 0) {
    return (
      <div className="grafico-tarjeta">
        <h3 className="grafico-titulo">{titulo}</h3>
        <div className="grafico-vacio">Sin datos históricos suficientes</div>
      </div>
    );
  }

  const valores = datos.map((d) => parseFloat(d[campo] || 0));
  const maxVal = Math.max(...valores, 10);
  const minVal = 0;
  const rango = maxVal - minVal || 1;

  const ancho = 500;
  const alto = 160;
  const padX = 40;
  const padY = 25;
  const anchoGrafico = ancho - padX * 2;
  const altoGrafico = alto - padY * 2;

  const puntos = datos.map((d, i) => {
    const x = padX + (i / Math.max(datos.length - 1, 1)) * anchoGrafico;
    const val = parseFloat(d[campo] || 0);
    const y = padY + altoGrafico - ((val - minVal) / rango) * altoGrafico;
    return { x, y, val, etiqueta: d.etiqueta || d.periodo };
  });

  const lineaPath = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${lineaPath} L ${puntos[puntos.length - 1].x.toFixed(1)} ${(padY + altoGrafico).toFixed(1)} L ${puntos[0].x.toFixed(1)} ${(padY + altoGrafico).toFixed(1)} Z`;

  return (
    <div className="grafico-tarjeta">
      <div className="grafico-cabecera">
        <h3 className="grafico-titulo">{titulo}</h3>
        <span className="grafico-ultimo-valor" style={{ color: colorHex }}>
          {valores[valores.length - 1] ?? 0}{sufijo}
        </span>
      </div>

      <div className="grafico-svg-contenedor">
        <svg viewBox={`0 0 ${ancho} ${alto}`} className="grafico-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradienteId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colorHex} stopOpacity="0.28" />
              <stop offset="100%" stopColor={colorHex} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <line
            x1={padX}
            y1={padY}
            x2={ancho - padX}
            y2={padY}
            stroke="var(--color-borde-suave)"
            strokeDasharray="4 4"
          />
          <line
            x1={padX}
            y1={padY + altoGrafico / 2}
            x2={ancho - padX}
            y2={padY + altoGrafico / 2}
            stroke="var(--color-borde-suave)"
            strokeDasharray="4 4"
          />
          <line
            x1={padX}
            y1={padY + altoGrafico}
            x2={ancho - padX}
            y2={padY + altoGrafico}
            stroke="var(--color-borde)"
          />

          <path d={areaPath} fill={`url(#${gradienteId})`} />
          <path
            d={lineaPath}
            fill="none"
            stroke={colorHex}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {puntos.map((p, i) => (
            <g key={i} className="grafico-nodo">
              <circle
                cx={p.x}
                cy={p.y}
                r="4.5"
                fill="var(--color-superficie)"
                stroke={colorHex}
                strokeWidth="2"
              />
              <text
                x={p.x}
                y={p.y - 10}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="var(--color-texto-principal)"
              >
                {p.val}{sufijo}
              </text>
              <text
                x={p.x}
                y={alto - 4}
                textAnchor="middle"
                fontSize="10"
                fill="var(--color-texto-secundario)"
              >
                {p.etiqueta}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

export default function AnalisisHistoricoPage() {
  const { informar } = useModal();
  const [historial, setHistorial] = useState([]);
  const [porServicio, setPorServicio] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [filtros, setFiltros] = useState({ periodos: '6', clienteId: '', sedeId: '' });

  const cargar = useCallback(async (mostrarSpinner = false) => {
    if (mostrarSpinner) setCargando(true);
    try {
      const params = {};
      if (filtros.periodos) params.periodos = filtros.periodos;
      if (filtros.clienteId) params.clienteId = filtros.clienteId;
      if (filtros.sedeId) params.sedeId = filtros.sedeId;

      const [hist, svc] = await Promise.all([
        historialIndicadores(params),
        indicadoresPorServicio(params),
      ]);
      setHistorial(hist || []);
      setPorServicio(svc || []);
    } catch (err) {
      informar('Error', err.message, 'error');
    } finally {
      setCargando(false);
    }
  }, [filtros, informar]);

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [cls, sds] = await Promise.all([listarClientes(), listarSedes()]);
        setClientes(cls);
        setSedes(sds);
      } catch {
        // Silencioso
      }
    };
    cargarCatalogos();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargar();
    }, 0);
    return () => clearTimeout(timer);
  }, [cargar]);

  const kpis = useMemo(() => {
    if (!historial || historial.length === 0) {
      return {
        promCumplimiento: '—',
        totalIncidencias: 0,
        promTiempoAtencion: '—',
        serviciosAnalizados: porServicio.length,
      };
    }

    const cumpValidos = historial.map((h) => parseFloat(h.cumplimiento_turnos || 0)).filter((v) => v > 0);
    const promCump = cumpValidos.length > 0
      ? (cumpValidos.reduce((a, b) => a + b, 0) / cumpValidos.length).toFixed(1)
      : '0';

    const totalInc = historial.reduce((acc, h) => acc + parseInt(h.incidencias_abiertas || 0, 10), 0);

    const tiempos = historial.map((h) => parseFloat(h.tiempo_prom_atencion || 0)).filter((t) => t > 0);
    const promTiempo = tiempos.length > 0
      ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length)
      : '—';

    return {
      promCumplimiento: `${promCump}%`,
      totalIncidencias: totalInc,
      promTiempoAtencion: promTiempo !== '—' ? `${promTiempo} min` : '—',
      serviciosAnalizados: porServicio.length,
    };
  }, [historial, porServicio]);

  const restablecerFiltros = () => setFiltros({ periodos: '6', clienteId: '', sedeId: '' });

  const columnas = [
    {
      llave: 'nombre',
      titulo: 'Servicio',
      render: (f) => (
        <div className="hist-col-servicio">
          <strong className="hist-servicio-nombre">{f.nombre}</strong>
          <span className="hist-servicio-sede">{f.sede}</span>
        </div>
      ),
    },
    {
      llave: 'cliente',
      titulo: 'Cliente',
      render: (f) => <span className="hist-cliente-nombre">{f.cliente}</span>,
    },
    {
      llave: 'estado',
      titulo: 'Estado',
      render: (f) => <Badge valor={f.estado} />,
    },
    {
      llave: 'cumplimiento_turnos',
      titulo: 'Cumplimiento turnos',
      render: (f) => {
        const val = parseFloat(f.cumplimiento_turnos || 0);
        const colorVar = val >= 80 ? 'var(--color-exito)' : val >= 60 ? 'var(--color-advertencia)' : 'var(--color-peligro)';
        return (
          <div className="hist-cumplimiento-barra-grupo">
            <span className="hist-cumplimiento-texto" style={{ color: colorVar }}>
              {val}%
            </span>
            <div className="hist-progreso-pista">
              <div
                className="hist-progreso-relleno"
                style={{ width: `${Math.min(val, 100)}%`, background: colorVar }}
              />
            </div>
          </div>
        );
      },
    },
    {
      llave: 'incidencias_abiertas',
      titulo: 'Incidencias activas',
      render: (f) => {
        const cant = f.incidencias_abiertas || 0;
        return (
          <span className={`hist-incidencia-pill ${cant > 0 ? 'hist-incidencia-pill-alerta' : ''}`}>
            {cant}
          </span>
        );
      },
    },
    {
      llave: 'evidencias',
      titulo: 'Evidencias',
      render: (f) => <span className="hist-evidencias-cant">{f.evidencias || 0}</span>,
    },
    {
      llave: 'tiempo_prom_atencion',
      titulo: 'T. prom. atención',
      render: (f) => <span>{f.tiempo_prom_atencion ? `${f.tiempo_prom_atencion} min` : '—'}</span>,
    },
  ];

  return (
    <div className="fade-in">
      <div className="pagina-encabezado">
        <div>
          <h1 className="pagina-titulo">Análisis Histórico</h1>
          <p className="pagina-subtitulo">Evolución temporal del rendimiento operativo, cumplimiento de turnos e incidencias</p>
        </div>
        <div className="pagina-acciones">
          <Select
            id="filtro-periodos-hist"
            nombre="periodos"
            valor={filtros.periodos}
            onChange={(e) => setFiltros((f) => ({ ...f, periodos: e.target.value }))}
          >
            {PERIODOS.map((p) => (
              <option key={p.valor} value={p.valor}>{p.label}</option>
            ))}
          </Select>
          <Select
            id="filtro-cliente-hist"
            nombre="clienteId"
            valor={filtros.clienteId}
            onChange={(e) => setFiltros((f) => ({ ...f, clienteId: e.target.value }))}
            placeholder="Todos los clientes"
          >
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </Select>
          <Select
            id="filtro-sede-hist"
            nombre="sedeId"
            valor={filtros.sedeId}
            onChange={(e) => setFiltros((f) => ({ ...f, sedeId: e.target.value }))}
            placeholder="Todas las sedes"
          >
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </Select>
          {(filtros.clienteId || filtros.sedeId || filtros.periodos !== '6') && (
            <Button variante="secundario" onClick={restablecerFiltros}>
              Restablecer
            </Button>
          )}
        </div>
      </div>

      <div className="grilla-kpi grilla-kpi-4">
        <KpiCard
          titulo="Cumplimiento promedio"
          valor={kpis.promCumplimiento}
          color="exito"
          cargando={cargando}
          icono={<Icono nombre="check" tamano={18} />}
        />
        <KpiCard
          titulo="Incidencias acumuladas"
          valor={kpis.totalIncidencias}
          color="peligro"
          cargando={cargando}
          icono={<Icono nombre="alerta" tamano={18} />}
        />
        <KpiCard
          titulo="Tiempo prom. atención"
          valor={kpis.promTiempoAtencion}
          color="advertencia"
          cargando={cargando}
          icono={<Icono nombre="estado" tamano={18} />}
        />
        <KpiCard
          titulo="Servicios evaluados"
          valor={kpis.serviciosAnalizados}
          color="primario"
          cargando={cargando}
          icono={<Icono nombre="escudo" tamano={18} />}
        />
      </div>

      <div className="hist-graficos-grilla">
        <GraficoTendencia
          datos={historial}
          campo="cumplimiento_turnos"
          titulo="Cumplimiento de turnos (%)"
          sufijo="%"
          colorHex="#16A34A"
          gradienteId="grad-cump-hist"
        />
        <GraficoTendencia
          datos={historial}
          campo="incidencias_abiertas"
          titulo="Incidencias registradas"
          colorHex="#DC2626"
          gradienteId="grad-inc-hist"
        />
        <GraficoTendencia
          datos={historial}
          campo="tiempo_prom_atencion"
          titulo="Tiempo prom. atención (min)"
          sufijo="m"
          colorHex="#D97706"
          gradienteId="grad-tiempo-hist"
        />
      </div>

      <div className="tarjeta">
        <div className="hist-tarjeta-encabezado">
          <h2 className="tarjeta-titulo">Desempeño consolidado por servicio</h2>
          <p className="tarjeta-subtitulo">
            Evaluación comparativa de cumplimiento, incidencias y evidencias registradas en el período seleccionado
          </p>
        </div>

        <Table
          columnas={columnas}
          datos={porServicio}
          cargando={cargando}
          vacio="No hay datos históricos para los filtros seleccionados"
        />
      </div>
    </div>
  );
}
