import { useState } from 'react';
import { useForm } from '../../hooks/useForm';
import { useAsync } from '../../hooks/useAsync';
import { solicitarRecuperacion, restablecerClave } from '../../api/auth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const validarPaso1 = (v) => {
  const e = {};
  if (!v.correo) e.correo = 'El correo es obligatorio';
  else if (!/\S+@\S+\.\S+/.test(v.correo)) e.correo = 'Correo electrónico inválido';
  return e;
};

const validarPaso2 = (v) => {
  const e = {};
  if (!v.codigo?.trim()) e.codigo = 'El código de verificación es obligatorio';
  if (!v.nuevaClave) e.nuevaClave = 'La nueva contraseña es obligatoria';
  else if (v.nuevaClave.length < 6) e.nuevaClave = 'Mínimo 6 caracteres';
  return e;
};

export default function ModalRecuperarClave({ onExito, onCancelar, informar }) {
  const [paso, setPaso] = useState(1);
  const [correoEnviado, setCorreoEnviado] = useState('');
  const { cargando, ejecutar } = useAsync();

  const form1 = useForm({ correo: '' }, validarPaso1);
  const form2 = useForm({ codigo: '', nuevaClave: '' }, validarPaso2);

  const solicitarCodigo = async (e) => {
    e.preventDefault();
    if (!form1.validarTodo()) return;

    await ejecutar(async () => {
      try {
        const respuesta = await solicitarRecuperacion({ correo: form1.valores.correo.trim() });
        setCorreoEnviado(form1.valores.correo.trim());
        setPaso(2);
        informar('Código generado', respuesta.mensaje || 'Revise su correo con el código de recuperación.', 'info');
      } catch (err) {
        informar('Error', err.message, 'error');
      }
    });
  };

  const confirmarNuevaClave = async (e) => {
    e.preventDefault();
    if (!form2.validarTodo()) return;

    await ejecutar(async () => {
      try {
        const respuesta = await restablecerClave({
          correo: correoEnviado,
          codigo: form2.valores.codigo.trim(),
          nuevaClave: form2.valores.nuevaClave,
        });
        informar('Contraseña restablecida', respuesta.mensaje || 'Su contraseña ha sido actualizada.', 'exito');
        onExito();
      } catch (err) {
        informar('Error', err.message, 'error');
      }
    });
  };

  if (paso === 1) {
    return (
      <form onSubmit={solicitarCodigo} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: 'var(--tam-sm)', color: 'var(--color-texto-secundario)' }}>
          Ingrese su correo electrónico registrado para recibir las instrucciones y el código de verificación de recuperación de acceso.
        </p>
        <Input
          id="recuperar-correo"
          label="Correo corporativo"
          nombre="correo"
          tipo="email"
          valor={form1.valores.correo}
          onChange={form1.manejarCambio}
          onBlur={form1.manejarBlur}
          error={form1.errores.correo}
          placeholder="usuario@segurtrack.com"
          requerido
        />
        <div className="form-pie">
          <Button tipo="button" variante="secundario" onClick={onCancelar} disabled={cargando}>
            Cancelar
          </Button>
          <Button tipo="submit" variante="primario" cargando={cargando}>
            Enviar instrucciones
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={confirmarNuevaClave} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 'var(--tam-sm)', color: 'var(--color-texto-secundario)' }}>
        Hemos enviado un código a <strong>{correoEnviado}</strong>. Ingréselo a continuación junto con su nueva contraseña.
      </p>
      <Input
        id="recuperar-codigo"
        label="Código de verificación"
        nombre="codigo"
        valor={form2.valores.codigo}
        onChange={form2.manejarCambio}
        onBlur={form2.manejarBlur}
        error={form2.errores.codigo}
        placeholder="Ej. 123456"
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
        placeholder="Mínimo 6 caracteres"
        requerido
      />
      <div className="form-pie">
        <Button tipo="button" variante="secundario" onClick={() => setPaso(1)} disabled={cargando}>
          Atrás
        </Button>
        <Button tipo="submit" variante="primario" cargando={cargando}>
          Restablecer contraseña
        </Button>
      </div>
    </form>
  );
}
