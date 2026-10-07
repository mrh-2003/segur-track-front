import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import { Icono } from '../../components/ui/Icono';
import {
  obtenerDetalleOperativo,
  asociarProtocolosServicio,
  desasociarProtocoloServicio,
  crearRequerimientoServicio,
  eliminarRequerimientoServicio,
  asignarPersonalServicio,
  desasignarPersonalServicio,
} from '../../api/servicios';
import { listarPersonal } from '../../api/personal';
import { listarProtocolos, crearProtocolo } from '../../api/protocolos';
import { crearEvidencia, revisarEvidencia } from '../../api/evidencias';
import { subirMultiplesFotosImageKit } from '../../utils/imagekit';
import { formatearFecha } from '../../utils/fechas';
import './ModalDetalleOperativo.css';

function formatearTamano(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ModalDetalleOperativo({ servicioId, onCerrar, informar }) {
  const { usuario } = useAuth();
  const [pestana, setPestana] = useState('resumen');
  const [datos, setDatos] = useState(null);
  const [todosProtocolos, setTodosProtocolos] = useState([]);
  const [todosPersonal, setTodosPersonal] = useState([]);
  const [mostrarAsignarPersonal, setMostrarAsignarPersonal] = useState(false);
  const [personalAAsignarId, setPersonalAAsignarId] = useState('');
  const [filtroPersonal, setFiltroPersonal] = useState('');
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
  const [evPersonalId, setEvPersonalId] = useState('');
  const [evDesc, setEvDesc] = useState('');
  const [archivosEvidencia, setArchivosEvidencia] = useState([]);
  const [arrastrandoEvidencia, setArrastrandoEvidencia] = useState(false);
  const [errorCargaEvidencia, setErrorCargaEvidencia] = useState('');
  const [fotoModal, setFotoModal] = useState(null);
  const inputEvidenciaRef = useRef(null);

  const [evidenciaARevisar, setEvidenciaARevisar] = useState(null);
  const [revEstado, setRevEstado] = useState('aprobada');
  const [revObservacion, setRevObservacion] = useState('');

  const [filtroEstadoEv, setFiltroEstadoEv] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [detalle, listaProts, listaPersonal] = await Promise.all([
        obtenerDetalleOperativo(servicioId),
        listarProtocolos(),
        listarPersonal({ estado: 'activo' }),
      ]);
      setDatos(detalle);
      setTodosProtocolos(listaProts);
      setTodosPersonal(listaPersonal);
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

  useEffect(() => {
    if (datos) {
      if (usuario?.personalId) {
        setEvPersonalId(String(usuario.personalId));
      } else if (datos.servicio?.supervisor_id) {
        setEvPersonalId(String(datos.servicio.supervisor_id));
      } else if (datos.personalAsignado?.length > 0) {
        setEvPersonalId(String(datos.personalAsignado[0].id));
      }
    }
  }, [datos, usuario]);

  const agregarArchivosEvidencia = (files) => {
    setErrorCargaEvidencia('');
    const validos = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (validos.length === 0) {
      setErrorCargaEvidencia('Solo se permiten archivos de imagen (JPG, PNG, WEBP, etc.)');
      return;
    }
    const nuevos = validos.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      nombre: file.name,
      tamano: file.size,
      previewUrl: URL.createObjectURL(file),
    }));
    setArchivosEvidencia((prev) => [...prev, ...nuevos]);
  };

  const eliminarArchivoEvidencia = (id) => {
    setArchivosEvidencia((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  };

  const handleAsignarPersonal = async (e) => {
    e.preventDefault();
    if (!personalAAsignarId) {
      informar('Seleccione personal', 'Debe seleccionar un personal operativo para asignar', 'advertencia');
      return;
    }
    await ejecutar(async () => {
      try {
        await asignarPersonalServicio(servicioId, Number(personalAAsignarId));
        informar('Personal asignado', 'El personal fue asignado exitosamente al servicio', 'exito');
        setPersonalAAsignarId('');
        setMostrarAsignarPersonal(false);
        await cargar();
      } catch (err) {
        informar('Error de asignación', err.message, 'error');
      }
    });
  };

  const handleDesasignarPersonal = async (asignacionId, nombrePersonal) => {
    await ejecutar(async () => {
      try {
        await desasignarPersonalServicio(servicioId, asignacionId);
        informar('Asignación retirada', `Se retiró a ${nombrePersonal} del servicio`, 'exito');
        await cargar();
      } catch (err) {
        informar('Error', err.message, 'error');
      }
    });
  };

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
    if (archivosEvidencia.length === 0) {
      setErrorCargaEvidencia('Debe seleccionar o arrastrar al menos una imagen de evidencia');
      return;
    }

    const personalElegido = evPersonalId
      ? parseInt(evPersonalId, 10)
      : (usuario?.personalId || datos?.servicio?.supervisor_id || (datos?.personalAsignado[0]?.id ?? null));

    if (!personalElegido) {
      informar('Personal requerido', 'Debe seleccionar el personal operativo responsable de la evidencia', 'advertencia');
      return;
    }

    await ejecutar(async () => {
      try {
        const archivos = archivosEvidencia.map((x) => x.file);
        let urlsSubidas = [];
        try {
          urlsSubidas = await subirMultiplesFotosImageKit(archivos);
        } catch {
          urlsSubidas = await Promise.all(
            archivos.map(
              (file) =>
                new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onload = (ev) => resolve(ev.target.result);
                  reader.readAsDataURL(file);
                })
            )
          );
        }

        for (let i = 0; i < urlsSubidas.length; i++) {
          const url = urlsSubidas[i];
          const tituloFinal =
            urlsSubidas.length > 1
              ? `${evTitulo.trim()} (${i + 1}/${urlsSubidas.length})`
              : evTitulo.trim();

          await crearEvidencia({
            servicioId,
            protocoloId: evProtId ? parseInt(evProtId, 10) : null,
            personalId: personalElegido,
            titulo: tituloFinal,
            descripcion: evDesc.trim() || null,
            archivoUrl: url,
          });
        }

        archivosEvidencia.forEach((a) => {
          if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
        });
        setArchivosEvidencia([]);
        setMostrarFormEvidencia(false);
        setEvTitulo('');
        setEvProtId('');
        setEvDesc('');
        await cargar();
        informar('Éxito', `${urlsSubidas.length} evidencia(s) registrada(s) correctamente`, 'exito');
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

  const personalAsignadoFiltrado = personalAsignado.filter((p) => {
    if (!filtroPersonal.trim()) return true;
    const term = filtroPersonal.toLowerCase();
    return (
      p.nombres?.toLowerCase().includes(term) ||
      p.apellidos?.toLowerCase().includes(term) ||
      p.documento?.includes(term) ||
      p.cargo?.toLowerCase().includes(term)
    );
  });

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
          type="button"
        >
          Resumen y Personal ({personalAsignado.length})
        </button>
        <button
          className={`pestana-btn ${pestana === 'requerimientos' ? 'activa' : ''}`}
          onClick={() => setPestana('requerimientos')}
          type="button"
        >
          Requerimientos ({requerimientos.length})
        </button>
        <button
          className={`pestana-btn ${pestana === 'protocolos' ? 'activa' : ''}`}
          onClick={() => setPestana('protocolos')}
          type="button"
        >
          Protocolos ({protocolos.length})
        </button>
        <button
          className={`pestana-btn ${pestana === 'evidencias' ? 'activa' : ''}`}
          onClick={() => setPestana('evidencias')}
          type="button"
        >
          Evidencias ({evidencias.length})
        </button>
        <button
          className={`pestana-btn ${pestana === 'incidencias' ? 'activa' : ''}`}
          onClick={() => setPestana('incidencias')}
          type="button"
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

            <div className="panel-acciones-seccion" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 12 }}>
              <h4 className="seccion-subtitulo" style={{ margin: 0 }}>Personal Operativo Asignado ({personalAsignado.length})</h4>
              {esSupervisorOAdmin && (
                <Button
                  variante="primario"
                  tamano="sm"
                  onClick={() => setMostrarAsignarPersonal(!mostrarAsignarPersonal)}
                >
                  {mostrarAsignarPersonal ? 'Cerrar asignación' : '+ Asignar personal'}
                </Button>
              )}
            </div>

            {mostrarAsignarPersonal && (
              <form onSubmit={handleAsignarPersonal} className="formulario-subpanel" style={{ marginBottom: 16 }}>
                <Select
                  id="select-personal-asignar"
                  label="Seleccionar personal operativo"
                  nombre="personalId"
                  valor={personalAAsignarId}
                  onChange={(e) => setPersonalAAsignarId(e.target.value)}
                  requerido
                >
                  <option value="">-- Seleccionar personal activo --</option>
                  {todosPersonal
                    .filter((pers) => !personalAsignado.some((pa) => pa.id === pers.id))
                    .map((pers) => (
                      <option key={pers.id} value={pers.id}>
                        {pers.nombres} {pers.apellidos} ({pers.cargo}) - DNI: {pers.documento}
                      </option>
                    ))}
                </Select>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                  <Button tipo="button" variante="secundario" tamano="sm" onClick={() => setMostrarAsignarPersonal(false)} disabled={cargandoAccion}>
                    Cancelar
                  </Button>
                  <Button tipo="submit" variante="primario" tamano="sm" cargando={cargandoAccion} disabled={!personalAAsignarId}>
                    Confirmar asignación
                  </Button>
                </div>
              </form>
            )}

            {personalAsignado.length > 2 && (
              <div style={{ marginBottom: 12 }}>
                <Input
                  id="filtro-personal-asignado"
                  nombre="filtroPersonal"
                  valor={filtroPersonal}
                  onChange={(e) => setFiltroPersonal(e.target.value)}
                  placeholder="Filtrar personal por nombre, cargo o DNI..."
                />
              </div>
            )}

            {personalAsignadoFiltrado.length === 0 ? (
              <p className="vacio-mensaje">
                {personalAsignado.length === 0
                  ? 'No hay personal operativo asignado actualmente a este servicio.'
                  : 'No se encontraron asignaciones coincidentes con el filtro aplicado.'}
              </p>
            ) : (
              <div className="lista-cards-personal">
                {personalAsignadoFiltrado.map((p) => (
                  <div key={p.id} className="tarjeta-persona-asignada" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{p.nombres} {p.apellidos}</strong>
                      <span className="persona-doc">DNI: {p.documento} • {p.cargo}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Badge valor={p.estado} />
                      {esSupervisorOAdmin && (
                        <button
                          type="button"
                          className="btn-link-peligro"
                          style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontSize: 'var(--tam-xs)', fontWeight: 600 }}
                          onClick={() => handleDesasignarPersonal(p.asignacion_id, `${p.nombres} ${p.apellidos}`)}
                          title="Retirar asignación"
                          disabled={cargandoAccion}
                        >
                          Retirar
                        </button>
                      )}
                    </div>
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
                  <Button tipo="button" variante="secundario" tamano="sm" onClick={() => setMostrarFormReq(false)} disabled={cargandoAccion}>
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
                          disabled={cargandoAccion}
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
                  <Button tipo="button" variante="secundario" tamano="sm" onClick={() => setMostrarAsociarProt(false)} disabled={cargandoAccion}>
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
                  <Button tipo="button" variante="secundario" tamano="sm" onClick={() => setMostrarCrearProt(false)} disabled={cargandoAccion}>
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
                          disabled={cargandoAccion}
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
                  id="ev-personal"
                  label="Personal operativo responsable *"
                  nombre="evPersonalId"
                  valor={evPersonalId}
                  onChange={(e) => setEvPersonalId(e.target.value)}
                  requerido
                >
                  <option value="">-- Seleccionar personal responsable --</option>
                  {personalAsignado.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombres} {p.apellidos} ({p.cargo}) [Asignado]
                    </option>
                  ))}
                  {todosPersonal
                    .filter((p) => !personalAsignado.some((pa) => pa.id === p.id))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombres} {p.apellidos} ({p.cargo})
                      </option>
                    ))}
                </Select>
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

                <div className="evidencia-subida-contenedor">
                  <label className="campo-etiqueta">
                    Cargar fotografías de evidencia *
                  </label>
                  <div
                    className={`evidencias-dropzone ${arrastrandoEvidencia ? 'dropzone-activa' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setArrastrandoEvidencia(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setArrastrandoEvidencia(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setArrastrandoEvidencia(false);
                      if (e.dataTransfer?.files?.length > 0) agregarArchivosEvidencia(e.dataTransfer.files);
                    }}
                    onClick={() => inputEvidenciaRef.current?.click()}
                  >
                    <input
                      ref={inputEvidenciaRef}
                      type="file"
                      multiple
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target?.files?.length > 0) agregarArchivosEvidencia(e.target.files);
                      }}
                    />
                    <div className="dropzone-icono">
                      <Icono nombre="subir" tamano={28} />
                    </div>
                    <p className="dropzone-texto-principal">
                      Arrastra y suelta imágenes aquí, o <span className="dropzone-texto-enlace">haz clic para explorar</span>
                    </p>
                    <span className="dropzone-texto-secundario">
                      Formatos soportados: JPG, PNG, WEBP (puede seleccionar una o varias imágenes)
                    </span>
                  </div>

                  {errorCargaEvidencia && (
                    <div className="evidencias-error-alerta">
                      <Icono nombre="alerta" tamano={14} />
                      <span>{errorCargaEvidencia}</span>
                    </div>
                  )}

                  {archivosEvidencia.length > 0 && (
                    <div className="archivos-previews-grilla">
                      {archivosEvidencia.map((item) => (
                        <div key={item.id} className="archivo-preview-item">
                          <img src={item.previewUrl} alt={item.nombre} className="archivo-preview-miniatura" />
                          <div className="archivo-preview-info">
                            <span className="archivo-preview-nombre" title={item.nombre}>{item.nombre}</span>
                            <span className="archivo-preview-tamano">{formatearTamano(item.tamano)}</span>
                          </div>
                          <button
                            type="button"
                            className="archivo-preview-btn-eliminar"
                            onClick={() => eliminarArchivoEvidencia(item.id)}
                            disabled={cargandoAccion}
                            title="Quitar imagen"
                          >
                            <Icono nombre="cerrar" tamano={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                  <Button tipo="button" variante="secundario" tamano="sm" onClick={() => setMostrarFormEvidencia(false)} disabled={cargandoAccion}>
                    Cancelar
                  </Button>
                  <Button tipo="submit" variante="primario" tamano="sm" cargando={cargandoAccion} disabled={archivosEvidencia.length === 0}>
                    Guardar evidencia
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
                      <div className="ev-galeria-item" onClick={() => setFotoModal(ev.archivo_url)} title="Clic para ver foto ampliada">
                        <img src={ev.archivo_url} alt={ev.titulo} className="ev-miniatura-img" />
                        <div className="ev-miniatura-overlay">
                          <Icono nombre="zoom" tamano={18} color="#fff" />
                          <span>Ver foto</span>
                        </div>
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
                          disabled={cargandoAccion}
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

      {evidenciaARevisar && (
        <div className="modal-overlay modal-revision-overlay" onClick={() => setEvidenciaARevisar(null)}>
          <div
            className="modal-contenedor modal-formulario"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-rev-titulo"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-encabezado">
              <h3 id="modal-rev-titulo" className="modal-titulo">Revisar evidencia</h3>
              <button
                type="button"
                className="modal-cerrar"
                onClick={() => setEvidenciaARevisar(null)}
                aria-label="Cerrar"
                disabled={cargandoAccion}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarRevision} className="modal-cuerpo" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: 'var(--tam-base)', fontWeight: 700, color: 'var(--color-texto-principal)' }}>
                  {evidenciaARevisar.titulo}
                </p>
                <span style={{ fontSize: 'var(--tam-xs)', color: 'var(--color-texto-secundario)' }}>
                  Registrado por {evidenciaARevisar.personal} • {evidenciaARevisar.fecha_registro}
                </span>
              </div>

              {evidenciaARevisar.protocolo && (
                <div>
                  <span className="ev-protocolo-chip" style={{ margin: 0 }}>
                    {evidenciaARevisar.protocolo_codigo ? `[${evidenciaARevisar.protocolo_codigo}] ` : ''}
                    {evidenciaARevisar.protocolo}
                  </span>
                </div>
              )}

              {evidenciaARevisar.archivo_url && (
                <div className="ev-revision-foto-caja">
                  <img
                    src={evidenciaARevisar.archivo_url}
                    alt={evidenciaARevisar.titulo}
                    className="ev-revision-foto-img"
                  />
                </div>
              )}

              {evidenciaARevisar.descripcion && (
                <p style={{ margin: 0, fontSize: 'var(--tam-sm)', color: 'var(--color-texto-secundario)', lineHeight: 1.4 }}>
                  {evidenciaARevisar.descripcion}
                </p>
              )}

              <Select
                id="rev-estado-modal"
                label="Estado de revisión *"
                nombre="revEstado"
                valor={revEstado}
                onChange={(e) => setRevEstado(e.target.value)}
                requerido
              >
                <option value="aprobada">Aprobada</option>
                <option value="observada">Observada</option>
                <option value="pendiente">Pendiente</option>
              </Select>

              <div className="campo">
                <label className="campo-etiqueta" htmlFor="rev-obs-modal">
                  Observación o retroalimentación
                </label>
                <textarea
                  id="rev-obs-modal"
                  className="campo-input"
                  rows={3}
                  value={revObservacion}
                  onChange={(e) => setRevObservacion(e.target.value)}
                  placeholder="Comentario o directiva para el personal operativo..."
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <Button
                  type="button"
                  variante="secundario"
                  onClick={() => setEvidenciaARevisar(null)}
                  disabled={cargandoAccion}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variante="primario"
                  cargando={cargandoAccion}
                >
                  Confirmar revisión
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {fotoModal && (
        <div className="evidencia-lightbox-overlay" onClick={() => setFotoModal(null)}>
          <div className="evidencia-lightbox-contenido" onClick={(e) => e.stopPropagation()}>
            <img src={fotoModal} alt="Evidencia en pantalla completa" className="evidencia-lightbox-img" />
            <button
              type="button"
              className="evidencia-lightbox-cerrar"
              onClick={() => setFotoModal(null)}
              aria-label="Cerrar foto"
            >
              <Icono nombre="cerrar" tamano={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
