import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function MainLayout() {
  const [sidebarVisible, setSidebarVisible] = useState(() => window.innerWidth > 768);
  const [prevPath, setPrevPath] = useState('');
  const location = useLocation();

  if (location.pathname !== prevPath) {
    setPrevPath(location.pathname);
    if (window.innerWidth <= 768) {
      setSidebarVisible(false);
    }
  }

  return (
    <div className={`layout-principal ${sidebarVisible ? 'layout-sidebar-abierto' : 'layout-sidebar-cerrado'}`}>
      <Sidebar visible={sidebarVisible} onCerrar={() => setSidebarVisible(false)} />
      {sidebarVisible && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarVisible(false)}
          aria-hidden="true"
        />
      )}
      <div className="contenido-principal">
        <Topbar onToggleSidebar={() => setSidebarVisible((v) => !v)} />
        <main className="area-contenido" id="contenido-principal">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
