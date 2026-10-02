import { useState, useEffect, useCallback } from 'react';
import { useModal } from '../../hooks/useModal';
import { useAsync } from '../../hooks/useAsync';
import { listarReportes, historialReportes, generarReporte, descargarReporte } from '../../api/reportes';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Icono } from '../../components/ui/Icono';
import { formatearFechaHora, obtenerTimestampDescarga } from '../../utils/fechas';
import FormExportar from './FormExportar';
import './ReportesPage.css';

const PESTANAS = ['operativos', 'incidencias', 'multicriterio'];

export default function ReportesPage() {
  const [pestana, setPestana] = useState('operativos');
  const [busqueda, setBusqueda] = useState('');
  const [reportes, setReportes] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { abrirModal, cerrarModal, informar } = useModal();
  const { cargando: cargandoExport, ejecutar } = useAsync();

  const cargar = useCallback(async () => {
    try {
      const [lista, hist] = await Promise.all([listarReportes(), historialReportes()]);
      setReportes(lista || []);
      setHistorial(hist || []);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const reportesFiltrados = (reportes || []).filter((r) => {
    const coincideCategoria = r.categoria === pestana;
    const coincideBusqueda = busqueda.trim()
      ? r.tipo.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.formato.toLowerCase().includes(busqueda.toLowerCase())
      : true;
    return coincideCategoria && coincideBusqueda;
  });

  const abrirExportar = () => {
    abrirModal({
      tipo: 'formulario',
      titulo: 'Exportar reporte',
      contenido: (
        <FormExportar
          onGuardar={async (datos) => {
            await ejecutar(async () => {
              try {
                await generarReporte(datos);
                cerrarModal();
                await cargar();
                informar('Reporte generado', 'El reporte fue generado correctamente y se encuentra disponible para su descarga', 'exito');
              } catch (err) {
                informar('Error', err.message, 'error');
              }
            });
          }}
          onCancelar={cerrarModal}
          cargando={cargandoExport}
        />
      ),
    });
  };

  const manejarDescargar = async (id, nombre, formato) => {
    await ejecutar(async () => {
      try {
        const timestamp = obtenerTimestampDescarga();
        const nombreSugerido = `reporte_${nombre}_${timestamp}.${formato}`;
        const nombreFinal = await descargarReporte(id, nombreSugerido);
        informar('Descarga completada', `El reporte "${nombreFinal || nombreSugerido}" se ha descargado exitosamente.`, 'exito');
      } catch (err) {
        informar('Error', err.message, 'error');
      }
    });
  };

  return (
    <div className="fade-in">
      <div className="pagina-encabezado">
        <div>
          <h1 className="pagina-titulo">Reportes</h1>
          <p className="pagina-subtitulo">Generación y descarga de reportes del sistema</p>
        </div>
        <Button variante="primario" onClick={abrirExportar}>+ Exportar</Button>
      </div>

      <div className="grilla-contenido grilla-2-1">
        <div className="tarjeta">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <div className="reportes-pestanas" style={{ marginBottom: 0 }}>
              {PESTANAS.map((p) => (
                <button
                  key={p}
                  className={`reportes-pestana ${pestana === p ? 'reportes-pestana-activa' : ''}`}
                  onClick={() => setPestana(p)}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <div style={{ width: 220 }}>
              <Input
                id="buscar-reportes"
                nombre="busqueda"
                placeholder="Buscar reporte..."
                valor={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          {cargando ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-texto-tenue)' }}>Cargando reportes...</div>
          ) : reportesFiltrados.length === 0 ? (
            <p style={{ padding: 32, textAlign: 'center', color: 'var(--color-texto-tenue)', fontSize: 'var(--tam-sm)' }}>
              Sin reportes disponibles en esta categoría
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              {reportesFiltrados.map((r) => (
                <div key={r.id} className="reporte-item">
                  <div>
                    <p className="reporte-nombre" style={{ textTransform: 'capitalize' }}>
                      {r.tipo} — {r.formato.toUpperCase()}
                    </p>
                    <p className="reporte-fecha">{formatearFechaHora(r.ultima_actualizacion)}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Badge valor={r.estado} />
                    <button
                      className="accion-btn"
                      onClick={() => manejarDescargar(r.id, r.tipo, r.formato)}
                      title="Descargar archivo"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Icono nombre="descargar" tamano={14} /> Descargar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="tarjeta">
          <h3 className="tarjeta-titulo">Historial reciente</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            {historial.map((h, i) => (
              <div key={i} className="historial-item">
                <div>
                  <p style={{ fontSize: 'var(--tam-sm)', fontWeight: 600, textTransform: 'capitalize' }}>{h.tipo}</p>
                  <p style={{ fontSize: 'var(--tam-xs)', color: 'var(--color-texto-tenue)' }}>
                    {h.generado_por} · {formatearFechaHora(h.creado_en)}
                  </p>
                </div>
                <Badge valor={h.estado} />
              </div>
            ))}
            {historial.length === 0 && (
              <p style={{ fontSize: 'var(--tam-sm)', color: 'var(--color-texto-tenue)' }}>Sin historial registrado</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
