import { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [modal, setModal] = useState(null);

  const abrirModal = useCallback((config) => {
    setModal(config);
  }, []);

  const cerrarModal = useCallback(() => {
    setModal(null);
  }, []);

  const confirmar = useCallback((mensaje, onConfirmar, opciones = {}) => {
    setModal({
      tipo: 'confirmacion',
      titulo: opciones.titulo || 'Confirmar acción',
      mensaje,
      onConfirmar,
      labelConfirmar: opciones.labelConfirmar || 'Confirmar',
      labelCancelar: opciones.labelCancelar || 'Cancelar',
      variante: opciones.variante || 'peligro',
    });
  }, []);

  const informar = useCallback((titulo, mensaje, variante = 'info') => {
    setModal({ tipo: 'informacion', titulo, mensaje, variante });
  }, []);

  return (
    <ModalContext.Provider value={{ modal, abrirModal, cerrarModal, confirmar, informar }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}
