import { useEffect, useRef } from 'react';
import { Button } from './Button';
import './Modal.css';

export function Modal({ modal, onCerrar }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!modal) return;
    const el = dialogRef.current;
    if (!el) return;
    el.focus();

    const manejarEscape = (e) => {
      if (e.key === 'Escape' && modal.tipo !== 'formulario') onCerrar();
    };
    document.addEventListener('keydown', manejarEscape);
    return () => document.removeEventListener('keydown', manejarEscape);
  }, [modal, onCerrar]);

  if (!modal) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && modal.tipo !== 'formulario') onCerrar(); }}>
      <div
        className={`modal-contenedor modal-${modal.tipo}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="modal-encabezado">
          <h2 id="modal-titulo" className="modal-titulo">{modal.titulo}</h2>
          {modal.tipo !== 'confirmacion' && (
            <button className="modal-cerrar" onClick={onCerrar} aria-label="Cerrar">✕</button>
          )}
        </div>

        <div className="modal-cuerpo">
          {modal.tipo === 'formulario' && modal.contenido}

          {modal.tipo === 'confirmacion' && (
            <p className="modal-mensaje">{modal.mensaje}</p>
          )}

          {modal.tipo === 'informacion' && (
            <p className={`modal-mensaje modal-info-${modal.variante || 'info'}`}>{modal.mensaje}</p>
          )}
        </div>

        {(modal.tipo === 'confirmacion' || modal.tipo === 'informacion') && (
          <div className="modal-pie">
            {modal.tipo === 'confirmacion' && (
              <>
                <Button variante="secundario" onClick={onCerrar} disabled={modal.cargando}>
                  {modal.labelCancelar || 'Cancelar'}
                </Button>
                <Button
                  variante={modal.variante === 'peligro' ? 'peligro' : 'primario'}
                  cargando={modal.cargando}
                  onClick={async () => {
                    if (modal.onConfirmar) await modal.onConfirmar();
                    onCerrar();
                  }}
                >
                  {modal.labelConfirmar || 'Confirmar'}
                </Button>
              </>
            )}
            {modal.tipo === 'informacion' && (
              <Button variante="primario" onClick={onCerrar}>Aceptar</Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
