import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useModal } from '../../hooks/useModal';
import { useAsync } from '../../hooks/useAsync';
import {
  listarIncidencias, resumenIncidencias, incidenciasRecientes,
  crearIncidencia, actualizarIncidencia, cambiarEstadoIncidencia,
  eliminarIncidencia, listarTiposIncidencia,
} from '../../api/incidencias';
import { listarServicios } from '../../api/servicios';
import { descargarDirecto } from '../../api/reportes';
import { KpiCard } from '../../components/ui/KpiCard';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Icono } from '../../components/ui/Icono';
import { formatearFechaHora } from '../../utils/fechas';
import FormIncidencia from './FormIncidencia';
import './IncidenciasPage.css';

const DEBOUNCE_MS = 300;

function PanelRecientes({ items, cargando }) {
  return (
    <div className="tarjeta">
      <h3 className="tarjeta-titulo">Incidencias recientes</h3>
      {cargando ? (
        <p style={{ color: 'var(--color-texto-tenue)', padding: '16px 0', fontSize: 'var(--tam-sm)' }}>Cargando...</p>
      ) : items.length === 0 ? (
        <p style={{ color: 'var(--color-texto-tenue)', padding: '16px 0', fontSize: 'var(--tam-sm)' }}>Sin incidencias recientes</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          {items.map((item) => (
            <div key={item.codigo} className="incidencia-reciente-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 'var(--tam-sm)' }}>{item.codigo}</span>
                <Badge valor={item.prioridad} />
              </div>
              <p style={{ fontSize: 'var(--tam-xs)', color: 'var(--color-texto-secundario)', margin: '4px 0' }}>
                {item.tipo}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--tam-xs)', color: 'var(--color-texto-tenue)' }}>
                <span>{item.personal_registra || 'Sistema'}</span>
                <span>{formatearFechaHora(item.fecha_registro)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function IncidenciasPage() {
  const [incidencias, setIncidencias] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [recientes, setRecientes] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ q: '', tipoId: '', estado: '', servicioId: '' });
  const { abrirModal, cerrarModal, confirmar, informar } = useModal();
  const { cargando: cargandoAccion, ejecutar } = useAsync();
  const location = useLocation();

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = {};
      if (filtros.q) params.q = filtros.q;
      if (filtros.tipoId) params.tipoId = filtros.tipoId;
      if (filtros.estado) params.estado = filtros.estado;
      if (filtros.servicioId) params.servicioId = filtros.servicioId;

      const [lista, res, rec, listaTipos, listaServicios] = await Promise.all([
        listarIncidencias(params),
        resumenIncidencias(),
        incidenciasRecientes(),
        listarTiposIncidencia(),
        listarServicios(),
      ]);
      setIncidencias(lista);
      setResumen(res);
      setRecientes(rec);
      setTipos(listaTipos);
      setServicios(listaServicios);
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  useEffect(() => {
    const t = setTimeout(cargar, filtros.q ? DEBOUNCE_MS : 0);
    return () => clearTimeout(t);
  }, [cargar, filtros.q]);

  const abrirFormulario = useCallback((item = null) => {
    abrirModal({
      tipo: 'formulario',
      titulo: item ? 'Editar incidencia' : 'Registrar incidencia',
      contenido: (
        <FormIncidencia
          inicial={item}
          tipos={tipos}
          servicios={servicios}
          onGuardar={async (datos) => {
            await ejecutar(async () => {
              try {
                if (item) {
                  await actualizarIncidencia(item.id, datos);
                } else {
                  await crearIncidencia(datos);
                }
                cerrarModal();
                await cargar();
                informar('Operación exitosa', item ? 'Incidencia actualizada correctamente' : 'Incidencia registrada correctamente', 'exito');
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
  }, [abrirModal, cerrarModal, cargar, cargandoAccion, ejecutar, informar, tipos, servicios]);

  useEffect(() => {
    if (location.state?.abrirModal && tipos.length > 0) {
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => {
        abrirFormulario();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [location.state, tipos.length, abrirFormulario]);

  const abrirObservacion = (item) => {
    let obsTexto = item.observacion || '';
    abrirModal({
      tipo: 'formulario',
      titulo: `Observaciones y acciones - ${item.codigo}`,
      contenido: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: 0, fontSize: 'var(--tam-sm)', color: 'var(--color-texto-secundario)' }}>
            Registre las acciones tomadas o seguimiento realizado para esta incidencia.
          </p>
          <div className="campo">
            <label className="campo-etiqueta" htmlFor="obs-inc">Acción tomada / Observación</label>
            <textarea
              id="obs-inc"
              className="campo-input"
              rows={4}
              defaultValue={obsTexto}
              onChange={(e) => { obsTexto = e.target.value; }}
              placeholder="Detalle de la acción realizada..."
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <Button variante="secundario" onClick={cerrarModal} disabled={cargandoAccion}>
              Cancelar
            </Button>
            <Button
              variante="primario"
              cargando={cargandoAccion}
              onClick={async () => {
                await ejecutar(async () => {
                  try {
                    await actualizarIncidencia(item.id, { observacion: obsTexto });
                    cerrarModal();
                    await cargar();
                    informar('Guardado', 'Observación registrada correctamente', 'exito');
                  } catch (err) {
                    informar('Error', err.message, 'error');
                  }
                });
              }}
            >
              Guardar acción
            </Button>
          </div>
        </div>
      ),
    });
  };

  const manejarCambiarEstado = (item, nuevoEstado) => {
    confirmar(`¿Cambiar estado de ${item.codigo} a "${nuevoEstado}"?`, async () => {
      await ejecutar(async () => {
        try {
          await cambiarEstadoIncidencia(item.id, nuevoEstado);
          await cargar();
        } catch (err) {
          informar('Error', err.message, 'error');
        }
      });
    }, { titulo: 'Cambiar estado' });
  };

  const manejarEliminar = (item) => {
    confirmar(`¿Eliminar la incidencia ${item.codigo}?`, async () => {
      await ejecutar(async () => {
        try {
          await eliminarIncidencia(item.id);
          await cargar();
          informar('Eliminado', 'Incidencia eliminada correctamente', 'exito');
        } catch (err) {
          informar('Error', err.message, 'error');
        }
      });
    }, { titulo: 'Eliminar incidencia', variante: 'peligro' });
  };

  const exportarIncidencias = async (formato) => {
    await ejecutar(async () => {
      try {
        const nombre = await descargarDirecto('incidencias', formato);
        informar('Descarga exitosa', `El reporte "${nombre}" se descargó correctamente`, 'exito');
      } catch (err) {
        informar('Error', err.message, 'error');
      }
    });
  };

  const columnas = [
    { llave: 'codigo', titulo: 'Código', render: (f) => <strong>{f.codigo}</strong> },
    { llave: 'tipo', titulo: 'Tipo' },
    { llave: 'servicio', titulo: 'Servicio' },
    { llave: 'personal_registra', titulo: 'Registrado por', render: (f) => f.personal_registra || '—' },
    { llave: 'fecha_registro', titulo: 'Fecha y hora', render: (f) => formatearFechaHora(f.fecha_registro) },
    { llave: 'prioridad', titulo: 'Prioridad', render: (f) => <Badge valor={f.prioridad} /> },
    { llave: 'estado', titulo: 'Estado', render: (f) => <Badge valor={f.estado} /> },
    {
      llave: 'acciones', titulo: 'Acciones',
      render: (f) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="accion-btn" onClick={() => abrirObservacion(f)} title="Acciones y observaciones">
            <Icono nombre="actividad" tamano={13} />
          </button>
          {f.estado === 'abierta' && (
            <button className="accion-btn" onClick={() => manejarCambiarEstado(f, 'en_atencion')} title="Atender">
              <Icono nombre="play" tamano={13} />
            </button>
          )}
          {f.estado === 'en_atencion' && (
            <button className="accion-btn" onClick={() => manejarCambiarEstado(f, 'cerrada')} title="Cerrar">
              <Icono nombre="confirmar" tamano={13} />
            </button>
          )}
          <button className="accion-btn" onClick={() => abrirFormulario(f)} title="Editar">
            <Icono nombre="editar" tamano={13} />
          </button>
          <button className="accion-btn accion-btn-peligro" onClick={() => manejarEliminar(f)} title="Eliminar">
            <Icono nombre="eliminar" tamano={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <div className="pagina-encabezado">
        <div>
          <h1 className="pagina-titulo">Incidencias</h1>
          <p className="pagina-subtitulo">Registro y seguimiento de incidencias operativas</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variante="secundario" onClick={() => exportarIncidencias('xlsx')}>
            <Icono nombre="descargar" tamano={14} /> Exportar Excel
          </Button>
          <Button variante="secundario" onClick={() => exportarIncidencias('pdf')}>
            <Icono nombre="descargar" tamano={14} /> Exportar PDF
          </Button>
          <Button variante="primario" onClick={() => abrirFormulario()}>+ Registrar</Button>
        </div>
      </div>

      <div className="grilla-kpi grilla-kpi-3">
        <KpiCard titulo="Abiertas" valor={resumen?.abiertas} color="peligro" cargando={cargando} />
        <KpiCard titulo="En atención" valor={resumen?.en_atencion} color="advertencia" cargando={cargando} />
        <KpiCard titulo="Cerradas" valor={resumen?.cerradas} color="exito" cargando={cargando} />
      </div>

      <div className="grilla-contenido grilla-2-1">
        <div className="tarjeta">
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <Input id="buscar-inc" nombre="q" placeholder="Buscar incidencia..." valor={filtros.q}
              onChange={(e) => setFiltros((f) => ({ ...f, q: e.target.value }))} />
            <Select id="filtro-tipo" nombre="tipoId" valor={filtros.tipoId}
              onChange={(e) => setFiltros((f) => ({ ...f, tipoId: e.target.value }))}
              placeholder="Todos los tipos">
              {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </Select>
            <Select id="filtro-servicio-inc" nombre="servicioId" valor={filtros.servicioId}
              onChange={(e) => setFiltros((f) => ({ ...f, servicioId: e.target.value }))}
              placeholder="Todos los servicios">
              {servicios.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </Select>
            <Select id="filtro-estado-inc" nombre="estado" valor={filtros.estado}
              onChange={(e) => setFiltros((f) => ({ ...f, estado: e.target.value }))}
              placeholder="Todos los estados">
              <option value="abierta">Abierta</option>
              <option value="en_atencion">En atención</option>
              <option value="cerrada">Cerrada</option>
            </Select>
          </div>
          <Table columnas={columnas} datos={incidencias} cargando={cargando} vacio="No se encontraron incidencias con los criterios seleccionados." />
        </div>

        <PanelRecientes items={recientes} cargando={cargando} />
      </div>
    </div>
  );
}
