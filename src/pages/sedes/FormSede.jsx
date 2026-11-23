import {useEffect,useState} from 'react';
import {get} from '../../api/cliente';
import {Select} from '../../components/ui/Select';
import { useForm } from '../../hooks/useForm';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const validar = (v) => {
  const e = {};
  if (!v.nombre?.trim() || v.nombre.trim().length < 3) {
    e.nombre = 'El nombre de la sede debe tener al menos 3 caracteres';
  }
  if(!v.clienteId)e.clienteId='Seleccione un cliente';
  if(!v.supervisorId)e.supervisorId='Seleccione un supervisor';
  return e;
};

export default function FormSede({ inicial, onGuardar, onCancelar, cargando }) {
  const [clientes,setClientes]=useState([]),[supervisores,setSupervisores]=useState([]),[error,setError]=useState('');
  useEffect(()=>{let activo=true;Promise.all([get('/clientes?limite=1000'),get('/personal?estado=activo&limite=100')]).then(([c,p])=>{if(activo){setClientes(c);setSupervisores(p.filter(x=>x.cargo==='supervisor'));}}).catch(e=>{if(activo)setError(e.message);});return()=>{activo=false;};},[]);
  const { valores, errores, manejarCambio, manejarBlur, validarTodo } = useForm(
    {
      nombre: inicial?.nombre || '',
      clienteId: String(inicial?.cliente_id||''),supervisorId:String(inicial?.supervisor_id||''),
      direccion: inicial?.direccion || '',
    },
    validar
  );

  const manejarSubmit = (e) => {
    e.preventDefault();
    if (!validarTodo()) return;
    onGuardar({...valores,clienteId:Number(valores.clienteId),supervisorId:Number(valores.supervisorId)});
  };

  return (
    <form onSubmit={manejarSubmit} noValidate>
      {error&&<p role="alert">{error}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input
          id="sede-nombre"
          label="Nombre de la sede"
          nombre="nombre"
          valor={valores.nombre}
          onChange={manejarCambio}
          onBlur={manejarBlur}
          error={errores.nombre}
          placeholder="Ej: Centro Logístico Norte"
          requerido
        />

        <Select id="sede-cliente" label="Cliente de la sede" nombre="clienteId" valor={valores.clienteId} onChange={manejarCambio} error={errores.clienteId} placeholder="Seleccionar cliente" requerido>{clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</Select>
        <Select id="sede-supervisor" label="Supervisor responsable" nombre="supervisorId" valor={valores.supervisorId} onChange={manejarCambio} error={errores.supervisorId} placeholder="Seleccionar supervisor" requerido>{supervisores.map(p=><option key={p.id} value={p.id}>{p.nombres} {p.apellidos}</option>)}</Select>
        <p className="pagina-subtitulo">Los nuevos servicios de esta sede usarán este supervisor. Podrás elegir otro al crear el servicio.</p>
        <Input
          id="sede-direccion"
          label="Dirección"
          nombre="direccion"
          valor={valores.direccion}
          onChange={manejarCambio}
          onBlur={manejarBlur}
          error={errores.direccion}
          placeholder="Ej: Av. Industrial 1200, Zona Norte"
        />
      </div>

      <div className="form-pie" style={{ marginTop: 20 }}>
        <Button tipo="button" variante="secundario" onClick={onCancelar} disabled={cargando} motivoDeshabilitado={"Espere mientras se cargan los datos o se procesa la solicitud."}>
          Cancelar
        </Button>
        <Button tipo="submit" variante="primario" cargando={cargando}>
          {inicial ? 'Guardar' : 'Crear sede'}
        </Button>
      </div>
    </form>
  );
}
