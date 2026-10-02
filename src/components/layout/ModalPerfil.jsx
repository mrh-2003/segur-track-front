import { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { actualizarPerfil, cambiarClave } from '../../api/auth';
import { useForm } from '../../hooks/useForm';

const validarPerfil = (v) => {
  const e = {};
  if (!v.nombres?.trim() || v.nombres.trim().length < 2) e.nombres = 'Mínimo 2 caracteres';
  if (!v.apellidos?.trim() || v.apellidos.trim().length < 2) e.apellidos = 'Mínimo 2 caracteres';
  return e;
};

const validarClave = (v) => {
  const e = {};
  if (!v.claveActual) e.claveActual = 'Contraseña actual requerida';
  if (!v.nuevaClave || v.nuevaClave.length < 8) {
    e.nuevaClave = 'Mínimo 8 caracteres';
  } else if (!/[A-Z]/.test(v.nuevaClave)) {
    e.nuevaClave = 'Debe incluir al menos una mayúscula';
  } else if (!/[a-z]/.test(v.nuevaClave)) {
    e.nuevaClave = 'Debe incluir al menos una minúscula';
  } else if (!/[0-9]/.test(v.nuevaClave)) {
    e.nuevaClave = 'Debe incluir al menos un número';
  } else if (!/[^A-Za-z0-9]/.test(v.nuevaClave)) {
    e.nuevaClave = 'Debe incluir al menos un carácter especial (!@#$...)';
  }
  if (v.nuevaClave && v.confirmarClave && v.nuevaClave !== v.confirmarClave) {
    e.confirmarClave = 'Las contraseñas no coinciden';
  }
  return e;
};

export default function ModalPerfil({ usuario, onActualizado, onCancelar, informar }) {
  const [seccion, setSeccion] = useState('datos');
  const [guardando, setGuardando] = useState(false);

  const nombresIniciales = usuario?.nombres || usuario?.nombre?.split(' ')[0] || '';
  const apellidosIniciales = usuario?.apellidos || usuario?.nombre?.split(' ').slice(1).join(' ') || '';

  const formPerfil = useForm(
    { nombres: nombresIniciales, apellidos: apellidosIniciales },
    validarPerfil
  );

  const formClave = useForm(
    { claveActual: '', nuevaClave: '', confirmarClave: '' },
    validarClave
  );

  const guardarPerfil = async (e) => {
    e.preventDefault();
    if (!formPerfil.validarTodo()) return;
    setGuardando(true);
    try {
      const resp = await actualizarPerfil(formPerfil.valores);
      informar('Perfil actualizado', 'Sus datos fueron actualizados correctamente', 'exito');
      if (onActualizado) onActualizado(resp);
      onCancelar();
    } catch (err) {
      informar('Error', err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const guardarClave = async (e) => {
    e.preventDefault();
    if (!formClave.validarTodo()) return;
    setGuardando(true);
    try {
      await cambiarClave({
        claveActual: formClave.valores.claveActual,
        nuevaClave: formClave.valores.nuevaClave,
      });
      informar('Contraseña actualizada', 'Su contraseña ha sido cambiada correctamente', 'exito');
      onCancelar();
    } catch (err) {
      informar('Error', err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--color-borde)', paddingBottom: 10 }}>
        <button
          type="button"
          className={`accion-btn ${seccion === 'datos' ? 'accion-btn-activo' : ''}`}
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radio-md)',
            background: seccion === 'datos' ? 'var(--color-primario)' : 'transparent',
            color: seccion === 'datos' ? '#ffffff' : 'var(--color-texto-secundario)',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={() => setSeccion('datos')}
        >
          Datos de usuario
        </button>
        <button
          type="button"
          className={`accion-btn ${seccion === 'clave' ? 'accion-btn-activo' : ''}`}
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radio-md)',
            background: seccion === 'clave' ? 'var(--color-primario)' : 'transparent',
            color: seccion === 'clave' ? '#ffffff' : 'var(--color-texto-secundario)',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={() => setSeccion('clave')}
        >
          Cambiar contraseña
        </button>
      </div>

      {seccion === 'datos' ? (
        <form onSubmit={guardarPerfil} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input
              id="perfil-nombres"
              label="Nombres"
              nombre="nombres"
              valor={formPerfil.valores.nombres}
              onChange={formPerfil.manejarCambio}
              onBlur={formPerfil.manejarBlur}
              error={formPerfil.errores.nombres}
              requerido
            />
            <Input
              id="perfil-apellidos"
              label="Apellidos"
              nombre="apellidos"
              valor={formPerfil.valores.apellidos}
              onChange={formPerfil.manejarCambio}
              onBlur={formPerfil.manejarBlur}
              error={formPerfil.errores.apellidos}
              requerido
            />
            <Input
              id="perfil-correo"
              label="Correo"
              nombre="correo"
              valor={usuario?.correo || ''}
              disabled
            />
            <Input
              id="perfil-rol"
              label="Rol del sistema"
              nombre="rol"
              valor={usuario?.rol || ''}
              disabled
            />
          </div>

          <div className="form-pie" style={{ marginTop: 20 }}>
            <Button tipo="button" variante="secundario" onClick={onCancelar} disabled={guardando}>
              Cancelar
            </Button>
            <Button tipo="submit" variante="primario" cargando={guardando}>
              Guardar cambios
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={guardarClave} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input
              id="perfil-clave-actual"
              label="Contraseña actual"
              nombre="claveActual"
              tipo="password"
              valor={formClave.valores.claveActual}
              onChange={formClave.manejarCambio}
              onBlur={formClave.manejarBlur}
              error={formClave.errores.claveActual}
              requerido
            />
            <Input
              id="perfil-nueva-clave"
              label="Nueva contraseña"
              nombre="nuevaClave"
              tipo="password"
              valor={formClave.valores.nuevaClave}
              onChange={formClave.manejarCambio}
              onBlur={formClave.manejarBlur}
              error={formClave.errores.nuevaClave}
              placeholder="Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo"
              requerido
            />
            <Input
              id="perfil-confirmar-clave"
              label="Confirmar nueva contraseña"
              nombre="confirmarClave"
              tipo="password"
              valor={formClave.valores.confirmarClave}
              onChange={formClave.manejarCambio}
              onBlur={formClave.manejarBlur}
              error={formClave.errores.confirmarClave}
              requerido
            />
          </div>

          <div className="form-pie" style={{ marginTop: 20 }}>
            <Button tipo="button" variante="secundario" onClick={onCancelar} disabled={guardando}>
              Cancelar
            </Button>
            <Button tipo="submit" variante="primario" cargando={guardando}>
              Actualizar contraseña
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
