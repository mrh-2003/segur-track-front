import './Button.css';

function extraerTexto(nodo) {
  if (typeof nodo === 'string' || typeof nodo === 'number') return String(nodo);
  if (Array.isArray(nodo)) return nodo.map(extraerTexto).join(' ');
  if (nodo && nodo.props && nodo.props.children) return extraerTexto(nodo.props.children);
  return '';
}

function obtenerTextoCargando(children, tipo) {
  const texto = extraerTexto(children).trim().toLowerCase();

  if (texto.includes('guardar')) return 'Guardando...';
  if (texto.includes('crear') || texto.includes('registrar')) return 'Creando...';
  if (texto.includes('asignar')) return 'Asignando...';
  if (texto.includes('eliminar') || texto.includes('retirar')) return 'Eliminando...';
  if (texto.includes('confirmar')) return 'Confirmando...';
  if (texto.includes('rechazar')) return 'Procesando...';
  if (texto.includes('actualizar') || texto.includes('refrescar')) return 'Actualizando...';
  if (texto.includes('descargar')) return 'Descargando...';
  if (texto.includes('exportar')) return 'Exportando...';
  if (texto.includes('evaluar') || texto.includes('recalcular')) return 'Evaluando...';
  if (texto.includes('vincular')) return 'Vinculando...';
  if (texto.includes('revisar')) return 'Guardando...';
  if (texto.includes('iniciar') || texto.includes('entrar')) return 'Entrando...';
  if (texto.includes('enviar')) return 'Enviando...';
  if (texto.includes('restablecer')) return 'Guardando...';
  if (texto.includes('cambiar')) return 'Guardando...';
  if (texto.includes('culminar')) return 'Guardando...';
  if (tipo === 'submit') return 'Guardando...';
  return 'Cargando...';
}

export function Button({
  children,
  variante = 'primario',
  cargando = false,
  textoCargando,
  disabled = false,
  tipo = 'button',
  onClick,
  tamano = 'md',
  ...resto
}) {
  const textoAMostrar = textoCargando || obtenerTextoCargando(children, tipo);

  return (
    <button
      type={tipo}
      className={`btn btn-${variante} btn-${tamano} ${cargando ? 'btn-cargando' : ''}`}
      disabled={disabled || cargando}
      onClick={onClick}
      {...resto}
    >
      {cargando && <span className="btn-spinner" aria-hidden="true" />}
      <span className={cargando ? 'btn-texto-cargando' : 'btn-contenido'}>
        {cargando ? textoAMostrar : children}
      </span>
    </button>
  );
}
