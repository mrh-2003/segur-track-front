import {useState} from 'react';
import {Select} from '../../components/ui/Select';
import {Button} from '../../components/ui/Button';
export default function FormCambioSede({agente,sedes,onGuardar,onCancelar}){
 const [sedeId,setSedeId]=useState(String(agente.sede_id||'')),[guardando,setGuardando]=useState(false),[error,setError]=useState('');
 return <form onSubmit={async e=>{e.preventDefault();if(!sedeId)return;setGuardando(true);setError('');try{await onGuardar(Number(sedeId));}catch(e){setError(e.message);}finally{setGuardando(false);}}}>
  <p className="pagina-subtitulo">{agente.nombres} {agente.apellidos} · El agente tendrá una única sede.</p>
  <Select id="cambio-sede-agente" label="Sede asignada" nombre="sedeId" valor={sedeId} onChange={e=>setSedeId(e.target.value)} placeholder="Seleccionar sede" requerido>{sedes.map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}</Select>
  {error&&<p role="alert" className="campo-error">{error}</p>}
  <div className="form-pie"><Button variante="secundario" onClick={onCancelar} disabled={guardando} motivoDeshabilitado="Espere mientras se guarda la sede.">Cancelar</Button><Button tipo="submit" cargando={guardando} disabled={!sedeId} motivoDeshabilitado="Seleccione una sede para el agente.">Guardar sede</Button></div>
 </form>;
}
