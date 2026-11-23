import { useEffect, useState } from 'react';
import { opcionesTurno } from '../../api/operaciones';
import { useForm } from '../../hooks/useForm';
import SelectorPersonalTurno from './SelectorPersonalTurno';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

const validar = (v) => {
  const e = {};

  if (!v.puesto?.trim()) e.puesto = 'Indique puesto o agencia';
  if (
    !Number.isInteger(Number(v.evidenciasRequeridas)) ||
    Number(v.evidenciasRequeridas) < 0
  )
    e.evidenciasRequeridas = 'Cantidad inválida';
  if (!v.servicioId) e.servicioId = 'Seleccione servicio';
  if (!v.sedeId) e.sedeId = 'Seleccione sede';
  if (!v.fecha) e.fecha = 'Fecha requerida';
  if (!v.horaInicio) e.horaInicio = 'Hora inicio requerida';
  if (!v.horaFin) e.horaFin = 'Hora fin requerida';
  return e;
};

export default function FormTurno({
  servicios,
  sedes,
  onGuardar,
  onCancelar,
  cargando,
}) {
  const {
    valores,
    errores,
    manejarCambio,
    manejarBlur,
    establecerValor,
    validarTodo,
  } = useForm(
    {
      personalId: '',
      servicioId: '',
      sedeId: '',
      fecha: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date()),
      horaInicio: '',
      horaFin: '',
      estado: 'sin_confirmar',
      puesto: '',
      evidenciasRequeridas: 1,
    },
    validar
  );

  const [opciones, setOpciones] = useState({ servicios: [], compatibilidades: [], personal: [] });
  const [consultando, setConsultando] = useState(true);
  const [errorDisponibilidad, setErrorDisponibilidad] = useState('');
  useEffect(() => {
    let activo = true;
    Promise.resolve().then(async () => {
      if (!activo) return;
      setConsultando(true);
      try {
        const q = { fecha: valores.fecha };
        if (valores.horaInicio && valores.horaFin) Object.assign(q, { horaInicio: valores.horaInicio, horaFin: valores.horaFin });
        const r = await opcionesTurno(q);
        if (activo) { setOpciones(r); setErrorDisponibilidad(''); }
      } catch (e) { if (activo) setErrorDisponibilidad(e.message); }
      finally { if (activo) setConsultando(false); }
    });
    return () => { activo = false; };
  }, [valores.fecha, valores.horaInicio, valores.horaFin]);
  const compatible = (personalId, servicioId) => opciones.compatibilidades.some((p) => String(p.personalId) === String(personalId) && (!servicioId || String(p.servicioId) === String(servicioId)));
  const serviciosDisponibles = opciones.servicios;
  const seleccionValida = (!valores.personalId || compatible(valores.personalId, valores.servicioId)) && opciones.servicios.some((s) => String(s.id) === String(valores.servicioId));

  const personalVinculado = (opciones.personal || []).filter(p => String(p.servicioId) === String(valores.servicioId));

  const manejarCambioServicio = (e) => {
    const nuevoServicioId = e.target.value;
    manejarCambio(e);
    establecerValor('personalId', '');

    const serv = servicios.find(
      (s) => String(s.id) === String(nuevoServicioId)
    );
    if (serv) {
      if (serv.hora_inicio)
        establecerValor('horaInicio', serv.hora_inicio.slice(0, 5));
      if (serv.hora_fin) establecerValor('horaFin', serv.hora_fin.slice(0, 5));
      if (serv.sede_id) establecerValor('sedeId', String(serv.sede_id));
      if (!valores.puesto) establecerValor('puesto', serv.nombre);
    }
  };

  const manejarSubmit = (e) => {
    e.preventDefault();
    if (!validarTodo() || consultando || !seleccionValida || errorDisponibilidad) return;
    onGuardar({
      ...valores,
      personalId: valores.personalId ? parseInt(valores.personalId, 10) : null,
      servicioId: parseInt(valores.servicioId, 10),
      sedeId: parseInt(valores.sedeId, 10),
      estado: 'sin_confirmar',
      evidenciasRequeridas: Number(valores.evidenciasRequeridas),
    });
  };

  return (
    <form onSubmit={manejarSubmit} noValidate>
      <p className="turno-disponibilidad-ayuda" role="status">{consultando ? 'Consultando disponibilidad…' : 'Consulta el personal del servicio y su disponibilidad. Las restricciones se indican en rojo con su motivo.'}</p>
      {valores.servicioId && <p className="turno-plan-aviso" role="status">{opciones.servicios.find(s=>String(s.id)===String(valores.servicioId))?.plan_confirmado ? 'El turno generará automáticamente las actividades, rondas y reportes del plan del servicio.' : 'Este servicio no tiene plan operativo confirmado. Configúrelo en Servicios para generar sus obligaciones.'}</p>}
      {errorDisponibilidad && <p role="alert">{errorDisponibilidad}</p>}
      <div className="form-grilla">
        <Input
          id="form-t-puesto"
          label="Puesto / agencia"
          nombre="puesto"
          valor={valores.puesto}
          onChange={manejarCambio}
          requerido
          error={errores.puesto}
        />
        <Input
          id="form-t-evidencias"
          label="Evidencias exigidas"
          nombre="evidenciasRequeridas"
          tipo="number"
          valor={valores.evidenciasRequeridas}
          onChange={manejarCambio}
        />
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
          {serviciosDisponibles.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </Select>

        <SelectorPersonalTurno
          personas={personalVinculado}
          valor={valores.personalId}
          onCambiar={valor => establecerValor('personalId', valor)}
          cargando={consultando}
          sinServicio={!valores.servicioId}
        />

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
        <Button variante="secundario" onClick={onCancelar} disabled={cargando} motivoDeshabilitado={"Espere mientras se cargan los datos o se procesa la solicitud."}>
          Cancelar
        </Button>
        <Button tipo="submit" variante="primario" cargando={cargando} disabled={consultando || !seleccionValida || !!errorDisponibilidad} motivoDeshabilitado={consultando ? 'Espere mientras se consulta la disponibilidad.' : errorDisponibilidad ? 'No se pudo validar la disponibilidad: '+errorDisponibilidad : !valores.servicioId ? 'Seleccione un servicio antes de asignar el turno.' : valores.personalId && !compatible(valores.personalId,valores.servicioId) ? 'El personal seleccionado no está disponible. Revise los motivos en rojo o deje la plaza sin asignar.' : 'El servicio no está vigente para esta fecha. Cambie la fecha o seleccione otro servicio.'}>
          Asignar turno
        </Button>
      </div>
    </form>
  );
}
