import {useId, useState} from 'react';
import './SelectorSedes.css';

export default function SelectorSedes({sedes, valor=[], onChange, requerido=false, rol='jefe_operaciones', error}) {
 const id=useId(), [busqueda,setBusqueda]=useState('');
 const seleccionadas=sedes.filter(s=>valor.includes(s.id));
 return <div className="campo selector-sedes">
  <label id={id} className="campo-label">Sedes asignadas{requerido&&' *'}</label>
  <details className="selector-sedes-desplegable">
   <summary aria-labelledby={id}>{seleccionadas.length?`${seleccionadas.length} sede${seleccionadas.length===1?'':'s'} seleccionada${seleccionadas.length===1?'':'s'}`:'Seleccionar sedes'}<span aria-hidden="true">⌄</span></summary>
   <div className="selector-sedes-panel">
    <input className="campo-input" aria-label="Buscar sedes" placeholder="Buscar una sede…" value={busqueda} onChange={e=>setBusqueda(e.target.value)}/>
    <div className="selector-sedes-opciones" role="group" aria-labelledby={id}>
     {sedes.filter(s=>s.nombre.toLocaleLowerCase().includes(busqueda.toLocaleLowerCase())).map(s=><label key={s.id}><input type="checkbox" checked={valor.includes(s.id)} onChange={e=>onChange(e.target.checked?[...valor,s.id]:valor.filter(x=>x!==s.id))}/><span>{s.nombre}{s.cliente&&<small>{s.cliente}</small>}</span></label>)}
     {!sedes.length&&<p>{requerido?'No hay sedes. Cree una sede antes de registrar un supervisor.':'No hay sedes registradas. Puede crear esta cuenta sin asignar ninguna.'}</p>}
    </div>
   </div>
  </details>
  {seleccionadas.length>0&&<div className="selector-sedes-etiquetas">{seleccionadas.map(s=><span key={s.id}>{s.nombre}<button type="button" aria-label={`Quitar ${s.nombre}`} onClick={()=>onChange(valor.filter(x=>x!==s.id))}>×</button></span>)}</div>}
  <small>{requerido?'Seleccione una o varias sedes, sin límite.':`Opcional. ${rol==='administrador'?'El administrador':'El jefe de operaciones'} mantiene acceso a todas las sedes.`}</small>
  {error&&<p role="alert" className="campo-error">{error}</p>}
 </div>;
}
