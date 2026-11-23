import {ControlConAyuda} from '../../components/ui/AyudaControl';
import { useEffect, useState } from 'react';
import { get, put } from '../../api/cliente';
import { Button } from '../../components/ui/Button';
import './PlanOperativoServicio.css';

export function PlanOperativoServicio({ servicioId, puedeEditar }) {
  const [items,setItems]=useState([]),[consignas,setConsignas]=useState([]);
  const [confirmado,setConfirmado]=useState(false),[cargando,setCargando]=useState(true);
  const [ocupado,setOcupado]=useState(false),[error,setError]=useState(''),[mensaje,setMensaje]=useState('');
  useEffect(()=>{
    let activo=true;
    get(`/datos-kpi/servicios/${servicioId}/plan`).then(r=>{if(activo){setItems(r.plantillas.map(p=>({...p,minutosDesdeInicio:p.minutos_desde_inicio,intervaloMin:p.intervalo_min})));setConsignas(r.consignas);setConfirmado(r.confirmado);}})
      .catch(e=>{if(activo)setError(e.message);}).finally(()=>{if(activo)setCargando(false);});
    return()=>{activo=false;};
  },[servicioId]);
  const cambiar=(i,k,v)=>setItems(items.map((p,j)=>i===j?{...p,[k]:v}:p));
  const guardar=async(e)=>{
    e.preventDefault();setOcupado(true);setError('');setMensaje('');
    try{
      const r=await put(`/datos-kpi/servicios/${servicioId}/plan`,{plantillas:items.map(p=>({...(p.id?{id:p.id}:{}),tipo:p.tipo,descripcion:p.descripcion,minutosDesdeInicio:p.minutosDesdeInicio===''?null:p.minutosDesdeInicio,intervaloMin:p.intervaloMin===''?null:p.intervaloMin})),consignas:consignas.map(c=>({...(c.id?{id:c.id}:{}),descripcion:c.descripcion}))});
      const plan=await get(`/datos-kpi/servicios/${servicioId}/plan`);
      setItems(plan.plantillas.map(p=>({...p,minutosDesdeInicio:p.minutos_desde_inicio,intervaloMin:p.intervalo_min})));
      setConsignas(plan.consignas);setConfirmado(true);setMensaje(`Plan guardado. ${r.turnosProgramados} turnos futuros programados. Los nuevos turnos e importaciones usarán este plan.`);
    }catch(e){setError(e.message);}finally{setOcupado(false);}
  };
  if(cargando)return <p>Cargando plan operativo…</p>;
  return <section className="plan-operativo">
    <h3>Plan operativo del servicio</h3>
    <p>Defina qué se debe hacer en cada turno. Cada actividad, ronda y reporte genera una obligación independiente para calcular los KPI.</p>
    <p>Estado: <b>{confirmado?'Plan confirmado':'Sin configurar'}</b>. Los cambios se aplican a turnos futuros; la ejecución anterior se conserva.</p>
    {error&&<p role="alert">{error}</p>}{mensaje&&<p role="status">{mensaje}</p>}
    {(!puedeEditar||ocupado)&&<p className="campo-bloqueo" role="status">{!puedeEditar?'Su rol permite consultar el plan. Solicite su modificación al supervisor o a jefatura.':'Espere a que termine el guardado del plan operativo.'}</p>}
    <form onSubmit={guardar}>
      <ControlConAyuda as="fieldset" disabled={!puedeEditar||ocupado} motivoDeshabilitado={!puedeEditar ? 'Su rol solo permite consultar este plan. Solicite los cambios al supervisor, jefe de operaciones o administrador.' : 'Espere a que termine el guardado del plan operativo.'}>
        <legend>Actividades, rondas y reportes</legend>
        <p>Deje el plazo vacío para exigir la entrega al cierre del turno. Los minutos se cuentan desde su inicio. Un intervalo repite la obligación hasta el cierre. Si el plazo supera la duración del turno, se usa su cierre.</p>
        {items.map((p,i)=><article className="plan-operativo-fila" key={p.id||`nuevo-${i}`}>
          <label>Tipo<select aria-label={`Tipo ${i+1}`} className="campo-input" value={p.tipo} onChange={e=>cambiar(i,'tipo',e.target.value)}>{['actividad','ronda','reporte'].map(t=><option key={t}>{t}</option>)}</select></label>
          <label>Descripción<input aria-label={`Descripción ${i+1}`} className="campo-input" required minLength={3} maxLength={1000} value={p.descripcion} onChange={e=>cambiar(i,'descripcion',e.target.value)}/></label>
          <label>Plazo (minutos)<input aria-label={`Plazo ${i+1}`} className="campo-input" type="number" min="0" max="1440" placeholder="Al cierre" value={p.minutosDesdeInicio??''} onChange={e=>cambiar(i,'minutosDesdeInicio',e.target.value===''?null:Number(e.target.value))}/></label>
          <label>Repetir cada (minutos)<input aria-label={`Intervalo ${i+1}`} className="campo-input" type="number" min="1" max="1440" placeholder="Una vez" value={p.intervaloMin??''} onChange={e=>cambiar(i,'intervaloMin',e.target.value===''?null:Number(e.target.value))}/></label>
          <Button tipo="button" variante="secundario" onClick={()=>setItems(items.filter((_,j)=>i!==j))}>Quitar</Button>
        </article>)}
        <Button tipo="button" variante="secundario" onClick={()=>setItems([...items,{tipo:'actividad',descripcion:'',minutosDesdeInicio:null,intervaloMin:null}])}>Agregar obligación</Button>
        <h4>Consignas del servicio</h4>
        {consignas.map((c,i)=><div className="plan-consigna" key={c.id||`nueva-${i}`}>
          <label>Consigna {i+1}<input className="campo-input" required minLength={3} maxLength={1000} value={c.descripcion} onChange={e=>setConsignas(consignas.map((x,j)=>i===j?{...x,descripcion:e.target.value}:x))}/></label>
          <Button tipo="button" variante="secundario" onClick={()=>setConsignas(consignas.filter((_,j)=>i!==j))}>Quitar consigna</Button>
        </div>)}
        <Button tipo="button" variante="secundario" onClick={()=>setConsignas([...consignas,{descripcion:''}])}>Agregar consigna</Button>
        {puedeEditar&&<Button tipo="submit" disabled={ocupado} motivoDeshabilitado={"Espere a que termine la operación en curso antes de continuar."}>Guardar y confirmar plan</Button>}
      </ControlConAyuda>
    </form>
    {!items.length&&<p>Al confirmar un plan vacío declara que este servicio no exige actividades, rondas ni reportes. El monitor mostrará «Sin casos» cuando corresponda.</p>}
  </section>;
}
