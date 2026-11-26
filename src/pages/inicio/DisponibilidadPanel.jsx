import {BotonAccion} from '../../components/ui/BotonAccion';
import { useState, useEffect, useCallback } from 'react';
import { personalDisponible, catalogosOperativos, crearAusencia, listarAusencias, eliminarAusencia } from '../../api/operaciones';
import { Button } from '../../components/ui/Button';
import { Icono } from '../../components/ui/Icono';
import './InicioOperaciones.css';
const local = (d) => new Date(d.getTime()-5*3600000).toISOString().slice(0,16);
const iso = (v) => v ? new Date(v+'-05:00').toISOString() : null;
const fecha = (v) => new Date(v).toLocaleString('es-PE', {timeZone:'America/Lima', dateStyle:'short',timeStyle:'short'});
export default function DisponibilidadPanel() {
  const [inicio,setInicio] = useState(() => local(new Date()));
  const [fin,setFin] = useState(() => local(new Date(Date.now()+3600000)));
  const [personas,setPersonas] = useState([]), [catalogo,setCatalogo] = useState([]), [ausencias,setAusencias] = useState([]);
  const [error,setError] = useState(''), [ocupado,setOcupado] = useState(false), [guardando,setGuardando] = useState(false);
  const [vista,setVista] = useState('disponibles'), [busqueda,setBusqueda] = useState(''), [registrando,setRegistrando] = useState(false);
  const [form,setForm] = useState({personalId:'',inicio:'',fin:'',motivo:''});
  const cargar = useCallback(async () => {
    if (!inicio || !fin || new Date(iso(fin)) <= new Date(iso(inicio))) {setError('El fin debe ser posterior al inicio'); return;}
    setOcupado(true);
    try {
      const [p,c,a] = await Promise.all([personalDisponible({inicio:iso(inicio),fin:iso(fin)}),catalogosOperativos(),listarAusencias()]);
      setPersonas(p); setCatalogo(c.personal); setAusencias(a); setError('');
    } catch(e) { setError(e.message); } finally { setOcupado(false); }
  },[inicio,fin]);
  useEffect(() => { const t = setTimeout(() => void cargar(),200); return () => clearTimeout(t); },[cargar]);
  const ausenciasPeriodo = ausencias.filter((a) => +new Date(a.inicio)<+new Date(iso(fin)) && +new Date(a.fin)>+new Date(iso(inicio)));
  const nombre = (p) => `${p.nombres} ${p.apellidos}`;
  const lista = (vista==='disponibles' ? personas : ausenciasPeriodo).filter((p) => (p.personal || nombre(p)).toLowerCase().includes(busqueda.toLowerCase()));
  const guardar = async (e) => {
    e.preventDefault(); setGuardando(true); setError('');
    try { await crearAusencia({...form,personalId:Number(form.personalId),inicio:iso(form.inicio),fin:iso(form.fin)}); setRegistrando(false);setForm({personalId:'',inicio:'',fin:'',motivo:''});await cargar();setVista('ausencias'); }
    catch(err) {setError(err.message);} finally {setGuardando(false);}
  };
  return <section className="tarjeta inicio-personal">
    <div className="inicio-panel-cabecera"><div className="inicio-panel-identidad"><span className="inicio-icono-personal"><Icono nombre="personal" tamano={24}/></span><div><h3>Disponibilidad del personal</h3><p>Organiza tu equipo por horario.</p></div></div><Button variante="secundario" onClick={() => {setRegistrando(!registrando);setForm({...form,inicio,fin});}}>{registrando ? 'Cerrar registro' : '+ Registrar ausencia'}</Button></div>
    <div className="personal-rango"><label>Desde<input className="campo-input" type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} /></label><span>→</span><label>Hasta<input className="campo-input" type="datetime-local" value={fin} onChange={(e) => setFin(e.target.value)}/></label><span className="personal-zona">Hora de Lima</span></div>
    {error && <p className="flujo-error" role="alert">{error}</p>}
    {registrando && <form className="personal-ausencia-form" onSubmit={guardar}><h4>Nueva ausencia</h4><div className="form-grilla"><label className="campo">Personal<select required className="campo-select" value={form.personalId} onChange={(e) => setForm({...form,personalId:e.target.value})}><option value="">Seleccione una persona</option>{catalogo.map((p) => <option key={p.id} value={p.id}>{nombre(p)}</option>)}</select></label>{[['inicio','Desde'],['fin','Hasta'],['motivo','Motivo']].map(([k,t]) => <label key={k} className="campo">{t}<input className="campo-input" required minLength={k==='motivo' ? 5 : undefined} type={k==='motivo' ? 'text' : 'datetime-local'} value={form[k]} onChange={(e) => setForm({...form,[k]:e.target.value})}/></label>)}</div><div className="form-pie"><Button variante="secundario" disabled={guardando} motivoDeshabilitado={"Espere a que termine la operación en curso antes de continuar."} onClick={() => setRegistrando(false)}>Cancelar</Button><Button tipo="submit" cargando={guardando}>Registrar ausencia</Button></div></form>}
    <div className="personal-herramientas"><div className="personal-pestanas" role="tablist" aria-label="Estado del personal">{[['disponibles','Disponibles',personas.length],['ausencias','Ausencias',ausenciasPeriodo.length]].map(([id,t,n]) => <button key={id} type="button" role="tab" aria-selected={vista===id} className={vista===id ? 'activo' : ''} onClick={() => setVista(id)}>{t}<b>{n}</b></button>)}</div><input className="campo-input personal-busqueda" aria-label="Buscar personal" placeholder="Buscar por nombre…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
    {ocupado ? <p role="status" className="personal-vacio">Consultando equipo…</p> : <div className="personal-lista">{lista.length ? lista.map((p) => <article key={p.id} className="personal-item"><span className={`personal-avatar ${vista==='ausencias' ? 'ausente' : ''}`}>{(p.personal || p.nombres).slice(0,1)}</span><div><strong>{p.personal || nombre(p)}</strong><small>{vista==='disponibles' ? `DNI ${p.documento} · Agente` : `${p.motivo} · ${fecha(p.inicio)} — ${fecha(p.fin)}`}</small></div>{vista==='disponibles' ? <span className="personal-disponible">Disponible</span> : <BotonAccion icono="eliminar" disabled={guardando} motivoDeshabilitado={"Espere a que termine la operación en curso antes de continuar."} etiqueta="Retirar ausencia" onClick={async () => {setGuardando(true);try {await eliminarAusencia(p.id);await cargar();}catch(e){setError(e.message);}finally{setGuardando(false);}}}/>}</article>) : <p className="personal-vacio">{vista==='disponibles' ? 'No hay agentes disponibles en este horario.' : 'Sin ausencias en este horario.'}</p>}</div>}
  </section>;
}
