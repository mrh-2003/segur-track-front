import { EjecucionTurno } from './EjecucionTurno';
import { useState, useRef, useEffect } from 'react';
import OperacionTurnoPanel from './OperacionTurnoPanel';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Icono } from '../../components/ui/Icono';
import { registrarAsistencia, opcionesTurno } from '../../api/operaciones';
import { subirMultiplesFotosImageKit } from '../../utils/imagekit';
import { formatearFecha } from '../../utils/fechas';
import './ModalDetalleTurno.css';

export default function ModalDetalleTurno({ turno: inicial, usuario, personal = [], onConfirmar, onCumplir, onRechazar, onReasignar, onEliminar, onCerrar, onActualizar }) {
  const [turno, setTurno] = useState(inicial);
  const [modo, setModo] = useState('');
  const [motivo, setMotivo] = useState('');
  const [personalId, setPersonalId] = useState('');
  const [pares, setPares] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [progreso, setProgreso] = useState('');
  const input = useRef(null);
  const gestor = ['administrador','jefe_operaciones','supervisor'].includes(usuario?.rol);
  const puedeResponder = gestor || turno.personal_usuario_id === usuario?.id || (usuario?.personalId && turno.personal_id === usuario.personalId);
  const cumplido = turno.estado === 'cumplido';
  const confirmado = ['confirmado','pendiente'].includes(turno.estado) || !!turno.ingreso_real;
  const existentes = (turno.evidencias || []).map((e) => typeof e === 'string' ? e : e.url).filter(Boolean);
  const requeridas = turno.evidencias_requeridas ?? 1;
  const faltanFotos = existentes.length + archivos.length < requeridas;
  const paso = cumplido ? 5 : !confirmado ? 0 : !turno.ingreso_real ? 1 : faltanFotos ? 2 : !turno.salida_real ? 3 : 4;
  const tituloPaso = turno.relevo_pendiente ? 'Reasignación pendiente' : !confirmado ? 'Confirmar la asignación' : !turno.ingreso_real ? 'Registrar el ingreso' : faltanFotos ? 'Preparar las evidencias' : !turno.salida_real ? 'Registrar la salida' : 'Finalizar el turno';
  useEffect(() => {
    if (modo !== 'reasignar') return;
    let activo = true;
    opcionesTurno({fecha: turno.fecha.slice(0,10), horaInicio: turno.hora_inicio, horaFin: turno.hora_fin, excluirId: turno.id})
      .then((r) => { if(activo) setPares(r.compatibilidades); }).catch((e) => { if(activo) setError(e.message); });
    return () => { activo = false; };
  }, [modo, turno.id, turno.fecha, turno.hora_inicio, turno.hora_fin]);
  const ejecutar = async (fn) => {
    setOcupado(true); setError('');
    try { const r = await fn(); if(r) setTurno((t) => {
      const p = personal.find((p) => p.id === r.personal_id);
      return {...t,...r,...(p ? {personal:`${p.nombres} ${p.apellidos}`} : {})};
    }); }
    catch(e) { setError(e.message); }
    finally { setOcupado(false); setProgreso(''); }
  };
  const marcar = (accion) => ejecutar(async () => {
    const r = await registrarAsistencia(turno.id, { accion });
    await onActualizar?.();
    return r;
  });
  const seleccionar = (files) => {
    const lista = Array.from(files || []);
    if (lista.some((f) => !['image/jpeg','image/png','image/webp'].includes(f.type) || f.size > 8*1024*1024)) {
      setError('Use imágenes JPG, PNG o WEBP de hasta 8 MB.'); return;
    }
    setError(''); setArchivos((a) => [...a,...lista]);
  };
  const finalizar = () => ejecutar(async () => {
    const nuevas = await subirMultiplesFotosImageKit(archivos, (i,n) => setProgreso(`Subiendo ${i} de ${n}…`));
    const r = await onCumplir(turno, [...existentes,...nuevas]);
    setArchivos([]); return r;
  });
  const personalDisponible = personal.filter((p) => p.id !== turno.personal_id && pares.some((a) => a.personalId === p.id && a.servicioId === turno.servicio_id));
  return <div className="modal-detalle-turno turno-flujo">
    <div className="detalle-turno-encabezado"><div><h2 className="detalle-turno-servicio">{turno.servicio}</h2><p className="detalle-turno-sede">{turno.puesto || turno.sede}</p></div><Badge valor={turno.estado} /></div>
    <div className="detalle-turno-datos">
      <div><span className="detalle-dato-etiqueta">Personal</span><strong>{turno.personal || 'Plaza sin asignar'}</strong></div>
      <div><span className="detalle-dato-etiqueta">Fecha</span><strong>{formatearFecha(turno.fecha)}</strong></div>
      <div><span className="detalle-dato-etiqueta">Horario</span><strong>{turno.hora_inicio?.slice(0,5)} — {turno.hora_fin?.slice(0,5)}</strong></div>
    </div>
    <ol className="turno-pasos" aria-label="Progreso del turno">{['Confirmar','Ingreso','Evidencias','Salida','Finalizar'].map((p,i) => <li key={p} className={i < paso || cumplido ? 'completo' : i === paso ? 'actual' : ''}><span>{i < paso || cumplido ? '✓' : i+1}</span>{p}</li>)}</ol>
    {error && <p className="flujo-error" role="alert">{error}</p>}
    {cumplido ? <div className="flujo-estado"><Icono nombre="confirmar" />Turno finalizado. Consulte las evidencias o la trazabilidad.</div> : !turno.personal_id ? <div className="flujo-proxima"><strong>Asigne un agente para comenzar.</strong>{gestor && <Button onClick={() => setModo('reasignar')}>Asignar agente</Button>}</div> : puedeResponder && <section className="flujo-proxima">
      <div><span className="flujo-eyebrow">SIGUIENTE PASO</span><h3>{tituloPaso}</h3><p>{!confirmado ? 'Revise el horario y acepte el turno.' : !turno.ingreso_real ? 'La hora se registra automáticamente en Lima.' : !turno.salida_real ? `${existentes.length + archivos.length} de ${requeridas} fotografías requeridas.` : 'Guarde las fotografías y cierre el turno.'}</p></div>
      {turno.relevo_pendiente && gestor && <Button onClick={() => setModo('reasignar')}>Reasignar agente</Button>}
      {!confirmado && !turno.relevo_pendiente && <Button disabled={ocupado} onClick={() => ejecutar(() => onConfirmar(turno))}>Confirmar turno</Button>}
      {confirmado && !turno.ingreso_real && <Button disabled={ocupado} onClick={() => marcar('ingreso')}>Marcar ingreso</Button>}
      {turno.ingreso_real && faltanFotos && <Button disabled={ocupado} onClick={() => input.current?.click()}>Adjuntar fotografías</Button>}
      {turno.ingreso_real && !turno.salida_real && !faltanFotos && <Button disabled={ocupado} onClick={() => marcar('salida')}>Marcar salida</Button>}
      {turno.salida_real && !faltanFotos && <Button disabled={ocupado} cargando={ocupado} onClick={finalizar}>{progreso || 'Finalizar turno'}</Button>}
    </section>}
    {!!turno.ingreso_real && !cumplido && puedeResponder && <section className="flujo-evidencias">
      <div className="flujo-seccion-titulo"><h3>Evidencias</h3><span>{existentes.length + archivos.length} / {requeridas}</span></div>
      <input ref={input} type="file" hidden accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => {seleccionar(e.target.files); e.target.value='';}} />
      <button type="button" className="flujo-upload" disabled={ocupado} onClick={() => input.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => {e.preventDefault(); if(!ocupado) seleccionar(e.dataTransfer.files);}}><Icono nombre="subir" tamano={24} /><strong>Adjuntar fotografías</strong><span>JPG, PNG o WEBP · hasta 8 MB por imagen</span></button>
      {archivos.map((a,i) => <div className="flujo-archivo" key={`${a.name}-${i}`}><Icono nombre="camara" /><span>{a.name}</span><button type="button" disabled={ocupado} aria-label={`Quitar ${a.name}`} onClick={() => setArchivos((v) => v.filter((_,j) => j!==i))}>×</button></div>)}
      {faltanFotos && <p className="tarjeta-subtitulo">Adjunte las fotografías requeridas para habilitar la finalización.</p>}
    </section>}
    {!!existentes.length && <details className="flujo-desplegable" open={cumplido}><summary>Evidencias registradas · {existentes.length}</summary><div className="evidencias-galeria-grilla">{existentes.map((url,i) => <a key={url+i} href={url} target="_blank" rel="noreferrer"><img src={url} alt={`Evidencia ${i+1}`} className="evidencia-miniatura-imagen" /></a>)}</div></details>}
    {!cumplido && !turno.ingreso_real && <details className="flujo-desplegable"><summary>Otras acciones</summary><div className="flujo-secundarias">
      {gestor && <Button variante="secundario" disabled={ocupado} onClick={() => {setModo('reasignar'); setMotivo('');}}>Reasignar</Button>}
      {puedeResponder && !turno.relevo_pendiente && <Button variante="secundario" disabled={ocupado} onClick={() => {setModo('rechazar'); setMotivo('');}}>Rechazar</Button>}
      {gestor && <Button variante="fantasma" disabled={ocupado} onClick={() => onEliminar(turno)}>Eliminar turno</Button>}
    </div></details>}
    {!!modo && <form className="formulario-subaccion" onSubmit={(e) => {e.preventDefault(); ejecutar(async () => { const r = modo==='reasignar' ? await onReasignar(turno, Number(personalId), motivo) : await onRechazar(turno,motivo); setModo(''); return r; });}}>
      <h3>{modo==='reasignar' ? 'Reasignar turno' : 'Rechazar asignación'}</h3>
      {modo==='reasignar' && <label className="campo">Personal disponible<select required className="campo-select" value={personalId} onChange={(e) => setPersonalId(e.target.value)}><option value="">Seleccione un agente</option>{personalDisponible.map((p) => <option key={p.id} value={p.id}>{p.nombres} {p.apellidos}</option>)}</select></label>}
      <label className="campo">Motivo<input required minLength={5} className="campo-input" value={motivo} onChange={(e) => setMotivo(e.target.value)} /></label>
      <div className="form-pie"><Button variante="secundario" disabled={ocupado} onClick={() => setModo('')}>Cancelar</Button><Button tipo="submit" disabled={ocupado || motivo.trim().length<5 || (modo==='reasignar' && !personalId)}>Guardar cambio</Button></div>
    </form>}
    <EjecucionTurno turno={turno} usuario={usuario} onActualizar={onActualizar} />
    <OperacionTurnoPanel key={`${turno.ingreso_real}-${turno.salida_real}-${turno.asistencia_validada}`} turno={turno} usuario={usuario} onActualizar={async (r) => {if(r) setTurno((t) => ({...t,...r})); await onActualizar?.();}} />
    <div className="form-pie"><Button variante="secundario" disabled={ocupado} onClick={onCerrar}>Cerrar detalle</Button></div>
  </div>;
}
