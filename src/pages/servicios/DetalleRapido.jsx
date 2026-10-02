import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import './DetalleRapido.css';

export default function DetalleRapido({ servicio, onEditar }) {
  if (!servicio) {
    return (
      <div className="tarjeta detalle-rapido detalle-vacio">
        <p className="detalle-vacio-texto">Selecciona un servicio para ver el detalle rápido</p>
      </div>
    );
  }

  return (
    <div className="tarjeta detalle-rapido">
      <h3 className="tarjeta-titulo">{servicio.nombre}</h3>
      <Badge valor={servicio.estado} />
      <dl className="detalle-lista">
        <div className="detalle-item">
          <dt>Cliente</dt>
          <dd>{servicio.cliente}</dd>
        </div>
        <div className="detalle-item">
          <dt>Supervisor</dt>
          <dd>{servicio.supervisor}</dd>
        </div>
        <div className="detalle-item">
          <dt>Horario</dt>
          <dd>{servicio.hora_inicio} – {servicio.hora_fin}</dd>
        </div>
        <div className="detalle-item">
          <dt>Personal asignado</dt>
          <dd>{servicio.personal_asignado ?? 0} personas</dd>
        </div>
        <div className="detalle-item">
          <dt>Inicio</dt>
          <dd>{servicio.fecha_inicio}</dd>
        </div>
      </dl>
      <Button variante="primario" onClick={onEditar} tamano="sm" style={{ width: '100%', justifyContent: 'center' }}>
        Ver detalle
      </Button>
    </div>
  );
}
