import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useModal } from '../../hooks/useModal';
import { useForm } from '../../hooks/useForm';
import { useAsync } from '../../hooks/useAsync';
import { login } from '../../api/auth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Icono } from '../../components/ui/Icono';
import ModalCambioObligatorio from './ModalCambioObligatorio';
import './LoginPage.css';

const validar = (valores) => {
  const errores = {};
  if (!valores.correo) errores.correo = 'El correo es obligatorio';
  else if (!/\S+@\S+\.\S+/.test(valores.correo)) errores.correo = 'Correo inválido';
  if (!valores.clave) errores.clave = 'La contraseña es obligatoria';
  return errores;
};

export default function LoginPage() {
  const { iniciarSesion } = useAuth();
  const { abrirModal, cerrarModal, informar } = useModal();
  const navigate = useNavigate();
  const { cargando, ejecutar } = useAsync();

  const { valores, errores, manejarCambio, manejarBlur, validarTodo } = useForm(
    { correo: '', clave: '' },
    validar
  );

  const abrirOlvideClave = (e) => {
    e.preventDefault();
    informar(
      'Recuperación de contraseña',
      'Por políticas de seguridad de Segur Track, para restablecer su contraseña debe comunicarse con el Administrador del sistema (admin@segurtrack.com). El administrador reiniciará su acceso y su contraseña temporal volverá a ser su usuario/correo corporativo.',
      'info'
    );
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    if (!validarTodo()) return;

    await ejecutar(async () => {
      try {
        const resultado = await login(valores);
        const correoNormalizado = valores.correo.trim().toLowerCase();
        const claveIngresada = valores.clave.trim();
        const esClavePorDefecto = correoNormalizado === claveIngresada;
        const debeCambiar = Boolean(resultado.usuario?.debeCambiarClave) || esClavePorDefecto;

        if (debeCambiar) {
          localStorage.setItem('token', resultado.token);
          abrirModal({
            tipo: 'formulario',
            titulo: 'Actualización obligatoria de contraseña',
            contenido: (
              <ModalCambioObligatorio
                claveActual={valores.clave}
                onExito={() => {
                  iniciarSesion(resultado.token, {
                    ...resultado.usuario,
                    debeCambiarClave: false,
                  });
                  cerrarModal();
                  navigate('/');
                }}
                informar={informar}
              />
            ),
          });
          return;
        }

        iniciarSesion(resultado.token, resultado.usuario);
        navigate('/');
      } catch (err) {
        informar('Error de acceso', err.message || 'Credenciales incorrectas', 'error');
      }
    });
  };

  return (
    <div className="login-pagina">
      <div className="login-panel">
        <div className="login-logo">
          <span className="login-logo-icono" aria-hidden="true">ST</span>
          <h1 className="login-titulo">Segur Track</h1>
        </div>
        <p className="login-subtitulo">Sistema de monitoreo operativo de seguridad</p>

        <form onSubmit={manejarSubmit} noValidate className="login-formulario">
          <Input
            id="correo-login"
            label="Correo electrónico"
            nombre="correo"
            tipo="email"
            valor={valores.correo}
            onChange={manejarCambio}
            onBlur={manejarBlur}
            error={errores.correo}
            placeholder="usuario@segurtrack.com"
            requerido
            autoComplete="email"
          />
          <Input
            id="clave-login"
            label="Contraseña"
            nombre="clave"
            tipo="password"
            valor={valores.clave}
            onChange={manejarCambio}
            onBlur={manejarBlur}
            error={errores.clave}
            placeholder="••••••••"
            requerido
            autoComplete="current-password"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -6, marginBottom: 8 }}>
            <button
              type="button"
              onClick={abrirOlvideClave}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primario)',
                fontSize: 'var(--tam-sm)',
                fontWeight: 500,
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              ¿Olvidó su contraseña?
            </button>
          </div>

          <Button
            tipo="submit"
            variante="primario"
            cargando={cargando}
            disabled={cargando}
            tamano="lg"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Iniciar sesión
          </Button>
        </form>

        <div className="login-pie-contenedor">
          <div className="login-pie-insignia">
            <Icono nombre="escudo" tamano={15} color="var(--color-primario)" />
            <span>Acceso seguro para personal autorizado de Segur Track</span>
          </div>
        </div>
      </div>
    </div>
  );
}
