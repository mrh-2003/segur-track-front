import {ControlConAyuda} from '../../components/ui/AyudaControl';
import {useEffect, useId, useRef, useState} from 'react';
import './SelectorPersonalTurno.css';
import '../../components/ui/Input.css';

export default function SelectorPersonalTurno({personas, valor, onCambiar, cargando, sinServicio, permiteVacante=true}) {
  const textoVacio=permiteVacante?'Sin asignar: plaza requerida':'Seleccione un agente disponible';
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  const contenedor = useRef(null);
  const lista = useRef(null);
  const id = useId();
  const seleccionada = personas.find(p => String(p.personalId) === String(valor));
  const ordenadas = [...personas].sort((a,b) => Number(b.disponible)-Number(a.disponible));
  const disponibles = personas.filter(p=>p.disponible).length;
  const bloqueadas = ordenadas.filter(p => !p.disponible);
  const opciones = [{personalId:'', nombres:textoVacio, apellidos:'', disponible:true}, ...ordenadas];

  useEffect(() => {
    const cerrar = e => {if (!contenedor.current?.contains(e.target)) setAbierto(false);};
    document.addEventListener('pointerdown', cerrar);
    return () => document.removeEventListener('pointerdown', cerrar);
  }, []);
  useEffect(() => {
    if (abierto) lista.current?.querySelector('[data-activo="true"]')?.scrollIntoView({block:'nearest'});
  }, [activo, abierto]);

  const elegir = p => {
    if (!p.disponible) return;
    onCambiar(String(p.personalId));
    setAbierto(false);
  };
  const teclado = e => {
    if (['ArrowDown','ArrowUp','Home','End'].includes(e.key)) {
      e.preventDefault();
      setAbierto(true);
      setActivo(n => e.key==='Home' ? 0 : e.key==='End' ? opciones.length-1 : Math.max(0,Math.min(opciones.length-1,n+(e.key==='ArrowDown'?1:-1))));
    } else if (e.key==='Escape' || e.key==='Tab') setAbierto(false);
    else if (abierto && ['Enter',' '].includes(e.key)) {
      e.preventDefault();
      if (opciones[activo]) elegir(opciones[activo]);
    }
  };

  return <div className="campo selector-personal" ref={contenedor}>
    <label id={id+'-label'} className="campo-label" htmlFor={id+'-control'}>{permiteVacante?'Personal asignado (opcional)':'Agente a asignar *'}</label>
    <div className="selector-personal-control">
      <ControlConAyuda as="button" id={id+'-control'} type="button" role="combobox" aria-labelledby={id+'-label'}
        aria-expanded={abierto} aria-controls={id+'-lista'} aria-haspopup="listbox"
        aria-activedescendant={abierto && activo>=0 ? id+'-opcion-'+activo : undefined}
        aria-describedby={id+'-ayuda'} disabled={cargando || sinServicio} motivoDeshabilitado={sinServicio ? 'Primero seleccione un servicio para consultar sus agentes.' : 'Espere mientras se consulta la disponibilidad del personal.'}
        className={'campo-select selector-personal-boton '+(seleccionada && !seleccionada.disponible?'con-conflicto':'')}
        onKeyDown={teclado} onClick={()=>{setAbierto(!abierto);setActivo(opciones.findIndex(p=>String(p.personalId)===String(valor)));}}>
        <span>{cargando?'Consultando personal…':sinServicio?'Primero seleccione un servicio':seleccionada?`${seleccionada.nombres} ${seleccionada.apellidos}${seleccionada.disponible?'':' *'}`:valor?'Selección no disponible *':textoVacio}</span>
        <span aria-hidden="true">⌄</span>
      </ControlConAyuda>
      {abierto && !cargando && <div className="selector-personal-menu">
        <div className="selector-personal-cabecera">{personas.length} personas vinculadas <span>{disponibles} {disponibles===1?'disponible':'disponibles'}</span></div>
        <div id={id+'-lista'} ref={lista} role="listbox" aria-labelledby={id+'-label'} className="selector-personal-lista">
          {opciones.map((p,n)=><div key={p.personalId} id={id+'-opcion-'+n} role="option"
            aria-selected={String(p.personalId)===String(valor)} aria-disabled={!p.disponible}
            data-activo={activo===n} className={'selector-personal-opcion '+(!p.disponible?'no-disponible':'')}
            onMouseDown={e=>e.preventDefault()} onClick={()=>elegir(p)} onMouseEnter={()=>setActivo(n)}>
            <span className="selector-personal-indicador" aria-hidden="true">{!p.disponible?'!':String(p.personalId)===String(valor)?'✓':'○'}</span>
            <div><strong>{p.nombres} {p.apellidos}{!p.disponible?' *':''}</strong>
              <small>{p.personalId ? p.disponible?'Disponible para este turno':p.motivos.join(' '):permiteVacante?'Programar una plaza pendiente de cubrir':'Seleccione una persona para continuar'}</small></div>
          </div>)}
        </div>
      </div>}
    </div>
    <div id={id+'-ayuda'} className="selector-personal-ayuda" aria-live="polite">
      {!cargando && !sinServicio && !personas.length && <p>No hay personal vinculado a este servicio. Vincúlelo desde Servicios o programe una plaza sin asignar.</p>}
      {!cargando && bloqueadas.length>0 && <div className="selector-personal-advertencia"><p><b>* Personal no disponible</b> · Se muestra en rojo y no se puede asignar en este horario.</p>
        <ul>{bloqueadas.map(p=><li key={p.personalId}><strong>{p.nombres} {p.apellidos}:</strong> {p.motivos.join(' ')}</li>)}</ul>
      </div>}
      {!cargando && valor && !seleccionada && <p className="selector-personal-advertencia">* El personal seleccionado no está vinculado a este servicio o ya no está disponible. Seleccione otra persona o deje la plaza sin asignar.</p>}
    </div>
  </div>;
}
