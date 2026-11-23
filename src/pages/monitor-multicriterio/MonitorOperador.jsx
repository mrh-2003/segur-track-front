import {useCallback,useEffect,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {get} from '../../api/cliente';
import {useAuth} from '../../hooks/useAuth';
import {useModal} from '../../hooks/useModal';
import {confirmarTurno,cumplirTurno,rechazarTurno} from '../../api/turnos';
import {Button} from '../../components/ui/Button';
import {Badge} from '../../components/ui/Badge';
import ModalDetalleTurno from '../turnos/ModalDetalleTurno';
import './MonitorOperador.css';
export default function MonitorOperador(){
 const [data,setData]=useState(null),[error,setError]=useState(''),[cargando,setCargando]=useState(true);
 const {usuario}=useAuth(),{abrirModal,cerrarModal}=useModal(),navigate=useNavigate();
 const cargar=useCallback(async()=>{const r=await get('/multicriterio/mi-operacion');setData(r);setError('');return r;},[]);
 useEffect(()=>{let activo=true;const actualizar=()=>get('/multicriterio/mi-operacion').then(r=>{if(activo){setData(r);setError('');}}).catch(e=>{if(activo)setError(e.message);}).finally(()=>{if(activo)setCargando(false);});actualizar();const t=setInterval(actualizar,30000);return()=>{activo=false;clearInterval(t);};},[]);
 const abrir=()=>{const t=data.turno;const ejecutar=async(fn)=>{const r=await fn();await cargar();return r;};abrirModal({tipo:'formulario',tamano:'xl',titulo:'Mi turno · '+t.servicio,contenido:<ModalDetalleTurno turno={t} usuario={usuario} onCerrar={cerrarModal} onActualizar={cargar} onConfirmar={x=>ejecutar(()=>confirmarTurno(x.id))} onCumplir={(x,ev)=>ejecutar(()=>cumplirTurno(x.id,ev))} onRechazar={(x,m)=>ejecutar(()=>rechazarTurno(x.id,m))}/>});};
 const t=data?.turno;
 return <div className="fade-in operador-monitor"><header className="pagina-encabezado"><div><p className="operador-eyebrow">MI ESPACIO OPERATIVO</p><h1 className="pagina-titulo">Monitor multicriterio</h1><p className="pagina-subtitulo">Tu servicio, tus tareas y tu avance en un solo lugar.</p></div><Button variante="secundario" onClick={()=>navigate('/turnos')}>Historial de turnos</Button></header>
 {error&&<p className="operador-error" role="alert">{error}</p>}{cargando&&!data?<div className="tarjeta" role="status">Cargando tu operación…</div>:!t?<div className="tarjeta operador-vacio"><span>✓</span><h2>No tienes turnos pendientes</h2><p>Cuando te asignen un turno, recibirás una notificación y aparecerá aquí.</p><Button onClick={()=>navigate('/turnos')}>Consultar mis turnos</Button></div>:<>
 <section className="operador-hero"><div><span className="operador-etiqueta">{t.activo?'SERVICIO ACTUAL':'PRÓXIMO TURNO'}</span><h2>{t.servicio}</h2><p>{t.sede} · {t.fecha} · {t.hora_inicio?.slice(0,5)}–{t.hora_fin?.slice(0,5)}</p><Badge valor={t.estado}/><div className="operador-hero-acciones"><Button onClick={abrir}>{t.activo?'Marcar asistencia y completar tareas':'Ver mi turno'}</Button>{t.activo&&<Button variante="secundario" onClick={()=>navigate('/incidencias',{state:{abrirModal:true,servicioId:t.servicio_id}})}>Reportar incidencia</Button>}</div><small>La asistencia guarda la hora del sistema y tu ubicación actual.</small></div><div className="operador-progreso" role="img" aria-label={data.progreso===null?'Sin tareas programadas':`${data.progreso}% completado`} style={{'--avance':(data.progreso||0)+'%'}}><div><strong>{data.progreso===null?'—':data.progreso+'%'}</strong><span>Completado</span></div></div></section>
 <div className="operador-metricas">{[['Tareas pendientes',data.tareas.filter(x=>!x.completa).length],['Incidencias por resolver',data.incidencias.filter(x=>x.estado!=='cerrada').length],['Compromisos completados',`${data.completadas} / ${data.total}`]].map(([titulo,valor])=><article className="tarjeta" key={titulo}><span>{titulo}</span><strong>{valor}</strong></article>)}</div>
 <div className="operador-columnas"><section className="tarjeta"><header><h2>Mi lista de trabajo</h2><span>{data.tareas.length} tareas</span></header>{!data.tareas.length?<p className="pagina-subtitulo">Todavía no hay tareas programadas para este turno.</p>:<ul className="operador-tareas">{data.tareas.map(x=><li key={x.id}><span className={'operador-check '+(x.completa?'completa':'')}>{x.completa?'✓':'○'}</span><div><small>{x.tipo}</small><strong>{x.descripcion}</strong></div><span>{x.completa?'Completada':'Pendiente'}</span></li>)}</ul>}<Button variante="secundario" onClick={abrir}>Abrir ejecución del turno</Button></section>
 <section className="tarjeta"><header><h2>Mis incidencias</h2><span>{data.incidencias.length} reportes</span></header>{!data.incidencias.length?<p className="pagina-subtitulo">No tienes incidencias en este servicio.</p>:<ul className="operador-incidencias">{data.incidencias.map(i=><li key={i.id}><button onClick={()=>navigate('/incidencias?incidencia='+i.id)}><strong>{i.codigo}</strong><p>{i.descripcion}</p><Badge valor={i.estado}/></button></li>)}</ul>}</section></div></>}
 </div>;
}
