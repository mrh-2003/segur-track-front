import {BotonAccion} from '../../components/ui/BotonAccion';
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useModal } from '../../hooks/useModal';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../hooks/useAuth';
import {
  listarPersonal, resumenPersonal, crearPersonal,
  actualizarPersonal, cambiarEstadoPersonal, eliminarPersonal,
  reiniciarClavePersonal, listarSedes, cambiarSedePersonal,
} from '../../api/personal';
import { KpiCard } from '../../components/ui/KpiCard';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import FormPersonal from './FormPersonal';
import FormCambioSede from './FormCambioSede';
import './PersonalPage.css';

const DEBOUNCE_MS = 300;

function useDatos() {
  const {usuario}=useAuth();
  const supervisor=usuario?.rol==='supervisor';
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
        supervisor?Promise.resolve(null):resumenPersonal(),
        listarSedes(),
      ]);
      setPersonal(lista);
      setResumen(res);
      setSedes(listaSedes);
    } finally {
      setCargando(false);
    }
  }, [filtros,supervisor]);

  useEffect(() => {
    const t = setTimeout(cargar, filtros.q ? DEBOUNCE_MS : 0);
    return () => clearTimeout(t);
  }, [cargar, filtros.q]);

  return { personal, resumen, sedes, cargando, filtros, setFiltros, cargar };
}

export default function PersonalPage() {
  const { usuario } = useAuth();
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
          puedeGestionarAdministradores={usuario?.rol==='administrador'}
          sedes={sedes}
          onGuardar={async (datos) => {
            await ejecutar(async () => {
              if (item) {
                await actualizarPersonal(item.id, datos);
              } else {
                await crearPersonal(datos);
              }
              cerrarModal();
              await cargar();
              informar('Operación exitosa', item ? 'Personal actualizado correctamente' : 'Personal creado correctamente', 'exito');
            });
          }}
          onCancelar={cerrarModal}
          cargando={cargandoAccion}
        />
      ),
    });
  }, [abrirModal, cerrarModal, cargar, cargandoAccion, ejecutar, informar, sedes,usuario?.rol]);

  useEffect(() => {
    if (location.state?.abrirModal && usuario?.rol!=='supervisor') {
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => {
        abrirFormulario();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [location.state, abrirFormulario,usuario?.rol]);

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

  const manejarReiniciarClave = (item) => {
    confirmar(
      `¿Desea reiniciar la contraseña de ${item.nombres} ${item.apellidos}? Su contraseña volverá a ser su correo (${item.correo}) y se le obligará a crear una nueva contraseña en su próximo inicio de sesión.`,
      async () => {
        await ejecutar(async () => {
          try {
            const resp = await reiniciarClavePersonal(item.id);
            informar('Contraseña reiniciada', resp.mensaje || 'Contraseña reiniciada correctamente a su correo corporativo.', 'exito');
            await cargar();
          } catch (err) {
            informar('Error', err.message, 'error');
          }
        });
      },
      { titulo: 'Reiniciar contraseña', variante: 'primario', labelConfirmar: 'Reiniciar' }
    );
  };

  const cambiarSede = (item) => {
    abrirModal({tipo:'formulario',titulo:'Cambiar sede del agente',contenido:<FormCambioSede agente={item} sedes={sedes} onCancelar={cerrarModal} onGuardar={async sedeId=>{await cambiarSedePersonal(item.id,sedeId);cerrarModal();await cargar();}}/>});
  };
  const columnas = [
    {
      llave: 'nombre_completo',
      titulo: 'Nombre',
      render: (f) => (
        <div>
          <div style={{ fontWeight: 600 }}>{f.nombres} {f.apellidos}</div>
          <div style={{ fontSize: 'var(--tam-xs)', color: 'var(--color-texto-tenue)' }}>{f.correo || f.documento}</div>
        </div>
      ),
    },
    { llave: 'documento', titulo: 'Documento' },
    { llave: 'cargo', titulo: 'Cargo', render: (f) => <span style={{ textTransform: 'capitalize' }}>{f.cargo}</span> },
    { llave: 'sede', titulo: 'Sedes asignadas', render: (f) => f.sedes?.join(', ') || f.sede || 'Sin asignación' },
    { llave: 'turno_actual', titulo: 'Turno actual', render: (f) => f.turno_actual || <span style={{ color: 'var(--color-texto-tenue)' }}>—</span> },
    { llave: 'estado', titulo: 'Estado', render: (f) => <Badge valor={f.estado} /> },
    {
      llave: 'acciones', titulo: 'Acciones',
      render: (f) => f.cargo==='administrador'&&usuario?.rol!=='administrador'?<span className="pagina-subtitulo">Solo administrador</span>:(
        <div className="tabla-acciones">
          {usuario?.rol!=='supervisor'&&<BotonAccion etiqueta="Editar" icono="editar" onClick={() => abrirFormulario(f)}/>}
          {f.cargo==='agente'&&<BotonAccion etiqueta="Cambiar sede" icono="sede" onClick={()=>cambiarSede(f)}/>}
          {(usuario?.rol === 'administrador' || usuario?.rol === 'jefe_operaciones') && (
            <BotonAccion etiqueta="Reiniciar contraseña (volverá a ser su usuario y contraseña)" icono="clave" onClick={() => manejarReiniciarClave(f)}/>
          )}
          {usuario?.rol!=='supervisor'&&<><BotonAccion etiqueta="Cambiar estado" icono="estado" onClick={() => manejarCambiarEstado(f)}/>
          <BotonAccion etiqueta="Eliminar" icono="eliminar" peligro onClick={() => manejarEliminar(f)}/></>}
        </div>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <div className="pagina-encabezado">
        <div>
          <h1 className="pagina-titulo">Personal</h1>
          <p className="pagina-subtitulo">{usuario?.rol==='supervisor'?'Agentes de tus servicios y sedes asignadas':'Gestión de agentes y supervisores'}</p>
        </div>
        <div className="pagina-acciones">
          {usuario?.rol!=='supervisor'&&<Button variante="primario" onClick={() => abrirFormulario()}>+ Nuevo personal</Button>}
        </div>
      </div>

      {usuario?.rol!=='supervisor'&&<div className="grilla-kpi grilla-kpi-4" style={{ marginBottom: 24 }}>
        <KpiCard titulo="Total personal" valor={resumen?.total} color="primario" cargando={cargando} />
        <KpiCard titulo="Activos" valor={resumen?.activos} variacion={resumen?.personal_nuevo_semana} color="exito" cargando={cargando} />
        <KpiCard titulo="Inactivos" valor={resumen?.inactivos} color="advertencia" cargando={cargando} />
        <KpiCard titulo="Supervisores / Agentes" valor={resumen ? `${resumen.supervisores} / ${resumen.agentes}` : null} color="morado" cargando={cargando} />
      </div>}

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
