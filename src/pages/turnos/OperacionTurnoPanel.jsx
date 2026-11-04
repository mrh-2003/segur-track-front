import { useState, useEffect } from 'react';
import { registrarAsistencia, historialTurno } from '../../api/operaciones';
import { Button } from '../../components/ui/Button';
import { formatearFechaHora } from '../../utils/fechas';

const local = (v) =>
  v
    ? new Date(new Date(v).getTime() - 5 * 3600000).toISOString().slice(0, 16)
    : '';
const iso = (v) => (v ? new Date(v + '-05:00').toISOString() : null);
export default function OperacionTurnoPanel({ turno, usuario, onActualizar }) {
  const gestor = ['administrador', 'jefe_operaciones', 'supervisor'].includes(
    usuario?.rol
  );
  const [historial, setHistorial] = useState([]),
    [error, setError] = useState(''),
    [ocupado, setOcupado] = useState(false);
  const [v, setV] = useState({
    ingresoReal: local(turno.ingreso_real),
    salidaReal: local(turno.salida_real),
    validada: turno.asistencia_validada || false,
    puesto: turno.puesto || turno.sede || '',
    toleranciaMin: turno.tolerancia_min ?? 10,
    evidenciasRequeridas: turno.evidencias_requeridas ?? 1,
    evidenciasRegistradas:
      turno.evidencias_registradas ?? turno.evidencias?.length ?? 0,
    evidenciaLimite: local(turno.evidencia_limite),
    evidenciaRegistro: local(turno.evidencia_registro),
    motivo: '',
  });
  useEffect(() => {
    historialTurno(turno.id)
      .then(setHistorial)
      .catch((e) => setError(e.message));
  }, [turno.id]);
  const guardar = async (datos) => {
    setError('');
    setOcupado(true);
    try {
      const actualizado = await registrarAsistencia(turno.id, datos);
      await onActualizar(actualizado);
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  };
  const campo = (nombre, label, tipo = 'datetime-local') => (
    <label className="campo" key={nombre}>
      {label}
      <input
        className="campo-input"
        type={tipo}
        value={v[nombre]}
        min={tipo === 'number' ? 0 : undefined}
        onChange={(e) =>
          setV({
            ...v,
            [nombre]:
              tipo === 'number' ? Number(e.target.value) : e.target.value,
          })
        }
      />
    </label>
  );
  return (
    <details className="flujo-desplegable">
      <summary>Supervisión y trazabilidad</summary>
      <p className="tarjeta-subtitulo">
        Horarios en Lima. La supervisión verifica las marcaciones; una ausencia
        validada se registra sin ingreso.
      </p>
      {error && (
        <p role="alert" style={{ color: 'var(--color-peligro)' }}>
          {error}
        </p>
      )}
      {gestor && turno.personal_id && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            guardar({
              ...v,
              ingresoReal: iso(v.ingresoReal),
              salidaReal: iso(v.salidaReal),
              evidenciaLimite: iso(v.evidenciaLimite),
              evidenciaRegistro: iso(v.evidenciaRegistro),
            });
          }}
        >
          <div className="form-grilla">
            {campo('puesto', 'Puesto / agencia', 'text')}
            {campo('ingresoReal', 'Ingreso real')}
            {campo('salidaReal', 'Salida real')}
            {campo('toleranciaMin', 'Tolerancia (minutos)', 'number')}
            {campo('evidenciasRequeridas', 'Evidencias exigidas', 'number')}
            {campo(
              'evidenciasRegistradas',
              'Evidencias registradas verificadas',
              'number'
            )}
            {campo('evidenciaLimite', 'Fecha límite de evidencias')}
            {campo('evidenciaRegistro', 'Último registro de evidencias')}
            {campo('motivo', 'Motivo de registro o corrección', 'text')}
          </div>
          <label>
            <input
              type="checkbox"
              checked={v.validada}
              onChange={(e) => setV({ ...v, validada: e.target.checked })}
            />{' '}
            Asistencia revisada y validada
          </label>
          <p className="tarjeta-subtitulo">
            Los contadores históricos requieren verificación. Las fotografías se
            consultan y adjuntan en este mismo detalle.
          </p>
          <Button
            tipo="submit"
            disabled={ocupado || v.motivo.trim().length < 5}
          >
            Guardar revisión
          </Button>
        </form>
      )}
      <h3 className="tarjeta-titulo" style={{ marginTop: 20 }}>
        Trazabilidad
      </h3>
      {!historial.length && (
        <p>Sin movimientos registrados desde la activación del historial.</p>
      )}
      {historial.map((h) => (
        <div
          key={h.id}
          style={{
            borderBottom: '1px solid var(--color-borde)',
            padding: '10px 0',
          }}
        >
          <strong>
            {h.usuario || 'Sistema'} · {formatearFechaHora(h.creado_en)}
          </strong>
          <p>{h.motivo || 'Actualización del turno'}</p>
          {h.anterior?.personal_id !== h.nuevo?.personal_id && (
            <p>
              {h.personal_anterior || 'Sin asignar'} →{' '}
              {h.personal_nuevo || 'Sin asignar'}
            </p>
          )}
          <small>
            {h.anterior?.estado || 'Nuevo'} → {h.nuevo?.estado}
          </small>
        </div>
      ))}
    </details>
  );
}
