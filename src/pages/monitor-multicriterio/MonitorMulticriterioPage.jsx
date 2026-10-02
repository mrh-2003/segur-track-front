import { useState, useEffect, useCallback } from 'react';
import { useModal } from '../../context/ModalContext';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import {
  listarCriterios, actualizarPesosCriterios,
  evaluarServicio, resultadoMulticriterio, detalleServicioMcda,
} from '../../api/multicriterio';
import { listarServicios } from '../../api/servicios';
import { KpiCard } from '../../components/ui/KpiCard';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import './MonitorMulticriterioPage.css';

export default function MonitorMulticriterioPage() {
  const { usuario } = useAuth();
  const [criterios, setCriterios] = useState([]);
  const [resultado, setResultado] = useState({ resumen: null, tabla: [] });
  const [servicios, setServicios] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [servicioSelId, setServicioSelId] = useState('');
  const [cargando, setCargando] = useState(true);
  const { abrirModal, cerrarModal, informar } = useModal();
  const { cargando: cargandoAccion, ejecutar } = useAsync();

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [c, r, s] = await Promise.all([
        listarCriterios(),
        resultadoMulticriterio(),
        listarServicios(),
      ]);
      setCriterios(c);
      setResultado(r);
      setServicios(s);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const manejarEvaluar = async () => {
    if (!servicioSelId) { informar('Aviso', 'Seleccione un servicio para evaluar', 'advertencia'); return; }
    await ejecutar(async () => {
      try {
        await evaluarServicio(parseInt(servicioSelId, 10));
        await cargar();
        informar('Evaluación completada', 'El servicio fue evaluado correctamente', 'exito');
      } catch (err) { informar('Error', err.message, 'error'); }
    });
  };

  const manejarVerDetalle = async (id) => {
    try {
      const d = await detalleServicioMcda(id);
      setDetalle(d);
    } catch (err) { informar('Error', err.message, 'error'); }
  };

  const abrirEditarPesos = () => {
    const pesos = criterios.map((c) => ({ ...c, nuevoPeso: c.peso }));
    abrirModal({
      tipo: 'formulario',
      titulo: 'Editar pesos de criterios',
      contenido: <FormPesos criterios={pesos} onGuardar={async (datos) => {
        await ejecutar(async () => {
          try {
            await actualizarPesosCriterios({ criterios: datos });
            cerrarModal();
            await cargar();
            informar('Pesos actualizados', 'Los pesos fueron actualizados correctamente', 'exito');
          } catch (err) { informar('Error', err.message, 'error'); }
        });
      }} onCancelar={cerrarModal} cargando={cargandoAccion} />,
    });
  };

  const columnas = [
    { llave: 'servicio',   titulo: 'Servicio' },
    { llave: 'evaluacion', titulo: 'Puntaje', render: (f) => `${f.evaluacion}%` },
    { llave: 'nivel',      titulo: 'Nivel', render: (f) => <Badge valor={f.nivel} /> },
    { llave: 'criterios_influyen', titulo: 'Criterios que influyen', render: (f) => (f.criterios_influyen || []).join(', ') || '—' },
    { llave: 'acciones',   titulo: '', render: (f) => <button className="accion-btn" onClick={() => manejarVerDetalle(f.id)}>Ver detalle</button> },
  ];

  return (
    <div className="fade-in">
      <div className="pagina-encabezado">
        <div>
          <h1 className="pagina-titulo">Monitor multicriterio</h1>
          <p className="pagina-subtitulo">Evaluación MCDA de servicios</p>
        </div>
        <div className="pagina-acciones">
          <Select id="sel-servicio-evaluar" nombre="servicioId" valor={servicioSelId}
            onChange={(e) => setServicioSelId(e.target.value)} placeholder="Seleccionar servicio">
            {servicios.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </Select>
          <Button variante="primario" cargando={cargandoAccion} onClick={manejarEvaluar}>Evaluar</Button>
          {usuario?.rol === 'administrador' && (
            <Button variante="secundario" onClick={abrirEditarPesos}>Editar pesos</Button>
          )}
        </div>
      </div>

      <div className="grilla-kpi grilla-kpi-4">
        <KpiCard titulo="Evaluados" valor={resultado.resumen?.evaluados} color="primario" cargando={cargando} />
        <KpiCard titulo="Alta atención" valor={resultado.resumen?.alta} color="peligro" cargando={cargando} />
        <KpiCard titulo="Media atención" valor={resultado.resumen?.media} color="advertencia" cargando={cargando} />
        <KpiCard titulo="Baja atención" valor={resultado.resumen?.baja} color="exito" cargando={cargando} />
      </div>

      <div className="grilla-contenido grilla-1-1">
        <div className="tarjeta">
          <h3 className="tarjeta-titulo">Criterios de evaluación</h3>
          <div className="criterios-lista">
            {criterios.map((c) => (
              <div key={c.id} className="criterio-item">
                <div className="criterio-info">
                  <span className="criterio-codigo">{c.codigo}</span>
                  <span className="criterio-nombre">{c.nombre}</span>
                </div>
                <div className="criterio-peso">
                  <div className="criterio-barra-contenedor">
                    <div className="criterio-barra" style={{ width: `${c.peso * 100}%` }} />
                  </div>
                  <span className="criterio-pct">{(c.peso * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {detalle && detalle.length > 0 && (
          <div className="tarjeta">
            <h3 className="tarjeta-titulo">Detalle del servicio</h3>
            <p className="tarjeta-subtitulo">Puntaje global: {detalle[0].puntaje_global}% — Nivel: <Badge valor={detalle[0].nivel} /></p>
            <div className="detalle-criterios">
              {detalle.map((d, i) => (
                <div key={i} className="detalle-criterio-item">
                  <div className="detalle-criterio-header">
                    <span className="detalle-criterio-nombre">{d.criterio}</span>
                    <span className={`detalle-criterio-pct ${d.puntaje_criterio < 60 ? 'pct-alerta' : 'pct-ok'}`}>
                      {d.puntaje_criterio}%
                    </span>
                  </div>
                  <div className="barra-detalle-contenedor">
                    <div className={`barra-detalle ${d.puntaje_criterio < 60 ? 'barra-alerta' : 'barra-ok'}`}
                      style={{ width: `${d.puntaje_criterio}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="tarjeta">
        <h3 className="tarjeta-titulo" style={{ marginBottom: 16 }}>Resultados por servicio</h3>
        <Table columnas={columnas} datos={resultado.tabla} cargando={cargando} vacio="Sin evaluaciones. Use el botón Evaluar para comenzar." />
      </div>
    </div>
  );
}

function FormPesos({ criterios: inicial, onGuardar, onCancelar, cargando }) {
  const [pesos, setPesos] = useState(inicial.map((c) => ({ id: c.id, nombre: c.nombre, peso: parseFloat(c.peso) })));
  const suma = pesos.reduce((s, p) => s + p.peso, 0);
  const valida = Math.abs(suma - 1) < 0.001;

  const actualizar = (id, valor) => {
    setPesos((prev) => prev.map((p) => p.id === id ? { ...p, peso: parseFloat(valor) || 0 } : p));
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {pesos.map((p) => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 'var(--tam-sm)' }}>{p.nombre}</span>
            <input
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={p.peso}
              onChange={(e) => actualizar(p.id, e.target.value)}
              style={{ width: 80, padding: '6px 8px', border: '1.5px solid var(--color-borde)', borderRadius: 'var(--radio-sm)', background: 'var(--color-superficie)', color: 'var(--color-texto-principal)' }}
            />
          </div>
        ))}
        <p style={{ fontSize: 'var(--tam-xs)', color: valida ? 'var(--color-exito)' : 'var(--color-peligro)', fontWeight: 600 }}>
          Suma actual: {suma.toFixed(3)} (debe ser 1.000)
        </p>
      </div>
      <div className="form-pie">
        <Button variante="secundario" onClick={onCancelar} disabled={cargando}>Cancelar</Button>
        <Button variante="primario" cargando={cargando} disabled={!valida} onClick={() => onGuardar(pesos.map(({ id, peso }) => ({ id, peso })))}>
          Guardar
        </Button>
      </div>
    </div>
  );
}
