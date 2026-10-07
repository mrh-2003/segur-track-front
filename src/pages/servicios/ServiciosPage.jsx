import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useModal } from '../../hooks/useModal';
import { useAsync } from '../../hooks/useAsync';
import {
  listarServicios, resumenServicios, obtenerServicio,
  crearServicio, actualizarServicio, cambiarEstadoServicio,
  eliminarServicio, listarClientes,
} from '../../api/servicios';
import { listarPersonal, listarSedes } from '../../api/personal';
import { KpiCard } from '../../components/ui/KpiCard';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Icono } from '../../components/ui/Icono';
import { formatearFecha } from '../../utils/fechas';
import FormServicio from './FormServicio';
import DetalleRapido from './DetalleRapido';
import ModalDetalleOperativo from './ModalDetalleOperativo';

const DEBOUNCE_MS = 300;

export default function ServiciosPage() {
  const { usuario } = useAuth();
  const [servicios, setServicios] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [soloAsignados, setSoloAsignados] = useState(usuario?.rol === 'operador');
  const [filtros, setFiltros] = useState({ q: '', clienteId: '', estado: '' });
  const [seleccionado, setSeleccionado] = useState(null);
  const { abrirModal, cerrarModal, confirmar, informar } = useModal();
  const { cargando: cargandoAccion, ejecutar } = useAsync();
  const location = useLocation();

  const esSupervisorOAdmin = usuario?.rol === 'administrador' || usuario?.rol === 'jefe_operaciones' || usuario?.rol === 'supervisor';

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = {};
      if (filtros.q) params.q = filtros.q;
      if (filtros.clienteId) params.clienteId = filtros.clienteId;
      if (filtros.estado) params.estado = filtros.estado;
      if (soloAsignados && usuario?.personalId) {
        params.personalId = usuario.personalId;
      }

      const [lista, res, listaClientes, listaPersonal, listaSedes] = await Promise.all([
        listarServicios(params),
        resumenServicios(),
        listarClientes(),
        listarPersonal({ estado: 'activo' }),
        listarSedes(),
      ]);
      setServicios(lista);
      setResumen(res);
      setClientes(listaClientes);
      setPersonal(listaPersonal);
      setSedes(listaSedes);
      if (lista.length > 0 && (!seleccionado || !lista.some((s) => s.id === seleccionado.id))) {
        setSeleccionado(lista[0]);
      } else if (lista.length === 0) {
        setSeleccionado(null);
      }
    } finally {
      setCargando(false);
    }
  }, [filtros, soloAsignados, usuario?.personalId, seleccionado]);

  useEffect(() => {
    const t = setTimeout(cargar, filtros.q ? DEBOUNCE_MS : 0);
    return () => clearTimeout(t);
  }, [cargar, filtros.q]);

  const abrirDetalleOperativo = useCallback((item) => {
    abrirModal({
      tipo: 'formulario',
      titulo: `Detalle operativo: ${item.nombre}`,
      tamano: 'xl',
      sinScrollExterno: true,
      contenido: (
        <ModalDetalleOperativo
          servicioId={item.id}
          onCerrar={cerrarModal}
          informar={informar}
        />
      ),
    });
  }, [abrirModal, cerrarModal, informar]);

  const abrirFormulario = useCallback((item = null) => {
    abrirModal({
      tipo: 'formulario',
      titulo: item ? 'Editar servicio' : 'Nuevo servicio',
      contenido: (
        <FormServicio
          inicial={item}
          clientes={clientes}
          personal={personal}
          sedes={sedes}
          onGuardar={async (datos) => {
            await ejecutar(async () => {
              try {
                if (item) {
                  await actualizarServicio(item.id, datos);
                } else {
                  await crearServicio(datos);
                }
                cerrarModal();
                await cargar();
                informar('Operación exitosa', item ? 'Servicio actualizado correctamente' : 'Servicio creado correctamente', 'exito');
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
  }, [abrirModal, cerrarModal, cargar, cargandoAccion, ejecutar, informar, clientes, personal, sedes]);

  useEffect(() => {
    if (location.state?.abrirModal && clientes.length > 0) {
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => {
        abrirFormulario();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [location.state, clientes.length, abrirFormulario]);

  const manejarVerDetalle = useCallback(async (item) => {
    try {
      const detalle = await obtenerServicio(item.id);
      setSeleccionado(detalle);
    } catch {
      setSeleccionado(item);
    }
  }, []);

  const manejarCambiarEstado = (item) => {
    const siguienteEstado = item.estado === 'programado' ? 'en_curso' : item.estado === 'en_curso' ? 'finalizado' : 'programado';
    confirmar(`¿Cambiar estado del servicio "${item.nombre}" a "${siguienteEstado}"?`, async () => {
      await ejecutar(async () => {
        try {
          await cambiarEstadoServicio(item.id, siguienteEstado);
          await cargar();
        } catch (err) {
          informar('Error', err.message, 'error');
        }
      });
    }, { titulo: 'Cambiar estado' });
  };

  const manejarEliminar = (item) => {
    confirmar(`¿Eliminar el servicio "${item.nombre}"?`, async () => {
      await ejecutar(async () => {
        try {
          await eliminarServicio(item.id);
          if (seleccionado?.id === item.id) setSeleccionado(null);
          await cargar();
          informar('Eliminado', 'Servicio eliminado correctamente', 'exito');
        } catch (err) {
          informar('Error', err.message, 'error');
        }
      });
    }, { titulo: 'Eliminar servicio', variante: 'peligro' });
  };

  const columnas = [
    { llave: 'nombre',     titulo: 'Servicio' },
    { llave: 'cliente',    titulo: 'Cliente' },
    { llave: 'supervisor', titulo: 'Supervisor' },
    {
      llave: 'horario',
      titulo: 'Horario',
      render: (f) => `${f.hora_inicio?.slice(0, 5)} - ${f.hora_fin?.slice(0, 5)}`,
    },
    {
      llave: 'fecha_inicio',
      titulo: 'Fecha inicio',
      render: (f) => formatearFecha(f.fecha_inicio),
    },
    { llave: 'estado',     titulo: 'Estado', render: (f) => <Badge valor={f.estado} /> },
    {
      llave: 'acciones', titulo: 'Acciones',
      render: (f) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="accion-btn" onClick={() => abrirDetalleOperativo(f)} title="Detalle operativo y evidencias">
            <Icono nombre="ojo" tamano={14} />
          </button>
          {esSupervisorOAdmin && (
            <>
              <button className="accion-btn" onClick={() => abrirFormulario(f)} title="Editar servicio">
                <Icono nombre="editar" tamano={14} />
              </button>
              <button className="accion-btn" onClick={() => manejarCambiarEstado(f)} title="Cambiar estado">
                <Icono nombre="estado" tamano={14} />
              </button>
            </>
          )}
          {(usuario?.rol === 'administrador' || usuario?.rol === 'jefe_operaciones') && (
            <button className="accion-btn accion-btn-peligro" onClick={() => manejarEliminar(f)} title="Eliminar servicio">
              <Icono nombre="eliminar" tamano={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const mensajeVacio = soloAsignados
    ? 'No cuenta con servicios asignados.'
    : 'Sin servicios registrados con los criterios seleccionados.';

  return (
    <div className="fade-in">
      <div className="pagina-encabezado">
        <div>
          <h1 className="pagina-titulo">Servicios</h1>
          <p className="pagina-subtitulo">Gestión de servicios de seguridad y lineamientos operativos</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {usuario?.rol === 'operador' && (
            <Button
              variante={soloAsignados ? 'primario' : 'secundario'}
              onClick={() => setSoloAsignados(!soloAsignados)}
            >
              {soloAsignados ? 'Mostrando mis servicios asignados' : 'Filtrar mis servicios asignados'}
            </Button>
          )}
          {esSupervisorOAdmin && (
            <Button variante="primario" onClick={() => abrirFormulario()}>+ Nuevo</Button>
          )}
        </div>
      </div>

      <div className="grilla-kpi grilla-kpi-3">
        <KpiCard titulo="Activos" valor={resumen?.activos} color="primario" cargando={cargando} />
        <KpiCard titulo="Finalizados" valor={resumen?.finalizados} color="neutro" cargando={cargando} />
        <KpiCard titulo="Cumplimiento" valor={resumen?.cumplimiento ? `${resumen.cumplimiento}%` : null} color="exito" cargando={cargando} />
      </div>

      <div className="grilla-contenido grilla-2-1">
        <div className="tarjeta">
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <Input id="buscar-servicios" nombre="q" placeholder="Buscar servicio..." valor={filtros.q}
              onChange={(e) => setFiltros((f) => ({ ...f, q: e.target.value }))} />
            <Select id="filtro-cliente" nombre="clienteId" valor={filtros.clienteId}
              onChange={(e) => setFiltros((f) => ({ ...f, clienteId: e.target.value }))}
              placeholder="Todos los clientes">
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
            <Select id="filtro-estado-servicio" nombre="estado" valor={filtros.estado}
              onChange={(e) => setFiltros((f) => ({ ...f, estado: e.target.value }))}
              placeholder="Todos los estados">
              <option value="programado">Programado</option>
              <option value="en_curso">En curso</option>
              <option value="finalizado">Finalizado</option>
            </Select>
          </div>
          <Table
            columnas={columnas}
            datos={servicios}
            cargando={cargando}
            vacio={mensajeVacio}
            alSeleccionar={(fila) => manejarVerDetalle(fila)}
          />
        </div>

        <DetalleRapido
          servicio={seleccionado}
          onEditar={() => abrirFormulario(seleccionado)}
          onVerDetalleOperativo={() => abrirDetalleOperativo(seleccionado)}
        />
      </div>
    </div>
  );
}
