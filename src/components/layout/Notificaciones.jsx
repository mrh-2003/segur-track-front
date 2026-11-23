import {useEffect,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {get,patch} from '../../api/cliente';
import './Notificaciones.css';
export default function Notificaciones(){
 const [items,setItems]=useState([]),[abierto,setAbierto]=useState(false),[error,setError]=useState('');
 const navigate=useNavigate();
 useEffect(()=>{let activo=true;const cargar=()=>get('/notificaciones').then(r=>{if(activo){setItems(r);setError('');}}).catch(()=>{if(activo)setError('No se pudieron cargar las notificaciones.');});cargar();const t=setInterval(cargar,30000);return()=>{activo=false;clearInterval(t);};},[]);
 const pendientes=items.filter(i=>!i.leido_en).length;
 return <div className="notificaciones"><button className="topbar-tema-btn" type="button" aria-label={`Notificaciones, ${pendientes} sin leer`} aria-expanded={abierto} onClick={()=>setAbierto(!abierto)}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>{pendientes>0&&<span className="notificaciones-contador">{pendientes}</span>}</button>{abierto&&<section className="notificaciones-panel" aria-label="Notificaciones"><header><strong>Notificaciones</strong><button type="button" onClick={()=>setAbierto(false)} aria-label="Cerrar notificaciones">×</button></header>{error&&<p role="alert">{error}</p>}{!error&&!items.length&&<p>No tienes notificaciones pendientes.</p>}{items.map(i=><button type="button" key={i.id} className={'notificaciones-item '+(!i.leido_en?'nueva':'')} onClick={async()=>{try{await patch('/notificaciones/'+i.id+'/leer',{});setItems(items.map(x=>x.id===i.id?{...x,leido_en:new Date().toISOString()}:x));setAbierto(false);navigate('/turnos'+(i.fecha?'?fecha='+i.fecha:''),{state:{turnoId:i.turno_id}});}catch(e){setError(e.message);}}}><strong>{i.titulo}</strong><span>{i.mensaje}</span><small>{new Date(i.creado_en).toLocaleString('es-PE',{timeZone:'America/Lima'})}</small></button>)}</section>}</div>;
}
