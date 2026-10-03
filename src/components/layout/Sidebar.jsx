import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

const MENU = [
  { ruta: '/', etiqueta: 'Inicio', roles: ['administrador', 'supervisor', 'operador'] },
  { ruta: '/personal', etiqueta: 'Personal', roles: ['administrador'] },
  { ruta: '/turnos', etiqueta: 'Turnos', roles: ['administrador', 'supervisor', 'operador'] },
  { ruta: '/servicios', etiqueta: 'Servicios', roles: ['administrador', 'supervisor'] },
  { ruta: '/sedes', etiqueta: 'Sedes', roles: ['administrador', 'supervisor'] },
  { ruta: '/clientes', etiqueta: 'Clientes', roles: ['administrador', 'supervisor'] },
  { ruta: '/incidencias', etiqueta: 'Incidencias', roles: ['administrador', 'supervisor', 'operador'] },
  { ruta: '/dashboard-bi', etiqueta: 'Dashboard BI', roles: ['administrador'] },
  { ruta: '/monitor-multicriterio', etiqueta: 'Monitor multicriterio', roles: ['administrador'] },
  { ruta: '/reportes', etiqueta: 'Reportes', roles: ['administrador'] },
];

export function Sidebar({ visible, onCerrar }) {
  const { usuario } = useAuth();
  const rol = usuario?.rol || 'operador';

  const menuFiltrado = MENU.filter((item) => item.roles.includes(rol));

  return (
    <nav className={`sidebar ${visible ? 'sidebar-visible' : 'sidebar-oculto'}`} aria-label="Navegación principal">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icono" aria-hidden="true">ST</span>
        <span className="sidebar-logo-texto">Segur Track</span>
        <button
          className="sidebar-cerrar-mobile"
          onClick={onCerrar}
          aria-label="Cerrar navegación"
          type="button"
        >
          ✕
        </button>
      </div>
      <ul className="sidebar-menu" role="list">
        {menuFiltrado.map((item) => (
          <li key={item.ruta}>
            <NavLink
              to={item.ruta}
              end={item.ruta === '/'}
              onClick={() => {
                if (window.innerWidth <= 768 && onCerrar) {
                  onCerrar();
                }
              }}
              className={({ isActive }) =>
                `sidebar-enlace ${isActive ? 'sidebar-enlace-activo' : ''}`
              }
            >
              {item.etiqueta}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
