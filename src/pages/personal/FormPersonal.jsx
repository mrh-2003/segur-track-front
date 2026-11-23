import { useForm } from '../../hooks/useForm';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

const validar = (v) => {
  const e = {};
  if (!v.nombres?.trim()) e.nombres = 'Nombres requeridos';
  if (!v.apellidos?.trim()) e.apellidos = 'Apellidos requeridos';
  if (!v.documento || !/^\d{8}$/.test(v.documento)) e.documento = 'DNI debe tener 8 dígitos numéricos';
  if (!v.correo || !/\S+@\S+\.\S+/.test(v.correo)) e.correo = 'Correo electrónico válido requerido';
  if (!v.cargo) e.cargo = 'Seleccione un cargo';
  if (!v.sedeId) e.sedeId = 'Seleccione una sede';
  if (!!v.horarioInicio !== !!v.horarioFin) e.horarioFin = 'Complete ambas horas';
  if (!v.diasLaborales?.length) e.diasLaborales = 'Seleccione al menos un día';
  return e;
};

export default function FormPersonal({ inicial, sedes, onGuardar, onCancelar, cargando }) {
  const { valores, errores, manejarCambio, manejarBlur, establecerValor, validarTodo } = useForm(
    {
      nombres:   inicial?.nombres   || '',
      apellidos: inicial?.apellidos || '',
      documento: inicial?.documento || '',
      correo:    inicial?.correo    || '',
      cargo:     inicial?.cargo     || '',
      estado:    inicial?.estado    || 'activo',
      horarioInicio: inicial?.horario_inicio?.slice(0,5) || '',
      horarioFin: inicial?.horario_fin?.slice(0,5) || '',
      diasLaborales: inicial?.dias_laborales || [0,1,2,3,4,5,6],
      sedeId:    inicial?.sede_id ? String(inicial.sede_id) : (inicial?.sedeId ? String(inicial.sedeId) : ''),
    },
    validar
  );

  const manejarSubmit = (e) => {
    e.preventDefault();
    if (!validarTodo()) return;
    onGuardar({ ...valores, horarioInicio: valores.horarioInicio || null, horarioFin: valores.horarioFin || null, sedeId: parseInt(valores.sedeId, 10) });
  };

  return (
    <form onSubmit={manejarSubmit} noValidate>
      <div className="form-grilla">
        <Input id="form-nombres" label="Nombres" nombre="nombres" valor={valores.nombres}
          onChange={manejarCambio} onBlur={manejarBlur} error={errores.nombres} requerido />
        <Input id="form-apellidos" label="Apellidos" nombre="apellidos" valor={valores.apellidos}
          onChange={manejarCambio} onBlur={manejarBlur} error={errores.apellidos} requerido />
        <Input id="form-documento" label="DNI" nombre="documento" valor={valores.documento}
          onChange={manejarCambio} onBlur={manejarBlur} error={errores.documento}
          placeholder="12345678" maxLength={8} requerido />
        <Input id="form-correo" label="Correo electrónico" nombre="correo" tipo="email" valor={valores.correo}
          onChange={manejarCambio} onBlur={manejarBlur} error={errores.correo}
          placeholder="usuario@segurtrack.com" requerido />
        <Select id="form-cargo" label="Cargo" nombre="cargo" valor={valores.cargo}
          onChange={manejarCambio} onBlur={manejarBlur} error={errores.cargo}
          placeholder="Seleccionar cargo" requerido>
          <option value="jefe_operaciones">Jefe de Operaciones</option>
          <option value="supervisor">Supervisor</option>
          <option value="agente">Agente</option>
          <option value="administrativo">Administrativo</option>
        </Select>
        <Select id="form-estado" label="Estado" nombre="estado" valor={valores.estado}
          onChange={manejarCambio} onBlur={manejarBlur} error={errores.estado}>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </Select>
        <Select id="form-sede" label="Sede" nombre="sedeId" valor={valores.sedeId}
          onChange={manejarCambio} onBlur={manejarBlur} error={errores.sedeId}
          placeholder="Seleccionar sede" requerido>
          {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </Select>
      </div>
      <details className="horario-personal">
        <summary>Horario laboral</summary>
        <p className="tarjeta-subtitulo">Sin horas: disponibilidad flexible. Los turnos y las ausencias siempre se respetan.</p>
        <div className="form-grilla">
          <Input id="personal-horario-inicio" label="Desde" nombre="horarioInicio" tipo="time" valor={valores.horarioInicio} onChange={manejarCambio} />
          <Input id="personal-horario-fin" label="Hasta" nombre="horarioFin" tipo="time" valor={valores.horarioFin} onChange={manejarCambio} error={errores.horarioFin} />
        </div>
        <div className="horario-dias">{['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map((dia,i) => <label key={dia}><input type="checkbox" checked={valores.diasLaborales.includes(i)} onChange={(e) => establecerValor('diasLaborales', e.target.checked ? [...valores.diasLaborales,i] : valores.diasLaborales.filter((d) => d!==i))} />{dia}</label>)}</div>
        {errores.diasLaborales && <p role="alert">{errores.diasLaborales}</p>}
      </details>
      <div className="form-pie">
        <Button tipo="button" variante="secundario" onClick={onCancelar} disabled={cargando} motivoDeshabilitado={"Espere mientras se cargan los datos o se procesa la solicitud."}>Cancelar</Button>
        <Button tipo="submit" variante="primario" cargando={cargando}>
          {inicial ? 'Guardar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}
