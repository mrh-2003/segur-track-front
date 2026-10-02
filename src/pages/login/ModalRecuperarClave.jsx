import { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { solicitarRecuperacion, restablecerClave } from '../../api/auth';
import { useForm } from '../../hooks/useForm';

const validarPaso1 = (v) => {
  const e = {};
  if (!v.correo) e.correo = 'El correo es obligatorio';
  else if (!/\S+@\S+\.\S+/.test(v.correo)) e.correo = 'Correo electrónico inválido';
  return e;
};

const validarPaso2 = (v) => {
  const e = {};
  if (!v.codigo) e.codigo = 'El código de verificación es obligatorio';
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

export default function ModalRecuperarClave({ onCerrar, informar }) {
  const [paso, setPaso] = useState(1);
  const [correoEnviado, setCorreoEnviado] = useState('');
  const [codigoGenerado, setCodigoGenerado] = useState('');
  const [cargando, setCargando] = useState(false);

  const form1 = useForm({ correo: '' }, validarPaso1);
  const form2 = useForm({ codigo: '', nuevaClave: '', confirmarClave: '' }, validarPaso2);

  const enviarSolicitud = async (e) => {
    e.preventDefault();
    if (!form1.validarTodo()) return;
    setCargando(true);
    try {
      const resp = await solicitarRecuperacion({ correo: form1.valores.correo });
      setCorreoEnviado(form1.valores.correo);
      setCodigoGenerado(resp.codigo);
      setPaso(2);
      informar('Código generado', resp.mensaje, 'info');
    } catch (err) {
      informar('Error', err.message, 'error');
    } finally {
      setCargando(false);
    }
  };

  const enviarRestablecimiento = async (e) => {
    e.preventDefault();
    if (!form2.validarTodo()) return;
    setCargando(true);
    try {
      await restablecerClave({
        correo: correoEnviado,
        codigo: form2.valores.codigo,
        nuevaClave: form2.valores.nuevaClave,
      });
      informar(
        'Contraseña restablecida',
        'Su contraseña ha sido cambiada con éxito. Ya puede iniciar sesión.',
        'exito'
      );
      onCerrar();
    } catch (err) {
      informar('Error', err.message, 'error');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {paso === 1 ? (
        <form onSubmit={enviarSolicitud} noValidate>
          <p style={{ fontSize: 'var(--tam-sm)', color: 'var(--color-texto-secundario)', marginBottom: 16 }}>
            Ingrese su correo electrónico registrado para recibir un código de verificación.
          </p>
          <Input
            id="recuperar-correo"
            label="Correo electrónico"
            nombre="correo"
            tipo="email"
            valor={form1.valores.correo}
            onChange={form1.manejarCambio}
            onBlur={form1.manejarBlur}
            error={form1.errores.correo}
            placeholder="usuario@segurtrack.com"
            requerido
          />
          <div className="form-pie" style={{ marginTop: 20 }}>
            <Button tipo="button" variante="secundario" onClick={onCerrar} disabled={cargando}>
              Cancelar
            </Button>
            <Button tipo="submit" variante="primario" cargando={cargando}>
              Enviar código
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={enviarRestablecimiento} noValidate>
          {codigoGenerado && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radio-md)',
                background: 'var(--color-primario-fondo)',
                border: '1px solid var(--color-primario)',
                color: 'var(--color-primario)',
                fontSize: 'var(--tam-sm)',
                marginBottom: 16,
              }}
            >
              Código de verificación: <strong>{codigoGenerado}</strong>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input
              id="recuperar-codigo"
              label="Código de verificación"
              nombre="codigo"
              valor={form2.valores.codigo}
              onChange={form2.manejarCambio}
              onBlur={form2.manejarBlur}
              error={form2.errores.codigo}
              placeholder="Ej: 123456"
              requerido
            />
            <Input
              id="recuperar-nueva-clave"
              label="Nueva contraseña"
              nombre="nuevaClave"
              tipo="password"
              valor={form2.valores.nuevaClave}
              onChange={form2.manejarCambio}
              onBlur={form2.manejarBlur}
              error={form2.errores.nuevaClave}
              placeholder="Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo"
              requerido
            />
            <Input
              id="recuperar-confirmar-clave"
              label="Confirmar contraseña"
              nombre="confirmarClave"
              tipo="password"
              valor={form2.valores.confirmarClave}
              onChange={form2.manejarCambio}
              onBlur={form2.manejarBlur}
              error={form2.errores.confirmarClave}
              requerido
            />
          </div>
          <div className="form-pie" style={{ marginTop: 20 }}>
            <Button tipo="button" variante="secundario" onClick={() => setPaso(1)} disabled={cargando}>
              Volver
            </Button>
            <Button tipo="submit" variante="primario" cargando={cargando}>
              Restablecer contraseña
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
