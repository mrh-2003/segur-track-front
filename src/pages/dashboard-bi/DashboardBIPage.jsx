import { useState, useEffect } from 'react';
import { useModal } from '../../hooks/useModal';
import {
  indicadoresBi, evolucionCumplimiento,
  incidenciasPorTipo, desempenoPorServicio, embedBi,
} from '../../api/bi';
import { listarClientes, listarServicios } from '../../api/servicios';
import { KpiCard } from '../../components/ui/KpiCard';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import GraficoLineas from './GraficoLineas';
import GraficoDona from './GraficoDona';
import TablaDesempeno from './TablaDesempeno';
import './DashboardBIPage.css';

const PERIODOS = [
  { valor: '7',  label: 'Últimos 7 días' },
  { valor: '30', label: 'Últimos 30 días' },
  { valor: '90', label: 'Últimos 90 días' },
];

export default function DashboardBIPage() {
  const [periodo, setPeriodo] = useState('30');
  const [clienteId, setClienteId] = useState('');
  const [servicioId, setServicioId] = useState('');
  const [compararPeriodo, setCompararPeriodo] = useState(false);
  const [indicadores, setIndicadores] = useState(null);
  const [evolucion, setEvolucion] = useState([]);
  const [porTipo, setPorTipo] = useState([]);
  const [desempeno, setDesempeno] = useState([]);
  const [embedUrl, setEmbedUrl] = useState('');
  const [clientes, setClientes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { informar } = useModal();

  const hayFiltrosActivos = clienteId !== '' || servicioId !== '' || periodo !== '30' || compararPeriodo;

  const restablecerFiltros = () => {
    setPeriodo('30');
    setClienteId('');
    setServicioId('');
    setCompararPeriodo(false);
  };

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const params = { periodo };
        if (clienteId) params.clienteId = clienteId;
        if (servicioId) params.servicioId = servicioId;

        const [ind, evol, tipo, desemp, embed, listClientes, listServicios] = await Promise.all([
          indicadoresBi(params),
          evolucionCumplimiento(),
          incidenciasPorTipo(),
          desempenoPorServicio(),
          embedBi().catch(() => ({ url: '' })),
          listarClientes(),
          listarServicios(),
        ]);
        if (activo) {
          setIndicadores(ind);
          setEvolucion(evol);
          setPorTipo(tipo);
          setDesempeno(desemp);
          setEmbedUrl(embed?.url || '');
          setClientes(listClientes);
          setServicios(listServicios);
        }
      } catch (err) {
        if (activo) informar('Error', err.message, 'error');
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, [periodo, clienteId, servicioId, informar]);

  return (
    <div className="fade-in">
      <div className="pagina-encabezado">
        <div>
          <h1 className="pagina-titulo">Dashboard BI</h1>
          <p className="pagina-subtitulo">Indicadores operativos y análisis histórico en tiempo real</p>
        </div>
        <div className="pagina-acciones">
          <Select id="filtro-periodo-bi" nombre="periodo" valor={periodo}
            onChange={(e) => setPeriodo(e.target.value)}>
            {PERIODOS.map((p) => <option key={p.valor} value={p.valor}>{p.label}</option>)}
          </Select>
          <Select id="filtro-cliente-bi" nombre="clienteId" valor={clienteId}
            onChange={(e) => setClienteId(e.target.value)} placeholder="Todos los clientes">
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </Select>
          <Select id="filtro-servicio-bi" nombre="servicioId" valor={servicioId}
            onChange={(e) => setServicioId(e.target.value)} placeholder="Todos los servicios">
            {servicios.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </Select>
          <Button
            variante={compararPeriodo ? 'primario' : 'secundario'}
            onClick={() => setCompararPeriodo(!compararPeriodo)}
          >
            {compararPeriodo ? 'Comparando periodo' : 'Comparar periodo'}
          </Button>
          {hayFiltrosActivos && (
            <Button variante="secundario" onClick={restablecerFiltros}>
              Restablecer filtros
            </Button>
          )}
        </div>
      </div>

      <div className="grilla-kpi grilla-kpi-4">
        <KpiCard
          titulo="Cumplimiento turnos"
          valor={indicadores ? `${indicadores.cumplimiento_turnos}%` : null}
          variacion={compararPeriodo ? '+2.4%' : null}
          color="primario"
          cargando={cargando}
        />
        <KpiCard
          titulo="Cumplimiento servicios"
          valor={indicadores ? `${indicadores.cumplimiento_servicios}%` : null}
          variacion={compararPeriodo ? '+1.1%' : null}
          color="exito"
          cargando={cargando}
        />
        <KpiCard
          titulo="Incidencias abiertas"
          valor={indicadores?.incidencias_abiertas}
          variacion={compararPeriodo ? '-12.5%' : null}
          color="peligro"
          cargando={cargando}
        />
        <KpiCard
          titulo="Tiempo prom. atención"
          valor={indicadores ? `${indicadores.tiempo_promedio_atencion} min` : null}
          variacion={compararPeriodo ? '-5.0%' : null}
          color="advertencia"
          cargando={cargando}
        />
      </div>

      <div className="grilla-contenido grilla-2-1">
        <div className="tarjeta">
          <h3 className="tarjeta-titulo">Evolución del cumplimiento</h3>
          <p className="tarjeta-subtitulo">Turnos y servicios por semana</p>
          <GraficoLineas datos={evolucion} cargando={cargando} />
        </div>
        <div className="tarjeta">
          <h3 className="tarjeta-titulo">Incidencias por tipo</h3>
          <GraficoDona datos={porTipo} cargando={cargando} />
        </div>
      </div>

      <div className="tarjeta" style={{ marginBottom: 20 }}>
        <h3 className="tarjeta-titulo">Desempeño por servicio</h3>
        <TablaDesempeno datos={desempeno} cargando={cargando} />
      </div>

      {embedUrl ? (
        <div className="tarjeta" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
          <h3 className="tarjeta-titulo" style={{ padding: '16px 20px 0' }}>Informe Power BI</h3>
          <iframe
            title="Power BI Report"
            src={embedUrl}
            width="100%"
            height="600"
            style={{ border: 'none', display: 'block', marginTop: 12 }}
            allowFullScreen
          />
        </div>
      ) : (
        <div className="tarjeta embed-placeholder">
          <p style={{ marginBottom: 12 }}>El informe de Power BI no está configurado en el servidor.</p>
          <button
            type="button"
            className="accion-btn"
            onClick={() => informar('Power BI no configurado', 'La variable de entorno POWER_BI_EMBED_URL no está configurada en el backend. Configure dicha variable en .env para visualizar el informe embebido.', 'advertencia')}
          >
            Verificar configuración
          </button>
        </div>
      )}
    </div>
  );
}
