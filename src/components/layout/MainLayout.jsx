import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Modal } from '../ui/Modal';
import { useModal } from '../../hooks/useModal';

export function MainLayout() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const { modal, cerrarModal } = useModal();

  return (
    <div className="layout-principal">
      <Sidebar visible={sidebarVisible} />
      <div className="contenido-principal">
        <Topbar onToggleSidebar={() => setSidebarVisible((v) => !v)} />
        <main className="area-contenido" id="contenido-principal">
          <Outlet />
        </main>
      </div>
      <Modal modal={modal} onCerrar={cerrarModal} />
    </div>
  );
}
