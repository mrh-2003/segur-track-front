import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatearFecha } from '../../utils/fechas';
import './DetalleRapido.css';

export default function DetalleRapido({ servicio, onEditar, onVerDetalleOperativo }) {
  if (!servicio) {
    return (
      <div className="tarjeta detalle-rapido detalle-vacio">
        <p className="detalle-vacio-texto">Seleccione un servicio para ver el detalle rápido</p>
      </div>
    );
  }

  return (
    <div className="tarjeta detalle-rapido">
      <h3 className="tarjeta-titulo">{servicio.nombre}</h3>
      <div style={{ marginBottom: 12 }}>
        <Badge valor={servicio.estado} />
      </div>
      <dl className="detalle-lista">
        <div className="detalle-item">
          <dt>Cliente</dt>
          <dd>{servicio.cliente}</dd>
        </div>
        <div className="detalle-item">
          <dt>Sede</dt>
          <dd>{servicio.sede || '—'}</dd>
        </div>
        <div className="detalle-item">
          <dt>Supervisor</dt>
          <dd>{servicio.supervisor}</dd>
        </div>
        <div className="detalle-item">
          <dt>Horario</dt>
          <dd>{servicio.hora_inicio?.slice(0, 5)} – {servicio.hora_fin?.slice(0, 5)}</dd>
        </div>
        <div className="detalle-item">
          <dt>Personal asignado</dt>
          <dd>{servicio.personal_asignado ?? 0} personas</dd>
        </div>
        <div className="detalle-item">
          <dt>Inicio</dt>
          <dd>{formatearFecha(servicio.fecha_inicio)}</dd>
        </div>
        {servicio.fecha_fin && (
          <div className="detalle-item">
            <dt>Fin</dt>
            <dd>{formatearFecha(servicio.fecha_fin)}</dd>
          </div>
        )}
      </dl>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        <Button
          variante="primario"
          onClick={() => onVerDetalleOperativo && onVerDetalleOperativo(servicio)}
          tamano="sm"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          Detalle operativo y protocolos
        </Button>
        <Button
          variante="secundario"
          onClick={onEditar}
          tamano="sm"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          Editar servicio
        </Button>
      </div>
    </div>
  );
}
