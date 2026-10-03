import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumenInicio, actividadOperativa, actividadReciente } from '../../api/inicio';
import { KpiCard } from '../../components/ui/KpiCard';
import { useModal } from '../../hooks/useModal';
import { useAuth } from '../../hooks/useAuth';
import { Icono } from '../../components/ui/Icono';
import { formatearFechaHora } from '../../utils/fechas';
import GraficoActividadOperativa from './GraficoActividadOperativa';
import './InicioPage.css';

const ACCESOS = [
  { label: 'Nuevo personal', ruta: '/personal', modal: true, icono: 'personal' },
  { label: 'Asignar turno', ruta: '/turnos', modal: true, icono: 'turnos' },
  { label: 'Registrar incidencia', ruta: '/incidencias', modal: true, icono: 'incidencias' },
  { label: 'Ver servicios', ruta: '/servicios', modal: false, icono: 'servicios' },
];

export default function InicioPage() {
  const [resumen, setResumen] = useState(null);
  const [actividad, setActividad] = useState([]);
  const [recientes, setRecientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();
  const { informar } = useModal();
  const { usuario } = useAuth();

  const esAdmin = usuario?.rol === 'administrador';
  const esOperador = usuario?.rol === 'operador';

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const peticiones = [
          resumenInicio(),
          actividadOperativa(),
        ];
        if (!esOperador) {
          peticiones.push(actividadReciente());
        }

        const [res, act, rec] = await Promise.all(peticiones);
        if (activo) {
          setResumen(res);
          setActividad(act);
          if (rec) setRecientes(rec);
        }
      } catch (err) {
        if (activo) informar('Error', err.message, 'error');
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, [informar, esOperador]);

  return (
    <div className="fade-in">
      <div className="pagina-encabezado">
        <div>
          <h1 className="pagina-titulo">Inicio</h1>
          <p className="pagina-subtitulo">Resumen operativo del día</p>
        </div>
      </div>

      <div className="grilla-kpi grilla-kpi-4">
        <KpiCard titulo="Personal activo" valor={resumen?.personal_activo} variacion={resumen?.personal_nuevo_semana} color="primario" cargando={cargando} />
        <KpiCard titulo="Servicios en curso" valor={resumen?.servicios_en_curso} variacion={resumen?.servicios_nuevos_semana} color="exito" cargando={cargando} />
        <KpiCard titulo="Incidencias abiertas" valor={resumen?.incidencias_abiertas} variacion={resumen?.incidencias_ayer} color="peligro" cargando={cargando} />
        <KpiCard titulo="T. prom. atención" valor={resumen?.tiempo_prom_atencion ? `${resumen.tiempo_prom_atencion} min` : null} color="advertencia" cargando={cargando} />
      </div>

      <div className={`grilla-contenido ${esAdmin ? 'grilla-2-1' : ''}`}>
        <div className="tarjeta">
          <h3 className="tarjeta-titulo">Actividad operativa</h3>
          <p className="tarjeta-subtitulo">Eventos de las últimas 24 horas</p>
          <GraficoActividadOperativa datos={actividad} cargando={cargando} />
        </div>

        {esAdmin && (
          <div className="tarjeta">
            <h3 className="tarjeta-titulo">Accesos rápidos</h3>
            <div className="accesos-grid">
              {ACCESOS.map((a) => (
                <button
                  key={a.ruta}
                  className="acceso-btn"
                  onClick={() => navigate(a.ruta, a.modal ? { state: { abrirModal: true } } : undefined)}
                >
                  <span className="acceso-emoji" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icono nombre={a.icono} tamano={20} />
                  </span>
                  <span className="acceso-label">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {!esOperador && (
        <div className="tarjeta">
          <h3 className="tarjeta-titulo" style={{ marginBottom: 12 }}>Actividad reciente</h3>
          {recientes.length === 0 ? (
            <p style={{ color: 'var(--color-texto-tenue)', fontSize: 'var(--tam-sm)' }}>Sin actividad reciente</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recientes.map((r, i) => {
                const iconoTipo = r.tipo?.includes('incidencia')
                  ? 'incidencias'
                  : r.tipo?.includes('turno')
                  ? 'turnos'
                  : r.tipo?.includes('servicio')
                  ? 'servicios'
                  : 'personal';

                return (
                  <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--color-borde-suave)', alignItems: 'center' }}>
                    <div className="actividad-icono" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: 'var(--color-fondo-panel)' }}>
                      <Icono nombre={iconoTipo} tamano={16} />
                    </div>
                    <div>
                      <p style={{ fontSize: 'var(--tam-sm)', color: 'var(--color-texto-principal)', margin: 0 }}>{r.descripcion}</p>
                      <p style={{ fontSize: 'var(--tam-xs)', color: 'var(--color-texto-tenue)', margin: '2px 0 0 0' }}>
                        {formatearFechaHora(r.creado_en)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
