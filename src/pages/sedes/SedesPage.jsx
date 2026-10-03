import { useState, useEffect, useCallback } from 'react';
import { useModal } from '../../hooks/useModal';
import { useAsync } from '../../hooks/useAsync';
import {
  listarSedes, resumenSedes, crearSede,
  actualizarSede, eliminarSede,
} from '../../api/sedes';
import { KpiCard } from '../../components/ui/KpiCard';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Icono } from '../../components/ui/Icono';
import { formatearFecha } from '../../utils/fechas';
import FormSede from './FormSede';

const DEBOUNCE_MS = 300;

export default function SedesPage() {
  const [sedes, setSedes] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const { abrirModal, cerrarModal, confirmar, informar } = useModal();
  const { cargando: cargandoAccion, ejecutar } = useAsync();

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [lista, res] = await Promise.all([
        listarSedes({ q: busqueda }),
        resumenSedes(),
      ]);
      setSedes(lista || []);
      setResumen(res);
    } finally {
      setCargando(false);
    }
  }, [busqueda]);

  useEffect(() => {
    const t = setTimeout(cargar, busqueda ? DEBOUNCE_MS : 0);
    return () => clearTimeout(t);
  }, [cargar, busqueda]);

  const abrirFormulario = useCallback((item = null) => {
    abrirModal({
      tipo: 'formulario',
      titulo: item ? 'Editar sede' : 'Nueva sede',
      contenido: (
        <FormSede
          inicial={item}
          onGuardar={async (datos) => {
            await ejecutar(async () => {
              try {
                if (item) {
                  await actualizarSede(item.id, datos);
                } else {
                  await crearSede(datos);
                }
                cerrarModal();
                await cargar();
                informar('Operación exitosa', item ? 'Sede actualizada correctamente' : 'Sede creada correctamente', 'exito');
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
  }, [abrirModal, cerrarModal, cargar, cargandoAccion, ejecutar, informar]);

  const manejarEliminar = (item) => {
    confirmar(`¿Eliminar la sede "${item.nombre}"?`, async () => {
      await ejecutar(async () => {
        try {
          await eliminarSede(item.id);
          await cargar();
          informar('Eliminado', 'Sede eliminada correctamente', 'exito');
        } catch (err) {
          informar('Error', err.message, 'error');
        }
      });
    }, { titulo: 'Eliminar sede', variante: 'peligro' });
  };

  const columnas = [
    { llave: 'nombre', titulo: 'Nombre', render: (f) => <strong>{f.nombre}</strong> },
    { llave: 'direccion', titulo: 'Dirección', render: (f) => f.direccion || '—' },
    { llave: 'personal_total', titulo: 'Personal asignado', render: (f) => `${f.personal_total ?? 0} personas` },
    { llave: 'servicios_total', titulo: 'Servicios', render: (f) => `${f.servicios_total ?? 0} servicios` },
    { llave: 'creado_en', titulo: 'Fecha de registro', render: (f) => formatearFecha(f.creado_en) },
    {
      llave: 'acciones', titulo: 'Acciones',
      render: (f) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="accion-btn" onClick={() => abrirFormulario(f)} title="Editar sede">
            <Icono nombre="editar" tamano={14} />
          </button>
          <button className="accion-btn accion-btn-peligro" onClick={() => manejarEliminar(f)} title="Eliminar sede">
            <Icono nombre="eliminar" tamano={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <div className="pagina-encabezado">
        <div>
          <h1 className="pagina-titulo">Sedes</h1>
          <p className="pagina-subtitulo">Gestión de sedes e instalaciones operativas</p>
        </div>
        <Button variante="primario" onClick={() => abrirFormulario()}>+ Nueva sede</Button>
      </div>

      <div className="grilla-kpi grilla-kpi-3" style={{ marginBottom: 24 }}>
        <KpiCard titulo="Total sedes" valor={resumen?.total} color="primario" cargando={cargando} />
        <KpiCard titulo="Personal en sedes" valor={resumen?.total_personal} color="exito" cargando={cargando} />
        <KpiCard titulo="Servicios activos" valor={resumen?.servicios_activos} color="morado" cargando={cargando} />
      </div>

      <div className="tarjeta">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, maxWidth: 360, width: '100%' }}>
          <Input
            id="buscar-sedes"
            nombre="busqueda"
            placeholder="Buscar por nombre o dirección..."
            valor={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <Table
          columnas={columnas}
          datos={sedes}
          cargando={cargando}
          vacio="No se encontraron sedes registradas"
        />
      </div>
    </div>
  );
}
