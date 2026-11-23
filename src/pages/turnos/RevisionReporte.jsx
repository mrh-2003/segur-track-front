import { useState } from 'react';
import { Button } from '../../components/ui/Button';

export function RevisionReporte({reporte,historial,gestor,ocupado,onRevisar}) {
  const [abierto,setAbierto]=useState(false),[estado,setEstado]=useState('aprobado'),[observacion,setObservacion]=useState('');
  const ultimo=historial.at(-1);
  return <div className="revision-reporte">
    <ol className="revision-pasos" aria-label="Flujo del reporte">
      <li className={reporte.fecha_completada?'listo':'actual'}>1. Entregar</li>
      <li className={reporte.estado_revision==='aprobado'?'listo':reporte.fecha_completada?'actual':''}>2. Revisar</li>
      <li className={reporte.estado_revision==='observado'?'actual':''}>3. Corregir si corresponde</li>
    </ol>
    {reporte.fecha_completada&&<p>{reporte.estado_revision==='aprobado'?'Reporte aprobado':reporte.estado_revision==='observado'?'Se requiere una corrección':'Entrega pendiente de revisión'} · Versión {reporte.version_entrega}</p>}
    {reporte.estado_revision==='observado'&&ultimo&&<p className="ejecucion-alerta">{ultimo.observacion}</p>}
    {gestor&&reporte.fecha_completada&&reporte.estado_revision==='pendiente'&&!abierto&&<Button tipo="button" variante="secundario" disabled={ocupado} motivoDeshabilitado={"Espere a que termine la operación en curso antes de continuar."} onClick={()=>setAbierto(true)}>Revisar entrega</Button>}
    {abierto&&<form className="ejecucion-form" onSubmit={async e=>{e.preventDefault();if(await onRevisar({estado,observacion}))setAbierto(false);}}>
      <h4>Revisión de la entrega</h4>
      <label>Resultado de revisión<select className="campo-input" aria-label="Resultado de revisión" value={estado} onChange={e=>setEstado(e.target.value)}><option value="aprobado">Aprobar reporte</option><option value="observado">Solicitar corrección</option></select></label>
      <label>{estado==='observado'?'Indique qué debe corregirse':'Comentario de revisión (opcional)'}<textarea className="campo-input" required={estado==='observado'} minLength={estado==='observado'?3:undefined} maxLength={3000} value={observacion} onChange={e=>setObservacion(e.target.value)}/></label>
      <div className="ejecucion-form-acciones"><Button tipo="submit" disabled={ocupado} motivoDeshabilitado={"Espere a que termine la operación en curso antes de continuar."}>Confirmar revisión</Button><Button tipo="button" variante="secundario" disabled={ocupado} motivoDeshabilitado={"Espere a que termine la operación en curso antes de continuar."} onClick={()=>setAbierto(false)}>Volver</Button></div>
    </form>}
    {!!historial.length&&<details><summary>Historial de revisiones · {historial.length}</summary>{historial.map(h=><div className="revision-historial" key={h.id}><b>Versión {h.version_entrega} · {h.estado}</b><p>{h.observacion||'Sin observaciones'}</p><small>{h.revisor} · {new Date(h.revisado_en).toLocaleString('es-PE',{timeZone:'America/Lima'})}</small></div>)}</details>}
  </div>;
}
