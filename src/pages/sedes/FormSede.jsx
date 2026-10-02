import { useForm } from '../../hooks/useForm';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const validar = (v) => {
  const e = {};
  if (!v.nombre?.trim() || v.nombre.trim().length < 3) {
    e.nombre = 'El nombre de la sede debe tener al menos 3 caracteres';
  }
  return e;
};

export default function FormSede({ inicial, onGuardar, onCancelar, cargando }) {
  const { valores, errores, manejarCambio, manejarBlur, validarTodo } = useForm(
    {
      nombre: inicial?.nombre || '',
      direccion: inicial?.direccion || '',
    },
    validar
  );

  const manejarSubmit = (e) => {
    e.preventDefault();
    if (!validarTodo()) return;
    onGuardar(valores);
  };

  return (
    <form onSubmit={manejarSubmit} noValidate>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input
          id="sede-nombre"
          label="Nombre de la sede"
          nombre="nombre"
          valor={valores.nombre}
          onChange={manejarCambio}
          onBlur={manejarBlur}
          error={errores.nombre}
          placeholder="Ej: Centro Logístico Norte"
          requerido
        />

        <Input
          id="sede-direccion"
          label="Dirección"
          nombre="direccion"
          valor={valores.direccion}
          onChange={manejarCambio}
          onBlur={manejarBlur}
          error={errores.direccion}
          placeholder="Ej: Av. Industrial 1200, Zona Norte"
        />
      </div>

      <div className="form-pie" style={{ marginTop: 20 }}>
        <Button tipo="button" variante="secundario" onClick={onCancelar} disabled={cargando}>
          Cancelar
        </Button>
        <Button tipo="submit" variante="primario" cargando={cargando}>
          {inicial ? 'Guardar' : 'Crear sede'}
        </Button>
      </div>
    </form>
  );
}
