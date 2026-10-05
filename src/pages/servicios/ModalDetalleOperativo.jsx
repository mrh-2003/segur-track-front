import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import {
  obtenerDetalleOperativo,
  asociarProtocolosServicio,
  desasociarProtocoloServicio,
  crearRequerimientoServicio,
  eliminarRequerimientoServicio,
} from '../../api/servicios';
import { listarProtocolos, crearProtocolo } from '../../api/protocolos';
import { crearEvidencia, revisarEvidencia } from '../../api/evidencias';
import { formatearFecha } from '../../utils/fechas';
import './ModalDetalleOperativo.css';

export default function ModalDetalleOperativo({ servicioId, onCerrar, informar }) {
  const { usuario } = useAuth();
  const [pestana, setPestana] = useState('resumen');
  const [datos, setDatos] = useState(null);
  const [todosProtocolos, setTodosProtocolos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { cargando: cargandoAccion, ejecutar } = useAsync();

  const [mostrarFormReq, setMostrarFormReq] = useState(false);
  const [reqTitulo, setReqTitulo] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqPrioridad, setReqPrioridad] = useState('media');

  const [mostrarAsociarProt, setMostrarAsociarProt] = useState(false);
  const [protSeleccionadoId, setProtSeleccionadoId] = useState('');
  const [mostrarCrearProt, setMostrarCrearProt] = useState(false);
  const [nuevoProtCodigo, setNuevoProtCodigo] = useState('');
  const [nuevoProtNombre, setNuevoProtNombre] = useState('');
  const [nuevoProtDesc, setNuevoProtDesc] = useState('');
  const [nuevoProtActividades, setNuevoProtActividades] = useState('');

  const [mostrarFormEvidencia, setMostrarFormEvidencia] = useState(false);
  const [evTitulo, setEvTitulo] = useState('');
  const [evProtId, setEvProtId] = useState('');
  const [evDesc, setEvDesc] = useState('');
  const [evUrl, setEvUrl] = useState('');

  const [evidenciaARevisar, setEvidenciaARevisar] = useState(null);
  const [revEstado, setRevEstado] = useState('aprobada');
  const [revObservacion, setRevObservacion] = useState('');

  const [filtroEstadoEv, setFiltroEstadoEv] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [detalle, listaProts] = await Promise.all([
        obtenerDetalleOperativo(servicioId),
        listarProtocolos(),
      ]);
      setDatos(detalle);
      setTodosProtocolos(listaProts);
    } catch (err) {
      informar('Error', err.message, 'error');
    } finally {
      setCargando(false);
    }
  }, [servicioId, informar]);

  useEffect(() => {
    let activo = true;
    Promise.resolve().then(() => {
      if (activo) {
        cargar();
      }
    });
    return () => {
      activo = false;
    };
  }, [cargar]);

  const handleCrearRequerimiento = async (e) => {
    e.preventDefault();
    if (!reqTitulo.trim()) {
      informar('Dato requerido', 'El título del requerimiento es obligatorio', 'advertencia');
      return;
    }
    await ejecutar(async () => {
      try {
        await crearRequerimientoServicio(servicioId, {
          titulo: reqTitulo.trim(),
          descripcion: reqDesc.trim(),
          prioridad: reqPrioridad,
        });
        setReqTitulo('');
        setReqDesc('');
        setMostrarFormReq(false);
        await cargar();
        informar('Éxito', 'Requerimiento registrado', 'exito');
      } catch (err) {
        informar('Error', err.message, 'error');
      }
    });
  };

  const handleEliminarRequerimiento = async (reqId) => {
    await ejecutar(async () => {
      try {
        await eliminarRequerimientoServicio(servicioId, reqId);
        await cargar();
        informar('Éxito', 'Requerimiento retirado', 'exito');
      } catch (err) {
        informar('Error', err.message, 'error');
      }
    });
  };

  const handleAsociarProtocolo = async (e) => {
    e.preventDefault();
    if (!protSeleccionadoId) {
      informar('Selección requerida', 'Seleccione un protocolo para asociar', 'advertencia');
      return;
    }
    await ejecutar(async () => {
      try {
        await asociarProtocolosServicio(servicioId, { protocolos: [protSeleccionadoId] });
        setMostrarAsociarProt(false);
        setProtSeleccionadoId('');
        await cargar();
        informar('Éxito', 'Protocolo vinculado al servicio', 'exito');
      } catch (err) {
        informar('Error', err.message, 'error');
      }
    });
  };

  const handleCrearYAsociarProtocolo = async (e) => {
    e.preventDefault();
    if (!nuevoProtCodigo.trim() || !nuevoProtNombre.trim() || !nuevoProtActividades.trim()) {
      informar('Datos incompletos', 'Complete código, nombre y actividades del protocolo', 'advertencia');
      return;
    }
    await ejecutar(async () => {
      try {
        const nuevo = await crearProtocolo({
          codigo: nuevoProtCodigo.trim(),
          nombre: nuevoProtNombre.trim(),
          descripcion: nuevoProtDesc.trim(),
          actividades: nuevoProtActividades.trim(),
        });
        await asociarProtocolosServicio(servicioId, { protocolos: [nuevo.id] });
        setMostrarCrearProt(false);
        setNuevoProtCodigo('');
        setNuevoProtNombre('');
        setNuevoProtDesc('');
        setNuevoProtActividades('');
        await cargar();
        informar('Éxito', 'Protocolo registrado y asociado al servicio', 'exito');
      } catch (err) {
        informar('Error', err.message, 'error');
      }
    });
  };

  const handleDesasociarProtocolo = async (protocoloId) => {
    await ejecutar(async () => {
      try {
        await desasociarProtocoloServicio(servicioId, protocoloId);
        await cargar();
        informar('Éxito', 'Asociación de protocolo retirada', 'exito');
      } catch (err) {
        informar('Error', err.message, 'error');
      }
    });
  };

  const handleRegistrarEvidencia = async (e) => {
    e.preventDefault();
    if (!evTitulo.trim()) {
      informar('Dato requerido', 'El título de la evidencia es obligatorio', 'advertencia');
      return;
    }
    await ejecutar(async () => {
      try {
        await crearEvidencia({
          servicioId,
          protocoloId: evProtId ? parseInt(evProtId, 10) : null,
          titulo: evTitulo.trim(),
          descripcion: evDesc.trim(),
          archivoUrl: evUrl.trim() || null,
        });
        setMostrarFormEvidencia(false);
        setEvTitulo('');
        setEvProtId('');
        setEvDesc('');
        setEvUrl('');
        await cargar();
        informar('Éxito', 'Evidencia registrada correctamente', 'exito');
      } catch (err) {
        informar('Error', err.message, 'error');
      }
    });
  };

  const handleGuardarRevision = async (e) => {
    e.preventDefault();
    if (!evidenciaARevisar) return;
    await ejecutar(async () => {
      try {
        await revisarEvidencia(evidenciaARevisar.id, {
          estadoRevision: revEstado,
          observacion: revObservacion.trim() || null,
        });
        setEvidenciaARevisar(null);
        setRevObservacion('');
        await cargar();
        informar('Éxito', 'Revisión de evidencia guardada', 'exito');
      } catch (err) {
        informar('Error', err.message, 'error');
      }
    });
  };

  if (cargando || !datos) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Spinner texto="Cargando detalle operativo..." />
      </div>
    );
  }

  const { servicio, personalAsignado, protocolos, requerimientos, evidencias, incidencias } = datos;
  const esSupervisorOAdmin = usuario?.rol === 'administrador' || usuario?.rol === 'jefe_operaciones' || usuario?.rol === 'supervisor';

  const evidenciasFiltradas = filtroEstadoEv
    ? evidencias.filter((ev) => ev.estado_revision === filtroEstadoEv)
    : evidencias;

  const protocolosDisponiblesParaAsociar = todosProtocolos.filter(
    (tp) => !protocolos.some((p) => p.id === tp.id)
  );

  return (
    <div className="detalle-operativo-modal">
      <div className="detalle-operativo-cabecera">
        <div>
          <h2 className="detalle-op-nombre">{servicio.nombre}</h2>
          <p className="detalle-op-sub">
            {servicio.cliente} • Sede {servicio.sede} • Supervisor: {servicio.supervisor}
          </p>
        </div>
        <Badge valor={servicio.estado} />
      </div>

      <div className="detalle-op-pestanas">
        <button
          className={`pestana-btn ${pestana === 'resumen' ? 'activa' : ''}`}
          onClick={() => setPestana('resumen')}
        >
          Resumen y Personal ({personalAsignado.length})
        </button>
        <button
          className={`pestana-btn ${pestana === 'requerimientos' ? 'activa' : ''}`}
          onClick={() => setPestana('requerimientos')}
        >
          Requerimientos ({requerimientos.length})
        </button>
        <button
          className={`pestana-btn ${pestana === 'protocolos' ? 'activa' : ''}`}
          onClick={() => setPestana('protocolos')}
        >
          Protocolos ({protocolos.length})
        </button>
        <button
          className={`pestana-btn ${pestana === 'evidencias' ? 'activa' : ''}`}
          onClick={() => setPestana('evidencias')}
        >
          Evidencias ({evidencias.length})
        </button>
        <button
          className={`pestana-btn ${pestana === 'incidencias' ? 'activa' : ''}`}
          onClick={() => setPestana('incidencias')}
        >
          Incidencias ({incidencias.length})
        </button>
      </div>

      <div className="detalle-op-cuerpo">
        {pestana === 'resumen' && (
          <div className="detalle-panel-contenido">
            <div className="panel-info-grilla">
              <div className="info-bloque">
                <span className="info-rotulo">Horario de servicio</span>
                <span className="info-dato">{servicio.hora_inicio?.slice(0, 5)} - {servicio.hora_fin?.slice(0, 5)}</span>
              </div>
              <div className="info-bloque">
                <span className="info-rotulo">Fecha de inicio</span>
                <span className="info-dato">{formatearFecha(servicio.fecha_inicio)}</span>
              </div>
              <div className="info-bloque">
                <span className="info-rotulo">Fecha de finalización</span>
                <span className="info-dato">{servicio.fecha_fin ? formatearFecha(servicio.fecha_fin) : 'Indefinida'}</span>
              </div>
              <div className="info-bloque">
                <span className="info-rotulo">Total de agentes asignados</span>
                <span className="info-dato">{personalAsignado.length} personas</span>
              </div>
            </div>

            <h4 className="seccion-subtitulo">Personal Operativo Asignado</h4>
            {personalAsignado.length === 0 ? (
              <p className="vacio-mensaje">No hay personal operativo asignado actualmente a este servicio.</p>
            ) : (
              <div className="lista-cards-personal">
                {personalAsignado.map((p) => (
                  <div key={p.id} className="tarjeta-persona-asignada">
                    <div>
                      <strong>{p.nombres} {p.apellidos}</strong>
                      <span className="persona-doc">DNI: {p.documento} • {p.cargo}</span>
                    </div>
                    <Badge valor={p.estado} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {pestana === 'requerimientos' && (
          <div className="detalle-panel-contenido">
            <div className="panel-acciones-seccion">
              <h4 className="seccion-subtitulo">Requerimientos y Condiciones del Servicio</h4>
              {esSupervisorOAdmin && (
                <Button
                  variante="primario"
                  tamano="sm"
                  onClick={() => setMostrarFormReq(!mostrarFormReq)}
                >
                  {mostrarFormReq ? 'Cerrar formulario' : '+ Agregar requerimiento'}
                </Button>
              )}
            </div>

            {mostrarFormReq && (
              <form onSubmit={handleCrearRequerimiento} className="formulario-subpanel">
                <Input
                  id="req-titulo"
                  label="Título del requerimiento"
                  nombre="reqTitulo"
                  valor={reqTitulo}
                  onChange={(e) => setReqTitulo(e.target.value)}
                  placeholder="Ej. Control de precintos de seguridad"
                  requerido
                />
                <Input
                  id="req-desc"
                  label="Detalle / Especificación"
                  nombre="reqDesc"
                  valor={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  placeholder="Instrucciones detalladas a cumplir"
                />
                <Select
                  id="req-prioridad"
                  label="Prioridad"
                  nombre="reqPrioridad"
                  valor={reqPrioridad}
                  onChange={(e) => setReqPrioridad(e.target.value)}
                >
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </Select>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                  <Button tipo="button" variante="secundario" tamano="sm" onClick={() => setMostrarFormReq(false)}>
                    Cancelar
                  </Button>
                  <Button tipo="submit" variante="primario" tamano="sm" cargando={cargandoAccion}>
                    Guardar requerimiento
                  </Button>
                </div>
              </form>
            )}

            {requerimientos.length === 0 ? (
              <p className="vacio-mensaje">El servicio no cuenta con requerimientos específicos registrados.</p>
            ) : (
              <div className="lista-requerimientos">
                {requerimientos.map((r) => (
                  <div key={r.id} className="tarjeta-requerimiento">
                    <div className="req-cabecera">
                      <strong>{r.titulo}</strong>
                      <span className={`req-tag tag-${r.prioridad}`}>Prioridad {r.prioridad}</span>
                    </div>
                    {r.descripcion && <p className="req-cuerpo">{r.descripcion}</p>}
                    {esSupervisorOAdmin && (
                      <div className="req-pie">
                        <button
                          type="button"
                          className="btn-link-peligro"
                          onClick={() => handleEliminarRequerimiento(r.id)}
                        >
                          Eliminar requerimiento
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {pestana === 'protocolos' && (
          <div className="detalle-panel-contenido">
            <div className="panel-acciones-seccion">
              <h4 className="seccion-subtitulo">Protocolos Operativos Aplicables</h4>
              {esSupervisorOAdmin && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    variante="secundario"
                    tamano="sm"
                    onClick={() => {
                      setMostrarAsociarProt(!mostrarAsociarProt);
                      setMostrarCrearProt(false);
                    }}
                  >
                    Vincular protocolo existente
                  </Button>
                  <Button
                    variante="primario"
                    tamano="sm"
                    onClick={() => {
                      setMostrarCrearProt(!mostrarCrearProt);
                      setMostrarAsociarProt(false);
                    }}
                  >
                    + Crear y asociar protocolo
                  </Button>
                </div>
              )}
            </div>

            {mostrarAsociarProt && (
              <form onSubmit={handleAsociarProtocolo} className="formulario-subpanel">
                <Select
                  id="prot-asoc"
                  label="Seleccione protocolo disponible"
                  nombre="protSeleccionadoId"
                  valor={protSeleccionadoId}
                  onChange={(e) => setProtSeleccionadoId(e.target.value)}
                  placeholder="Seleccionar..."
                  requerido
                >
                  {protocolosDisponiblesParaAsociar.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.codigo}] {p.nombre}
                    </option>
                  ))}
                </Select>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                  <Button tipo="button" variante="secundario" tamano="sm" onClick={() => setMostrarAsociarProt(false)}>
                    Cancelar
                  </Button>
                  <Button tipo="submit" variante="primario" tamano="sm" cargando={cargandoAccion}>
                    Vincular al servicio
                  </Button>
                </div>
              </form>
            )}

            {mostrarCrearProt && (
              <form onSubmit={handleCrearYAsociarProtocolo} className="formulario-subpanel">
                <Input
                  id="nuevo-prot-cod"
                  label="Código del protocolo"
                  nombre="nuevoProtCodigo"
                  valor={nuevoProtCodigo}
                  onChange={(e) => setNuevoProtCodigo(e.target.value)}
                  placeholder="Ej. PROT-005"
                  requerido
                />
                <Input
                  id="nuevo-prot-nom"
                  label="Nombre del protocolo"
                  nombre="nuevoProtNombre"
                  valor={nuevoProtNombre}
                  onChange={(e) => setNuevoProtNombre(e.target.value)}
                  placeholder="Ej. Inspección de Salidas de Emergencia"
                  requerido
                />
                <Input
                  id="nuevo-prot-desc"
                  label="Descripción general"
                  nombre="nuevoProtDesc"
                  valor={nuevoProtDesc}
                  onChange={(e) => setNuevoProtDesc(e.target.value)}
                  placeholder="Alcance y objetivo del protocolo"
                />
                <Input
                  id="nuevo-prot-act"
                  label="Actividades y lineamientos a cumplir"
                  nombre="nuevoProtActividades"
                  valor={nuevoProtActividades}
                  onChange={(e) => setNuevoProtActividades(e.target.value)}
                  placeholder="Pasos y directivas obligatorias para el personal"
                  requerido
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                  <Button tipo="button" variante="secundario" tamano="sm" onClick={() => setMostrarCrearProt(false)}>
                    Cancelar
                  </Button>
                  <Button tipo="submit" variante="primario" tamano="sm" cargando={cargandoAccion}>
                    Registrar y vincular
                  </Button>
                </div>
              </form>
            )}

            {protocolos.length === 0 ? (
              <p className="vacio-mensaje">El servicio no cuenta con protocolos asociados actualmente.</p>
            ) : (
              <div className="lista-protocolos">
                {protocolos.map((p) => (
                  <div key={p.id} className="tarjeta-protocolo">
                    <div className="protocolo-cabecera">
                      <div>
                        <span className="protocolo-codigo">{p.codigo}</span>
                        <strong className="protocolo-titulo">{p.nombre}</strong>
                      </div>
                      {esSupervisorOAdmin && (
                        <button
                          type="button"
                          className="btn-link-peligro"
                          onClick={() => handleDesasociarProtocolo(p.id)}
                        >
                          Retirar protocolo
                        </button>
                      )}
                    </div>
                    {p.descripcion && <p className="protocolo-desc">{p.descripcion}</p>}
                    <div className="protocolo-actividades-caja">
                      <span className="actividades-rotulo">Actividades y lineamientos:</span>
                      <p className="actividades-texto">{p.actividades}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {pestana === 'evidencias' && (
          <div className="detalle-panel-contenido">
            <div className="panel-acciones-seccion">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h4 className="seccion-subtitulo" style={{ margin: 0 }}>Evidencias del Servicio</h4>
                <div style={{ width: 180 }}>
                  <Select
                    id="filtro-ev-estado"
                    nombre="filtroEstadoEv"
                    valor={filtroEstadoEv}
                    onChange={(e) => setFiltroEstadoEv(e.target.value)}
                    placeholder="Todos los estados"
                  >
                    <option value="pendiente">Pendientes</option>
                    <option value="aprobada">Aprobadas</option>
                    <option value="observada">Observadas</option>
                  </Select>
                </div>
              </div>
              <Button
                variante="primario"
                tamano="sm"
                onClick={() => setMostrarFormEvidencia(!mostrarFormEvidencia)}
              >
                {mostrarFormEvidencia ? 'Cerrar formulario' : '+ Registrar evidencia'}
              </Button>
            </div>

            {mostrarFormEvidencia && (
              <form onSubmit={handleRegistrarEvidencia} className="formulario-subpanel">
                <Input
                  id="ev-titulo"
                  label="Título de la evidencia"
                  nombre="evTitulo"
                  valor={evTitulo}
                  onChange={(e) => setEvTitulo(e.target.value)}
                  placeholder="Ej. Comprobación de sellos en esclusa 2"
                  requerido
                />
                <Select
                  id="ev-prot"
                  label="Protocolo asociado"
                  nombre="evProtId"
                  valor={evProtId}
                  onChange={(e) => setEvProtId(e.target.value)}
                  placeholder="Ninguno / General"
                >
                  {protocolos.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.codigo}] {p.nombre}
                    </option>
                  ))}
                </Select>
                <Input
                  id="ev-desc"
                  label="Descripción y sustento de la actividad"
                  nombre="evDesc"
                  valor={evDesc}
                  onChange={(e) => setEvDesc(e.target.value)}
                  placeholder="Detalle de la labor realizada"
                />
                <Input
                  id="ev-url"
                  label="Enlace a archivo o fotografía (URL)"
                  nombre="evUrl"
                  valor={evUrl}
                  onChange={(e) => setEvUrl(e.target.value)}
                  placeholder="https://..."
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                  <Button tipo="button" variante="secundario" tamano="sm" onClick={() => setMostrarFormEvidencia(false)}>
                    Cancelar
                  </Button>
                  <Button tipo="submit" variante="primario" tamano="sm" cargando={cargandoAccion}>
                    Guardar evidencia
                  </Button>
                </div>
              </form>
            )}

            {evidenciaARevisar && (
              <form onSubmit={handleGuardarRevision} className="formulario-subpanel panel-revision">
                <h5 style={{ margin: '0 0 8px 0', fontSize: 'var(--tam-sm)' }}>
                  Revisión de evidencia: <strong>{evidenciaARevisar.titulo}</strong>
                </h5>
                <Select
                  id="rev-estado"
                  label="Estado de revisión"
                  nombre="revEstado"
                  valor={revEstado}
                  onChange={(e) => setRevEstado(e.target.value)}
                  requerido
                >
                  <option value="aprobada">Aprobada</option>
                  <option value="observada">Observada</option>
                  <option value="pendiente">Pendiente</option>
                </Select>
                <Input
                  id="rev-obs"
                  label="Observación o retroalimentación"
                  nombre="revObservacion"
                  valor={revObservacion}
                  onChange={(e) => setRevObservacion(e.target.value)}
                  placeholder="Comentario para el personal operativo"
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                  <Button tipo="button" variante="secundario" tamano="sm" onClick={() => setEvidenciaARevisar(null)}>
                    Cancelar
                  </Button>
                  <Button tipo="submit" variante="primario" tamano="sm" cargando={cargandoAccion}>
                    Confirmar revisión
                  </Button>
                </div>
              </form>
            )}

            {evidenciasFiltradas.length === 0 ? (
              <p className="vacio-mensaje">No existen evidencias registradas para el servicio con el filtro seleccionado.</p>
            ) : (
              <div className="lista-evidencias">
                {evidenciasFiltradas.map((ev) => (
                  <div key={ev.id} className="tarjeta-evidencia">
                    <div className="ev-cabecera">
                      <div>
                        <strong>{ev.titulo}</strong>
                        {ev.protocolo && (
                          <span className="ev-protocolo-chip">
                            {ev.protocolo_codigo ? `[${ev.protocolo_codigo}] ` : ''}{ev.protocolo}
                          </span>
                        )}
                      </div>
                      <Badge valor={ev.estado_revision} />
                    </div>
                    {ev.descripcion && <p className="ev-desc">{ev.descripcion}</p>}
                    {ev.archivo_url && (
                      <div className="ev-enlace-caja">
                        <a href={ev.archivo_url} target="_blank" rel="noreferrer" className="ev-link">
                          Ver archivo / evidencia adjunta ↗
                        </a>
                      </div>
                    )}
                    <div className="ev-pie">
                      <span className="ev-meta">
                        Registrado por {ev.personal} • {ev.fecha_registro}
                      </span>
                      {esSupervisorOAdmin && (
                        <button
                          type="button"
                          className="btn-link-accion"
                          onClick={() => {
                            setEvidenciaARevisar(ev);
                            setRevEstado(ev.estado_revision);
                            setRevObservacion(ev.observacion || '');
                          }}
                        >
                          Revisar evidencia
                        </button>
                      )}
                    </div>
                    {ev.observacion && (
                      <div className="ev-observacion-caja">
                        <strong>Observación de revisión:</strong> {ev.observacion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {pestana === 'incidencias' && (
          <div className="detalle-panel-contenido">
            <h4 className="seccion-subtitulo">Incidencias Reportadas en este Servicio</h4>
            {incidencias.length === 0 ? (
              <p className="vacio-mensaje">No hay incidencias reportadas en este servicio.</p>
            ) : (
              <div className="lista-incidencias-servicio">
                {incidencias.map((inc) => (
                  <div key={inc.id} className="tarjeta-incidencia-srv">
                    <div className="inc-srv-top">
                      <span className="inc-srv-codigo">{inc.codigo}</span>
                      <strong className="inc-srv-tipo">{inc.tipo}</strong>
                      <Badge valor={inc.estado} />
                      <Badge valor={inc.prioridad} />
                    </div>
                    <p className="inc-srv-desc">{inc.descripcion}</p>
                    {inc.observacion && (
                      <p className="inc-srv-obs">
                        <strong>Acción / Observación:</strong> {inc.observacion}
                      </p>
                    )}
                    <span className="inc-srv-fecha">
                      Reportado: {inc.fecha_registro} • Por: {inc.personal_registra}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="detalle-op-footer">
        <Button variante="secundario" onClick={onCerrar}>
          Cerrar
        </Button>
      </div>
    </div>
  );
}
