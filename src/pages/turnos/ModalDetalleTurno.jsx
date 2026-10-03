import { useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { formatearFecha } from '../../utils/fechas';
import './ModalDetalleTurno.css';

export default function ModalDetalleTurno({
  turno,
  usuario,
  personal = [],
  onConfirmar,
  onRechazar,
  onReasignar,
  onEliminar,
  onCerrar,
  cargando = false,
}) {
  const [modo, setModo] = useState('detalle');
  const [motivo, setMotivo] = useState('');
  const [nuevoPersonalId, setNuevoPersonalId] = useState('');
  const [errorReasignar, setErrorReasignar] = useState('');

  const esAdmin = usuario?.rol === 'administrador';
  const esSupervisor = usuario?.rol === 'supervisor';
  const esAsignado =
    (turno.personal_usuario_id && turno.personal_usuario_id === usuario?.id) ||
    (usuario?.personalId && turno.personal_id === usuario.personalId);

  const puedeGestionar = esAdmin || esSupervisor;
  const puedeResponder = esAsignado || puedeGestionar;

  const personalDisponible = personal.filter((p) => {
    if (p.id === turno.personal_id) return false;
    if (esSupervisor) return p.cargo === 'agente';
    return true;
  });

  const manejarSubmitRechazo = (e) => {
    e.preventDefault();
    onRechazar(turno, motivo);
  };

  const manejarSubmitReasignar = (e) => {
    e.preventDefault();
    if (!nuevoPersonalId) {
      setErrorReasignar('Seleccione el nuevo personal');
      return;
    }
    setErrorReasignar('');
    onReasignar(turno, parseInt(nuevoPersonalId, 10));
  };

  return (
    <div className="modal-detalle-turno">
      <div className="detalle-turno-encabezado">
        <div>
          <h2 className="detalle-turno-servicio">{turno.servicio}</h2>
          <p className="detalle-turno-sede">{turno.sede}</p>
        </div>
        <div>
          {turno.relevo_pendiente ? (
            <Badge variante="peligro">Relevo Pendiente</Badge>
          ) : turno.estado === 'sin_confirmar' ? (
            <Badge variante="advertencia">Sin confirmar</Badge>
          ) : turno.estado === 'pendiente' ? (
            <Badge variante="primario">Turno pendiente</Badge>
          ) : turno.estado === 'cumplido' ? (
            <Badge variante="exito">Cumplido</Badge>
          ) : (
            <Badge valor={turno.estado} />
          )}
        </div>
      </div>

      <div
        className={`bandeja-alerta ${
          turno.relevo_pendiente
            ? 'bandeja-alerta-peligro'
            : turno.estado === 'sin_confirmar'
            ? 'bandeja-alerta-advertencia'
            : turno.estado === 'pendiente'
            ? 'bandeja-alerta-primario'
            : 'bandeja-alerta-exito'
        }`}
      >
        <div className="bandeja-alerta-titulo">
          {turno.relevo_pendiente
            ? 'Bandeja: Supervisor / Administrador (Reasignación pendiente)'
            : turno.estado === 'sin_confirmar'
            ? `Bandeja: ${turno.personal} (Sin confirmar)`
            : turno.estado === 'pendiente'
            ? 'Bandeja: Turno pendiente (Confirmado para ejecución)'
            : 'Bandeja: Turno cumplido y archivado'}
        </div>
        <p className="bandeja-alerta-descripcion">
          {turno.relevo_pendiente
            ? 'El turno fue rechazado por el personal asignado. Está en la bandeja de supervisión para su inmediata reasignación.'
            : turno.estado === 'sin_confirmar'
            ? 'El turno se encuentra en la bandeja del agente asignado en espera de ser confirmado o rechazado.'
            : turno.estado === 'pendiente'
            ? 'El turno fue confirmado exitosamente por el personal y está programado para su inicio.'
            : 'El turno ya ha sido ejecutado en su totalidad.'}
        </p>
        {turno.relevo_pendiente && turno.motivo_rechazo && (
          <p className="bandeja-alerta-motivo">
            <strong>Motivo indicado:</strong> "{turno.motivo_rechazo}"
          </p>
        )}
      </div>

      <div className="detalle-turno-datos">
        <div className="detalle-dato-item">
          <span className="detalle-dato-etiqueta">Personal asignado</span>
          <span className="detalle-dato-valor">{turno.personal}</span>
        </div>
        <div className="detalle-dato-item">
          <span className="detalle-dato-etiqueta">Fecha</span>
          <span className="detalle-dato-valor">{formatearFecha(turno.fecha)}</span>
        </div>
        <div className="detalle-dato-item">
          <span className="detalle-dato-etiqueta">Horario programado</span>
          <span className="detalle-dato-valor">
            {turno.hora_inicio?.slice(0, 5)} — {turno.hora_fin?.slice(0, 5)}
          </span>
        </div>
        <div className="detalle-dato-item">
          <span className="detalle-dato-etiqueta">Asignado por</span>
          <span className="detalle-dato-valor">
            {turno.creador_nombre || 'Administración'}
          </span>
        </div>
      </div>

      {modo === 'rechazando' && (
        <form onSubmit={manejarSubmitRechazo} className="formulario-subaccion">
          <label htmlFor="motivo-rechazo" className="campo-etiqueta">
            Motivo del rechazo (opcional)
          </label>
          <textarea
            id="motivo-rechazo"
            className="input textarea-motivo"
            rows={3}
            placeholder="Indique el motivo por el cual no puede tomar este turno..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
          <div className="form-pie">
            <Button
              variante="secundario"
              tipo="button"
              onClick={() => setModo('detalle')}
              disabled={cargando}
            >
              Volver
            </Button>
            <Button
              variante="peligro"
              tipo="submit"
              cargando={cargando}
            >
              Confirmar rechazo
            </Button>
          </div>
        </form>
      )}

      {modo === 'reasignando' && (
        <form onSubmit={manejarSubmitReasignar} className="formulario-subaccion">
          <Select
            id="nuevo-personal-id"
            label="Nuevo personal a asignar"
            nombre="nuevoPersonalId"
            valor={nuevoPersonalId}
            onChange={(e) => {
              setNuevoPersonalId(e.target.value);
              setErrorReasignar('');
            }}
            error={errorReasignar}
            placeholder="Seleccionar nuevo personal..."
            requerido
          >
            {personalDisponible.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombres} {p.apellidos} ({p.cargo})
              </option>
            ))}
          </Select>
          <div className="form-pie">
            <Button
              variante="secundario"
              tipo="button"
              onClick={() => setModo('detalle')}
              disabled={cargando}
            >
              Volver
            </Button>
            <Button
              variante="primario"
              tipo="submit"
              cargando={cargando}
            >
              Guardar reasignación
            </Button>
          </div>
        </form>
      )}

      {modo === 'detalle' && (
        <div className="detalle-acciones-pie">
          <div className="acciones-izquierda">
            {puedeGestionar && (
              <Button
                variante="peligro"
                tipo="button"
                onClick={() => onEliminar(turno)}
                disabled={cargando}
              >
                Eliminar turno
              </Button>
            )}
          </div>
          <div className="acciones-derecha">
            {turno.estado === 'sin_confirmar' && !turno.relevo_pendiente && puedeResponder && (
              <>
                <Button
                  variante="peligro"
                  tipo="button"
                  onClick={() => setModo('rechazando')}
                  disabled={cargando}
                >
                  Rechazar turno
                </Button>
                <Button
                  variante="exito"
                  tipo="button"
                  onClick={() => onConfirmar(turno)}
                  cargando={cargando}
                >
                  Confirmar turno
                </Button>
              </>
            )}

            {turno.relevo_pendiente && puedeGestionar && (
              <Button
                variante="primario"
                tipo="button"
                onClick={() => setModo('reasignando')}
                disabled={cargando}
              >
                Reasignar turno
              </Button>
            )}

            <Button
              variante="secundario"
              tipo="button"
              onClick={onCerrar}
              disabled={cargando}
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
