import {useEffect, useId, useState} from 'react';
import {createPortal} from 'react-dom';
import './AyudaControl.css';

// Conserva el disabled nativo; la envoltura recibe hover, foco y toque.
export function AyudaControl({motivo, children, bloque=false, estilo}) {
  const [posicion,setPosicion]=useState(null);
  const id=useId();
  useEffect(()=>{
    if(!posicion)return;
    const cerrar=()=>setPosicion(null);
    window.addEventListener('scroll',cerrar,true);
    window.addEventListener('resize',cerrar);
    return()=>{window.removeEventListener('scroll',cerrar,true);window.removeEventListener('resize',cerrar);};
  },[posicion]);
  if(!motivo)return children;
  const mostrar=e=>{
    const r=e.currentTarget.getBoundingClientRect();
    const ancho=Math.min(320,window.innerWidth-24);
    setPosicion({left:Math.max(12,Math.min(r.left,window.innerWidth-ancho-12)),top:r.top,bottom:r.bottom,ancho,arriba:r.top>130});
  };
  return <span className={'control-ayuda'+(bloque?' control-ayuda-bloque':'')} style={estilo}
    tabIndex={0} role="group" aria-label="Control no disponible" aria-describedby={id}
    title={motivo} onPointerEnter={mostrar} onPointerLeave={()=>setPosicion(null)} onFocus={mostrar}
    onBlur={()=>setPosicion(null)} onClick={e=>{e.preventDefault();e.stopPropagation();mostrar(e);}}
    onKeyDown={e=>{if(e.key==='Escape')setPosicion(null);if(e.key==='Enter'||e.key===' '){e.preventDefault();mostrar(e);}}}>
    {children}<span id={id} className="control-ayuda-lector">{motivo}</span>
    {posicion&&createPortal(<span className="control-ayuda-tooltip" role="tooltip" aria-hidden="true"
      style={{left:posicion.left,top:posicion.arriba?posicion.top-8:posicion.bottom+8,width:posicion.ancho,transform:posicion.arriba?'translateY(-100%)':undefined}}>{motivo}</span>,document.body)}
  </span>;
}

// Para controles nativos con estilos propios y campos que no usan Input/Select.
export function ControlConAyuda({as:Etiqueta='button',motivoDeshabilitado,disabled,...props}) {
  const motivo=disabled?motivoDeshabilitado:null;
  const campo=['input','select','textarea','fieldset'].includes(Etiqueta);
  const control=<Etiqueta {...props} disabled={disabled} data-motivo-deshabilitado={motivo||undefined} title={motivo||props.title}/>;
  if(props.hidden)return control;
  return <AyudaControl motivo={motivo} bloque={campo || props.role==='combobox'} estilo={props.style?.width?{width:props.style.width}:undefined}>{control}</AyudaControl>;
}
