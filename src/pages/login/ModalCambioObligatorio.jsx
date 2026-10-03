import { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { cambiarClave } from '../../api/auth';
import { useForm } from '../../hooks/useForm';

const validar = (v) => {
  const e = {};
  if (!v.nuevaClave || v.nuevaClave.length < 8) {
    e.nuevaClave = 'La nueva contraseña debe tener al menos 8 caracteres';
  } else if (!/[A-Z]/.test(v.nuevaClave)) {
    e.nuevaClave = 'Debe incluir al menos una letra mayúscula';
  } else if (!/[a-z]/.test(v.nuevaClave)) {
    e.nuevaClave = 'Debe incluir al menos una letra minúscula';
  } else if (!/[0-9]/.test(v.nuevaClave)) {
    e.nuevaClave = 'Debe incluir al menos un número';
  } else if (!/[^A-Za-z0-9]/.test(v.nuevaClave)) {
    e.nuevaClave = 'Debe incluir al menos un carácter especial (!@#$%...)';
  }
  if (v.nuevaClave && v.confirmarClave && v.nuevaClave !== v.confirmarClave) {
    e.confirmarClave = 'Las contraseñas no coinciden';
  }
  return e;
};

export default function ModalCambioObligatorio({ claveActual, onExito }) {
  const [cargando, setCargando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');
  const { valores, errores, manejarCambio, manejarBlur, validarTodo } = useForm(
    { nuevaClave: '', confirmarClave: '' },
    validar
  );

  const manejarSubmit = async (e) => {
    e.preventDefault();
    if (!validarTodo()) return;
    setErrorGeneral('');
    setCargando(true);
    try {
      await cambiarClave({
        claveActual,
        nuevaClave: valores.nuevaClave,
      });
      onExito();
    } catch (err) {
      setErrorGeneral(err.message || 'Error al actualizar la contraseña');
    } finally {
      setCargando(false);
    }
  };

  return (
    <form onSubmit={manejarSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontSize: 'var(--tam-sm)', color: 'var(--color-texto-secundario)', lineHeight: 1.5 }}>
        Su cuenta tiene configurada la contraseña inicial por defecto. Por seguridad, debe crear una nueva contraseña personal antes de ingresar al sistema.
      </p>

      {errorGeneral && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(220, 38, 38, 0.1)',
          border: '1px solid var(--color-peligro)',
          color: 'var(--color-peligro)',
          borderRadius: 'var(--radio-md)',
          fontSize: 'var(--tam-sm)',
          fontWeight: 500,
        }}>
          {errorGeneral}
        </div>
      )}

      <Input
        id="cambio-obligatorio-nueva"
        label="Nueva contraseña"
        nombre="nuevaClave"
        tipo="password"
        valor={valores.nuevaClave}
        onChange={manejarCambio}
        onBlur={manejarBlur}
        error={errores.nuevaClave}
        placeholder="Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo"
        requerido
      />

      <Input
        id="cambio-obligatorio-confirmar"
        label="Confirmar nueva contraseña"
        nombre="confirmarClave"
        tipo="password"
        valor={valores.confirmarClave}
        onChange={manejarCambio}
        onBlur={manejarBlur}
        error={errores.confirmarClave}
        requerido
      />

      <div className="form-pie" style={{ marginTop: 10 }}>
        <Button tipo="submit" variante="primario" cargando={cargando} style={{ width: '100%' }}>
          Guardar y continuar al sistema
        </Button>
      </div>
    </form>
  );
}
