import { useState, useEffect, useCallback } from 'react';
import { useModal } from '../../context/ModalContext';
import { useAsync } from '../../hooks/useAsync';
import { listarReportes, historialReportes, generarReporte } from '../../api/reportes';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import './ReportesPage.css';

const PESTANAS = ['operativos', 'incidencias', 'multicriterio'];

export default function ReportesPage() {
  const [pestana, setPestana] = useState('operativos');
  const [reportes, setReportes] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { abrirModal, cerrarModal, informar } = useModal();
  const { cargando: cargandoExport, ejecutar } = useAsync();

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [lista, hist] = await Promise.all([listarReportes(), historialReportes()]);
      setReportes(lista);
      setHistorial(hist);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const reportesFiltrados = reportes.filter((r) => r.categoria === pestana);

  const abrirExportar = () => {
    let tipo = '', formato = '';
    abrirModal({
      tipo: 'formulario',
      titulo: 'Exportar reporte',
      contenido: (
        <div>
          <div className="form-grilla-1" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
            <Select id="exp-tipo" label="Tipo de reporte" nombre="tipo"
              valor={tipo} onChange={(e) => { tipo = e.target.value; }}
              placeholder="Seleccionar tipo" requerido>
              <option value="servicios">Servicios</option>
              <option value="turnos">Turnos</option>
              <option value="incidencias">Incidencias</option>
              <option value="bi">Dashboard BI</option>
              <option value="multicriterio">Multicriterio</option>
            </Select>
            <Select id="exp-formato" label="Formato" nombre="formato"
              valor={formato} onChange={(e) => { formato = e.target.value; }}
              placeholder="Seleccionar formato" requerido>
              <option value="xlsx">Excel (XLSX)</option>
              <option value="pdf">PDF</option>
            </Select>
          </div>
          <div className="form-pie">
            <Button variante="secundario" onClick={cerrarModal}>Cancelar</Button>
            <Button variante="primario" cargando={cargandoExport} onClick={async () => {
              await ejecutar(async () => {
                try {
                  const categoria = ['servicios', 'turnos'].includes(tipo) ? 'operativos'
                    : tipo === 'incidencias' ? 'incidencias' : 'multicriterio';
                  await generarReporte({ tipo, categoria, formato });
                  cerrarModal();
                  await cargar();
                  informar('Reporte generado', 'El reporte fue generado correctamente', 'exito');
                } catch (err) { informar('Error', err.message, 'error'); }
              });
            }}>Generar</Button>
          </div>
        </div>
      ),
    });
  };

  return (
    <div className="fade-in">
      <div className="pagina-encabezado">
        <div>
          <h1 className="pagina-titulo">Reportes</h1>
          <p className="pagina-subtitulo">Generación y descarga de reportes</p>
        </div>
        <Button variante="primario" onClick={abrirExportar}>+ Exportar</Button>
      </div>

      <div className="grilla-contenido grilla-2-1">
        <div className="tarjeta">
          <div className="reportes-pestanas">
            {PESTANAS.map((p) => (
              <button key={p} className={`reportes-pestana ${pestana === p ? 'reportes-pestana-activa' : ''}`}
                onClick={() => setPestana(p)}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {cargando ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-texto-tenue)' }}>Cargando...</div>
          ) : reportesFiltrados.length === 0 ? (
            <p style={{ padding: 32, textAlign: 'center', color: 'var(--color-texto-tenue)', fontSize: 'var(--tam-sm)' }}>
              Sin reportes en esta categoría
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              {reportesFiltrados.map((r) => (
                <div key={r.id} className="reporte-item">
                  <div>
                    <p className="reporte-nombre">{r.tipo} — {r.formato.toUpperCase()}</p>
                    <p className="reporte-fecha">{new Date(r.ultima_actualizacion).toLocaleString('es-PE')}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Badge valor={r.estado} />
                    <button className="accion-btn">⬇ Descargar</button>
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
                  <p style={{ fontSize: 'var(--tam-sm)', fontWeight: 600 }}>{h.tipo}</p>
                  <p style={{ fontSize: 'var(--tam-xs)', color: 'var(--color-texto-tenue)' }}>{h.generado_por} · {new Date(h.creado_en).toLocaleString('es-PE')}</p>
                </div>
                <Badge valor={h.estado} />
              </div>
            ))}
            {historial.length === 0 && <p style={{ fontSize: 'var(--tam-sm)', color: 'var(--color-texto-tenue)' }}>Sin historial</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
