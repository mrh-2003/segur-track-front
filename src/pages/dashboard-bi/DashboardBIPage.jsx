import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { resumenBi,catalogosBi,estadoBi,sincronizarBi,embedBi } from '../../api/bi';
import { Button } from '../../components/ui/Button';
import GraficoLineas from './GraficoLineas';
import GraficoDona from './GraficoDona';
import { MetasBi } from './MetasBi';
import './DashboardBIPage.css';
const formato=(v,u)=>v===null||v===undefined?'—':Number(v).toLocaleString('es-PE',{maximumFractionDigits:u==='cantidad'?0:1})+(u==='%'?' %':u==='min'?' min':u==='por_1000'?' / 1.000':'');
const hora=v=>v?new Date(v).toLocaleString('es-PE',{timeZone:'America/Lima'}):'Pendiente';
const SERIES=[{campo:'cobertura',nombre:'Cobertura',color:'#3b82f6'},{campo:'ausentismo',nombre:'Ausentismo',color:'#a78bfa'},{campo:'tardanzas',nombre:'Tardanzas',color:'#f59e0b'}];
export default function DashboardBIPage(){
  const {usuario}=useAuth();
  const puedeGestionar=['administrador','jefe_operaciones'].includes(usuario?.rol);
  const [f,setF]=useState({periodo:'30',clienteId:'',servicioId:'',sedeId:'',supervisorId:''});
  const [data,setData]=useState(null),[catalogo,setCatalogo]=useState({clientes:[],servicios:[],sedes:[],supervisores:[]}),[estado,setEstado]=useState(null);
  const [vista,setVista]=useState('indicadores'),[recarga,setRecarga]=useState(0),[cargando,setCargando]=useState(true),[sincronizando,setSincronizando]=useState(false),[error,setError]=useState(''),[mensaje,setMensaje]=useState(''),[embed,setEmbed]=useState('');
  const ultimo=useRef(null);
  useEffect(()=>{
    let activo=true;
    Promise.resolve().then(async()=>{if(activo)setCargando(true);try{const [r,c,s,e]=await Promise.all([resumenBi(f),catalogosBi(),estadoBi(),embedBi()]);if(activo){setData(r);setCatalogo(c);setEstado(s);ultimo.current=s.ultima_carga_en;setEmbed(e.url||'');setError('');}}catch(e){if(activo)setError(e.message);}finally{if(activo)setCargando(false);}});
    return()=>{activo=false;};
  },[f,recarga]);
  useEffect(()=>{
    let activo=true;
    const timer=setInterval(()=>estadoBi().then(s=>{if(activo){setEstado(s);if(s.ultima_carga_en!==ultimo.current){ultimo.current=s.ultima_carga_en;setRecarga(n=>n+1);}}}).catch(()=>{}),30000);
    return()=>{activo=false;clearInterval(timer);};
  },[]);
  const sincronizar=async()=>{setSincronizando(true);setError('');setMensaje('');try{const r=await sincronizarBi();setMensaje(r.en_curso?'Ya hay una sincronización en curso. Los indicadores cambiarán al finalizar.':'Datos sincronizados correctamente.');setRecarga(n=>n+1);return r;}catch(e){setError(e.message);throw e;}finally{setSincronizando(false);}};
  const indicador=codigo=>data?.indicadores.find(i=>i.codigo===codigo);
  const filtro=(campo,titulo,items)=><label>{titulo}<select aria-label={titulo} className="campo-input" value={f[campo]} onChange={e=>setF({...f,[campo]:e.target.value})}><option value="">Todos</option>{items.map(x=><option key={x.id} value={x.id}>{x.nombre}</option>)}</select></label>;
  return <div className="pagina-bi">
    <header className="bi-encabezado"><div><h1 className="pagina-titulo">Dashboard BI</h1><p className="pagina-subtitulo">Indicadores operativos e históricos · última sincronización completada</p></div>{puedeGestionar&&<Button cargando={sincronizando} disabled={estado?.ultima?.estado==='ejecutando'} onClick={()=>sincronizar().catch(()=>{})}>Sincronizar datos</Button>}</header>
    <section className="bi-estado"><div><b>{estado?.ultima?.estado==='ejecutando'?'Sincronización en curso':data?.sincronizado?'Datos disponibles':'Primera carga pendiente'}</b><span>Última carga: {hora(estado?.ultima_carga_en)}</span></div><div><span>Actualización automática cada 60 minutos</span><small>Próxima: {hora(estado?.proxima_carga_en)}</small></div></section>
    {error&&<p className="ejecucion-alerta error" role="alert">{error}</p>}{mensaje&&<p className="ejecucion-alerta exito" role="status">{mensaje}</p>}
    <nav className="bi-pestanas"><button type="button" className={vista==='indicadores'?'activa':''} onClick={()=>setVista('indicadores')}>Indicadores</button>{puedeGestionar&&<button type="button" className={vista==='metas'?'activa':''} onClick={()=>setVista('metas')}>Configurar metas</button>}</nav>
    {vista==='metas'&&puedeGestionar?<MetasBi onSincronizar={sincronizar}/>:<>
      <section className="tarjeta bi-filtros"><label>Periodo<select aria-label="Periodo BI" className="campo-input" value={f.periodo} onChange={e=>setF({...f,periodo:e.target.value})}>{[7,30,90,180].map(d=><option key={d} value={d}>Últimos {d} días</option>)}</select></label>{filtro('servicioId','Servicio',catalogo.servicios)}{filtro('clienteId','Cliente',catalogo.clientes)}{filtro('sedeId','Sede',catalogo.sedes)}{usuario?.rol!=='supervisor'&&filtro('supervisorId','Supervisor',catalogo.supervisores)}</section>
      {!cargando&&!data?.sincronizado?<section className="tarjeta"><h2>Aún no hay una carga completada</h2><p>Los registros operativos aparecerán aquí después de la primera sincronización.</p></section>:<>
        <div className="bi-kpis">{['I00','I01','I03','I04'].map(c=>{const i=indicador(c);return <article className="tarjeta" key={c}><span>{i?.nombre||c}</span><strong>{cargando?'…':formato(i?.valor,i?.unidad)}</strong><small>{i?.variacion==null?'Sin periodo anterior comparable':(i.variacion>0?'+':'')+Number(i.variacion).toFixed(1)+(i.unidad==='%'?' pp':'')+' frente al periodo anterior'}</small></article>;})}</div>
        {(data?.calidad?.asistenciasPendientes>0||data?.calidad?.plazosPendientes>0)&&<p className="ejecucion-alerta">Información pendiente de validar: {data.calidad.asistenciasPendientes} asistencias y {data.calidad.plazosPendientes} plazos de incidencia.</p>}
        <div className="grilla-contenido grilla-2-1"><section className="tarjeta"><h2>Evolución de indicadores</h2><p className="tarjeta-subtitulo">Últimos seis meses disponibles · porcentajes</p><GraficoLineas datos={(data?.evolucion||[]).map(e=>({...e,semana:e.mes+'-01'}))} series={SERIES} cargando={cargando}/></section><section className="tarjeta"><h2>Incidencias por tipo</h2><GraficoDona datos={data?.tipos||[]} cargando={cargando}/></section></div>
        <section className="tarjeta"><h2>Indicadores del periodo</h2><p className="tarjeta-subtitulo">{data?.periodo?.inicio} al {data?.periodo?.fin} · comparación con {data?.periodo?.anteriorInicio} al {data?.periodo?.anteriorFin}</p><div className="bi-tabla-scroll"><table className="bi-tabla"><thead><tr><th>Código</th><th>Indicador</th><th>Resultado</th><th>Meta</th><th>Variación</th><th>Estado</th></tr></thead><tbody>{(data?.indicadores||[]).map(i=><tr key={i.codigo}><td>{i.codigo}</td><td><b>{i.nombre}</b><small>{i.formula}</small></td><td>{formato(i.valor,i.unidad)}</td><td>{i.meta===null?'Sin meta':(i.sentido==='mayor'?'≥ ':'≤ ')+formato(i.meta,i.unidad)}</td><td>{i.variacion===null?'—':(i.variacion>0?'+':'')+(i.unidad==='%'?Number(i.variacion).toLocaleString('es-PE',{maximumFractionDigits:1}):formato(i.variacion,i.unidad))+(i.unidad==='%'?' pp':'')}</td><td>{i.valor===null?'Sin casos':i.cumple===null?'Informativo':i.cumple?'En meta':'Requiere atención'}</td></tr>)}</tbody></table></div></section>
        <section className="tarjeta"><h2>Cobertura por servicio</h2><div className="bi-tabla-scroll"><table className="bi-tabla"><thead><tr><th>Servicio</th><th>Turnos exigibles</th><th>Descubiertos</th><th>Cobertura</th></tr></thead><tbody>{(data?.servicios||[]).map(s=><tr key={s.id+'-'+s.servicio}><td>{s.servicio}</td><td>{s.turnos}</td><td>{s.descubiertos}</td><td>{formato(s.cobertura,'%')}</td></tr>)}</tbody></table></div></section>
      </>}
      {embed?<section className="tarjeta"><h2>Informe Power BI</h2><iframe title="Informe Power BI" src={embed} width="100%" height="600" style={{border:0}} allowFullScreen/></section>:<p className="bi-nota">El informe de Power BI se mostrará aquí cuando se configure su publicación.</p>}
    </>}
  </div>;
}
