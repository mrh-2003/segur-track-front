import {ControlConAyuda} from '../../components/ui/AyudaControl';
import { useEffect, useState } from 'react';
import { configuracionBi, guardarMetasBi } from '../../api/bi';
import { Button } from '../../components/ui/Button';
export function MetasBi({onSincronizar}) {
  const [items,setItems]=useState([]),[paso,setPaso]=useState(1),[error,setError]=useState(''),[ocupado,setOcupado]=useState(false);
  const [desde,setDesde]=useState(()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima'}).format(new Date()));
  useEffect(()=>{let activo=true;configuracionBi().then(r=>{if(activo)setItems(r.indicadores.map(i=>({...i,valor:i.valor??''})));}).catch(e=>{if(activo)setError(e.message);});return()=>{activo=false;};},[]);
  return <section className="tarjeta bi-metas">
    <h2>Metas de los indicadores</h2><p className="tarjeta-subtitulo">1. Definir valores → 2. Revisar y publicar</p>
    {error&&<p role="alert">{error}</p>}
    <form onSubmit={async e=>{e.preventDefault();if(paso===1){setPaso(2);return;}setOcupado(true);setError('');try{await guardarMetasBi({vigenteDesde:desde,metas:items.map(i=>({codigo:i.codigo,valor:i.valor===''?null:Number(i.valor)}))});await onSincronizar();setPaso(1);}catch(e){setError(e.message);}finally{setOcupado(false);}}}>
      <label>Vigentes desde<ControlConAyuda as="input" className="campo-input" type="date" required value={desde} disabled={paso===2||ocupado} motivoDeshabilitado={ocupado ? 'Espere a que termine el guardado de las metas.' : 'Pulse «Volver a editar» para cambiar la fecha de vigencia.'} onChange={e=>setDesde(e.target.value)}/></label>
      <div className="bi-tabla-scroll"><table className="bi-tabla"><thead><tr><th>Indicador</th><th>Meta</th><th>Interpretación</th></tr></thead><tbody>{items.map((i,n)=><tr key={i.codigo}><td><b>{i.codigo} · {i.nombre}</b><small>{i.formula}</small></td><td>{paso===1?<input aria-label={'Meta '+i.codigo} className="campo-input" type="number" min="0" max={i.unidad==='%'?100:undefined} step="any" placeholder="Sin meta" value={i.valor} onChange={e=>setItems(items.map((x,j)=>n===j?{...x,valor:e.target.value}:x))}/>:<b>{i.valor===''?'Sin meta':i.valor+' '+i.unidad}</b>}</td><td>{i.sentido==='mayor'?'Mayor o igual':i.sentido==='menor'?'Menor o igual':'Informativo'}</td></tr>)}</tbody></table></div>
      {paso===2&&<p>Se conservarán las metas anteriores y se actualizarán los indicadores cuando termine la sincronización.</p>}
      <div className="form-pie">{paso===2&&<Button tipo="button" variante="secundario" disabled={ocupado} motivoDeshabilitado={"Espere a que termine la operación en curso antes de continuar."} onClick={()=>setPaso(1)}>Volver a editar</Button>}<Button tipo="submit" cargando={ocupado} disabled={!items.length} motivoDeshabilitado={"Primero deben cargarse los indicadores y sus metas. Si no aparecen, vuelva a abrir esta sección."}>{paso===1?'Revisar metas':'Guardar metas y sincronizar'}</Button></div>
    </form>
  </section>;
}
