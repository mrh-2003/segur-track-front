import {BotonAccion} from '../../components/ui/BotonAccion';
import { useAuth } from '../../hooks/useAuth';
import { useState, useEffect, useCallback } from 'react';
import { useModal } from '../../hooks/useModal';
import { useAsync } from '../../hooks/useAsync';
import {
  listarClientes, resumenClientes, crearCliente,
  actualizarCliente, eliminarCliente,
} from '../../api/clientes';
import { KpiCard } from '../../components/ui/KpiCard';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatearFecha } from '../../utils/fechas';
import FormCliente from './FormCliente';

const DEBOUNCE_MS = 300;

export default function ClientesPage() {
  const {usuario}=useAuth();
  const puedeGestionar=['administrador','jefe_operaciones'].includes(usuario?.rol);
  const [clientes, setClientes] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const { abrirModal, cerrarModal, confirmar, informar } = useModal();
  const { cargando: cargandoAccion, ejecutar } = useAsync();

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [lista, res] = await Promise.all([
        listarClientes({ q: busqueda }),
        resumenClientes(),
      ]);
      setClientes(lista || []);
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
      titulo: item ? 'Editar cliente' : 'Nuevo cliente',
      contenido: (
        <FormCliente
          inicial={item}
          onGuardar={async (datos) => {
            await ejecutar(async () => {
              try {
                if (item) {
                  await actualizarCliente(item.id, datos);
                } else {
                  await crearCliente(datos);
                }
                cerrarModal();
                await cargar();
                informar('Operación exitosa', item ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente', 'exito');
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
    confirmar(`¿Eliminar el cliente "${item.nombre}"?`, async () => {
      await ejecutar(async () => {
        try {
          await eliminarCliente(item.id);
          await cargar();
          informar('Eliminado', 'Cliente eliminado correctamente', 'exito');
        } catch (err) {
          informar('Error', err.message, 'error');
        }
      });
    }, { titulo: 'Eliminar cliente', variante: 'peligro' });
  };

  const columnas = [
    { llave: 'nombre', titulo: 'Nombre', render: (f) => <strong>{f.nombre}</strong> },
    { llave: 'contacto', titulo: 'Contacto', render: (f) => f.contacto || '—' },
    { llave: 'servicios_activos', titulo: 'Servicios activos', render: (f) => `${f.servicios_activos ?? 0} activos` },
    { llave: 'servicios_total', titulo: 'Total servicios', render: (f) => `${f.servicios_total ?? 0} servicios` },
    { llave: 'creado_en', titulo: 'Fecha de registro', render: (f) => formatearFecha(f.creado_en) },
    {
      llave: 'acciones', titulo: 'Acciones',
      render: (f) => (
        <div className="tabla-acciones">
          <BotonAccion etiqueta="Editar cliente" icono="editar" onClick={() => abrirFormulario(f)}/>
          <BotonAccion etiqueta="Eliminar cliente" icono="eliminar" peligro onClick={() => manejarEliminar(f)}/>
        </div>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <div className="pagina-encabezado">
        <div>
          <h1 className="pagina-titulo">Clientes</h1>
          <p className="pagina-subtitulo">Gestión de cuentas y empresas cliente</p>
        </div>
        {puedeGestionar && <Button variante="primario" onClick={() => abrirFormulario()}>+ Nuevo cliente</Button>}
      </div>

      <div className="grilla-kpi grilla-kpi-3" style={{ marginBottom: 24 }}>
        <KpiCard titulo="Total clientes" valor={resumen?.total} color="primario" cargando={cargando} />
        <KpiCard titulo="Servicios activos" valor={resumen?.servicios_activos} color="exito" cargando={cargando} />
        <KpiCard titulo="Servicios finalizados" valor={resumen?.servicios_finalizados} color="info" cargando={cargando} />
      </div>

      <div className="tarjeta">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, maxWidth: 360, width: '100%' }}>
          <Input
            id="buscar-clientes"
            nombre="busqueda"
            placeholder="Buscar por nombre o contacto..."
            valor={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <Table
          columnas={puedeGestionar ? columnas : columnas.filter(c=>c.llave!=='acciones')}
          datos={clientes}
          cargando={cargando}
          vacio="No se encontraron clientes registrados"
        />
      </div>
    </div>
  );
}
