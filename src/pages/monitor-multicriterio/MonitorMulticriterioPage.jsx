import { useState, useEffect, useCallback } from 'react';
import { useModal } from '../../hooks/useModal';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../hooks/useAuth';
import {
  listarCriterios, actualizarPesosCriterios,
  evaluarServicio, resultadoMulticriterio, detalleServicioMcda,
  obtenerIndicadoresMulticriterio,
} from '../../api/multicriterio';
import { listarServicios } from '../../api/servicios';
import { KpiCard } from '../../components/ui/KpiCard';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import './MonitorMulticriterioPage.css';

export default function MonitorMulticriterioPage() {
  const { usuario } = useAuth();
  const [criterios, setCriterios] = useState([]);
  const [resultado, setResultado] = useState({ resumen: null, tabla: [], indicadores: null });
  const [indicadores, setIndicadores] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [servicioSelId, setServicioSelId] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');
  const [cargando, setCargando] = useState(true);
  const { abrirModal, cerrarModal, informar } = useModal();
  const { cargando: cargandoAccion, ejecutar } = useAsync();

  const cargar = useCallback(async () => {
    try {
      const [c, r, s, ind] = await Promise.all([
        listarCriterios(),
        resultadoMulticriterio(),
        listarServicios(),
        obtenerIndicadoresMulticriterio().catch(() => null),
      ]);
      setCriterios(c);
      setResultado(r);
      setServicios(s);
      setIndicadores(ind || r?.indicadores || null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const manejarEvaluar = async () => {
    if (!servicioSelId) {
      informar('Aviso', 'Seleccione un servicio para evaluar', 'advertencia');
      return;
    }
    await ejecutar(async () => {
      try {
        await evaluarServicio(parseInt(servicioSelId, 10));
        await cargar();
        informar('Evaluación completada', 'El servicio fue evaluado correctamente', 'exito');
      } catch (err) {
        informar('Error', err.message, 'error');
      }
    });
  };

  const manejarVerDetalle = async (id) => {
    try {
      const d = await detalleServicioMcda(id);
      setDetalle(d);
    } catch (err) {
      informar('Error', err.message, 'error');
    }
  };

  const abrirEditarPesos = () => {
    const pesos = criterios.map((c) => ({ ...c, nuevoPeso: c.peso }));
    abrirModal({
      tipo: 'formulario',
      titulo: 'Editar pesos de criterios',
      contenido: (
        <FormPesos
          criterios={pesos}
          onGuardar={async (datos) => {
            await ejecutar(async () => {
              try {
                await actualizarPesosCriterios({ criterios: datos });
                cerrarModal();
                await cargar();
                informar('Pesos actualizados', 'Los pesos fueron actualizados correctamente', 'exito');
              } catch (err) {
                informar('Error', err.message, 'error');
              }
            });
          }}
          onCancelar={cerrarModal}
          cargando={cargandoAccion}
        />
      ),
    });
  };

  const columnas = [
    { llave: 'servicio', titulo: 'Servicio' },
    { llave: 'evaluacion', titulo: 'Puntaje', render: (f) => `${f.evaluacion}%` },
    { llave: 'nivel', titulo: 'Nivel', render: (f) => <Badge valor={f.nivel} /> },
    {
      llave: 'criterios_influyen',
      titulo: 'Criterios que influyen',
      render: (f) => (f.criterios_influyen || []).join(', ') || '—',
    },
    {
      llave: 'acciones',
      titulo: '',
      render: (f) => (
        <button
          type="button"
          className="accion-btn"
          onClick={() => manejarVerDetalle(f.servicio_id || f.id)}
        >
          Ver detalle
        </button>
      ),
    },
  ];

  const tablaFiltrada = filtroNivel
    ? (resultado.tabla || []).filter((f) => f.nivel === filtroNivel)
    : (resultado.tabla || []);

  const totalServ = indicadores?.totalServicios ?? resultado?.indicadores?.totalServicios ?? 0;
  const duracionProm = indicadores?.duracionPromedioHoras ?? resultado?.indicadores?.duracionPromedioHoras ?? 0;
  const listaClientes = indicadores?.serviciosPorCliente ?? resultado?.indicadores?.serviciosPorCliente ?? [];
  const listaHoras = indicadores?.serviciosPorHoraInicio ?? resultado?.indicadores?.serviciosPorHoraInicio ?? [];
  const topAgentes = indicadores?.topAgentes ?? resultado?.indicadores?.topAgentes ?? [];
  const topClientes = indicadores?.topClientes ?? resultado?.indicadores?.topClientes ?? [];

  const maxServCliente = listaClientes.reduce((max, c) => Math.max(max, c.total || 0), 1);
  const maxServHora = listaHoras.reduce((max, h) => Math.max(max, h.total || 0), 1);

  return (
    <div className="fade-in">
      <div className="pagina-encabezado">
        <div>
          <h1 className="pagina-titulo">Monitor multicriterio</h1>
          <p className="pagina-subtitulo">Evaluación de criterios e indicadores operativos de servicios</p>
        </div>
        <div className="pagina-acciones">
          <Select
            id="sel-servicio-evaluar"
            nombre="servicioId"
            valor={servicioSelId}
            onChange={(e) => setServicioSelId(e.target.value)}
            placeholder="Seleccionar servicio"
          >
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </Select>
          <Button variante="primario" cargando={cargandoAccion} onClick={manejarEvaluar}>
            Evaluar
          </Button>
          {(usuario?.rol === 'administrador' || usuario?.rol === 'jefe_operaciones') && (
            <Button variante="secundario" onClick={abrirEditarPesos}>
              Editar pesos
            </Button>
          )}
        </div>
      </div>

      <div className="grilla-kpi" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <KpiCard
          titulo="Total de servicios"
          valor={totalServ}
          color="primario"
          cargando={cargando}
        />
        <KpiCard
          titulo="Duración promedio"
          valor={`${duracionProm} hrs`}
          color="morado"
          cargando={cargando}
        />
        <KpiCard
          titulo="Evaluados"
          valor={resultado.resumen?.evaluados ?? 0}
          color="primario"
          cargando={cargando}
        />
        <KpiCard
          titulo="Alta atención"
          valor={resultado.resumen?.alta ?? 0}
          color="peligro"
          cargando={cargando}
        />
        <KpiCard
          titulo="Media atención"
          valor={resultado.resumen?.media ?? 0}
          color="advertencia"
          cargando={cargando}
        />
        <KpiCard
          titulo="Baja atención"
          valor={resultado.resumen?.baja ?? 0}
          color="exito"
          cargando={cargando}
        />
      </div>

      <div className="grilla-contenido grilla-1-1">
        <div className="tarjeta">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="tarjeta-titulo" style={{ margin: 0 }}>Criterios de evaluación</h3>
            <span className="indicador-badge-count">{criterios.length} criterios activos</span>
          </div>
          <div className="criterios-lista">
            {criterios.map((c) => (
              <div key={c.id} className="criterio-item">
                <div className="criterio-info">
                  <span className="criterio-codigo">{c.codigo}</span>
                  <span className="criterio-nombre">{c.nombre}</span>
                </div>
                <div className="criterio-peso">
                  <div className="criterio-barra-contenedor">
                    <div className="criterio-barra" style={{ width: `${c.peso * 100}%` }} />
                  </div>
                  <span className="criterio-pct">{(c.peso * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {detalle && detalle.length > 0 ? (
          <div className="tarjeta">
            <h3 className="tarjeta-titulo">Detalle del servicio</h3>
            <p className="tarjeta-subtitulo">
              Puntaje global: {detalle[0].puntaje_global}% — Nivel: <Badge valor={detalle[0].nivel} />
            </p>
            <div className="detalle-criterios">
              {detalle.map((d, i) => (
                <div key={i} className="detalle-criterio-item">
                  <div className="detalle-criterio-header">
                    <span className="detalle-criterio-nombre">{d.criterio}</span>
                    <span className={`detalle-criterio-pct ${d.puntaje_criterio < 60 ? 'pct-alerta' : 'pct-ok'}`}>
                      {d.puntaje_criterio}%
                    </span>
                  </div>
                  <div className="barra-detalle-contenedor">
                    <div
                      className={`barra-detalle ${d.puntaje_criterio < 60 ? 'barra-alerta' : 'barra-ok'}`}
                      style={{ width: `${d.puntaje_criterio}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="tarjeta">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="tarjeta-titulo" style={{ margin: 0 }}>Top 3 clientes con más servicios</h3>
              <span className="indicador-badge-count">Destacados</span>
            </div>
            <div className="lista-top-items">
              {topClientes.map((tc, idx) => (
                <div key={tc.id} className="top-item-row">
                  <div className="top-item-left">
                    <span className={`top-ranking-num top-ranking-${idx + 1}`}>{idx + 1}</span>
                    <div>
                      <div className="top-item-titulo">{tc.cliente}</div>
                      <div className="top-item-sub">Cliente corporativo</div>
                    </div>
                  </div>
                  <span className="top-item-badge">{tc.total_servicios} servicios</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="seccion-indicadores-titulo">
        <span>Indicadores operativos</span>
      </div>

      <div className="grilla-contenido grilla-1-1">
        <div className="tarjeta">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="tarjeta-titulo" style={{ margin: 0 }}>Servicios por cliente</h3>
            <span className="indicador-badge-count">{listaClientes.length} clientes</span>
          </div>
          <div className="distribucion-lista">
            {listaClientes.map((item) => {
              const porcentaje = Math.round((item.total / maxServCliente) * 100);
              return (
                <div key={item.id} className="distribucion-item">
                  <div className="distribucion-header">
                    <span className="distribucion-label">{item.cliente}</span>
                    <span className="distribucion-val">{item.total} servicios</span>
                  </div>
                  <div className="distribucion-barra-bg">
                    <div
                      className="distribucion-barra-fill distribucion-barra-cliente"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="tarjeta">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="tarjeta-titulo" style={{ margin: 0 }}>Servicios por hora de inicio</h3>
            <span className="indicador-badge-count">Distribución horaria</span>
          </div>
          <div className="distribucion-lista">
            {listaHoras.map((item) => {
              const porcentaje = Math.round((item.total / maxServHora) * 100);
              return (
                <div key={item.franja} className="distribucion-item">
                  <div className="distribucion-header">
                    <span className="distribucion-label">{item.franja} hrs</span>
                    <span className="distribucion-val">{item.total} servicios</span>
                  </div>
                  <div className="distribucion-barra-bg">
                    <div
                      className="distribucion-barra-fill distribucion-barra-hora"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="tarjeta" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="tarjeta-titulo" style={{ margin: 0 }}>Top 10 agentes con más servicios</h3>
          <span className="indicador-badge-count">{topAgentes.length} agentes listados</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tabla-agentes-compacta">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Agente</th>
                <th>Documento</th>
                <th style={{ textAlign: 'right' }}>Servicios Asignados</th>
              </tr>
            </thead>
            <tbody>
              {topAgentes.map((agente, idx) => (
                <tr key={agente.id}>
                  <td>
                    <span
                      className={`top-ranking-num ${idx < 3 ? `top-ranking-${idx + 1}` : ''}`}
                      style={{ width: 22, height: 22, fontSize: '0.7rem' }}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{agente.nombre}</td>
                  <td style={{ color: 'var(--color-texto-secundario)' }}>{agente.documento}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="top-item-badge">{agente.total_servicios}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="tarjeta" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h3 className="tarjeta-titulo" style={{ margin: 0 }}>Resultados por servicio</h3>
          <div style={{ width: 240 }}>
            <Select
              id="filtro-nivel-atencion"
              nombre="filtroNivel"
              valor={filtroNivel}
              onChange={(e) => setFiltroNivel(e.target.value)}
              placeholder="Todos los niveles de atención"
            >
              <option value="alta">Alta atención</option>
              <option value="media">Media atención</option>
              <option value="baja">Baja atención</option>
            </Select>
          </div>
        </div>
        <Table
          columnas={columnas}
          datos={tablaFiltrada}
          cargando={cargando}
          vacio={filtroNivel ? 'No existen servicios en el nivel de atención seleccionado.' : 'Sin evaluaciones. Use el botón Evaluar para comenzar.'}
        />
      </div>
    </div>
  );
}

function FormPesos({ criterios: inicial, onGuardar, onCancelar, cargando }) {
  const [pesos, setPesos] = useState(
    inicial.map((c) => ({ id: c.id, nombre: c.nombre, peso: parseFloat(c.peso) }))
  );
  const suma = pesos.reduce((s, p) => s + p.peso, 0);
  const valida = Math.abs(suma - 1) < 0.001;

  const actualizar = (id, valor) => {
    setPesos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, peso: parseFloat(valor) || 0 } : p))
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {pesos.map((p) => (
          <div
            key={p.id}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}
          >
            <span style={{ fontSize: 'var(--tam-sm)' }}>{p.nombre}</span>
            <input
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={p.peso}
              onChange={(e) => actualizar(p.id, e.target.value)}
              style={{
                width: 80,
                padding: '6px 8px',
                border: '1.5px solid var(--color-borde)',
                borderRadius: 'var(--radio-sm)',
                background: 'var(--color-superficie)',
                color: 'var(--color-texto-principal)',
              }}
            />
          </div>
        ))}
        <p
          style={{
            fontSize: 'var(--tam-xs)',
            color: valida ? 'var(--color-exito)' : 'var(--color-peligro)',
            fontWeight: 600,
          }}
        >
          Suma actual: {suma.toFixed(3)} (debe ser 1.000)
        </p>
      </div>
      <div className="form-pie">
        <Button variante="secundario" onClick={onCancelar} disabled={cargando}>
          Cancelar
        </Button>
        <Button
          variante="primario"
          cargando={cargando}
          disabled={!valida}
          onClick={() => onGuardar(pesos.map(({ id, peso }) => ({ id, peso })))}
        >
          Guardar
        </Button>
      </div>
    </div>
  );
}
