import { useForm } from '../../hooks/useForm';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const validar = (v) => {
  const e = {};
  if (!v.nombre?.trim() || v.nombre.trim().length < 3) {
    e.nombre = 'El nombre del cliente debe tener al menos 3 caracteres';
  }
  return e;
};

export default function FormCliente({ inicial, onGuardar, onCancelar, cargando }) {
  const { valores, errores, manejarCambio, manejarBlur, validarTodo } = useForm(
    {
      nombre: inicial?.nombre || '',
      contacto: inicial?.contacto || '',
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
          id="cliente-nombre"
          label="Nombre del cliente"
          nombre="nombre"
          valor={valores.nombre}
          onChange={manejarCambio}
          onBlur={manejarBlur}
          error={errores.nombre}
          placeholder="Ej: Centro Logístico"
          requerido
        />

        <Input
          id="cliente-contacto"
          label="Contacto / Teléfono"
          nombre="contacto"
          valor={valores.contacto}
          onChange={manejarCambio}
          onBlur={manejarBlur}
          error={errores.contacto}
          placeholder="Ej: contacto@cliente.com / +51 987 654 321"
        />
      </div>

      <div className="form-pie" style={{ marginTop: 20 }}>
        <Button tipo="button" variante="secundario" onClick={onCancelar} disabled={cargando}>
          Cancelar
        </Button>
        <Button tipo="submit" variante="primario" cargando={cargando}>
          {inicial ? 'Guardar' : 'Crear cliente'}
        </Button>
      </div>
    </form>
  );
}
