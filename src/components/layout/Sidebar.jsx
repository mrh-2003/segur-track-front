import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const MENU = [
  { ruta: '/', etiqueta: 'Inicio' },
  { ruta: '/personal', etiqueta: 'Personal' },
  { ruta: '/turnos', etiqueta: 'Turnos' },
  { ruta: '/servicios', etiqueta: 'Servicios' },
  { ruta: '/sedes', etiqueta: 'Sedes' },
  { ruta: '/clientes', etiqueta: 'Clientes' },
  { ruta: '/incidencias', etiqueta: 'Incidencias' },
  { ruta: '/dashboard-bi', etiqueta: 'Dashboard BI' },
  { ruta: '/monitor-multicriterio', etiqueta: 'Monitor multicriterio' },
  { ruta: '/reportes', etiqueta: 'Reportes' },
];

export function Sidebar({ visible, onCerrar }) {
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
        {MENU.map((item) => (
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
