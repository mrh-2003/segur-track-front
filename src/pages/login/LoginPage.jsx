import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useModal } from '../../hooks/useModal';
import { useForm } from '../../hooks/useForm';
import { useAsync } from '../../hooks/useAsync';
import { login } from '../../api/auth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
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
  const { informar } = useModal();
  const navigate = useNavigate();
  const { cargando, ejecutar } = useAsync();

  const { valores, errores, manejarCambio, manejarBlur, validarTodo } = useForm(
    { correo: '', clave: '' },
    validar
  );

  const manejarSubmit = async (e) => {
    e.preventDefault();
    if (!validarTodo()) return;

    await ejecutar(async () => {
      try {
        const resultado = await login(valores);
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
          <span className="login-logo-icono" aria-hidden="true">M</span>
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
            placeholder="nombre@empresa.com"
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
      </div>
    </div>
  );
}
