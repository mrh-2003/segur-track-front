import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { responsablesIncidencia } from '../../api/incidencias';
import { Button } from '../../components/ui/Button';
import { CargaImagenes } from '../../components/ui/CargaImagenes';
import { subirFotoImageKit } from '../../utils/imagekit';
export default function FormIncidencia({tipos,servicios,onGuardar,onCancelar}){
 const {usuario}=useAuth(),operador=usuario?.rol==='operador';
 const [paso,setPaso]=useState(1),[d,setD]=useState({servicioId:'',tipoIncidenciaId:'',responsableId:'',prioridad:'media',descripcion:'',slaMin:'',slaResolucionMin:''});
 const [responsables,setResponsables]=useState([]),[archivos,setArchivos]=useState([]),[error,setError]=useState(''),[ocupado,setOcupado]=useState(false),[progreso,setProgreso]=useState('');
 const subidas=useRef(new Map());
 useEffect(()=>{let activo=true;if(!d.servicioId)return;responsablesIncidencia(d.servicioId).then(r=>{if(activo){setResponsables(r);if(operador)setD(v=>({...v,responsableId:String(r[0]?.id||'')}));}}).catch(e=>{if(activo)setError(e.message);});return()=>{activo=false;};},[d.servicioId,operador]);
 const cambio=e=>setD({...d,[e.target.name]:e.target.value});
 const enviar=async e=>{e.preventDefault();setError('');if(paso<3){setPaso(paso+1);return;}setOcupado(true);try{
  const evidencias=[];for(let i=0;i<archivos.length;i++){setProgreso(`Subiendo imagen ${i+1} de ${archivos.length}`);if(!subidas.current.has(archivos[i]))subidas.current.set(archivos[i],await subirFotoImageKit(archivos[i]));evidencias.push(subidas.current.get(archivos[i]));}
  await onGuardar({servicioId:Number(d.servicioId),tipoIncidenciaId:Number(d.tipoIncidenciaId),responsableId:Number(d.responsableId),prioridad:d.prioridad,descripcion:d.descripcion,evidencias,...(!operador?{...(d.slaMin?{slaMin:Number(d.slaMin)}:{}),...(d.slaResolucionMin?{slaResolucionMin:Number(d.slaResolucionMin)}:{})}:{})});
 }catch(e){setError(e.message);}finally{setOcupado(false);setProgreso('');}};
 return <form className="inc-flujo" onSubmit={enviar}>
  <ol className="inc-pasos" aria-label="Registro de incidencia">{['Identificar','Describir y adjuntar','Revisar y registrar'].map((p,i)=><li key={p} aria-current={paso===i+1?'step':undefined}>{i+1}. {p}</li>)}</ol>
  {error&&<p className="inc-error" role="alert">{error}</p>}
  {paso===1&&<div className="form-grilla">
   <label className="campo">Servicio<select className="campo-input" name="servicioId" value={d.servicioId} required onChange={e=>{setResponsables([]);setD({...d,servicioId:e.target.value,responsableId:''});}}><option value="">Seleccione un servicio</option>{servicios.map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}</select></label>
   <label className="campo">Tipo de incidencia<select className="campo-input" name="tipoIncidenciaId" value={d.tipoIncidenciaId} required onChange={cambio}><option value="">Seleccione el tipo</option>{tipos.map(t=><option key={t.id} value={t.id}>{t.nombre}</option>)}</select></label>
   <label className="campo">Responsable operativo<select className="campo-input" name="responsableId" value={d.responsableId} required onChange={cambio}><option value="">{d.servicioId?'Seleccione un agente':'Primero seleccione el servicio'}</option>{responsables.map(p=><option key={p.id} value={p.id}>{p.nombre}{p.puede_operar?'':' · Sin cuenta operativa'}</option>)}</select>{d.servicioId&&!responsables.length&&<small>Se necesita un agente activo asignado al servicio.</small>}</label>
   <label className="campo">Prioridad<select className="campo-input" name="prioridad" value={d.prioridad} onChange={cambio}>{['alta','media','baja'].map(p=><option key={p}>{p}</option>)}</select></label>
   {!operador&&<details className="campo-full"><summary>Definir los plazos iniciales (opcional)</summary><div className="form-grilla">{[['slaMin','Primera atención'],['slaResolucionMin','Resolución']].map(([name,label])=><label className="campo" key={name}>{label} · minutos desde el registro<input className="campo-input" type="number" min="1" max="525600" name={name} value={d[name]} onChange={cambio}/></label>)}</div></details>}
   <p className="campo-full inc-ayuda">Los plazos vacíos toman la configuración vigente por prioridad. Después del registro, una ampliación requiere aprobación del supervisor.</p>
  </div>}
  {paso===2&&<><label className="campo">¿Qué ocurrió?<textarea className="campo-input" name="descripcion" value={d.descripcion} required minLength={10} maxLength={10000} rows={5} onChange={cambio}/></label><CargaImagenes archivos={archivos} onCambiar={setArchivos} disabled={ocupado}/></>}
  {paso===3&&<div className="inc-resumen"><h3>Confirme la incidencia</h3><p><b>Servicio:</b> {servicios.find(s=>s.id===Number(d.servicioId))?.nombre}</p><p><b>Responsable:</b> {responsables.find(p=>p.id===Number(d.responsableId))?.nombre}</p><p><b>Tipo:</b> {tipos.find(t=>t.id===Number(d.tipoIncidenciaId))?.nombre} · Prioridad {d.prioridad}</p><p>{d.descripcion}</p><p>{archivos.length} imágenes para adjuntar</p><p>El agente atenderá y resolverá el caso. Si necesita más tiempo, solicitará una ampliación al supervisor.</p></div>}
  <div className="form-pie"><Button tipo="button" variante="secundario" disabled={ocupado} onClick={paso>1?()=>setPaso(paso-1):onCancelar}>{paso>1?'Volver':'Cancelar'}</Button><Button tipo="submit" cargando={ocupado} textoCargando={progreso||'Registrando…'}>{paso<3?'Continuar':'Registrar incidencia'}</Button></div>
 </form>;
}
