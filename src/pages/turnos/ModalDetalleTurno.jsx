import { useState, useRef } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Icono } from '../../components/ui/Icono';
import { Spinner } from '../../components/ui/Spinner';
import { formatearFecha } from '../../utils/fechas';
import { subirMultiplesFotosImageKit } from '../../utils/imagekit';
import './ModalDetalleTurno.css';

const formatearTamano = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

export default function ModalDetalleTurno({
  turno,
  usuario,
  personal = [],
  onConfirmar,
  onCumplir,
  onRechazar,
  onReasignar,
  onEliminar,
  onCerrar,
  cargando = false,
}) {
  const [modo, setModo] = useState('detalle');
  const [motivo, setMotivo] = useState('');
  const [nuevoPersonalId, setNuevoPersonalId] = useState('');
  const [errorReasignar, setErrorReasignar] = useState('');

  const [archivosSeleccionados, setArchivosSeleccionados] = useState([]);
  const [arrastrando, setArrastrando] = useState(false);
  const [subiendoEvidencias, setSubiendoEvidencias] = useState(false);
  const [textoProgreso, setTextoProgreso] = useState('');
  const [errorEvidencias, setErrorEvidencias] = useState('');
  const [fotoModal, setFotoModal] = useState(null);

  const inputArchivoRef = useRef(null);

  const esAdmin = usuario?.rol === 'administrador';
  const esSupervisor = usuario?.rol === 'supervisor';
  const esAsignado =
    (turno.personal_usuario_id && turno.personal_usuario_id === usuario?.id) ||
    (usuario?.personalId && turno.personal_id === usuario.personalId);

  const puedeGestionar = esAdmin || esSupervisor;
  const puedeResponder = esAsignado || puedeGestionar;

  const esConfirmado = turno.estado === 'confirmado' || turno.estado === 'pendiente';
  const esCumplido = turno.estado === 'cumplido';

  const evidenciasExistentes = Array.isArray(turno.evidencias)
    ? turno.evidencias.map((e) => (typeof e === 'string' ? e : e?.url)).filter(Boolean)
    : [];

  const personalDisponible = personal.filter((p) => {
    if (p.id === turno.personal_id) return false;
    if (esSupervisor) return p.cargo === 'agente';
    return true;
  });

  const agregarArchivos = (archivosNuevos) => {
    setErrorEvidencias('');
    const listaValida = Array.from(archivosNuevos).filter((f) => f.type.startsWith('image/'));
    if (listaValida.length === 0) {
      setErrorEvidencias('Solo se permiten archivos de imagen (JPG, PNG, WEBP)');
      return;
    }

    const nuevosObjetos = listaValida.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      nombre: file.name,
      tamano: file.size,
    }));

    setArchivosSeleccionados((prev) => [...prev, ...nuevosObjetos]);
  };

  const manejarDragOver = (e) => {
    e.preventDefault();
    setArrastrando(true);
  };

  const manejarDragLeave = (e) => {
    e.preventDefault();
    setArrastrando(false);
  };

  const manejarDrop = (e) => {
    e.preventDefault();
    setArrastrando(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      agregarArchivos(e.dataTransfer.files);
    }
  };

  const manejarInputArchivos = (e) => {
    if (e.target?.files && e.target.files.length > 0) {
      agregarArchivos(e.target.files);
    }
  };

  const eliminarArchivoSeleccionado = (id) => {
    setArchivosSeleccionados((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((x) => x.id !== id);
    });
  };

  const manejarCulminarTurno = async () => {
    if (archivosSeleccionados.length === 0) {
      setErrorEvidencias('Debe cargar o arrastrar al menos una foto de evidencia para culminar el turno');
      return;
    }

    setErrorEvidencias('');
    setSubiendoEvidencias(true);
    setTextoProgreso('Preparando carga de evidencias...');

    try {
      const archivos = archivosSeleccionados.map((x) => x.file);
      const urlsSubidas = await subirMultiplesFotosImageKit(archivos, (actual, total) => {
        setTextoProgreso(`Subiendo foto ${actual} de ${total} a ImageKit...`);
      });

      const todasLasEvidencias = [...evidenciasExistentes, ...urlsSubidas];
      await onCumplir(turno, todasLasEvidencias);
    } catch (err) {
      setErrorEvidencias(err.message || 'Error al subir fotos de evidencia');
    } finally {
      setSubiendoEvidencias(false);
      setTextoProgreso('');
    }
  };

  const manejarSubmitRechazo = (e) => {
    e.preventDefault();
    onRechazar(turno, motivo);
  };

  const manejarSubmitReasignar = (e) => {
    e.preventDefault();
    if (!nuevoPersonalId) {
      setErrorReasignar('Seleccione el nuevo personal');
      return;
    }
    setErrorReasignar('');
    onReasignar(turno, parseInt(nuevoPersonalId, 10));
  };

  return (
    <div className="modal-detalle-turno">
      <div className="detalle-turno-encabezado">
        <div>
          <h2 className="detalle-turno-servicio">{turno.servicio}</h2>
          <p className="detalle-turno-sede">{turno.sede}</p>
        </div>
        <div>
          {turno.relevo_pendiente ? (
            <Badge variante="peligro">Relevo Pendiente</Badge>
          ) : turno.estado === 'sin_confirmar' ? (
            <Badge variante="advertencia">Sin confirmar</Badge>
          ) : turno.estado === 'confirmado' ? (
            <Badge variante="exito">Confirmado</Badge>
          ) : turno.estado === 'pendiente' ? (
            <Badge variante="primario">Turno pendiente</Badge>
          ) : turno.estado === 'cumplido' ? (
            <Badge variante="exito">Cumplido</Badge>
          ) : (
            <Badge valor={turno.estado} />
          )}
        </div>
      </div>

      <div
        className={`bandeja-alerta ${
          turno.relevo_pendiente
            ? 'bandeja-alerta-peligro'
            : turno.estado === 'sin_confirmar'
            ? 'bandeja-alerta-advertencia'
            : esConfirmado
            ? 'bandeja-alerta-exito'
            : esCumplido
            ? 'bandeja-alerta-exito'
            : 'bandeja-alerta-primario'
        }`}
      >
        <div className="bandeja-alerta-titulo">
          {turno.relevo_pendiente
            ? 'Bandeja: Supervisor / Administrador (Reasignación pendiente)'
            : turno.estado === 'sin_confirmar'
            ? `Bandeja: ${turno.personal} (Sin confirmar)`
            : esConfirmado
            ? 'Bandeja: Turno confirmado (En ejecución)'
            : esCumplido
            ? 'Bandeja: Turno cumplido y archivado'
            : 'Bandeja: Turno programado'}
        </div>
        <p className="bandeja-alerta-descripcion">
          {turno.relevo_pendiente
            ? 'El turno fue rechazado por el personal asignado. Está en la bandeja de supervisión para su inmediata reasignación.'
            : turno.estado === 'sin_confirmar'
            ? 'El turno se encuentra en la bandeja del agente asignado en espera de ser confirmado o rechazado.'
            : esConfirmado
            ? 'El turno fue confirmado exitosamente. Para que pase a estado cumplido, debe cargar una o varias fotos como evidencia.'
            : esCumplido
            ? 'El turno ya ha sido ejecutado en su totalidad con evidencias fotográficas registradas.'
            : 'El turno se encuentra planificado en el cronograma.'}
        </p>
        {turno.relevo_pendiente && turno.motivo_rechazo && (
          <p className="bandeja-alerta-motivo">
            <strong>Motivo indicado:</strong> "{turno.motivo_rechazo}"
          </p>
        )}
      </div>

      <div className="detalle-turno-datos">
        <div className="detalle-dato-item">
          <span className="detalle-dato-etiqueta">Personal asignado</span>
          <span className="detalle-dato-valor">{turno.personal}</span>
        </div>
        <div className="detalle-dato-item">
          <span className="detalle-dato-etiqueta">Fecha</span>
          <span className="detalle-dato-valor">{formatearFecha(turno.fecha)}</span>
        </div>
        <div className="detalle-dato-item">
          <span className="detalle-dato-etiqueta">Horario programado</span>
          <span className="detalle-dato-valor">
            {turno.hora_inicio?.slice(0, 5)} — {turno.hora_fin?.slice(0, 5)}
          </span>
        </div>
        <div className="detalle-dato-item">
          <span className="detalle-dato-etiqueta">Asignado por</span>
          <span className="detalle-dato-valor">
            {turno.creador_nombre || 'Administración'}
          </span>
        </div>
      </div>

      {evidenciasExistentes.length > 0 && (
        <div className="evidencias-existentes-seccion">
          <div className="evidencias-seccion-cabecera">
            <span className="evidencias-seccion-titulo">
              <Icono nombre="camara" tamano={16} /> Evidencias fotográficas registradas ({evidenciasExistentes.length})
            </span>
            <span className="evidencias-seccion-subtitulo">Haga clic en cualquier foto para verla ampliada</span>
          </div>
          <div className="evidencias-galeria-grilla">
            {evidenciasExistentes.map((url, idx) => (
              <div
                key={url + idx}
                className="evidencia-miniatura-tarjeta"
                onClick={() => setFotoModal(url)}
                title="Clic para ver foto en tamaño grande"
              >
                <img src={url} alt={`Evidencia ${idx + 1}`} className="evidencia-miniatura-imagen" />
                <div className="evidencia-miniatura-overlay">
                  <Icono nombre="zoom" tamano={20} color="#FFFFFF" />
                  <span className="evidencia-miniatura-texto">Ver foto</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {esConfirmado && !esCumplido && puedeResponder && modo === 'detalle' && (
        <div className="evidencias-carga-seccion">
          <div className="evidencias-seccion-cabecera">
            <span className="evidencias-seccion-titulo">
              <Icono nombre="camara" tamano={16} /> Carga de evidencias fotográficas *
            </span>
            <span className="evidencias-seccion-subtitulo">
              Requerido para pasar a cumplido. Puede cargar o arrastrar una o varias fotos.
            </span>
          </div>

          <div
            className={`evidencias-dropzone ${arrastrando ? 'dropzone-activa' : ''}`}
            onDragOver={manejarDragOver}
            onDragLeave={manejarDragLeave}
            onDrop={manejarDrop}
            onClick={() => inputArchivoRef.current?.click()}
          >
            <input
              ref={inputArchivoRef}
              type="file"
              multiple
              accept="image/*"
              style={{ display: 'none' }}
              onChange={manejarInputArchivos}
            />
            <div className="dropzone-icono">
              <Icono nombre="subir" tamano={32} />
            </div>
            <p className="dropzone-texto-principal">
              Arrastra y suelta tus fotos aquí, o <span className="dropzone-texto-enlace">haz clic para explorar</span>
            </p>
            <span className="dropzone-texto-secundario">
              Formatos aceptados: JPG, JPEG, PNG, WEBP (puede seleccionar varias fotos)
            </span>
          </div>

          {errorEvidencias && (
            <div className="evidencias-error-alerta">
              <Icono nombre="alerta" tamano={16} />
              <span>{errorEvidencias}</span>
            </div>
          )}

          {archivosSeleccionados.length > 0 && (
            <div className="archivos-previews-contenedor">
              <span className="archivos-previews-titulo">
                Fotos listas para enviar ({archivosSeleccionados.length}):
              </span>
              <div className="archivos-previews-grilla">
                {archivosSeleccionados.map((item) => (
                  <div key={item.id} className="archivo-preview-item">
                    <img src={item.previewUrl} alt={item.nombre} className="archivo-preview-miniatura" />
                    <div className="archivo-preview-info">
                      <span className="archivo-preview-nombre" title={item.nombre}>{item.nombre}</span>
                      <span className="archivo-preview-tamano">{formatearTamano(item.tamano)}</span>
                    </div>
                    <button
                      type="button"
                      className="archivo-preview-btn-eliminar"
                      onClick={() => eliminarArchivoSeleccionado(item.id)}
                      disabled={subiendoEvidencias}
                      title="Quitar foto"
                    >
                      <Icono nombre="cerrar" tamano={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {subiendoEvidencias && (
            <div className="evidencias-progreso-caja">
              <Spinner tamano="sm" />
              <span className="evidencias-progreso-texto">{textoProgreso}</span>
            </div>
          )}
        </div>
      )}

      {modo === 'rechazando' && (
        <form onSubmit={manejarSubmitRechazo} className="formulario-subaccion">
          <label htmlFor="motivo-rechazo" className="campo-etiqueta">
            Motivo del rechazo (opcional)
          </label>
          <textarea
            id="motivo-rechazo"
            className="input textarea-motivo"
            rows={3}
            placeholder="Indique el motivo por el cual no puede tomar este turno..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
          <div className="form-pie">
            <Button
              variante="secundario"
              tipo="button"
              onClick={() => setModo('detalle')}
              disabled={cargando}
            >
              Volver
            </Button>
            <Button
              variante="peligro"
              tipo="submit"
              cargando={cargando}
            >
              Confirmar rechazo
            </Button>
          </div>
        </form>
      )}

      {modo === 'reasignando' && (
        <form onSubmit={manejarSubmitReasignar} className="formulario-subaccion">
          <Select
            id="nuevo-personal-id"
            label="Nuevo personal a asignar"
            nombre="nuevoPersonalId"
            valor={nuevoPersonalId}
            onChange={(e) => {
              setNuevoPersonalId(e.target.value);
              setErrorReasignar('');
            }}
            error={errorReasignar}
            placeholder="Seleccionar nuevo personal..."
            requerido
          >
            {personalDisponible.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombres} {p.apellidos} ({p.cargo})
              </option>
            ))}
          </Select>
          <div className="form-pie">
            <Button
              variante="secundario"
              tipo="button"
              onClick={() => setModo('detalle')}
              disabled={cargando}
            >
              Volver
            </Button>
            <Button
              variante="primario"
              tipo="submit"
              cargando={cargando}
            >
              Guardar reasignación
            </Button>
          </div>
        </form>
      )}

      {modo === 'detalle' && (
        <div className="detalle-acciones-pie">
          <div className="acciones-izquierda">
            {puedeGestionar && !esCumplido && (
              <Button
                variante="peligro"
                tipo="button"
                onClick={() => onEliminar(turno)}
                disabled={cargando || subiendoEvidencias}
              >
                Eliminar turno
              </Button>
            )}
          </div>
          <div className="acciones-derecha">
            {turno.estado === 'sin_confirmar' && !turno.relevo_pendiente && puedeResponder && (
              <>
                <Button
                  variante="peligro"
                  tipo="button"
                  onClick={() => setModo('rechazando')}
                  disabled={cargando || subiendoEvidencias}
                >
                  Rechazar turno
                </Button>
                <Button
                  variante="exito"
                  tipo="button"
                  onClick={() => onConfirmar(turno)}
                  cargando={cargando}
                  disabled={cargando || subiendoEvidencias}
                >
                  Confirmar turno
                </Button>
              </>
            )}

            {esConfirmado && !esCumplido && puedeResponder && (
              <Button
                variante="exito"
                tipo="button"
                onClick={manejarCulminarTurno}
                cargando={subiendoEvidencias || cargando}
                disabled={subiendoEvidencias || cargando}
              >
                Culminar turno (cargar evidencias)
              </Button>
            )}

            {turno.relevo_pendiente && puedeGestionar && (
              <Button
                variante="primario"
                tipo="button"
                onClick={() => setModo('reasignando')}
                disabled={cargando || subiendoEvidencias}
              >
                Reasignar turno
              </Button>
            )}

            <Button
              variante="secundario"
              tipo="button"
              onClick={onCerrar}
              disabled={cargando || subiendoEvidencias}
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}

      {fotoModal && (
        <div className="visor-lightbox-fondo" onClick={() => setFotoModal(null)}>
          <div className="visor-lightbox-caja" onClick={(e) => e.stopPropagation()}>
            <div className="visor-lightbox-encabezado">
              <div className="visor-lightbox-titulo">
                <Icono nombre="camara" tamano={18} />
                <span>Evidencia fotográfica del turno</span>
              </div>
              <div className="visor-lightbox-acciones">
                <a
                  href={fotoModal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="visor-lightbox-enlace-externo"
                  title="Abrir imagen en nueva pestaña"
                >
                  Ver original ↗
                </a>
                <button
                  type="button"
                  className="visor-lightbox-btn-cerrar"
                  onClick={() => setFotoModal(null)}
                  title="Cerrar visor"
                >
                  <Icono nombre="cerrar" tamano={18} />
                </button>
              </div>
            </div>
            <div className="visor-lightbox-cuerpo">
              <img src={fotoModal} alt="Evidencia en tamaño completo" className="visor-lightbox-imagen" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
