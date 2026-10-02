import { useForm } from '../../hooks/useForm';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

const validar = (v) => {
  const e = {};
  if (!v.nombres?.trim()) e.nombres = 'Nombres requeridos';
  if (!v.apellidos?.trim()) e.apellidos = 'Apellidos requeridos';
  if (!v.documento || !/^\d{8}$/.test(v.documento)) e.documento = 'DNI debe tener 8 dígitos numéricos';
  if (!v.cargo) e.cargo = 'Seleccione un cargo';
  if (!v.sedeId) e.sedeId = 'Seleccione una sede';
  return e;
};

export default function FormPersonal({ inicial, sedes, onGuardar, onCancelar, cargando }) {
  const { valores, errores, manejarCambio, manejarBlur, validarTodo } = useForm(
    {
      nombres:   inicial?.nombres   || '',
      apellidos: inicial?.apellidos || '',
      documento: inicial?.documento || '',
      cargo:     inicial?.cargo     || '',
      estado:    inicial?.estado    || 'activo',
      sedeId:    inicial?.sede_id   || '',
    },
    validar
  );

  const manejarSubmit = (e) => {
    e.preventDefault();
    if (!validarTodo()) return;
    onGuardar({ ...valores, sedeId: parseInt(valores.sedeId, 10) });
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
        <Select id="form-cargo" label="Cargo" nombre="cargo" valor={valores.cargo}
          onChange={manejarCambio} onBlur={manejarBlur} error={errores.cargo}
          placeholder="Seleccionar cargo" requerido>
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
      <div className="form-pie">
        <Button variante="secundario" onClick={onCancelar} disabled={cargando}>Cancelar</Button>
        <Button tipo="submit" variante="primario" cargando={cargando}>
          {inicial ? 'Guardar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}
