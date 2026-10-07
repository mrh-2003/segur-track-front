import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useModal } from '../../hooks/useModal';
import { logout } from '../../api/auth';
import { listarPersonal } from '../../api/personal';
import { listarServicios } from '../../api/servicios';
import { listarIncidencias } from '../../api/incidencias';
import { Icono } from '../ui/Icono';
import ModalPerfil from './ModalPerfil';
import './Topbar.css';

const DEBOUNCE_MS = 300;

export function Topbar({ onToggleSidebar }) {
  const { usuario, cerrarSesion, sincronizarPerfil } = useAuth();
  const { tema, alternarTema } = useTheme();
  const { abrirModal, cerrarModal, confirmar, informar } = useModal();
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState({ personal: [], servicios: [], incidencias: [] });
  const [buscando, setBuscando] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const navigate = useNavigate();
  const contenedorRef = useRef(null);

  const manejarLogout = () => {
    confirmar(
      '¿Está seguro de que desea cerrar la sesión actual?',
      async () => {
        try {
          await logout();
        } catch {
          void 0;
        }
        cerrarSesion();
        navigate('/login');
      },
      { titulo: 'Cerrar sesión', textoConfirmar: 'Cerrar sesión' }
    );
  };

  const abrirModalPerfil = () => {
    abrirModal({
      tipo: 'formulario',
      titulo: 'Mi Perfil de Usuario',
      contenido: (
        <ModalPerfil
          usuario={usuario}
          onActualizado={async () => {
            if (sincronizarPerfil) await sincronizarPerfil();
          }}
          onCancelar={cerrarModal}
          informar={informar}
        />
      ),
    });
  };

  useEffect(() => {
    const termino = busqueda.trim();
    if (termino.length < 2) return;

    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const [pers, serv, inc] = await Promise.all([
          listarPersonal({ q: termino }),
          listarServicios({ q: termino }),
          listarIncidencias({ q: termino }),
        ]);
        setResultados({
          personal: (pers || []).slice(0, 3),
          servicios: (serv || []).slice(0, 3),
          incidencias: (inc || []).slice(0, 3),
        });
        setMostrarResultados(true);
      } catch {
        setResultados({ personal: [], servicios: [], incidencias: [] });
      } finally {
        setBuscando(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(t);
  }, [busqueda]);

  useEffect(() => {
    const clickAfuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setMostrarResultados(false);
      }
    };
    document.addEventListener('mousedown', clickAfuera);
    return () => document.removeEventListener('mousedown', clickAfuera);
  }, []);

  const seleccionar = (ruta) => {
    setMostrarResultados(false);
    setBusqueda('');
    navigate(ruta);
  };

  const totalResultados =
    resultados.personal.length + resultados.servicios.length + resultados.incidencias.length;

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
        <div className="topbar-buscador-contenedor" ref={contenedorRef}>
          <div className="topbar-buscador">
            <span className="topbar-buscador-icono" aria-hidden="true">
              <Icono nombre="buscar" tamano={15} />
            </span>
            <input
              type="search"
              placeholder="Buscar personal, servicios o incidencias..."
              value={busqueda}
              onChange={(e) => {
                const valor = e.target.value;
                setBusqueda(valor);
                if (valor.trim().length < 2) {
                  setResultados({ personal: [], servicios: [], incidencias: [] });
                  setMostrarResultados(false);
                }
              }}
              onFocus={() => {
                if (busqueda.trim().length >= 2) setMostrarResultados(true);
              }}
              className="topbar-buscador-input"
              aria-label="Buscador global"
            />
            {buscando && <span className="topbar-spinner-inline" />}
          </div>

          {mostrarResultados && (
            <div className="topbar-resultados-dropdown">
              {totalResultados === 0 && !buscando ? (
                <div className="topbar-resultado-vacio">
                  Sin resultados para "{busqueda}"
                </div>
              ) : (
                <div className="topbar-resultado-secciones">
                  {resultados.personal.length > 0 && (
                    <div className="topbar-seccion">
                      <div className="topbar-seccion-titulo">Personal</div>
                      {resultados.personal.map((p) => (
                        <button
                          key={p.id}
                          className="topbar-resultado-item"
                          onClick={() => seleccionar('/personal')}
                        >
                          <span className="topbar-resultado-icono">
                            <Icono nombre="usuario" tamano={16} />
                          </span>
                          <div className="topbar-resultado-datos">
                            <span className="topbar-resultado-nombre">
                              {p.nombres} {p.apellidos}
                            </span>
                            <span className="topbar-resultado-sub">
                              {p.cargo} · {p.documento}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {resultados.servicios.length > 0 && (
                    <div className="topbar-seccion">
                      <div className="topbar-seccion-titulo">Servicios</div>
                      {resultados.servicios.map((s) => (
                        <button
                          key={s.id}
                          className="topbar-resultado-item"
                          onClick={() => seleccionar('/servicios')}
                        >
                          <span className="topbar-resultado-icono">
                            <Icono nombre="escudo" tamano={16} />
                          </span>
                          <div className="topbar-resultado-datos">
                            <span className="topbar-resultado-nombre">{s.nombre}</span>
                            <span className="topbar-resultado-sub">
                              {s.cliente || 'Cliente'} · {s.estado}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {resultados.incidencias.length > 0 && (
                    <div className="topbar-seccion">
                      <div className="topbar-seccion-titulo">Incidencias</div>
                      {resultados.incidencias.map((inc) => (
                        <button
                          key={inc.id}
                          className="topbar-resultado-item"
                          onClick={() => seleccionar('/incidencias')}
                        >
                          <span className="topbar-resultado-icono">
                            <Icono nombre="alerta" tamano={16} />
                          </span>
                          <div className="topbar-resultado-datos">
                            <span className="topbar-resultado-nombre">{inc.codigo}</span>
                            <span className="topbar-resultado-sub">
                              {inc.tipo || inc.descripcion?.slice(0, 35)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="topbar-derecha">
        <button
          className="topbar-tema-btn"
          onClick={alternarTema}
          aria-label={`Cambiar a tema ${tema === 'dark' ? 'claro' : 'oscuro'}`}
          title="Alternar tema"
        >
          {tema === 'dark' ? (
            <Icono nombre="sol" tamano={16} />
          ) : (
            <Icono nombre="luna" tamano={16} />
          )}
        </button>

        <button
          className="topbar-usuario"
          onClick={abrirModalPerfil}
          title="Ver y editar perfil de usuario"
          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <div className="topbar-usuario-avatar" aria-hidden="true">
            {usuario?.nombres?.charAt(0)?.toUpperCase() || usuario?.nombre?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="topbar-usuario-info">
            <p className="topbar-usuario-nombre">{usuario?.nombre || 'Usuario'}</p>
            <p className="topbar-usuario-rol" style={{ textTransform: 'capitalize' }}>
              {usuario?.rol || 'Operaciones'}
            </p>
          </div>
        </button>

        <button
          className="topbar-logout-btn"
          onClick={manejarLogout}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <Icono nombre="logout" tamano={17} />
        </button>
      </div>
    </header>
  );
}
