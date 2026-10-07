import { useState, useEffect, useCallback, useMemo } from 'react';
import { listarMonitor, detalleMonitor, indicadoresOperativos } from '../../api/monitor';
import { listarClientes } from '../../api/servicios';
import { listarSedes } from '../../api/sedes';
import { useModal } from '../../hooks/useModal';
import { KpiCard } from '../../components/ui/KpiCard';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import { Icono } from '../../components/ui/Icono';
import './MonitorOperativoPage.css';

const PESTANAS = [
  { id: 'personal', etiqueta: 'Personal asignado', icono: 'usuario' },
  { id: 'protocolos', etiqueta: 'Protocolos', icono: 'escudo' },
  { id: 'incidencias', etiqueta: 'Incidencias', icono: 'alerta' },
  { id: 'evidencias', etiqueta: 'Evidencias', icono: 'camara' },
];

function InspectorDetalle({ servicioId, onCerrar }) {
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [pestañaActiva, setPestañaActiva] = useState('personal');
  const { informar } = useModal();

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      setCargando(true);
      try {
        const data = await detalleMonitor(servicioId);
        if (activo) setDetalle(data);
      } catch (err) {
        if (activo) informar('Error', err.message, 'error');
      } finally {
        if (activo) setCargando(false);
      }
    };
    cargar();
    return () => { activo = false; };
  }, [servicioId, informar]);

  if (cargando) {
    return (
      <div className="monitor-inspector-cargando">
        <Spinner texto="Cargando detalle operativo..." />
      </div>
    );
  }

  if (!detalle) return null;

  return (
    <div className="monitor-inspector-contenido">
      <div className="monitor-inspector-encabezado">
        <div className="monitor-inspector-titulo-grupo">
          <div className="monitor-inspector-titulo-fila">
            <h3 className="monitor-inspector-titulo">{detalle.nombre}</h3>
            <Badge valor={detalle.estado} />
          </div>
          <p className="monitor-inspector-subtitulo">
            {detalle.cliente} · {detalle.sede}
          </p>
          {detalle.supervisor && (
            <p className="monitor-inspector-supervisor">
              <Icono nombre="usuario" tamano={13} />
              <span>Supervisor: <strong>{detalle.supervisor}</strong></span>
            </p>
          )}
        </div>
        <button
          className="monitor-inspector-cerrar"
          onClick={onCerrar}
          aria-label="Cerrar inspector"
          type="button"
        >
          <Icono nombre="cerrar" tamano={16} />
        </button>
      </div>

      <div className="monitor-inspector-pestanas" role="tablist">
        {PESTANAS.map((tab) => {
          const conteo = detalle[tab.id]?.length || 0;
          const activa = pestañaActiva === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activa}
              className={`monitor-pestana-btn ${activa ? 'monitor-pestana-activa' : ''}`}
              onClick={() => setPestañaActiva(tab.id)}
              type="button"
            >
              <Icono nombre={tab.icono} tamano={14} />
              <span>{tab.etiqueta}</span>
              <span className="monitor-pestana-contador">{conteo}</span>
            </button>
          );
        })}
      </div>

      <div className="monitor-inspector-cuerpo">
        {pestañaActiva === 'personal' && (
          <div className="monitor-seccion-lista">
            {detalle.personal.length === 0 ? (
              <div className="monitor-vacio-seccion">
                <Icono nombre="usuario" tamano={24} color="var(--color-texto-tenue)" />
                <p>Sin personal asignado a este servicio</p>
              </div>
            ) : (
              <div className="monitor-items-grid">
                {detalle.personal.map((p) => (
                  <div key={p.id} className="monitor-item-tarjeta">
                    <div className="monitor-item-avatar">
                      {p.nombres?.[0]}{p.apellidos?.[0]}
                    </div>
                    <div className="monitor-item-datos">
                      <p className="monitor-item-nombre">{p.nombres} {p.apellidos}</p>
                      <p className="monitor-item-cargo">{p.cargo}</p>
                    </div>
                    <Badge valor={p.estado} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {pestañaActiva === 'protocolos' && (
          <div className="monitor-seccion-lista">
            {detalle.protocolos.length === 0 ? (
              <div className="monitor-vacio-seccion">
                <Icono nombre="escudo" tamano={24} color="var(--color-texto-tenue)" />
                <p>Sin protocolos de seguridad vinculados</p>
              </div>
            ) : (
              <div className="monitor-items-grid">
                {detalle.protocolos.map((pr) => (
                  <div key={pr.id} className="monitor-protocolo-tarjeta">
                    <div className="monitor-protocolo-encabezado">
                      <span className="monitor-protocolo-codigo">{pr.codigo}</span>
                      <strong className="monitor-protocolo-nombre">{pr.nombre}</strong>
                    </div>
                    {pr.descripcion && (
                      <p className="monitor-protocolo-desc">{pr.descripcion}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {pestañaActiva === 'incidencias' && (
          <div className="monitor-seccion-lista">
            {detalle.incidencias.length === 0 ? (
              <div className="monitor-vacio-seccion">
                <Icono nombre="check" tamano={24} color="var(--color-exito)" />
                <p>No registra incidencias activas</p>
              </div>
            ) : (
              <div className="monitor-items-grid">
                {detalle.incidencias.map((inc) => (
                  <div key={inc.id} className="monitor-incidencia-tarjeta">
                    <div className="monitor-incidencia-top">
                      <span className="monitor-incidencia-codigo">{inc.codigo}</span>
                      <div className="monitor-incidencia-badges">
                        <Badge valor={inc.prioridad} />
                        <Badge valor={inc.estado} />
                      </div>
                    </div>
                    <p className="monitor-incidencia-tipo">{inc.tipo}</p>
                    {inc.descripcion && (
                      <p className="monitor-incidencia-desc">{inc.descripcion}</p>
                    )}
                    <span className="monitor-incidencia-fecha">
                      {new Date(inc.fecha_registro).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {pestañaActiva === 'evidencias' && (
          <div className="monitor-seccion-lista">
            {detalle.evidencias.length === 0 ? (
              <div className="monitor-vacio-seccion">
                <Icono nombre="camara" tamano={24} color="var(--color-texto-tenue)" />
                <p>Sin registros fotográficos o evidencias</p>
              </div>
            ) : (
              <div className="monitor-items-grid">
                {detalle.evidencias.map((ev) => (
                  <div key={ev.id} className="monitor-evidencia-tarjeta">
                    <div className="monitor-evidencia-top">
                      <strong className="monitor-evidencia-titulo">{ev.titulo}</strong>
                      <Badge valor={ev.estado_revision} />
                    </div>
                    {ev.protocolo && (
                      <p className="monitor-evidencia-protocolo">
                        <Icono nombre="escudo" tamano={12} />
                        <span>{ev.protocolo}</span>
                      </p>
                    )}
                    {ev.descripcion && (
                      <p className="monitor-evidencia-desc">{ev.descripcion}</p>
                    )}
                    <div className="monitor-evidencia-pie">
                      <span>{ev.personal || 'Operador'}</span>
                      <span>{new Date(ev.creado_en).toLocaleDateString('es-PE')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MonitorOperativoPage() {
  const { informar } = useModal();
  const [servicios, setServicios] = useState([]);
  const [indicadores, setIndicadores] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroSede, setFiltroSede] = useState('');
  const [clientes, setClientes] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);

  const cargar = useCallback(async (mostrarSpinner = false) => {
    if (mostrarSpinner) setCargando(true);
    try {
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroCliente) params.clienteId = filtroCliente;
      if (filtroSede) params.sedeId = filtroSede;

      const [svcs, inds] = await Promise.all([
        listarMonitor(params),
        indicadoresOperativos(params),
      ]);
      setServicios(svcs);
      setIndicadores(inds);

      if (svcs.length > 0 && !servicioSeleccionado) {
        setServicioSeleccionado(svcs[0].id);
      }
    } catch (err) {
      informar('Error', err.message, 'error');
    } finally {
      setCargando(false);
    }
  }, [filtroEstado, filtroCliente, filtroSede, servicioSeleccionado, informar]);

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

  const serviciosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return servicios;
    const term = busqueda.toLowerCase().trim();
    return servicios.filter((s) =>
      s.nombre?.toLowerCase().includes(term) ||
      s.cliente?.toLowerCase().includes(term) ||
      s.sede?.toLowerCase().includes(term) ||
      s.supervisor?.toLowerCase().includes(term)
    );
  }, [servicios, busqueda]);

  const columnas = [
    {
      llave: 'servicio',
      titulo: 'Servicio / Horario',
      render: (f) => (
        <div className="monitor-col-servicio">
          <strong className="monitor-servicio-nombre">{f.nombre}</strong>
          <span className="monitor-servicio-horario">
            {f.hora_inicio?.slice(0, 5)} - {f.hora_fin?.slice(0, 5)}
          </span>
        </div>
      ),
    },
    {
      llave: 'ubicacion',
      titulo: 'Cliente / Sede',
      render: (f) => (
        <div className="monitor-col-ubicacion">
          <span className="monitor-ubicacion-cliente">{f.cliente}</span>
          <span className="monitor-ubicacion-sede">{f.sede}</span>
        </div>
      ),
    },
    {
      llave: 'estado',
      titulo: 'Estado',
      render: (f) => <Badge valor={f.estado} />,
    },
    {
      llave: 'operacion',
      titulo: 'Operación activa',
      render: (f) => (
        <div className="monitor-badges-metricas">
          <span className="monitor-chip" title="Personal asignado">
            <Icono nombre="usuario" tamano={12} />
            <span>{f.personal_asignado}</span>
          </span>
          <span
            className={`monitor-chip ${f.incidencias_abiertas > 0 ? 'monitor-chip-alerta' : ''}`}
            title="Incidencias abiertas"
          >
            <Icono nombre="alerta" tamano={12} />
            <span>{f.incidencias_abiertas}</span>
          </span>
          <span className="monitor-chip" title="Evidencias registradas">
            <Icono nombre="camara" tamano={12} />
            <span>{f.evidencias_registradas}</span>
          </span>
        </div>
      ),
    },
    {
      llave: 'acciones',
      titulo: 'Acción',
      render: (f) => {
        const esActivo = servicioSeleccionado === f.id;
        return (
          <Button
            variante={esActivo ? 'primario' : 'secundario'}
            tamano="sm"
            onClick={() => setServicioSeleccionado(f.id)}
            title="Inspeccionar detalle en vivo"
          >
            <Icono nombre="ojo" tamano={13} />
            <span>{esActivo ? 'Viendo' : 'Ver'}</span>
          </Button>
        );
      },
    },
  ];

  return (
    <div className="fade-in">
      <div className="pagina-encabezado">
        <div>
          <h1 className="pagina-titulo">Monitor Operativo</h1>
          <p className="pagina-subtitulo">Supervisión en vivo de servicios activos, asignaciones, protocolos e incidencias</p>
        </div>
        <div className="pagina-acciones">
          <Button variante="secundario" onClick={cargar} cargando={cargando}>
            <Icono nombre="refrescar" tamano={15} />
            <span>Actualizar</span>
          </Button>
        </div>
      </div>

      <div className="grilla-kpi grilla-kpi-4">
        <KpiCard
          titulo="Servicios totales"
          valor={indicadores?.total_servicios}
          color="primario"
          cargando={cargando}
          icono={<Icono nombre="escudo" tamano={18} />}
        />
        <KpiCard
          titulo="Servicios en curso"
          valor={indicadores?.en_curso}
          color="exito"
          cargando={cargando}
          icono={<Icono nombre="check" tamano={18} />}
        />
        <KpiCard
          titulo="Cumplimiento turnos"
          valor={indicadores?.cumplimiento_turnos !== undefined && indicadores?.cumplimiento_turnos !== null ? `${indicadores.cumplimiento_turnos}%` : '—'}
          color="advertencia"
          cargando={cargando}
          icono={<Icono nombre="estado" tamano={18} />}
        />
        <KpiCard
          titulo="Incidencias abiertas"
          valor={indicadores?.incidencias_abiertas}
          color="peligro"
          cargando={cargando}
          icono={<Icono nombre="alerta" tamano={18} />}
        />
      </div>

      <div className="grilla-contenido grilla-2-1">
        <div className="tarjeta">
          <div className="monitor-filtros-barra">
            <Input
              id="buscar-monitor"
              nombre="busqueda"
              placeholder="Buscar por servicio, cliente o sede..."
              valor={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <Select
              id="filtro-estado-monitor"
              nombre="estado"
              valor={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              placeholder="Todos los estados"
            >
              <option value="en_curso">En curso</option>
              <option value="programado">Programado</option>
              <option value="finalizado">Finalizado</option>
            </Select>
            <Select
              id="filtro-cliente-monitor"
              nombre="clienteId"
              valor={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              placeholder="Todos los clientes"
            >
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </Select>
            <Select
              id="filtro-sede-monitor"
              nombre="sedeId"
              valor={filtroSede}
              onChange={(e) => setFiltroSede(e.target.value)}
              placeholder="Todas las sedes"
            >
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </Select>
          </div>

          <Table
            columnas={columnas}
            datos={serviciosFiltrados}
            cargando={cargando}
            vacio="No se encontraron servicios con los filtros aplicados"
          />
        </div>

        <div className="tarjeta monitor-inspector-tarjeta">
          {servicioSeleccionado ? (
            <InspectorDetalle
              servicioId={servicioSeleccionado}
              onCerrar={() => setServicioSeleccionado(null)}
            />
          ) : (
            <div className="monitor-inspector-vacio">
              <div className="monitor-inspector-vacio-icono">
                <Icono nombre="ojo" tamano={32} color="var(--color-primario)" />
              </div>
              <h3 className="monitor-inspector-vacio-titulo">Inspección de servicio</h3>
              <p className="monitor-inspector-vacio-desc">
                Seleccione un servicio de la tabla para ver su dotación de personal, protocolos vigentes, incidencias y evidencias en tiempo real.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
