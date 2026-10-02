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
import { KpiCard } from '../../components/ui/KpiCard';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import FormIncidencia from './FormIncidencia';
import './IncidenciasPage.css';

const DEBOUNCE_MS = 300;

export default function IncidenciasPage() {
  const [incidencias, setIncidencias] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [recientes, setRecientes] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ q: '', tipoId: '', estado: '' });
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

      const [lista, res, listRecientes, listTipos, listServicios] = await Promise.all([
        listarIncidencias(params),
        resumenIncidencias(),
        incidenciasRecientes(),
        listarTiposIncidencia(),
        listarServicios(),
      ]);
      setIncidencias(lista);
      setResumen(res);
      setRecientes(listRecientes);
      setTipos(listTipos);
      setServicios(listServicios);
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
                if (item) await actualizarIncidencia(item.id, datos);
                else await crearIncidencia(datos);
                cerrarModal();
                await cargar();
                informar('Operación exitosa', item ? 'Incidencia actualizada' : 'Incidencia registrada', 'exito');
              } catch (err) { informar('Error', err.message, 'error'); }
            });
          }}
          onCancelar={cerrarModal}
          cargando={cargandoAccion}
        />
      ),
    });
  }, [abrirModal, cerrarModal, cargar, cargandoAccion, ejecutar, informar, tipos, servicios]);

  useEffect(() => {
    if (location.state?.abrirModal && tipos.length > 0 && servicios.length > 0) {
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => {
        abrirFormulario();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [location.state, tipos.length, servicios.length, abrirFormulario]);

  const manejarCambiarEstado = (item, estado) => {
    confirmar(
      `¿Cambiar estado de ${item.codigo} a "${estado}"?`,
      async () => {
        await ejecutar(async () => {
          try {
            await cambiarEstadoIncidencia(item.id, estado);
            await cargar();
          } catch (err) { informar('Error', err.message, 'error'); }
        });
      },
      { titulo: 'Cambiar estado de incidencia' }
    );
  };

  const manejarEliminar = (item) => {
    confirmar(
      `¿Eliminar la incidencia ${item.codigo}?`,
      async () => {
        await ejecutar(async () => {
          try {
            await eliminarIncidencia(item.id);
            await cargar();
          } catch (err) { informar('Error', err.message, 'error'); }
        });
      },
      { titulo: 'Eliminar incidencia', variante: 'peligro' }
    );
  };

  const columnas = [
    { llave: 'codigo',   titulo: 'Código', render: (f) => <strong>{f.codigo}</strong> },
    { llave: 'tipo',     titulo: 'Tipo' },
    { llave: 'servicio', titulo: 'Servicio' },
    { llave: 'fecha_registro', titulo: 'Fecha', render: (f) => new Date(f.fecha_registro).toLocaleDateString('es-PE') },
    { llave: 'estado',   titulo: 'Estado', render: (f) => <Badge valor={f.estado} /> },
    { llave: 'prioridad', titulo: 'Prioridad', render: (f) => <Badge valor={f.prioridad} /> },
    {
      llave: 'acciones', titulo: 'Acciones',
      render: (f) => (
        <div style={{ display: 'flex', gap: 6 }}>
          {f.estado === 'abierta' && (
            <button className="accion-btn" onClick={() => manejarCambiarEstado(f, 'en_atencion')} title="Atender">▶</button>
          )}
          {f.estado === 'en_atencion' && (
            <button className="accion-btn" onClick={() => manejarCambiarEstado(f, 'cerrada')} title="Cerrar">✓</button>
          )}
          <button className="accion-btn" onClick={() => abrirFormulario(f)} title="Editar">✏️</button>
          <button className="accion-btn accion-btn-peligro" onClick={() => manejarEliminar(f)} title="Eliminar">🗑️</button>
        </div>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <div className="pagina-encabezado">
        <div>
          <h1 className="pagina-titulo">Incidencias</h1>
          <p className="pagina-subtitulo">Registro y seguimiento de incidencias</p>
        </div>
        <Button variante="primario" onClick={() => abrirFormulario()}>+ Registrar</Button>
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
            <Select id="filtro-estado-inc" nombre="estado" valor={filtros.estado}
              onChange={(e) => setFiltros((f) => ({ ...f, estado: e.target.value }))}
              placeholder="Todos los estados">
              <option value="abierta">Abierta</option>
              <option value="en_atencion">En atención</option>
              <option value="cerrada">Cerrada</option>
            </Select>
          </div>
          <Table columnas={columnas} datos={incidencias} cargando={cargando} vacio="Sin incidencias registradas" />
        </div>

        <div className="tarjeta">
          <h3 className="tarjeta-titulo">Incidencias recientes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {recientes.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-borde)' }}>
                <div>
                  <p style={{ fontSize: 'var(--tam-sm)', fontWeight: 600 }}>{r.tipo}</p>
                  <p style={{ fontSize: 'var(--tam-xs)', color: 'var(--color-texto-tenue)' }}>
                    {new Date(r.fecha_registro).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <Badge valor={r.prioridad} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
