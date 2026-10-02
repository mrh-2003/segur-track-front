import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumenInicio, actividadOperativa, actividadReciente } from '../../api/inicio';
import { KpiCard } from '../../components/ui/KpiCard';
import { useModal } from '../../hooks/useModal';
import GraficoActividadOperativa from './GraficoActividadOperativa';
import './InicioPage.css';

const ACCESOS = [
  { label: 'Nuevo personal',       ruta: '/personal',    modal: true,  emoji: '👤' },
  { label: 'Asignar turno',        ruta: '/turnos',      modal: true,  emoji: '🗓️' },
  { label: 'Registrar incidencia', ruta: '/incidencias', modal: true,  emoji: '⚠️' },
  { label: 'Ver servicios',        ruta: '/servicios',   modal: false, emoji: '🛡️' },
];

export default function InicioPage() {
  const [resumen, setResumen] = useState(null);
  const [actividad, setActividad] = useState([]);
  const [recientes, setRecientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();
  const { informar } = useModal();

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const [res, act, rec] = await Promise.all([
          resumenInicio(),
          actividadOperativa(),
          actividadReciente(),
        ]);
        if (activo) {
          setResumen(res);
          setActividad(act);
          setRecientes(rec);
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
  }, [informar]);

  return (
    <div className="fade-in">
      <div className="pagina-encabezado">
        <div>
          <h1 className="pagina-titulo">Inicio</h1>
          <p className="pagina-subtitulo">Resumen operativo del día</p>
        </div>
      </div>

      <div className="grilla-kpi grilla-kpi-4">
        <KpiCard titulo="Personal activo"    valor={resumen?.personal_activo}    variacion={resumen?.personal_nuevo_semana}   color="primario"    cargando={cargando} />
        <KpiCard titulo="Servicios en curso" valor={resumen?.servicios_en_curso}  variacion={resumen?.servicios_nuevos_semana}  color="exito"       cargando={cargando} />
        <KpiCard titulo="Incidencias abiertas" valor={resumen?.incidencias_abiertas} variacion={resumen?.incidencias_ayer}     color="peligro"     cargando={cargando} />
        <KpiCard titulo="T. prom. atención"  valor={resumen?.tiempo_prom_atencion ? `${resumen.tiempo_prom_atencion} min` : null} color="advertencia" cargando={cargando} />
      </div>

      <div className="grilla-contenido grilla-2-1">
        <div className="tarjeta">
          <h3 className="tarjeta-titulo">Actividad operativa</h3>
          <p className="tarjeta-subtitulo">Eventos de las últimas 24 horas</p>
          <GraficoActividadOperativa datos={actividad} cargando={cargando} />
        </div>

        <div className="tarjeta">
          <h3 className="tarjeta-titulo">Accesos rápidos</h3>
          <div className="accesos-grid">
            {ACCESOS.map((a) => (
              <button
                key={a.ruta}
                className="acceso-btn"
                onClick={() => navigate(a.ruta, a.modal ? { state: { abrirModal: true } } : undefined)}
              >
                <span className="acceso-emoji">{a.emoji}</span>
                <span className="acceso-label">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="tarjeta">
        <h3 className="tarjeta-titulo" style={{ marginBottom: 12 }}>Actividad reciente</h3>
        {recientes.length === 0 ? (
          <p style={{ color: 'var(--color-texto-tenue)', fontSize: 'var(--tam-sm)' }}>Sin actividad reciente</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recientes.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--color-borde-suave)' }}>
                <div className="actividad-icono">
                  {r.tipo?.includes('incidencia') ? '⚠️' : r.tipo?.includes('turno') ? '🗓️' : r.tipo?.includes('servicio') ? '🛡️' : '👤'}
                </div>
                <div>
                  <p style={{ fontSize: 'var(--tam-sm)', color: 'var(--color-texto-principal)' }}>{r.descripcion}</p>
                  <p style={{ fontSize: 'var(--tam-xs)', color: 'var(--color-texto-tenue)', marginTop: 2 }}>
                    {new Date(r.creado_en).toLocaleString('es-PE')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
