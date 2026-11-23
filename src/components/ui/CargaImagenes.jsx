import {ControlConAyuda} from './AyudaControl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './Button';
import './CargaImagenes.css';

export function CargaImagenes({ archivos, onCambiar, motivoDeshabilitado, disabled = false }) {
  const input = useRef(null);
  const [error, setError] = useState('');
  const previews = useMemo(() => archivos.map(file => ({file,url:URL.createObjectURL(file)})), [archivos]);
  useEffect(() => () => previews.forEach(p => URL.revokeObjectURL(p.url)), [previews]);
  const seleccionar = (files) => {
    if(disabled) return;
    const nuevos = Array.from(files || []);
    if(nuevos.some(f => !['image/jpeg','image/png','image/webp'].includes(f.type) || f.size > 8*1024*1024)) {
      setError('Seleccione imágenes JPG, PNG o WEBP de hasta 8 MB.'); return;
    }
    const lista = [...archivos];
    for(const file of nuevos) if(!lista.some(f => f.name===file.name && f.size===file.size && f.lastModified===file.lastModified)) lista.push(file);
    if(lista.length>6) { setError('Puede adjuntar hasta 6 imágenes por registro.'); return; }
    setError(''); onCambiar(lista);
  };
  return <div className="carga-imagenes">
    <div className="carga-imagenes-zona" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();seleccionar(e.dataTransfer.files);}}>
      <input ref={input} type="file" aria-label="Adjuntar imágenes de evidencia" accept="image/jpeg,image/png,image/webp" multiple hidden disabled={disabled} onChange={e=>{seleccionar(e.target.files);e.target.value='';}} />
      <span className="carga-imagenes-icono" aria-hidden="true">↥</span>
      <strong>Evidencias fotográficas</strong>
      <span>Arrastre sus imágenes aquí o selecciónelas desde su equipo.</span>
      <Button tipo="button" variante="secundario" disabled={disabled} motivoDeshabilitado={motivoDeshabilitado || 'Espere a que termine la carga de imágenes antes de modificarlas.'} onClick={()=>input.current?.click()}>Seleccionar imágenes</Button>
      {disabled&&<small className="campo-bloqueo" role="status">{motivoDeshabilitado || 'Espere a que termine la carga de imágenes antes de modificarlas.'}</small>}
      <small>Hasta 6 imágenes · JPG, PNG o WEBP · 8 MB por imagen</small>
    </div>
    {error&&<p role="alert">{error}</p>}
    {!!previews.length&&<div className="carga-imagenes-previews">{previews.map((p,i)=><figure key={p.url}>
      <img src={p.url} alt={`Vista previa de ${p.file.name}`} />
      <figcaption title={p.file.name}>{p.file.name}</figcaption>
      <ControlConAyuda as="button" type="button" disabled={disabled} motivoDeshabilitado={motivoDeshabilitado || 'Espere a que termine la carga de imágenes antes de modificarlas.'} aria-label={`Quitar imagen ${i+1}`} onClick={()=>{onCambiar(archivos.filter((_,j)=>j!==i));setError('');}}>×</ControlConAyuda>
    </figure>)}</div>}
  </div>;
}
