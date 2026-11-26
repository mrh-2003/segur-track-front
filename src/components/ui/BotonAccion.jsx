import {useEffect,useId,useState} from 'react';
import {createPortal} from 'react-dom';
import {Icono} from './Icono';
import {AyudaControl} from './AyudaControl';
import './BotonAccion.css';

export function BotonAccion({etiqueta,icono,peligro=false,activo=false,disabled=false,cargando=false,motivoDeshabilitado,onClick,...props}){
 const id=useId(),[posicion,setPosicion]=useState(null);
 const bloqueado=disabled||cargando;
 const ayuda=cargando?'Espere mientras se procesa la acción.':disabled?(motivoDeshabilitado||etiqueta):etiqueta;
 useEffect(()=>{
  if(!posicion)return;
  const cerrar=()=>setPosicion(null);
  window.addEventListener('scroll',cerrar,true);window.addEventListener('resize',cerrar);
  return()=>{window.removeEventListener('scroll',cerrar,true);window.removeEventListener('resize',cerrar);};
 },[posicion]);
 const mostrar=e=>{
  if(bloqueado)return;
  const r=e.currentTarget.getBoundingClientRect(),ancho=Math.min(260,window.innerWidth-24);
  setPosicion({left:Math.max(12,Math.min(r.left+r.width/2-ancho/2,window.innerWidth-ancho-12)),top:r.top>85?r.top-8:r.bottom+8,arriba:r.top>85,ancho});
 };
 return <AyudaControl motivo={bloqueado?ayuda:null}>
  <button {...props} type="button" className={`boton-accion${peligro?' boton-accion-peligro':''}${activo?' boton-accion-activo':''}`}
   disabled={bloqueado} data-motivo-deshabilitado={bloqueado?ayuda:undefined} aria-label={etiqueta} aria-busy={cargando||undefined}
   aria-describedby={posicion?id:undefined} title={posicion?undefined:ayuda} onClick={onClick}
   onPointerEnter={mostrar} onPointerLeave={()=>setPosicion(null)} onFocus={mostrar} onBlur={()=>setPosicion(null)} onKeyDown={e=>{if(e.key==='Escape')setPosicion(null);}}>
   {cargando?<span className="btn-spinner" aria-hidden="true"/>:typeof icono==='string'?<Icono nombre={icono} tamano={17}/>:icono}
  </button>
  {posicion&&createPortal(<span id={id} role="tooltip" className="boton-accion-tooltip" style={{left:posicion.left,top:posicion.top,maxWidth:posicion.ancho,transform:posicion.arriba?'translateY(-100%)':undefined}}>{etiqueta}</span>,document.body)}
 </AyudaControl>;
}
