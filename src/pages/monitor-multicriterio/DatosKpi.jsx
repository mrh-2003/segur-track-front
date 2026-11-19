import { useEffect, useState } from 'react';
import { turnosServicio } from '../../api/operaciones';
import { useAuth } from '../../hooks/useAuth';
import { EjecucionTurno } from '../turnos/EjecucionTurno';
import './DatosKpi.css';

const inicio=(t)=>new Date(t.fecha.slice(0,10)+'T'+t.hora_inicio+'-05:00');
const fin=(t)=>{const d=new Date(t.fecha.slice(0,10)+'T'+t.hora_fin+'-05:00');if(d<=inicio(t))d.setUTCDate(d.getUTCDate()+1);return d;};
const grupo=(t)=>inicio(t)>new Date()?2:fin(t)>new Date()?0:1;
const estado=(t)=>grupo(t)===0?'En curso':grupo(t)===1?'Finalizado':'Futuro';

export function DatosKpi({servicios,onCambio}) {
  const {usuario}=useAuth();
  const [servicio,setServicio]=useState(''),[turnoId,setTurnoId]=useState('');
  const [turnos,setTurnos]=useState([]),[error,setError]=useState('');
  useEffect(()=>{
    let activo=true;
    if(servicio)turnosServicio(servicio).then(r=>{if(activo){const ordenados=[...r].sort((a,b)=>grupo(a)-grupo(b)||inicio(b)-inicio(a));setTurnos(ordenados);setTurnoId(ordenados[0]?String(ordenados[0].id):'');}}).catch(e=>{if(activo)setError(e.message);});
    return()=>{activo=false;};
  },[servicio]);
  const turno=turnos.find(t=>String(t.id)===turnoId);
  return <div className="mv-datos-kpi">
    <div className="kpi-seleccion-intro"><span>REGISTRO OPERATIVO</span><p>Seleccione el servicio y el turno para registrar su ejecución y cargar las evidencias.</p></div>
    <div className="kpi-seleccion-campos">
    <label>Servicio<select aria-label="Servicio" className="campo-input" value={servicio} onChange={e=>{setServicio(e.target.value);setTurnoId('');setTurnos([]);setError('');}}>
      <option value="">Seleccione un servicio</option>{servicios.map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}
    </select></label>
    <label>Turno<select aria-label="Turno" className="campo-input" value={turnoId} onChange={e=>setTurnoId(e.target.value)}>
      <option value="">Seleccione un turno</option>{turnos.map(t=><option key={t.id} value={t.id}>{estado(t)} · {t.fecha} · {t.hora_inicio.slice(0,5)}–{t.hora_fin.slice(0,5)} · #{t.id}</option>)}
    </select></label>
    </div>
    {error&&<p role="alert">{error}</p>}
    {turno&&<EjecucionTurno key={turno.id} turno={turno} usuario={usuario} onActualizar={onCambio}/>}
  </div>;
}
