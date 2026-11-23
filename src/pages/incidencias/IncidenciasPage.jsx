import {get} from '../../api/cliente';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useModal } from '../../hooks/useModal';
import { listarIncidencias,resumenIncidencias,listarTiposIncidencia,crearIncidencia } from '../../api/incidencias';
import { listarServicios } from '../../api/servicios';
import { descargarDirecto } from '../../api/reportes';
import { KpiCard } from '../../components/ui/KpiCard';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { formatearFechaHora } from '../../utils/fechas';
import FormIncidencia from './FormIncidencia';
import FlujoIncidencia from './FlujoIncidencia';
import './IncidenciasPage.css';
export default function IncidenciasPage(){
 const [items,setItems]=useState([]),[resumen,setResumen]=useState(null),[tipos,setTipos]=useState([]),[servicios,setServicios]=useState([]),[error,setError]=useState(''),[cargando,setCargando]=useState(true),[pagina,setPagina]=useState(1),[ahora,setAhora]=useState(()=>Date.now());
 const [f,setF]=useState({q:'',estado:'',tipoId:'',servicioId:window.history.state?.usr?.servicioId||'',alerta:''});
 const {usuario}=useAuth();
 const {abrirModal,cerrarModal}=useModal(),location=useLocation(),abiertoInicial=useRef(false);
 const cargar=useCallback(async()=>{setCargando(true);try{const filtros=Object.fromEntries(Object.entries(f).filter(([,v])=>v!==''));const [lista,r]=await Promise.all([listarIncidencias({...filtros,pagina,limite:20}),resumenIncidencias(filtros)]);setItems(lista);setResumen(r);setError('');}catch(e){setError(e.message);}finally{setCargando(false);}},[f,pagina]);
 useEffect(()=>{const t=setTimeout(cargar,f.q?300:0);return()=>clearTimeout(t);},[cargar,f.q]);
 useEffect(()=>{let activo=true;Promise.all([listarTiposIncidencia(),usuario?.rol==='operador'?get('/multicriterio/mi-operacion').then(r=>r.turno?.activo?[{id:r.turno.servicio_id,nombre:r.turno.servicio}]:[]):listarServicios({limite:100})]).then(([t,s])=>{if(activo){setTipos(t);setServicios(s);}}).catch(e=>{if(activo)setError(e.message);});return()=>{activo=false;};},[usuario?.rol]);
 useEffect(()=>{const t=setInterval(()=>{setAhora(Date.now());void cargar();},60000);return()=>clearInterval(t);},[cargar]);
 const formulario=useCallback(()=>abrirModal({tipo:'formulario',tamano:'lg',titulo:'Reportar una incidencia',contenido:<FormIncidencia tipos={tipos} servicios={servicios} onCancelar={cerrarModal} onGuardar={async d=>{await crearIncidencia(d);cerrarModal();await cargar();}}/>}),[abrirModal,cerrarModal,tipos,servicios,cargar]);
 useEffect(()=>{if(!location.state?.abrirModal||!tipos.length||!servicios.length||abiertoInicial.current)return;const t=setTimeout(()=>{abiertoInicial.current=true;window.history.replaceState({},document.title);formulario();},0);return()=>clearTimeout(t);},[location.state,tipos.length,servicios.length,formulario]);
 const abrir=useCallback(i=>abrirModal({tipo:'formulario',tamano:'xl',titulo:'Seguimiento de incidencia · '+i.codigo,contenido:<FlujoIncidencia id={i.id} onActualizar={cargar}/>}),[abrirModal,cargar]);
 const enlaceAbierto=useRef(null);
 useEffect(()=>{
  const id=Number(new URLSearchParams(location.search).get('incidencia'));
  if(!Number.isSafeInteger(id)||id<=0)return;
  const clave=location.key+':'+id;
  if(enlaceAbierto.current===clave)return;
  // Abrir por ID: el caso puede estar fuera de la página o los filtros de la lista.
  const timer=setTimeout(()=>{enlaceAbierto.current=clave;abrir({id,codigo:location.state?.incidenciaCodigo||'#'+id});},0);
  return()=>clearTimeout(timer);
 },[location.key,location.search,location.state,abrir]);
 const cambiar=(k,v)=>{setF(a=>({...a,[k]:v}));setPagina(1);};
 const vencida=i=>i.estado!=='cerrada'&&i.plazo_resolucion&&+new Date(i.plazo_resolucion)<ahora;
 const exportar=async formato=>{try{await descargarDirecto('incidencias',formato,Object.fromEntries(Object.entries(f).filter(([k,v])=>v!==''&&k!=='alerta')));}catch(e){setError(e.message);}};
 const columnas=[
  {llave:'codigo',titulo:'Incidencia',render:i=><><b>{i.codigo}</b><small className="inc-tabla-secundario">{i.tipo} · Prioridad {i.prioridad}</small><span>{i.descripcion}</span></>},
  {llave:'servicio',titulo:'Servicio y responsable',render:i=><>{i.servicio}<small className="inc-tabla-secundario">{i.responsable||'Sin responsable operativo'}</small></>},
  {llave:'plazo',titulo:'Plazo de resolución',render:i=><><b>{i.plazo_resolucion?formatearFechaHora(i.plazo_resolucion):'Sin plazo definido'}</b>{vencida(i)&&<strong className="inc-alerta-texto">PLAZO VENCIDO · CRÍTICA</strong>}{i.atencion_vencida&&i.estado==='abierta'&&<small className="inc-alerta-texto">Primera atención vencida</small>}{i.plazo_resolucion_extendido&&<small className="inc-tabla-secundario">Plazo ampliado y aprobado</small>}</>},
  {llave:'estado',titulo:'Seguimiento',render:i=><><span>{i.estado==='cerrada'?'Resuelta':i.estado==='en_atencion'?'En atención':'Por atender'}</span>{i.ampliacion_pendiente&&<strong className="inc-solicitud-marca">Ampliación pendiente de aprobación</strong>}</>},
  {llave:'acciones',titulo:'Acción',render:i=><Button variante="secundario" onClick={()=>abrir(i)}>{i.ampliacion_pendiente?'Ver solicitud y seguimiento':'Abrir seguimiento'}</Button>}
 ];
 return <div className="inc-pagina fade-in"><header className="pagina-encabezado"><div><h1 className="pagina-titulo">Incidencias</h1><p className="pagina-subtitulo">Reportar → atender → corregir con evidencia → resolver</p></div><div className="inc-cabecera-acciones">{usuario?.rol==='administrador'&&<details><summary>Exportar registros</summary><Button variante="secundario" onClick={()=>exportar('xlsx')}>Excel</Button><Button variante="secundario" onClick={()=>exportar('pdf')}>PDF</Button></details>}<Button onClick={formulario}>Reportar incidencia</Button></div></header>
  {error&&<p className="inc-error" role="alert">{error}</p>}
  <div className="grilla-kpi grilla-kpi-4"><KpiCard titulo="Por atender" valor={resumen?.abiertas} color="advertencia" cargando={cargando}/><KpiCard titulo="En corrección" valor={resumen?.en_atencion} color="primario" cargando={cargando}/><KpiCard titulo="Plazo vencido" valor={resumen?.vencidas} color="peligro" cargando={cargando}/><KpiCard titulo="Ampliaciones por decidir" valor={resumen?.ampliaciones} color="advertencia" cargando={cargando}/></div>
  <section className="tarjeta"><div className="inc-filtros"><label>Buscar<input className="campo-input" value={f.q} onChange={e=>cambiar('q',e.target.value)} placeholder="Código o descripción"/></label><label>Servicio<select className="campo-input" value={f.servicioId} onChange={e=>cambiar('servicioId',e.target.value)}><option value="">Todos</option>{servicios.map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}</select></label><label>Tipo<select className="campo-input" value={f.tipoId} onChange={e=>cambiar('tipoId',e.target.value)}><option value="">Todos</option>{tipos.map(t=><option key={t.id} value={t.id}>{t.nombre}</option>)}</select></label><label>Estado<select className="campo-input" value={f.estado} onChange={e=>cambiar('estado',e.target.value)}><option value="">Todos</option><option value="abierta">Por atender</option><option value="en_atencion">En corrección</option><option value="cerrada">Resueltas</option></select></label><label>Alertas<select className="campo-input" value={f.alerta} onChange={e=>cambiar('alerta',e.target.value)}><option value="">Todas</option><option value="vencidas">Plazo de resolución vencido</option><option value="ampliaciones">Ampliaciones pendientes</option></select></label></div>
   <p className="inc-ayuda">Las filas rojas requieren atención crítica. Una solicitud de ampliación no detiene el plazo. El supervisor debe aprobarla o rechazarla.</p>
   <Table columnas={columnas} datos={items} cargando={cargando} claseFila={i=>vencida(i)||i.atencion_vencida?'inc-fila-vencida':i.ampliacion_pendiente?'inc-fila-solicitud':''} vacio="No hay incidencias con estos filtros."/>
   <div className="inc-paginacion"><span>{resumen?.total||0} registros · Página {pagina} de {Math.max(1,Math.ceil(Number(resumen?.total||0)/20))}</span><Button variante="secundario" disabled={pagina===1||cargando} motivoDeshabilitado={cargando ? 'Espere mientras se cargan las incidencias.' : 'Está en la primera página; no hay una página anterior.'} onClick={()=>setPagina(pagina-1)}>Anterior</Button><Button variante="secundario" disabled={pagina*20>=Number(resumen?.total||0)||cargando} motivoDeshabilitado={cargando ? 'Espere mientras se cargan las incidencias.' : 'No hay más incidencias para estos filtros; está en la última página.'} onClick={()=>setPagina(pagina+1)}>Siguiente</Button></div>
  </section>
 </div>;
}
