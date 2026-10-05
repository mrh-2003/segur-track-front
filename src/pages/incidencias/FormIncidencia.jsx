import { useForm } from '../../hooks/useForm';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

const validar = (v) => {
  const e = {};
  if (!v.tipoIncidenciaId) e.tipoIncidenciaId = 'Seleccione un tipo';
  if (!v.servicioId) e.servicioId = 'Seleccione un servicio';
  if (!v.descripcion || v.descripcion.length < 10) e.descripcion = 'Descripción mínima 10 caracteres';
  if (!v.prioridad) e.prioridad = 'Seleccione prioridad';
  return e;
};

export default function FormIncidencia({ inicial, tipos, servicios, onGuardar, onCancelar, cargando }) {
  const { valores, errores, manejarCambio, manejarBlur, validarTodo } = useForm(
    {
      tipoIncidenciaId: inicial?.tipo_incidencia_id
        ? String(inicial.tipo_incidencia_id)
        : (inicial?.tipoIncidenciaId ? String(inicial.tipoIncidenciaId) : ''),
      servicioId: inicial?.servicio_id
        ? String(inicial.servicio_id)
        : (inicial?.servicioId ? String(inicial.servicioId) : ''),
      personalId: inicial?.personal_id ? String(inicial.personal_id) : '',
      descripcion: inicial?.descripcion || '',
      prioridad: inicial?.prioridad || '',
      estado: inicial?.estado || 'abierta',
      observacion: inicial?.observacion || '',
    },
    validar
  );

  const manejarSubmit = (e) => {
    e.preventDefault();
    if (!validarTodo()) return;
    onGuardar({
      ...valores,
      tipoIncidenciaId: parseInt(valores.tipoIncidenciaId, 10),
      servicioId: parseInt(valores.servicioId, 10),
      personalId: valores.personalId ? parseInt(valores.personalId, 10) : undefined,
      observacion: valores.observacion ? valores.observacion.trim() : null,
    });
  };

  return (
    <form onSubmit={manejarSubmit} noValidate>
      <div className="form-grilla">
        <Select id="form-inc-tipo" label="Tipo de incidencia" nombre="tipoIncidenciaId"
          valor={valores.tipoIncidenciaId} onChange={manejarCambio} onBlur={manejarBlur}
          error={errores.tipoIncidenciaId} placeholder="Seleccionar tipo" requerido>
          {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
        </Select>
        <Select id="form-inc-servicio" label="Servicio" nombre="servicioId"
          valor={valores.servicioId} onChange={manejarCambio} onBlur={manejarBlur}
          error={errores.servicioId} placeholder="Seleccionar servicio" requerido>
          {servicios.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </Select>
        <Select id="form-inc-prioridad" label="Prioridad" nombre="prioridad"
          valor={valores.prioridad} onChange={manejarCambio} onBlur={manejarBlur}
          error={errores.prioridad} placeholder="Seleccionar prioridad" requerido>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </Select>
        {inicial && (
          <Select id="form-inc-estado" label="Estado" nombre="estado"
            valor={valores.estado} onChange={manejarCambio}>
            <option value="abierta">Abierta</option>
            <option value="en_atencion">En atención</option>
            <option value="cerrada">Cerrada</option>
          </Select>
        )}
        <div className="campo-full">
          <label htmlFor="form-inc-desc" className="campo-label">
            Descripción <span className="campo-obligatorio">*</span>
          </label>
          <textarea
            id="form-inc-desc"
            name="descripcion"
            value={valores.descripcion}
            onChange={manejarCambio}
            onBlur={manejarBlur}
            rows={4}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 'var(--radio-md)',
              border: '1.5px solid var(--color-borde)',
              background: 'var(--color-superficie)',
              color: 'var(--color-texto-principal)',
              fontSize: 'var(--tam-sm)',
              resize: 'vertical',
              fontFamily: 'var(--fuente-base)',
            }}
          />
          {errores.descripcion && <p className="campo-error">{errores.descripcion}</p>}
        </div>
        {inicial && (
          <div className="campo-full">
            <label htmlFor="form-inc-obs" className="campo-label">
              Acción / Observación de seguimiento
            </label>
            <textarea
              id="form-inc-obs"
              name="observacion"
              value={valores.observacion}
              onChange={manejarCambio}
              rows={3}
              placeholder="Detalle de acciones tomadas o retroalimentación"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radio-md)',
                border: '1.5px solid var(--color-borde)',
                background: 'var(--color-superficie)',
                color: 'var(--color-texto-principal)',
                fontSize: 'var(--tam-sm)',
                resize: 'vertical',
                fontFamily: 'var(--fuente-base)',
              }}
            />
          </div>
        )}
      </div>
      <div className="form-pie">
        <Button tipo="button" variante="secundario" onClick={onCancelar} disabled={cargando}>Cancelar</Button>
        <Button tipo="submit" variante="primario" cargando={cargando}>
          {inicial ? 'Guardar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}
