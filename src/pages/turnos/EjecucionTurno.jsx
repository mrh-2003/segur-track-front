import { RevisionReporte } from './RevisionReporte';
import { useEffect, useRef, useState } from 'react';
import { get, post, patch } from '../../api/cliente';
import { Button } from '../../components/ui/Button';
import { CargaImagenes } from '../../components/ui/CargaImagenes';
import { subirFotoImageKit } from '../../utils/imagekit';
import './EjecucionTurno.css';

const TIPOS = {actividad:'Actividades',ronda:'Rondas',reporte:'Reportes'};
const fecha = v => v ? new Date(v).toLocaleString('es-PE',{timeZone:'America/Lima',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : 'Pendiente';
export function EjecucionTurno({turno,usuario,onActualizar}) {
  const [datos,setDatos]=useState(null),[error,setError]=useState(''),[ocupado,setOcupado]=useState(false),[mensaje,setMensaje]=useState('');
  const [tipoVista,setTipoVista]=useState('actividad'),[seleccion,setSeleccion]=useState(null),[resultado,setResultado]=useState(''),[momento,setMomento]=useState('');
  const [archivos,setArchivos]=useState([]),[progreso,setProgreso]=useState('');
  const [consignaId,setConsignaId]=useState(''),[cumplida,setCumplida]=useState(''),[observacion,setObservacion]=useState('');
  const subidas=useRef(new Map());
  const formulario=useRef(null);
  const gestor=['administrador','jefe_operaciones','supervisor'].includes(usuario?.rol);
  useEffect(()=>{
    let activo=true;
    get('/datos-kpi/turnos/'+turno.id).then(r=>{if(activo)setDatos(r);}).catch(e=>{if(activo)setError(e.message);});
    return()=>{activo=false;};
  },[turno.id]);
  const ejecutar=async(fn,exito='Registro guardado correctamente.')=>{
    setOcupado(true);setError('');setMensaje('');
    try{
      await fn();setDatos(await get('/datos-kpi/turnos/'+turno.id));setSeleccion(null);setResultado('');setMomento('');setArchivos([]);subidas.current.clear();setMensaje(exito);await onActualizar?.();return true;
    }catch(e){setError(e.message);return false;}finally{setOcupado(false);setProgreso('');}
  };
  const filas=datos?[...datos.obligaciones.map(o=>({...o,grupo:'obligacion'})),...datos.rondas.map(r=>({...r,tipo:'ronda',descripcion:r.ruta,fecha_limite:r.fecha_programada,resultado:r.observaciones,grupo:'ronda'}))]:[];
  const completadas=filas.filter(r=>r.fecha_completada).length;
  const pendientes=filas.filter(r=>!r.fecha_completada||(r.tipo==='reporte'&&r.estado_revision!=='aprobado')).length;
  const abrir=(r)=>{setSeleccion(r);setResultado(r.estado_revision==='observado'?r.resultado||'':'');setMomento('');setArchivos([]);setError('');setMensaje('');subidas.current.clear();requestAnimationFrame(()=>formulario.current?.scrollIntoView({behavior:'smooth',block:'nearest'}));};
  const guardar=(e)=>{
    e.preventDefault();
    if(!datos.puede_registrar){setError(datos.motivo_bloqueo);return;}
    if(seleccion.tipo==='reporte' && resultado.trim().length<3){setError('Escriba el contenido del reporte (al menos 3 caracteres).');return;}
    ejecutar(async()=>{
      const evidencias=[];
      for(let i=0;i<archivos.length;i++){
        setProgreso('Subiendo imagen '+(i+1)+' de '+archivos.length+'…');
        if(!subidas.current.has(archivos[i]))subidas.current.set(archivos[i],await subirFotoImageKit(archivos[i]));
        evidencias.push(subidas.current.get(archivos[i]));
      }
      setProgreso('Guardando registro…');
      await patch('/datos-kpi/turnos/'+turno.id+'/'+seleccion.id,{tipo:seleccion.grupo,accion:'completar',resultado,evidencias,...(gestor&&momento?{fechaCompletada:new Date(momento+'-05:00').toISOString()}:{})});
    },seleccion.tipo==='reporte'?'Reporte entregado correctamente.':'Ejecución registrada correctamente.');
  };
  const editor = r => seleccion?.id===r.id && seleccion?.grupo===r.grupo && <form ref={formulario} className="ejecucion-form ejecucion-registro" onSubmit={guardar}>
    <div className="ejecucion-form-titulo"><h4>{r.tipo==='reporte'?(r.estado_revision==='observado'?'Corregir y reenviar':'Entregar reporte'):'Registrar ejecución'}</h4><span>Fecha y hora en Lima</span></div>
    <label>{r.tipo==='reporte'?'Contenido del reporte':'Resultado y observaciones'}<textarea className="campo-input" required={r.tipo==='reporte'} minLength={r.tipo==='reporte'?3:undefined} maxLength={10000} placeholder={r.tipo==='reporte'?'Describa las novedades y acciones realizadas…':'Describa el resultado de esta actividad…'} value={resultado} disabled={ocupado} onChange={e=>setResultado(e.target.value)}/></label>
    <CargaImagenes archivos={archivos} onCambiar={setArchivos} disabled={ocupado}/>
    {gestor&&<details className="ejecucion-fecha"><summary>Registrar una fecha real anterior</summary><label>Fecha real de ejecución (Lima)<input className="campo-input" type="datetime-local" min={new Date(new Date(datos.inicio_programado).getTime()-5*3600000).toISOString().slice(0,16)} max={new Date(new Date(datos.corte).getTime()-5*3600000).toISOString().slice(0,16)} value={momento} disabled={ocupado} onChange={e=>setMomento(e.target.value)}/></label></details>}
    <p className="ejecucion-ayuda">Se registra la hora actual si no indica otra. Las entregas fuera de plazo se identifican como tardías.</p>
    {error&&<p className="ejecucion-alerta error" role="alert">{error}</p>}
    <div className="ejecucion-form-acciones"><Button tipo="submit" cargando={ocupado} textoCargando={progreso||'Guardando…'} disabled={!datos.puede_registrar}>{r.tipo==='reporte'?'Guardar reporte':'Guardar ejecución'}</Button><Button tipo="button" variante="secundario" disabled={ocupado} onClick={()=>{setSeleccion(null);setArchivos([]);setError('');}}>Cancelar</Button></div>
  </form>;
  return <section className="ejecucion-turno">
    <header className="ejecucion-cabecera"><div><span className="ejecucion-eyebrow">SEGUIMIENTO OPERATIVO</span><h3>Actividades, rondas y reportes</h3><p>Complete las obligaciones del turno y adjunte sus fotografías.</p></div>{datos&&<div className="ejecucion-avance"><strong>{completadas}<small>/{filas.length}</small></strong><span>completadas</span></div>}</header>
    {!seleccion&&error&&<p className="ejecucion-alerta error" role="alert">{error}</p>}{mensaje&&<p className="ejecucion-alerta exito" role="status">{mensaje}</p>}
    {!datos&&!error&&<p>Cargando obligaciones…</p>}
    {datos&&<>
      {datos.motivo_bloqueo&&<div className="ejecucion-alerta" role="status"><strong>Consulta de programación</strong><p>{datos.motivo_bloqueo}</p><small>Inicio: {fecha(datos.inicio_programado)} · Fin: {fecha(datos.fin_programado)}</small></div>}
      {!datos.plan_kpi_validado&&<p className="ejecucion-alerta">El turno aún no tiene un plan confirmado. Configúrelo en Servicios y aplíquelo aquí.</p>}
      <nav className="ejecucion-tabs" aria-label="Tipo de obligación">{Object.entries(TIPOS).map(([tipo,nombre])=><button type="button" key={tipo} aria-pressed={tipoVista===tipo} className={tipoVista===tipo?'activa':''} disabled={ocupado} onClick={()=>{setTipoVista(tipo);setSeleccion(null);setArchivos([]);setError('');}}>{nombre}<span>{filas.filter(r=>r.tipo===tipo&&!r.fecha_completada).length}</span></button>)}</nav>
      <div className="ejecucion-lista-cabecera"><h4>{TIPOS[tipoVista]}</h4><span>{pendientes} pendientes en el turno</span></div>
      {!filas.some(r=>r.tipo===tipoVista)&&<div className="ejecucion-vacio">No hay {TIPOS[tipoVista].toLowerCase()} programadas para este turno.</div>}
      {filas.filter(r=>r.tipo===tipoVista).map(r=>{
        const vencida=!r.fecha_completada&&new Date(r.fecha_limite)<new Date();
        const fotos=r.evidencias?.length?r.evidencias:r.evidencia_url?[r.evidencia_url]:[];
        return <article className={'ejecucion-item'+(seleccion?.id===r.id&&seleccion?.grupo===r.grupo?' seleccionada':'')} key={r.grupo+'-'+r.id}>
          <div className="ejecucion-item-cuerpo"><div className="ejecucion-item-titulo"><strong>{r.descripcion}</strong><span className={'ejecucion-estado '+(r.fecha_completada?'completada':vencida?'vencida':'programada')}>{r.fecha_completada?'Completada':vencida?'Plazo vencido':'Programada'}</span></div>
            <div className="ejecucion-item-fechas"><span>Plazo · {fecha(r.fecha_limite)}</span>{r.fecha_completada&&<span>Registro · {fecha(r.fecha_completada)}</span>}</div>
            {r.fecha_completada&&r.resultado&&<p className="ejecucion-resultado">{r.resultado}</p>}
            {!!fotos.length&&<div className="ejecucion-fotos">{fotos.map((src,i)=><a href={src} key={src} target="_blank" rel="noreferrer"><img src={src} alt={'Evidencia '+(i+1)+' de '+r.descripcion}/></a>)}</div>}
            {r.tipo==='reporte'&&<RevisionReporte reporte={r} historial={(datos.revisiones||[]).filter(h=>h.reporte_id===r.id)} gestor={gestor} ocupado={ocupado} onRevisar={d=>ejecutar(()=>patch('/datos-kpi/turnos/'+turno.id+'/'+r.id+'/revision',d),'Revisión registrada correctamente.')}/>}
            {(!r.fecha_completada||(r.tipo==='reporte'&&r.estado_revision==='observado'))&&<div className="ejecucion-acciones"><Button tipo="button" disabled={ocupado||!datos.puede_registrar} onClick={()=>abrir(r)}>{r.tipo==='reporte'?(r.estado_revision==='observado'?'Corregir y reenviar':'Entregar reporte'):'Registrar ejecución'}</Button>{gestor&&<Button tipo="button" variante="fantasma" disabled={ocupado} onClick={()=>ejecutar(()=>patch('/datos-kpi/turnos/'+turno.id+'/'+r.id,{tipo:r.grupo,accion:'anular'}),'Obligación anulada.')}>Anular obligación</Button>}</div>}
          </div>{editor(r)}
        </article>;
      })}
      <details className="ejecucion-consignas"><summary>Consignas del servicio <span>{datos.consignas.length} verificadas</span></summary>
        {datos.consignas.map(v=><div className="ejecucion-consigna" key={v.id}><strong>{v.descripcion}</strong><span>{v.cumplida?'Cumplida':'Incumplida'} · {fecha(v.creado_en)}</span></div>)}
        {!!datos.catalogoConsignas?.filter(c=>!datos.consignas.some(v=>v.consigna_id===c.id)).length&&<form className="ejecucion-form" onSubmit={e=>{e.preventDefault();ejecutar(async()=>{await post('/datos-kpi/turnos/'+turno.id,{tipo:'consigna',consignaId:Number(consignaId),cumplida:cumplida==='si',observacion});setConsignaId('');setCumplida('');setObservacion('');});}}>
          <label>Consigna<select aria-label="Consigna del turno" className="campo-input" required value={consignaId} disabled={ocupado} onChange={e=>setConsignaId(e.target.value)}><option value="">Seleccione una consigna</option>{datos.catalogoConsignas.filter(c=>!datos.consignas.some(v=>v.consigna_id===c.id)).map(c=><option key={c.id} value={c.id}>{c.descripcion}</option>)}</select></label>
          <label>Resultado<select aria-label="Cumplimiento de consigna" className="campo-input" required value={cumplida} disabled={ocupado} onChange={e=>setCumplida(e.target.value)}><option value="">Seleccione el resultado</option><option value="si">Cumplida</option><option value="no">Incumplida</option></select></label>
          <label>Observación<input className="campo-input" maxLength={1000} value={observacion} disabled={ocupado} onChange={e=>setObservacion(e.target.value)}/></label>
          <Button tipo="submit" disabled={ocupado||!datos.puede_registrar}>Guardar verificación</Button>
        </form>}
      </details>
      {gestor&&<details className="ejecucion-configuracion"><summary>Administrar la programación</summary><p>Aplicar el plan del servicio agrega las obligaciones que aún no estén programadas y conserva las ejecuciones registradas.</p><Button tipo="button" variante="secundario" disabled={ocupado} onClick={()=>ejecutar(()=>post('/datos-kpi/turnos/'+turno.id,{tipo:'aplicar_plan'}),'Plan aplicado correctamente.')}>Aplicar plan del servicio</Button></details>}
    </>}
  </section>;
}
