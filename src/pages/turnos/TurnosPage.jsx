import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useModal } from '../../hooks/useModal';
import { useAuth } from '../../hooks/useAuth';
import {
  listarTurnos,
  crearTurno,
  confirmarTurno,
  cumplirTurno,
  rechazarTurno,
  reasignarTurno,
  eliminarTurno,
} from '../../api/turnos';
import { catalogosOperativos } from '../../api/operaciones';
import { KpiCard } from '../../components/ui/KpiCard';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import FormTurno from './FormTurno';
import ModalDetalleTurno from './ModalDetalleTurno';
import './TurnosPage.css';
const ymd = (d) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
const desplazar = (fecha, n) =>
  ymd(new Date(new Date(fecha + 'T12:00:00-05:00').getTime() + n * 86400000));
export default function TurnosPage() {
  const [desde, setDesde] = useState(() => ymd(new Date())),
    [hasta, setHasta] = useState(() => desplazar(ymd(new Date()), 6)),
    [vista, setVista] = useState('calendario'),
    [estado, setEstado] = useState(''),
    [sede, setSede] = useState(''),
    [turnos, setTurnos] = useState([]),
    [catalogo, setCatalogo] = useState({
      personal: [],
      sedes: [],
      servicios: [],
    }),
    [servicios, setServicios] = useState([]),
    [error, setError] = useState(''),
    [cargando, setCargando] = useState(true);
  const { usuario } = useAuth(),
    { abrirModal, cerrarModal, informar, confirmar } = useModal(),
    location = useLocation();
  const gestor = ['administrador', 'jefe_operaciones', 'supervisor'].includes(
    usuario?.rol
  );
  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const t = await listarTurnos({
        desde,
        hasta,
        ...(sede ? { sedeId: sede } : {}),
      });
      setTurnos(t);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [desde, hasta, sede]);
  useEffect(() => {
    let activo = true;
    Promise.resolve().then(() => {
      if (activo) void cargar();
    });
    return () => {
      activo = false;
    };
  }, [cargar]);
  useEffect(() => {
    if (gestor)
      catalogosOperativos()
        .then((c) => {
          setCatalogo(c);
          setServicios(c.servicios);
        })
        .catch((e) => setError(e.message));
  }, [gestor]);
  const accion = async (fn) => {
    try {
      await fn();
      cerrarModal();
      await cargar();
    } catch (e) {
      informar('No se pudo completar', e.message, 'error');
    }
  };
  const actualizarDetalle = async (fn) => {
    const resultado = await fn();
    await cargar();
    return resultado;
  };
  const detalle = (t) =>
    abrirModal({
      tipo: 'formulario',
      titulo: 'Detalle del turno',
      contenido: (
        <ModalDetalleTurno
          turno={t}
          usuario={usuario}
          personal={catalogo.personal}
          onConfirmar={(x) => actualizarDetalle(() => confirmarTurno(x.id))}
          onCumplir={(x, ev) => actualizarDetalle(() => cumplirTurno(x.id, ev))}
          onRechazar={(x, m) => actualizarDetalle(() => rechazarTurno(x.id, m))}
          onReasignar={(x, p, m) => actualizarDetalle(() => reasignarTurno(x.id, p, m))}
          onEliminar={(x) =>
            confirmar('¿Eliminar este turno?', () =>
              accion(() => eliminarTurno(x.id))
            )
          }
          onActualizar={cargar}
          onCerrar={cerrarModal}
          cargando={false}
        />
      ),
    });
  const formulario = useCallback(
    () =>
      abrirModal({
        tipo: 'formulario',
        titulo: 'Programar turno o plaza sin cubrir',
        contenido: (
          <FormTurno
            personal={catalogo.personal}
            servicios={servicios}
            sedes={catalogo.sedes}
            onCancelar={cerrarModal}
            onGuardar={async (d) => {
              try {
                await crearTurno(d);
                cerrarModal();
                await cargar();
              } catch (e) {
                informar('No se pudo programar', e.message, 'error');
              }
            }}
          />
        ),
      }),
    [abrirModal, catalogo, servicios, cerrarModal, cargar, informar]
  );
  useEffect(() => {
    if (location.state?.abrirModal && gestor && catalogo.sedes.length) {
      window.history.replaceState({}, document.title);
      const t = setTimeout(formulario, 0);
      return () => clearTimeout(t);
    }
  }, [location.state, gestor, catalogo.sedes.length, formulario]);
  const filtrados = turnos.filter(
    (t) =>
      !estado ||
      t.estado === estado ||
      (estado === 'sin_cubrir' && (!t.personal_id || t.relevo_pendiente))
  );
  const dias = Array.from(
    {
      length: Math.min(
        31,
        Math.max(
          1,
          Math.round((new Date(hasta) - new Date(desde)) / 86400000) + 1
        )
      ),
    },
    (_, i) => desplazar(desde, i)
  );
  const columnas = [
    { llave: 'fecha', titulo: 'Fecha' },
    {
      llave: 'horario',
      titulo: 'Horario',
      render: (t) => `${t.hora_inicio.slice(0, 5)}–${t.hora_fin.slice(0, 5)}`,
    },
    {
      llave: 'personal',
      titulo: 'Personal',
      render: (t) => t.personal?.trim() || 'Sin asignar',
    },
    { llave: 'servicio', titulo: 'Servicio' },
    {
      llave: 'puesto',
      titulo: 'Puesto / agencia',
      render: (t) => t.puesto || t.sede,
    },
    {
      llave: 'estado',
      titulo: 'Estado',
      render: (t) => <Badge valor={t.estado} />,
    },
    {
      llave: 'acciones',
      titulo: 'Acciones',
      render: (t) => (
        <Button tipo="button" variante="secundario" onClick={() => detalle(t)}>
          Ver detalle
        </Button>
      ),
    },
  ];
  return (
    <div className="fade-in">
      <div className="pagina-encabezado">
        <div>
          <h1 className="pagina-titulo">Turnos</h1>
          <p className="pagina-subtitulo">
            Programación, asistencia, cobertura y trazabilidad
          </p>
        </div>
        {gestor && (
          <Button tipo="button" onClick={formulario}>
            Programar turno
          </Button>
        )}
      </div>
      <div className="grilla-kpi grilla-kpi-3">
        <KpiCard titulo="Turnos del periodo" valor={turnos.length} />
        <KpiCard
          titulo="Cumplidos"
          valor={turnos.filter((t) => t.estado === 'cumplido').length}
          color="exito"
        />
        <KpiCard
          titulo="Sin agente / relevo pendiente"
          valor={
            turnos.filter((t) => !t.personal_id || t.relevo_pendiente).length
          }
          color="advertencia"
        />
      </div>
      <section className="tarjeta">
        <div className="form-grilla">
          <label>
            Desde
            <input
              className="campo-input"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
            />
          </label>
          <label>
            Hasta
            <input
              className="campo-input"
              type="date"
              value={hasta}
              min={desde}
              onChange={(e) => setHasta(e.target.value)}
            />
          </label>
          <label>
            Sede
            <select
              className="campo-input"
              value={sede}
              onChange={(e) => setSede(e.target.value)}
            >
              <option value="">Todas</option>
              {catalogo.sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estado
            <select
              className="campo-input"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="cumplido">Cumplido</option>
              <option value="pendiente">Pendiente</option>
              <option value="sin_confirmar">Por confirmar</option>
              <option value="confirmado">Confirmado</option>
              <option value="programado">Programado</option>
              <option value="sin_cubrir">Sin cubrir / relevo</option>
            </select>
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
          <Button
            tipo="button"
            variante={vista === 'calendario' ? 'primario' : 'secundario'}
            onClick={() => setVista('calendario')}
          >
            Calendario
          </Button>
          <Button
            tipo="button"
            variante={vista === 'tabla' ? 'primario' : 'secundario'}
            onClick={() => setVista('tabla')}
          >
            Tabla
          </Button>
        </div>
        {error && <p role="alert">{error}</p>}
        {vista === 'tabla' ? (
          <Table columnas={columnas} datos={filtrados} cargando={cargando} />
        ) : (
          <>
            <p className="tarjeta-subtitulo">
              Cada día muestra todos los turnos. El calendario admite hasta 31
              días; use la tabla para periodos mayores.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
                gap: 12,
              }}
            >
              {dias.map((d) => (
                <section
                  key={d}
                  style={{
                    padding: 12,
                    background: 'var(--color-fondo-alt)',
                    borderRadius: 'var(--radio-md)',
                  }}
                >
                  <h3>
                    {new Date(d + 'T12:00:00-05:00').toLocaleDateString(
                      'es-PE',
                      {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        timeZone: 'America/Lima',
                      }
                    )}
                  </h3>
                  {filtrados
                    .filter((t) => t.fecha === d)
                    .map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => detalle(t)}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          marginTop: 10,
                          padding: 12,
                          border: '1px solid var(--color-borde)',
                          borderRadius: 'var(--radio-sm)',
                          background: 'var(--color-superficie)',
                          color: 'var(--color-texto-principal)',
                          cursor: 'pointer',
                        }}
                      >
                        <strong>{t.personal?.trim() || 'Sin asignar'}</strong>
                        <p>{t.servicio}</p>
                        <p>{t.puesto || t.sede}</p>
                        <small>
                          {t.hora_inicio.slice(0, 5)}–{t.hora_fin.slice(0, 5)}
                        </small>
                        <div style={{ marginTop: 6 }}>
                          <Badge valor={t.estado} />
                        </div>
                      </button>
                    ))}
                </section>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
