import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useModal } from '../../hooks/useModal';
import { useAsync } from '../../hooks/useAsync';
import {
  listarPersonal, resumenPersonal, crearPersonal,
  actualizarPersonal, cambiarEstadoPersonal, eliminarPersonal, listarSedes,
} from '../../api/personal';
import { KpiCard } from '../../components/ui/KpiCard';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import FormPersonal from './FormPersonal';
import './PersonalPage.css';

const DEBOUNCE_MS = 300;

function useDatos() {
  const [personal, setPersonal] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [sedes, setSedes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ q: '', estado: '' });

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [lista, res, listaSedes] = await Promise.all([
        listarPersonal({ q: filtros.q, estado: filtros.estado }),
        resumenPersonal(),
        listarSedes(),
      ]);
      setPersonal(lista);
      setResumen(res);
      setSedes(listaSedes);
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  useEffect(() => {
    const t = setTimeout(cargar, filtros.q ? DEBOUNCE_MS : 0);
    return () => clearTimeout(t);
  }, [cargar, filtros.q]);

  return { personal, resumen, sedes, cargando, filtros, setFiltros, cargar };
}

export default function PersonalPage() {
  const { personal, resumen, sedes, cargando, filtros, setFiltros, cargar } = useDatos();
  const { abrirModal, cerrarModal, confirmar, informar } = useModal();
  const { cargando: cargandoAccion, ejecutar } = useAsync();
  const location = useLocation();

  const abrirFormulario = useCallback((item = null) => {
    abrirModal({
      tipo: 'formulario',
      titulo: item ? 'Editar personal' : 'Nuevo personal',
      contenido: (
        <FormPersonal
          inicial={item}
          sedes={sedes}
          onGuardar={async (datos) => {
            await ejecutar(async () => {
              try {
                if (item) {
                  await actualizarPersonal(item.id, datos);
                } else {
                  await crearPersonal(datos);
                }
                cerrarModal();
                await cargar();
                informar('Operación exitosa', item ? 'Personal actualizado correctamente' : 'Personal creado correctamente', 'exito');
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
  }, [abrirModal, cerrarModal, cargar, cargandoAccion, ejecutar, informar, sedes]);

  useEffect(() => {
    if (location.state?.abrirModal) {
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => {
        abrirFormulario();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [location.state, abrirFormulario]);

  const manejarEliminar = (item) => {
    confirmar(
      `¿Eliminar a ${item.nombres} ${item.apellidos}? Esta acción no se puede deshacer.`,
      async () => {
        await ejecutar(async () => {
          try {
            await eliminarPersonal(item.id);
            await cargar();
            informar('Eliminado', 'Personal eliminado correctamente', 'exito');
          } catch (err) {
            informar('Error', err.message, 'error');
          }
        });
      },
      { titulo: 'Eliminar personal', variante: 'peligro' }
    );
  };

  const manejarCambiarEstado = (item) => {
    const nuevoEstado = item.estado === 'activo' ? 'inactivo' : 'activo';
    confirmar(
      `¿Cambiar el estado de ${item.nombres} ${item.apellidos} a "${nuevoEstado}"?`,
      async () => {
        await ejecutar(async () => {
          try {
            await cambiarEstadoPersonal(item.id, nuevoEstado);
            await cargar();
          } catch (err) {
            informar('Error', err.message, 'error');
          }
        });
      },
      { titulo: 'Cambiar estado' }
    );
  };

  const columnas = [
    { llave: 'nombre_completo', titulo: 'Nombre', render: (f) => `${f.nombres} ${f.apellidos}` },
    { llave: 'documento', titulo: 'Documento' },
    { llave: 'cargo', titulo: 'Cargo', render: (f) => <span style={{ textTransform: 'capitalize' }}>{f.cargo}</span> },
    { llave: 'turno_actual', titulo: 'Turno actual', render: (f) => f.turno_actual || <span style={{ color: 'var(--color-texto-tenue)' }}>—</span> },
    { llave: 'estado', titulo: 'Estado', render: (f) => <Badge valor={f.estado} /> },
    {
      llave: 'acciones', titulo: 'Acciones',
      render: (f) => (
        <div className="tabla-acciones">
          <button className="accion-btn" onClick={() => abrirFormulario(f)} title="Editar">✏️</button>
          <button className="accion-btn" onClick={() => manejarCambiarEstado(f)} title="Cambiar estado">🔄</button>
          <button className="accion-btn accion-btn-peligro" onClick={() => manejarEliminar(f)} title="Eliminar">🗑️</button>
        </div>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <div className="pagina-encabezado">
        <div>
          <h1 className="pagina-titulo">Personal</h1>
          <p className="pagina-subtitulo">Gestión de agentes y supervisores</p>
        </div>
        <div className="pagina-acciones">
          <Button variante="primario" onClick={() => abrirFormulario()}>+ Nuevo personal</Button>
        </div>
      </div>

      <div className="grilla-kpi grilla-kpi-4" style={{ marginBottom: 24 }}>
        <KpiCard titulo="Total personal" valor={resumen?.total} color="primario" cargando={cargando} />
        <KpiCard titulo="Activos" valor={resumen?.activos} variacion={resumen?.personal_nuevo_semana} color="exito" cargando={cargando} />
        <KpiCard titulo="Inactivos" valor={resumen?.inactivos} color="advertencia" cargando={cargando} />
        <KpiCard titulo="Supervisores / Agentes" valor={resumen ? `${resumen.supervisores} / ${resumen.agentes}` : null} color="morado" cargando={cargando} />
      </div>

      <div className="tarjeta">
        <div className="personal-filtros">
          <Input
            id="buscar-personal"
            nombre="q"
            placeholder="Buscar por nombre, documento..."
            valor={filtros.q}
            onChange={(e) => setFiltros((f) => ({ ...f, q: e.target.value }))}
          />
          <Select
            id="filtro-estado-personal"
            nombre="estado"
            valor={filtros.estado}
            onChange={(e) => setFiltros((f) => ({ ...f, estado: e.target.value }))}
            placeholder="Todos los estados"
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </Select>
        </div>

        <Table
          columnas={columnas}
          datos={personal}
          cargando={cargando}
          vacio="No se encontró personal con los filtros seleccionados"
        />
      </div>
    </div>
  );
}
