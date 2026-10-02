import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { logout } from '../../api/auth';
import './Topbar.css';

export function Topbar({ onToggleSidebar }) {
  const { usuario, cerrarSesion } = useAuth();
  const { tema, alternarTema } = useTheme();
  const [busqueda, setBusqueda] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const manejarLogout = async () => {
    await logout().catch(() => {});
    cerrarSesion();
    navigate('/login');
  };

  const manejarBusqueda = (e) => {
    if (e.key === 'Enter' && busqueda.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(busqueda.trim())}`);
      setBusqueda('');
    }
  };

  return (
    <header className="topbar" role="banner">
      <div className="topbar-izquierda">
        <button
          className="topbar-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Alternar menú"
        >
          ☰
        </button>
        <div className="topbar-buscador">
          <span className="topbar-buscador-icono" aria-hidden="true">🔍</span>
          <input
            ref={inputRef}
            type="search"
            placeholder="Buscar personal, servicios o incidencias..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={manejarBusqueda}
            className="topbar-buscador-input"
            aria-label="Buscador global"
          />
        </div>
      </div>

      <div className="topbar-derecha">
        <button
          className="topbar-tema-btn"
          onClick={alternarTema}
          aria-label={`Cambiar a tema ${tema === 'dark' ? 'claro' : 'oscuro'}`}
          title="Alternar tema"
        >
          {tema === 'dark' ? '☀️' : '🌙'}
        </button>

        <div className="topbar-usuario">
          <div className="topbar-usuario-avatar" aria-hidden="true">
            {usuario?.nombre?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="topbar-usuario-info">
            <p className="topbar-usuario-nombre">{usuario?.nombre || 'Administrador'}</p>
            <p className="topbar-usuario-rol">
              {usuario?.rol === 'administrador' ? 'Operaciones' : usuario?.rol}
            </p>
          </div>
        </div>

        <button
          className="topbar-logout-btn"
          onClick={manejarLogout}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          ⏻
        </button>
      </div>
    </header>
  );
}
