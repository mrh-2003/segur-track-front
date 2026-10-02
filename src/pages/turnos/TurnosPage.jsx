import { useState, useEffect, useCallback } from 'react';
import { useModal } from '../../context/ModalContext';
import { useAsync } from '../../hooks/useAsync';
import {
  listarTurnos, resumenTurnos, alertasTurnos,
  crearTurno, confirmarTurno, eliminarTurno, listarSedesTurnos,
} from '../../api/turnos';
import { listarPersonal } from '../../api/personal';
import { listarServicios } from '../../api/servicios';
import { KpiCard } from '../../components/ui/KpiCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import FormTurno from './FormTurno';
import './TurnosPage.css';

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function obtenerSemana(fechaBase) {
  const inicio = new Date(fechaBase);
  const diaSemana = inicio.getDay();
  const diff = diaSemana === 0 ? -6 : 1 - diaSemana;
  inicio.setDate(inicio.getDate() + diff);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 6);
  return {
    desde: inicio.toISOString().slice(0, 10),
    hasta: fin.toISOString().slice(0, 10),
    dias: Array.from({ length: 7 }, (_, i) => {
      const d = new Date(inicio);
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(0, 10);
    }),
  };
}

export default function TurnosPage() {
  const [semanaBase, setSemanaBase] = useState(new Date().toISOString().slice(0, 10));
  const [sedeId, setSedeId] = useState('');
  const [turnos, setTurnos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [alertas, setAlertas] = useState(null);
  const [sedes, setSedes] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { abrirModal, cerrarModal, confirmar, informar } = useModal();
  const { cargando: cargandoAccion, ejecutar } = useAsync();

  const semana = obtenerSemana(semanaBase);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = { desde: semana.desde, hasta: semana.hasta };
      if (sedeId) params.sedeId = sedeId;

      const [listaTurnos, res, alerts, listaSedes, listaPersonal, listaServicios] = await Promise.all([
        listarTurnos(params),
        resumenTurnos(),
        alertasTurnos(),
        listarSedesTurnos(),
        listarPersonal({ estado: 'activo' }),
        listarServicios(),
      ]);
      setTurnos(listaTurnos);
      setResumen(res);
      setAlertas(alerts);
      setSedes(listaSedes);
      setPersonal(listaPersonal);
      setServicios(listaServicios);
    } finally {
      setCargando(false);
    }
  }, [semana.desde, semana.hasta, sedeId]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirFormulario = () => {
    abrirModal({
      tipo: 'formulario',
      titulo: 'Asignar turno',
      contenido: (
        <FormTurno
          personal={personal}
          servicios={servicios}
          sedes={sedes}
          onGuardar={async (datos) => {
            await ejecutar(async () => {
              try {
                await crearTurno(datos);
                cerrarModal();
                await cargar();
                informar('Turno asignado', 'Turno registrado correctamente', 'exito');
              } catch (err) { informar('Error', err.message, 'error'); }
            });
          }}
          onCancelar={cerrarModal}
          cargando={cargandoAccion}
        />
      ),
    });
  };

  const manejarConfirmar = (turno) => {
    confirmar(`¿Confirmar el turno de ${turno.personal}?`, async () => {
      await ejecutar(async () => {
        try {
          await confirmarTurno(turno.id);
          await cargar();
        } catch (err) { informar('Error', err.message, 'error'); }
      });
    }, { titulo: 'Confirmar turno' });
  };

  const manejarEliminar = (turno) => {
    confirmar(`¿Eliminar el turno de ${turno.personal} del ${turno.fecha}?`, async () => {
      await ejecutar(async () => {
        try {
          await eliminarTurno(turno.id);
          await cargar();
        } catch (err) { informar('Error', err.message, 'error'); }
      });
    }, { titulo: 'Eliminar turno', variante: 'peligro' });
  };

  const turnosPorPersona = turnos.reduce((acc, t) => {
    const key = t.personal_id;
    if (!acc[key]) acc[key] = { nombre: t.personal, turnos: {} };
    acc[key].turnos[t.fecha] = t;
    return acc;
  }, {});

  const avanzarSemana = (delta) => {
    const d = new Date(semanaBase);
    d.setDate(d.getDate() + delta * 7);
    setSemanaBase(d.toISOString().slice(0, 10));
  };

  return (
    <div className="fade-in">
      <div className="pagina-encabezado">
        <div>
          <h1 className="pagina-titulo">Turnos</h1>
          <p className="pagina-subtitulo">Planificación y control de turnos</p>
        </div>
        <Button variante="primario" onClick={abrirFormulario}>+ Asignar turno</Button>
      </div>

      <div className="grilla-kpi grilla-kpi-3">
        <KpiCard titulo="Programados" valor={resumen?.programados} color="primario" cargando={cargando} />
        <KpiCard titulo="Cobertura" valor={resumen?.cobertura ? `${resumen.cobertura}%` : null} color="exito" cargando={cargando} />
        <KpiCard titulo="Pendientes" valor={resumen?.pendientes} color="advertencia" cargando={cargando} />
      </div>

      <div className="grilla-contenido grilla-3-1">
        <div className="tarjeta">
          <div className="turnos-controles">
            <button className="turnos-nav-btn" onClick={() => avanzarSemana(-1)} aria-label="Semana anterior">←</button>
            <span className="turnos-semana-label">{semana.desde} — {semana.hasta}</span>
            <button className="turnos-nav-btn" onClick={() => avanzarSemana(1)} aria-label="Semana siguiente">→</button>
            <Select id="filtro-sede-turnos" nombre="sedeId" valor={sedeId}
              onChange={(e) => setSedeId(e.target.value)} placeholder="Todas las sedes">
              {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </Select>
          </div>

          <div className="turnos-grilla-contenedor">
            <table className="turnos-tabla">
              <thead>
                <tr>
                  <th className="turnos-th-persona">Personal</th>
                  {semana.dias.map((dia, i) => (
                    <th key={dia} className="turnos-th-dia">
                      <div>{DIAS[i]}</div>
                      <div className="turnos-dia-fecha">{dia.slice(8)}</div>
                    </th>
                  ))}
                  <th className="turnos-th-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--color-texto-tenue)' }}>Cargando...</td></tr>
                ) : Object.keys(turnosPorPersona).length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--color-texto-tenue)' }}>Sin turnos en esta semana</td></tr>
                ) : (
                  Object.values(turnosPorPersona).map((p) => (
                    <tr key={p.nombre} className="turnos-tr">
                      <td className="turnos-td-persona">{p.nombre}</td>
                      {semana.dias.map((dia) => {
                        const t = p.turnos[dia];
                        return (
                          <td key={dia} className="turnos-td-dia">
                            {t && (
                              <div className={`turno-chip turno-chip-${t.estado}`}>
                                {t.hora_inicio.slice(0, 5)}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="turnos-td-acciones">
                        {Object.values(p.turnos).slice(0, 1).map((t) => (
                          <div key={t.id} style={{ display: 'flex', gap: 4 }}>
                            {t.estado === 'sin_confirmar' && (
                              <button className="accion-btn" onClick={() => manejarConfirmar(t)} title="Confirmar">✓</button>
                            )}
                            <button className="accion-btn accion-btn-peligro" onClick={() => manejarEliminar(t)} title="Eliminar">🗑️</button>
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="tarjeta">
          <h3 className="tarjeta-titulo">Alertas del día</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            <div className="alerta-item alerta-advertencia">
              <p className="alerta-titulo">Sin confirmar</p>
              <p className="alerta-valor">{alertas?.sin_confirmar ?? 0}</p>
            </div>
            <div className="alerta-item alerta-peligro">
              <p className="alerta-titulo">Relevo pendiente</p>
              <p className="alerta-valor">{alertas?.relevo_pendiente ?? 0}</p>
            </div>
            <div className="alerta-item alerta-info">
              <p className="alerta-titulo">Turnos pendientes</p>
              <p className="alerta-valor">{alertas?.pendientes ?? 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
