import { Icono } from '../ui/Icono';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

const MENU = [
  {
    ruta: '/',
    etiqueta: 'Inicio',
    roles: ['administrador', 'jefe_operaciones', 'supervisor', 'operador'],
  },
  {
    ruta: '/personal',
    etiqueta: 'Personal',
    roles: ['administrador', 'jefe_operaciones'],
  },
  {
    ruta: '/turnos',
    etiqueta: 'Turnos',
    roles: ['administrador', 'jefe_operaciones', 'supervisor', 'operador'],
  },
  {
    ruta: '/servicios',
    etiqueta: 'Servicios',
    roles: ['administrador', 'jefe_operaciones', 'supervisor', 'operador'],
  },
  {
    ruta: '/sedes',
    etiqueta: 'Sedes',
    roles: ['administrador', 'jefe_operaciones', 'supervisor'],
  },
  {
    ruta: '/clientes',
    etiqueta: 'Clientes',
    roles: ['administrador', 'jefe_operaciones', 'supervisor'],
  },
  {
    ruta: '/incidencias',
    etiqueta: 'Incidencias',
    roles: ['administrador', 'jefe_operaciones', 'supervisor', 'operador'],
  },
  {
    ruta: '/monitor-operativo',
    etiqueta: 'Monitor Operativo',
    roles: ['administrador', 'jefe_operaciones', 'supervisor', 'operador'],
  },
  {
    ruta: '/dashboard-bi',
    etiqueta: 'Dashboard BI',
    roles: ['administrador', 'jefe_operaciones', 'supervisor'],
  },
  {
    ruta: '/monitor-multicriterio',
    etiqueta: 'Monitor multicriterio',
    roles: ['administrador', 'jefe_operaciones', 'supervisor'],
  },
  {
    ruta: '/analisis-historico',
    etiqueta: 'Análisis histórico',
    roles: ['administrador', 'jefe_operaciones'],
  },
  {
    ruta: '/reportes',
    etiqueta: 'Reportes',
    roles: ['administrador', 'jefe_operaciones'],
  },
];

export function Sidebar({ visible, onCerrar }) {
  const { usuario } = useAuth();
  const rol = usuario?.rol || 'operador';

  const iconos = {
    '/': 'escudo',
    '/personal': 'personal',
    '/turnos': 'turnos',
    '/servicios': 'servicios',
    '/sedes': 'sede',
    '/clientes': 'personal',
    '/incidencias': 'incidencias',
    '/monitor-operativo': 'escudo',
    '/dashboard-bi': 'actividad',
    '/monitor-multicriterio': 'actividad',
    '/analisis-historico': 'calendario',
    '/reportes': 'actividad',
  };
  const menuFiltrado = MENU.filter((item) => item.roles.includes(rol));

  return (
    <nav
      className={`sidebar ${visible ? 'sidebar-visible' : 'sidebar-oculto'}`}
      aria-label="Navegación principal"
    >
      <div className="sidebar-logo">
        <span className="sidebar-logo-icono" aria-hidden="true">
          <Icono nombre="escudo" tamano={23} />
        </span>
        <span className="sidebar-logo-texto">
          Segur Track<small>GESTIÓN OPERATIVA</small>
        </span>
        <button
          className="sidebar-cerrar-mobile"
          onClick={onCerrar}
          aria-label="Cerrar navegación"
          type="button"
        >
          ✕
        </button>
      </div>
      <p className="sidebar-grupo">ESPACIO DE TRABAJO</p>
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
              <Icono nombre={iconos[item.ruta]} tamano={17} />
              {item.etiqueta}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="sidebar-pie">
        <span className="sidebar-pie-icono">
          <Icono nombre="escudo" tamano={18} />
        </span>
        <div>
          <strong>Centro de operaciones</strong>
          <small>
            <i />
            Gestión y seguimiento
          </small>
        </div>
      </div>
    </nav>
  );
}
