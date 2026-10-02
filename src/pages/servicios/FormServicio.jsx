import { useForm } from '../../hooks/useForm';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

const validar = (v) => {
  const e = {};
  if (!v.nombre?.trim()) e.nombre = 'Nombre requerido';
  if (!v.clienteId) e.clienteId = 'Seleccione un cliente';
  if (!v.sedeId) e.sedeId = 'Seleccione una sede';
  if (!v.supervisorId) e.supervisorId = 'Seleccione un supervisor';
  if (!v.horaInicio) e.horaInicio = 'Hora de inicio requerida';
  if (!v.horaFin) e.horaFin = 'Hora de fin requerida';
  if (!v.fechaInicio) e.fechaInicio = 'Fecha de inicio requerida';
  return e;
};

export default function FormServicio({ inicial, clientes, personal, sedes, onGuardar, onCancelar, cargando }) {
  const supervisores = personal.filter((p) => p.cargo === 'supervisor');

  const { valores, errores, manejarCambio, manejarBlur, validarTodo } = useForm(
    {
      nombre:      inicial?.nombre       || '',
      clienteId:   inicial?.cliente_id   || '',
      sedeId:      inicial?.sede_id      || '',
      supervisorId: inicial?.supervisor_id || '',
      horaInicio:  inicial?.hora_inicio  || '',
      horaFin:     inicial?.hora_fin     || '',
      estado:      inicial?.estado       || 'programado',
      fechaInicio: inicial?.fecha_inicio || '',
      fechaFin:    inicial?.fecha_fin    || '',
    },
    validar
  );

  const manejarSubmit = (e) => {
    e.preventDefault();
    if (!validarTodo()) return;
    onGuardar({
      ...valores,
      clienteId:    parseInt(valores.clienteId, 10),
      sedeId:       parseInt(valores.sedeId, 10),
      supervisorId: parseInt(valores.supervisorId, 10),
    });
  };

  return (
    <form onSubmit={manejarSubmit} noValidate>
      <div className="form-grilla">
        <div className="campo-full">
          <Input id="form-srv-nombre" label="Nombre del servicio" nombre="nombre" valor={valores.nombre}
            onChange={manejarCambio} onBlur={manejarBlur} error={errores.nombre} requerido />
        </div>
        <Select id="form-srv-cliente" label="Cliente" nombre="clienteId" valor={valores.clienteId}
          onChange={manejarCambio} onBlur={manejarBlur} error={errores.clienteId}
          placeholder="Seleccionar cliente" requerido>
          {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </Select>
        <Select id="form-srv-sede" label="Sede" nombre="sedeId" valor={valores.sedeId}
          onChange={manejarCambio} onBlur={manejarBlur} error={errores.sedeId}
          placeholder="Seleccionar sede" requerido>
          {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </Select>
        <Select id="form-srv-supervisor" label="Supervisor" nombre="supervisorId" valor={valores.supervisorId}
          onChange={manejarCambio} onBlur={manejarBlur} error={errores.supervisorId}
          placeholder="Seleccionar supervisor" requerido>
          {supervisores.map((p) => <option key={p.id} value={p.id}>{p.nombres} {p.apellidos}</option>)}
        </Select>
        <Select id="form-srv-estado" label="Estado" nombre="estado" valor={valores.estado}
          onChange={manejarCambio}>
          <option value="programado">Programado</option>
          <option value="en_curso">En curso</option>
          <option value="finalizado">Finalizado</option>
        </Select>
        <Input id="form-srv-hora-inicio" label="Hora inicio" nombre="horaInicio" tipo="time"
          valor={valores.horaInicio} onChange={manejarCambio} onBlur={manejarBlur}
          error={errores.horaInicio} requerido />
        <Input id="form-srv-hora-fin" label="Hora fin" nombre="horaFin" tipo="time"
          valor={valores.horaFin} onChange={manejarCambio} onBlur={manejarBlur}
          error={errores.horaFin} requerido />
        <Input id="form-srv-fecha-inicio" label="Fecha inicio" nombre="fechaInicio" tipo="date"
          valor={valores.fechaInicio} onChange={manejarCambio} onBlur={manejarBlur}
          error={errores.fechaInicio} requerido />
        <Input id="form-srv-fecha-fin" label="Fecha fin" nombre="fechaFin" tipo="date"
          valor={valores.fechaFin} onChange={manejarCambio} />
      </div>
      <div className="form-pie">
        <Button variante="secundario" onClick={onCancelar} disabled={cargando}>Cancelar</Button>
        <Button tipo="submit" variante="primario" cargando={cargando}>
          {inicial ? 'Guardar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}
