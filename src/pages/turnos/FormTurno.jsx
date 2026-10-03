import { useForm } from '../../hooks/useForm';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

const validar = (v) => {
  const e = {};
  if (!v.personalId) e.personalId = 'Seleccione personal';
  if (!v.servicioId) e.servicioId = 'Seleccione servicio';
  if (!v.sedeId) e.sedeId = 'Seleccione sede';
  if (!v.fecha) e.fecha = 'Fecha requerida';
  if (!v.horaInicio) e.horaInicio = 'Hora inicio requerida';
  if (!v.horaFin) e.horaFin = 'Hora fin requerida';
  return e;
};

export default function FormTurno({ personal, servicios, sedes, onGuardar, onCancelar, cargando }) {
  const { usuario } = useAuth();
  const { valores, errores, manejarCambio, manejarBlur, establecerValor, validarTodo } = useForm(
    { personalId: '', servicioId: '', sedeId: '', fecha: '', horaInicio: '', horaFin: '', estado: 'sin_confirmar' },
    validar
  );

  const esSupervisor = usuario?.rol === 'supervisor';

  const personalDisponible = personal.filter((p) => {
    if (esSupervisor) {
      return p.cargo === 'agente';
    }
    return true;
  });

  const manejarCambioServicio = (e) => {
    const nuevoServicioId = e.target.value;
    manejarCambio(e);

    const serv = servicios.find((s) => String(s.id) === String(nuevoServicioId));
    if (serv) {
      if (serv.fecha_inicio) establecerValor('fecha', serv.fecha_inicio);
      if (serv.hora_inicio) establecerValor('horaInicio', serv.hora_inicio.slice(0, 5));
      if (serv.hora_fin) establecerValor('horaFin', serv.hora_fin.slice(0, 5));
      if (serv.sede_id) establecerValor('sedeId', String(serv.sede_id));
    }
  };

  const manejarSubmit = (e) => {
    e.preventDefault();
    if (!validarTodo()) return;
    onGuardar({
      ...valores,
      personalId:  parseInt(valores.personalId, 10),
      servicioId:  parseInt(valores.servicioId, 10),
      sedeId:      parseInt(valores.sedeId, 10),
      estado:      'sin_confirmar',
    });
  };

  return (
    <form onSubmit={manejarSubmit} noValidate>
      <div className="form-grilla">
        <Select
          id="form-t-servicio"
          label="Servicio"
          nombre="servicioId"
          valor={valores.servicioId}
          onChange={manejarCambioServicio}
          onBlur={manejarBlur}
          error={errores.servicioId}
          placeholder="Seleccionar servicio..."
          requerido
        >
          {servicios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </Select>

        <Select
          id="form-t-personal"
          label="Personal asignado"
          nombre="personalId"
          valor={valores.personalId}
          onChange={manejarCambio}
          onBlur={manejarBlur}
          error={errores.personalId}
          placeholder="Seleccionar personal..."
          requerido
        >
          {personalDisponible.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombres} {p.apellidos} ({p.cargo})
            </option>
          ))}
        </Select>

        <Select
          id="form-t-sede"
          label="Sede"
          nombre="sedeId"
          valor={valores.sedeId}
          onChange={manejarCambio}
          onBlur={manejarBlur}
          error={errores.sedeId}
          placeholder="Seleccionar sede..."
          requerido
        >
          {sedes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </Select>

        <Input
          id="form-t-fecha"
          label="Fecha"
          nombre="fecha"
          tipo="date"
          valor={valores.fecha}
          onChange={manejarCambio}
          onBlur={manejarBlur}
          error={errores.fecha}
          requerido
        />

        <Input
          id="form-t-hora-inicio"
          label="Hora inicio"
          nombre="horaInicio"
          tipo="time"
          valor={valores.horaInicio}
          onChange={manejarCambio}
          onBlur={manejarBlur}
          error={errores.horaInicio}
          requerido
        />

        <Input
          id="form-t-hora-fin"
          label="Hora fin"
          nombre="horaFin"
          tipo="time"
          valor={valores.horaFin}
          onChange={manejarCambio}
          onBlur={manejarBlur}
          error={errores.horaFin}
          requerido
        />
      </div>

      <div className="form-pie">
        <Button variante="secundario" onClick={onCancelar} disabled={cargando}>
          Cancelar
        </Button>
        <Button tipo="submit" variante="primario" cargando={cargando}>
          Asignar turno
        </Button>
      </div>
    </form>
  );
}
