import './Button.css';

export function Button({
  children,
  variante = 'primario',
  cargando = false,
  disabled = false,
  tipo = 'button',
  onClick,
  tamano = 'md',
  ...resto
}) {
  return (
    <button
      type={tipo}
      className={`btn btn-${variante} btn-${tamano}`}
      disabled={disabled || cargando}
      onClick={onClick}
      {...resto}
    >
      {cargando && <span className="btn-spinner" aria-hidden="true" />}
      <span className={cargando ? 'btn-texto-cargando' : ''}>
        {cargando ? obtenerTextoCargando(children) : children}
      </span>
    </button>
  );
}

function obtenerTextoCargando(children) {
  const textos = {
    'Guardar': 'Guardando...',
    'Crear': 'Creando...',
    'Eliminar': 'Eliminando...',
    'Confirmar': 'Procesando...',
    'Iniciar sesión': 'Entrando...',
    'Exportar': 'Exportando...',
    'Evaluar': 'Evaluando...',
    'Generar': 'Generando...',
  };
  const texto = typeof children === 'string' ? children : '';
  return textos[texto] || 'Procesando...';
}
