import {BotonAccion} from '../../components/ui/BotonAccion';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../../hooks/useModal';
import { useAuth } from '../../hooks/useAuth';
import {
  resultadoMulticriterio,
  detalleServicioMcda,
  detalleAgenteMcda,
  evaluarServicio,
  actualizarPesosCriterios,
} from '../../api/multicriterio';
import { catalogosOperativos } from '../../api/operaciones';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import {
  Nivel,
  Anillo,
  IconoMonitor,
  MiniLinea,
  GraficoEvolucion,
} from './MonitorVisuals';
import { CORTOS, COLORES, porcentaje } from './monitor.presentacion';
import './MonitorMulticriterioPage.css';
import { KPIS, COLUMNAS } from './monitor.kpis';
const numero = (v) =>
  v === null || v === undefined ? '—' : Number(v).toFixed(1);
const NOMBRES_KPI = Object.fromEntries([0,1,2,3,4].map((i) => ['C0'+(i+1), KPIS.slice(i*2,i*2+2).map((k) => 'KPI '+k[0]+' · '+k[1])]));
const GLOSARIO = COLUMNAS;
function FilaKpi({ nombre, kpi, pendiente }) {
  if (!kpi || kpi.denominador === 0) {
    return (
      <article className="mv-calculo-kpi sin-datos">
        <span className="mv-calculo-kpi-nombre">{nombre}</span>
        <span className="mv-calculo-kpi-tasa">{pendiente ? 'Faltan datos' : 'Sin casos'}</span>
      </article>
    );
  }
  return (
    <article className="mv-calculo-kpi">
      <span className="mv-calculo-kpi-nombre">{nombre}</span>
      <span className="mv-calculo-kpi-fraccion">
        {kpi.numerador} / {kpi.denominador}
      </span>
      <span className="mv-calculo-kpi-tasa">{numero(kpi.tasa)} %</span>
    </article>
  );
}
function Calculo({ servicio, filtros }) {
  const criterios = servicio.criterios || [];
  const periodoInicio = filtros.inicio
    ? new Date(filtros.inicio).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })
    : 'Todo el histórico';
  const periodoFin = new Date(filtros.fin).toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
  return (
    <div className="mv-calculo">
      <div className="mv-calculo-encabezado">
        <h3>{servicio.agente?servicio.agente.nombre+' · ':''}{servicio.servicio}</h3>
        <span className="mv-calculo-puntaje">
          Criticidad: <strong>{numero(servicio.criticidad)}</strong> / 100
        </span>
        <p className="mv-calculo-periodo">
          {periodoInicio} al {periodoFin} · Turno: {filtros.turno}
        </p>
      </div>
      <div className="mv-calculo-tarjetas" aria-label="Cálculos por criterio">
        {criterios.map(c=><section className="mv-calculo-tarjeta" key={c.codigo}>
          <header><div><span className="mv-calculo-codigo">{c.codigo}</span><h4>{c.nombre}</h4></div><span className="mv-calculo-estado">{c.estado}</span></header>
          <div className="mv-calculo-par"><FilaKpi nombre={NOMBRES_KPI[c.codigo]?.[0]} kpi={c.kpi01} pendiente={c.faltantes>0}/><FilaKpi nombre={NOMBRES_KPI[c.codigo]?.[1]} kpi={c.kpi02} pendiente={c.faltantes>0}/></div>
          <dl className="mv-calculo-metricas">{[['Cumplimiento',c.tasa===null?'—':numero(c.tasa)+' %'],['Umbral',c.umbral+' %'],['Riesgo',numero(c.riesgo)],['Peso',numero(c.peso*100)+' %'],['Aporte',numero(c.aporte)+' pts']].map(([titulo,valor])=><div key={titulo}><dt>{titulo}</dt><dd>{valor}</dd></div>)}</dl>
          {c.faltantes>0&&<p className="mv-calculo-incompleto">{c.faltantes} datos pendientes. {c.observaciones}</p>}
        </section>)}
      </div>
      <div className="mv-calculo-formulas">
        <p>
          <strong>Puntaje del criterio</strong> = promedio de sus KPIs disponibles
        </p>
        <p>
          <strong>Riesgo</strong> = mín(100, (100 − Puntaje) ÷ Umbral × 100)
        </p>
        <p>
          <strong>Aporte</strong> = Riesgo × Peso
        </p>
        <p>
          <strong>Criticidad {servicio.agente?'del agente':'del servicio'}</strong> = C01.aporte + C02.aporte + C03.aporte + C04.aporte + C05.aporte
        </p>
      </div>
      <div className="mv-calculo-suma">
        {criterios.map((c, i) => (
          <span key={c.codigo}>
            {i > 0 && <span className="mv-calculo-op">+</span>}
            <span title={c.nombre}>{numero(c.aporte)}</span>
          </span>
        ))}
        <span className="mv-calculo-op">=</span>
        <strong>{numero(servicio.criticidad)}</strong>
      </div>
      {!servicio.completo && (
        <p className="mv-calculo-incompleto" role="alert">
          Evaluación incompleta: revise los datos faltantes. No se redistribuyen los pesos.
        </p>
      )}
      <p className="mv-calculo-nota">
        Si algún KPI no tiene denominador (sin casos), su tasa se omite del promedio. Si ambos están sin casos y el inventario está confirmado, el criterio no aporta riesgo. Si faltan datos, la criticidad queda pendiente.
      </p>
      <details className="mv-calculo-glosario">
        <summary>Datos y fórmulas de los diez KPI</summary>
        <p>El periodo y la franja seleccionan los turnos por inicio programado y las incidencias por fecha de registro. Las obligaciones pertenecen a esos turnos. Los eventos posteriores al corte se excluyen. Todas las fechas se interpretan en Lima.</p>
        {KPIS.map(([id,nombre,n,d,nd,dd]) => <article key={id}>
          <h4>KPI {id} · {nombre}</h4>
          <p><b>Fórmula:</b> ({n} ÷ {d}) × 100</p>
          <p><b>Numerador — {n}:</b> {nd}</p>
          <p><b>Denominador — {d}:</b> {dd}</p>
        </article>)}
        <p>Para actividades, rondas y reportes, el plan confirmado del servicio genera y confirma el inventario del turno; la ejecución se registra en Turnos. La ausencia de registros sin esta confirmación significa información faltante.</p>
      </details>
      <details className="mv-calculo-glosario">
        <summary>Significado de las métricas</summary>
        <dl>
          {GLOSARIO.map(([t, d]) => (
            <div key={t}>
              <dt>{t}</dt>
              <dd>{d}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}
function Configuracion({ criterios, onGuardar }) {
  const [items, setItems] = useState(
      criterios.map((c) => ({
        ...c,
        peso: Number(c.peso),
        umbral: Number(c.umbral),
      }))
    ),
    [error, setError] = useState(''),
    [ocupado, setOcupado] = useState(false);
  const suma = items.reduce((n, c) => n + c.peso, 0);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setOcupado(true);
        try {
          await onGuardar(
            items.map((c) => ({ id: c.codigo, peso: c.peso, umbral: c.umbral }))
          );
        } catch (err) {
          setError(err.message);
        } finally {
          setOcupado(false);
        }
      }}
    >
      {items.map((c, i) => (
        <div key={c.codigo} className="mc-config">
          <strong>{c.nombre}</strong>
          <label>
            Peso (%)
            <input
              className="campo-input"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={Math.round(c.peso * 1000) / 10}
              onChange={(e) =>
                setItems(
                  items.map((x, j) =>
                    j === i ? { ...x, peso: Number(e.target.value) / 100 } : x
                  )
                )
              }
            />
          </label>
          <label>
            Umbral (%)
            <input
              className="campo-input"
              type="number"
              min="1"
              max="100"
              value={c.umbral}
              onChange={(e) =>
                setItems(
                  items.map((x, j) =>
                    j === i ? { ...x, umbral: Number(e.target.value) } : x
                  )
                )
              }
            />
          </label>
        </div>
      ))}
      <p>
        Suma: {numero(suma * 100)} %. Los cambios se aplican a nuevos cálculos;
        las evaluaciones guardadas mantienen su configuración.
      </p>
      {error && <p role="alert">{error}</p>}
      <Button tipo="submit" disabled={ocupado || Math.abs(suma - 1) > 0.000001} motivoDeshabilitado={ocupado ? 'Espere a que termine el guardado.' : 'Ajuste los pesos de los criterios para que sumen exactamente el 100%. Suma actual: '+(suma*100).toFixed(1)+'%.'}>
        Guardar configuración
      </Button>
    </form>
  );
}
export function DetallePrioridad({servicioId,filtros,onAbrirIncidencia}){
  const [base,setBase]=useState(null),[detalle,setDetalle]=useState(null),[agenteId,setAgenteId]=useState(null),[formulas,setFormulas]=useState(false),[error,setError]=useState(''),[cargando,setCargando]=useState(true);
  useEffect(()=>{let activo=true;Promise.resolve().then(()=>{if(activo){setCargando(true);setError('');}return agenteId?detalleAgenteMcda(servicioId,agenteId,filtros):detalleServicioMcda(servicioId,filtros);}).then(r=>{if(activo){setDetalle(r);if(!agenteId)setBase(r);}}).catch(e=>{if(activo)setError(e.message);}).finally(()=>{if(activo)setCargando(false);});return()=>{activo=false;};},[servicioId,agenteId,filtros]);
  return <div className="mv-page mv-detalle-modal">
    {error&&<p role="alert">{error}</p>}
    {base&&<section><h3>Agentes encargados del servicio</h3><p>Seleccione un agente para analizar sus turnos, obligaciones e incidencias. Se muestran también agentes con operación en el periodo que ya no están asignados.</p><div className="mv-agentes">
      <button type="button" aria-pressed={!agenteId} onClick={()=>{setAgenteId(null);setFormulas(false);}}>Todo el servicio</button>
      {base.agentes.map(p=><button type="button" key={p.id} aria-pressed={agenteId===p.id} onClick={()=>{setAgenteId(p.id);setFormulas(false);}}><b>{p.nombre}</b><small>{p.turnos} turnos · {p.incidencias} incidencias · {p.resueltas} resueltas · {p.asignado_actual?'Asignado actualmente':'Histórico'}{p.estado!=='activo'?' · '+p.estado:''}</small></button>)}
    </div>{!base.agentes.length&&<p>No hay agentes asignados ni con operación registrada en este periodo.</p>}</section>}
    {cargando?<p role="status">Cargando análisis…</p>:detalle&&<>
      <header className="mv-panel-heading"><div><span className="mv-eyebrow">{detalle.agente?'ANÁLISIS DEL AGENTE':'DETALLE DEL SERVICIO'}</span><h2>{detalle.agente?.nombre||detalle.servicio}</h2><p>{detalle.cliente} · {detalle.turnos} turnos analizados</p>{detalle.atribucion&&<p>{detalle.atribucion}</p>}</div><Nivel nivel={detalle.nivel}/></header>
      <Button tipo="button" variante="secundario" onClick={()=>setFormulas(!formulas)}>{formulas?'Volver a los criterios':'Ver cálculos y fórmulas'}</Button>
      {detalle.incidencias_resumen&&<><div className="mv-incidencias-balance"><span><b>{detalle.incidencias_resumen.total}</b> incidencias</span><span><b>{detalle.incidencias_resumen.resueltas}</b> resueltas</span><span><b>{detalle.incidencias_resumen.en_proceso}</b> en proceso</span><span><b>{detalle.incidencias_resumen.por_atender}</b> por atender</span></div>{!detalle.agente&&detalle.incidencias_resumen.sin_operador>0&&<p className="mv-calculo-nota">{detalle.incidencias_resumen.sin_operador} incidencias están asignadas a supervisión o sin un agente identificado. Forman parte del servicio y no se atribuyen a un operador hasta definir su responsable.</p>}</>}
      {formulas?<Calculo servicio={detalle} filtros={detalle.filtros}/>:<div className="mv-detalle-criterios">{detalle.criterios.map((c,n)=><article key={c.codigo}><span>{CORTOS[n]}</span><strong style={{color:COLORES[n]}}>{c.tasa===null?c.estado:porcentaje(c.tasa)}</strong><p>{NOMBRES_KPI[c.codigo]?.[0]}: {c.kpi01.numerador}/{c.kpi01.denominador}</p><p>{NOMBRES_KPI[c.codigo]?.[1]}: {c.kpi02.numerador}/{c.kpi02.denominador}</p><small>{numero(c.aporte)} puntos de criticidad</small>{c.observaciones&&<p>{c.observaciones}</p>}</article>)}</div>}
      {!!detalle.criticas.length&&<section><h3>Incidencias pendientes {detalle.agente?'a cargo del agente':'del servicio'}</h3>{detalle.criticas.map(i=><article className="mv-incidencia-agente" key={i.id}><b>{i.codigo} · {i.tipo}</b><p>{i.descripcion}</p><small>{i.responsable} · {i.estado}</small><div className="mv-incidencia-enlace"><Button tipo="button" variante="secundario" onClick={()=>onAbrirIncidencia(i)} aria-label={'Abrir incidencia '+i.codigo}>Abrir incidencia</Button></div></article>)}</section>}
    </>}
  </div>;
}
export default function MonitorMulticriterioPage() {
  const [f, setF] = useState({ periodo: '30', servicios: '', turno: 'ambos' });
  const [tab, setTab] = useState(0),
    [data, setData] = useState(null),
    [servicios, setServicios] = useState([]);
  const [detalle, setDetalle] = useState(null),
    [nivel, setNivel] = useState(''),
    [error, setError] = useState('');
  const [cargando, setCargando] = useState(true),
    [guardando, setGuardando] = useState(false);
  const { abrirModal, cerrarModal, informar } = useModal(),
    { usuario } = useAuth(),
    navigate = useNavigate();
  const cargar = useCallback(async () => {
    const r = await resultadoMulticriterio(f);
    setData(r);
    setDetalle(null);
  }, [f]);
  useEffect(() => {
    let activo = true;
    Promise.resolve()
      .then(() => {
        if (activo) setCargando(true);
        return resultadoMulticriterio(f);
      })
      .then((r) => {
        if (activo) {
          setData(r);
          setDetalle(null);
          setError('');
        }
      })
      .catch((e) => {
        if (activo) setError(e.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [f]);
  useEffect(() => {
    catalogosOperativos()
      .then((c) => setServicios(c.servicios))
      .catch((e) => setError(e.message));
  }, []);
  const tabla = data?.tabla || [],
    criterios = data?.criterios || [];
  const totales = criterios.map((c, i) => {
    const agregar = (campo) => {
      const n = tabla.reduce((a,s) => a + s.criterios[i][campo].numerador,0);
      const d = tabla.reduce((a,s) => a + s.criterios[i][campo].denominador,0);
      return {n,d,tasa:d ? n/d*100 : null};
    };
    const primero=agregar('kpi01'), segundo=agregar('kpi02');
    const tasas=[primero.tasa,segundo.tasa].filter((v) => v!==null);
    const faltan=tabla.some((s) => s.criterios[i].faltantes>0);
    return {...c,tasa:faltan || !tasas.length ? null : tasas.reduce((a,v)=>a+v,0)/tasas.length,n:primero.n+segundo.n,d:primero.d+segundo.d,primero,segundo};
  });
  const niveles = ['alta', 'media', 'baja'].map((n) => ({
    nivel: n,
    cantidad: tabla.filter((s) => s.nivel === n).length,
  }));
  const filtrados = tabla.filter((s) => !nivel || s.nivel === nivel),
    cumplimiento = totales[0]?.tasa,
    cobertura = totales[2]?.tasa;
  const totalTurnos = tabla.reduce((n, s) => n + s.turnos, 0);
  const fechaCorte = data
    ? new Date(data.filtros.fin).toLocaleString('es-PE', {
        timeZone: 'America/Lima',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Actualizando';
  const calculo = (s) =>
    abrirModal({
      tipo: 'formulario',
      tamano: 'xl',
      titulo: 'Ver cálculo · evaluación multicriterio',
      contenido: <Calculo servicio={s} filtros={data.filtros} />,
    });
  const verDetalle = (s) => {
    setDetalle(s);
    abrirModal({tipo:'formulario',tamano:'xl',titulo:'Detalle del servicio · '+s.servicio,
      contenido:<DetallePrioridad servicioId={s.id} filtros={f} onAbrirIncidencia={i=>{
        cerrarModal();
        navigate('/incidencias?incidencia='+i.id,{state:{servicioId:s.id,incidenciaCodigo:i.codigo}});
      }}/>});
  };
  const ayuda = () =>
    abrirModal({
      tipo: 'formulario',
      tamano: 'lg',
      titulo: 'Tu guía del monitor',
      contenido: (
        <div className="mv-guia">
          <p>De la operación al seguimiento, en cuatro pasos.</p>
          {[
            [
              'Filtra tu operación',
              'Elige periodo, servicios y franja. Los filtros se mantienen al cambiar de vista.',
            ],
            [
              'Identifica prioridades',
              'El puntaje de criticidad va de 0 a 100: cuanto más alto, mayor necesidad de atención. Las tasas de cumplimiento funcionan al revés: cuanto más altas, mejor.',
            ],
            [
              'Revisa la explicación',
              'Abre un servicio y pulsa Ver cálculo para consultar cantidades, umbrales, pesos y aportes.',
            ],
            [
              'Actúa y sigue la evolución',
              'Consulta la incidencia, coordina con su responsable y revisa los indicadores en Evolución. Guardar evaluación conserva una instantánea.',
            ],
          ].map(([t, d], i) => (
            <article key={t}>
              <b>{i + 1}</b>
              <div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            </article>
          ))}
        </div>
      ),
    });
  const guardar = async () => {
    setGuardando(true);
    try {
      setData(await evaluarServicio(null, f));
      informar(
        'Evaluación guardada',
          'Se conservó una instantánea por servicio con filtros, criterios, pesos, tasas y puntaje para auditoría. Las consultas en vivo seguirán mostrando los datos actuales.',
        'exito'
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };
  const tarjetas = [
    {
      titulo: 'Actividades y rondas',
      valor: porcentaje(cobertura),
      nota: `Actividades: ${totales[2]?.primero.n ?? 0}/${totales[2]?.primero.d ?? 0} · Rondas: ${totales[2]?.segundo.n ?? 0}/${totales[2]?.segundo.d ?? 0}`,
      icono: 'escudo',
      tono: 'verde',
      tendencia: (data?.evolucion || []).map((d) => d.criterios[2].tasa),
    },
    {
      titulo: 'Servicios prioritarios',
      valor: data?.resumen.alta ?? 0,
      nota: 'Requieren atención del supervisor',
      icono: 'alerta',
      tono: 'coral',
    },
    {
      titulo: 'Incidencias pendientes',
      valor: data?.resumen.pendientes ?? 0,
      nota: 'Abiertas y en atención en el periodo',
      icono: 'reloj',
      tono: 'ambar',
    },
    {
      titulo: 'Turnos sin cubrir',
      valor: data?.resumen.sin_cubrir ?? 0,
      nota: 'Plazas vacantes o sin presencia',
      icono: 'personal',
      tono: 'violeta',
    },
  ];
  const incidentes = (lista, limite = 5) =>
    lista.slice(0, limite).map((i) => (
      <button
        type="button"
        className="mv-incidente"
        key={i.id}
        onClick={() =>
          navigate('/incidencias', { state: { servicioId: i.servicio_id } })
        }
      >
        <span className={`mv-incidente-icono ${i.prioridad}`}>
          <IconoMonitor nombre="alerta" tamano={17} />
        </span>
        <span className="mv-incidente-info">
          <span>
            <b>{i.codigo}</b>
            <small className={`mv-prioridad-texto ${i.prioridad}`}>
              {i.prioridad}
            </small>
          </span>
          <strong>{i.tipo}</strong>
          <small>{i.servicio}</small>
          <small>{i.responsable?.trim() || 'Responsable por asignar'}</small>
        </span>
        <IconoMonitor nombre="flecha" tamano={15} />
      </button>
    ));
  return (
    <div className="mv-page">
      <header className="mv-hero">
        <div className="mv-hero-copy">
          <div className="mv-hero-eyebrow">
            <span className="mv-live-dot" />
            CENTRO DE OPERACIONES
            {data?.demo && <span className="mv-demo-pill">DEMO</span>}
          </div>
          <h1>
            Monitor multicriterio
            <span>Una visión completa de tu operación.</span>
          </h1>
          <p>
            Detecta prioridades, entiende sus causas y acompaña cada decisión
            con datos.
          </p>
          <div className="mv-hero-meta">
            <span>
              <IconoMonitor nombre="escudo" tamano={15} />
              {data?.resumen.evaluados ?? 0} servicios evaluados
            </span>
            <span>
              <IconoMonitor nombre="reloj" tamano={15} />
              {fechaCorte} · Lima
            </span>
          </div>
        </div>
        <div className="mv-hero-balance">
          <Anillo valor={cumplimiento} tamano={106}>
            <strong>{porcentaje(cumplimiento)}</strong>
            <small>CUMPLIMIENTO</small>
          </Anillo>
          <div>
            <span>Desempeño del personal</span>
            <strong>
              {totalTurnos.toLocaleString('es-PE')}
              <small> turnos analizados</small>
            </strong>
            <p>Cinco criterios. Un mismo panorama.</p>
          </div>
        </div>
        <button type="button" className="mv-ayuda" onClick={ayuda}>
          <IconoMonitor nombre="ayuda" tamano={17} />
          Cómo usarlo
        </button>
        <span className="mv-hero-decor" aria-hidden="true" />
      </header>
      <section className="mv-filtros" aria-label="Filtros del monitor">
        <div className="mv-periodo">
          <label>Periodo de análisis</label>
          <div className="mv-segmentos">
            {['3', '7', '30', 'todos'].map((v) => (
              <button
                type="button"
                key={v}
                className={f.periodo === v ? 'activo' : ''}
                onClick={() => setF({ ...f, periodo: v })}
              >
                {v === 'todos' ? 'Todo' : `${v} días`}
              </button>
            ))}
          </div>
        </div>
        <div className="mv-selector-servicios">
          <label>Servicios</label>
          <details>
            <summary>
              <IconoMonitor nombre="matriz" tamano={16} />
              {f.servicios
                ? `${f.servicios.split(',').length} seleccionados`
                : 'Todos los servicios'}
              <span>⌄</span>
            </summary>
            <div>
              {servicios.map((s) => (
                <label key={s.id}>
                  <input
                    type="checkbox"
                    checked={f.servicios.split(',').includes(String(s.id))}
                    onChange={(e) => {
                      const ids = new Set(
                        f.servicios.split(',').filter(Boolean)
                      );
                      if (e.target.checked) ids.add(String(s.id));
                      else ids.delete(String(s.id));
                      setF({ ...f, servicios: [...ids].join(',') });
                    }}
                  />
                  {s.nombre}
                </label>
              ))}
            </div>
          </details>
        </div>
        <div className="mv-franjas">
          <label>Franja del turno</label>
          <div className="mv-segmentos">
            {[
              ['ambos', 'Ambos', 'reloj'],
              ['diurno', 'Día', 'sol'],
              ['nocturno', 'Noche', 'luna'],
            ].map(([v, n, icono]) => (
              <button
                type="button"
                key={v}
                className={f.turno === v ? 'activo' : ''}
                onClick={() => setF({ ...f, turno: v })}
              >
                <IconoMonitor nombre={icono} tamano={14} />
                {n}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="mv-reset"
          onClick={() => setF({ periodo: '30', servicios: '', turno: 'ambos' })}
        >
          Restablecer
        </button>
      </section>
      {error && (
        <p className="mv-error" role="alert">
          {error}
        </p>
      )}
      <div className="mv-kpis" aria-busy={cargando}>
        {tarjetas.map((k) => (
          <article className={`mv-kpi ${k.tono}`} key={k.titulo}>
            <div className="mv-kpi-top">
              <span>{k.titulo}</span>
              <i>
                <IconoMonitor nombre={k.icono} tamano={19} />
              </i>
            </div>
            <div className="mv-kpi-value">
              <strong>{cargando ? '…' : k.valor}</strong>
              {k.tendencia && <MiniLinea valores={k.tendencia} />}
            </div>
            <p>
              <span className="mv-kpi-dot" />
              {k.nota}
            </p>
          </article>
        ))}
      </div>
      <div className="mv-indicadores" aria-label="Los cinco indicadores">
        {totales.map((c, i) => (
          <div key={c.codigo}>
            <span>
              <i style={{ background: COLORES[i] }} />
              {CORTOS[i]}
            </span>
            <strong>{porcentaje(c.tasa)}</strong>
            <div className="mv-mini-progress">
              <i style={{ width: `${c.tasa ?? 0}%`, background: COLORES[i] }} />
            </div>
          </div>
        ))}
      </div>
      <nav className="mv-tabs" role="tablist" aria-label="Vistas del monitor">
        {[
          ['Prioridades', 'escudo'],
          ['Matriz multicriterio', 'matriz'],
          ['Evolución', 'tendencia'],
          ['Método y validación', 'metodo'],
        ].map(([n, icono], i) => (
          <button
            type="button"
            key={n}
            role="tab"
            aria-selected={tab === i}
            onClick={() => setTab(i)}
            className={tab === i ? 'activo' : ''}
          >
            <IconoMonitor nombre={icono} tamano={17} />
            {n}
            {i === 0 && !!data?.resumen.alta && (
              <span>{data.resumen.alta}</span>
            )}
          </button>
        ))}
      </nav>
      {tab === 0 && (
        <>
          <div className="mv-prioridades-grid">
            <section className="mv-panel mv-ranking">
              <div className="mv-panel-heading">
                <div>
                  <span className="mv-eyebrow">DÓNDE PONER EL FOCO</span>
                  <h2>Prioridades por servicio</h2>
                  <p>Ordenados de mayor a menor necesidad de atención.</p>
                </div>
                <select
                  className="mv-select-nivel"
                  aria-label="Filtrar nivel de atención"
                  value={nivel}
                  onChange={(e) => setNivel(e.target.value)}
                >
                  <option value="">Todos los niveles</option>
                  <option value="alta">Prioridad alta</option>
                  <option value="media">En seguimiento</option>
                  <option value="baja">Bajo control</option>
                </select>
              </div>
              <div className="mv-ranking-labels">
                <span>SERVICIO / CLIENTE</span>
                <span>CRITICIDAD</span>
                <span>ATENCIÓN</span>
                <span />
              </div>
              {filtrados.map((s, i) => (
                <article
                  className={`mv-servicio ${detalle?.id === s.id ? 'seleccionado' : ''}`}
                  key={s.id}
                >
                  <span className="mv-rank-num">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="mv-servicio-nombre">
                    <strong>{s.servicio}</strong>
                    <small>
                      {s.cliente} <i /> {s.turnos} turnos
                    </small>
                    <div className="mv-cinco-puntos">
                      {s.criterios.map((c, j) => (
                        <span
                          key={c.codigo}
                          title={`${CORTOS[j]}: ${porcentaje(c.tasa)}`}
                          style={{
                            background:
                              c.riesgo >= 60
                                ? '#f17983'
                                : c.riesgo >= 30
                                  ? '#edb65a'
                                  : '#22b69a',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className={`mv-score ${s.nivel}`}>
                    <strong>{numero(s.puntaje)}</strong>
                    <span>/ 100</span>
                    <div>
                      <i style={{ width: `${s.puntaje ?? 0}%` }} />
                    </div>
                  </div>
                  <Nivel nivel={s.nivel} />
                  <button
                    type="button"
                    className="mv-ver-detalle"
                    aria-label={`Ver detalle de ${s.servicio}`}
                    onClick={() => verDetalle(s)}
                  >
                    <IconoMonitor nombre="flecha" tamano={18} />
                  </button>
                </article>
              ))}
              {!cargando && !filtrados.length && (
                <p className="mv-vacio">
                  No hay servicios en este nivel con los filtros seleccionados.
                </p>
              )}
            </section>
            <aside className="mv-aside">
              <section className="mv-panel mv-distribucion">
                <div className="mv-panel-heading">
                  <div>
                    <span className="mv-eyebrow">PANORAMA GENERAL</span>
                    <h2>Distribución del riesgo</h2>
                  </div>
                </div>
                <div
                  className="mv-donut"
                  style={{
                    background: `conic-gradient(#f17983 0 ${(niveles[0].cantidad / Math.max(1, tabla.length)) * 100}%, #edb65a ${(niveles[0].cantidad / Math.max(1, tabla.length)) * 100}% ${((niveles[0].cantidad + niveles[1].cantidad) / Math.max(1, tabla.length)) * 100}%, #22b69a 0)`,
                  }}
                >
                  <div>
                    <strong>{tabla.length}</strong>
                    <small>SERVICIOS</small>
                  </div>
                </div>
                <div className="mv-leyenda-riesgo">
                  {niveles.map((n) => (
                    <div key={n.nivel}>
                      <Nivel nivel={n.nivel} />
                      <strong>
                        {n.cantidad}
                        <small>
                          {Math.round(
                            (n.cantidad / Math.max(1, tabla.length)) * 100
                          )}
                          %
                        </small>
                      </strong>
                    </div>
                  ))}
                </div>
              </section>
              <section className="mv-panel mv-alertas">
                <div className="mv-panel-heading">
                  <div>
                    <span className="mv-eyebrow">SEGUIMIENTO ACTIVO</span>
                    <h2>Incidencias en foco</h2>
                  </div>
                  <span className="mv-contador">
                    {data?.resumen.pendientes ?? 0}
                  </span>
                </div>
                {incidentes(data?.criticas || [], 4)}
                {!data?.criticas.length && (
                  <p className="mv-vacio">
                    Sin incidencias pendientes en el periodo.
                  </p>
                )}
                <button
                  type="button"
                  className="mv-text-link"
                  onClick={() => navigate('/incidencias')}
                >
                  Consultar incidencias
                  <IconoMonitor nombre="flecha" tamano={15} />
                </button>
              </section>
            </aside>
          </div>

        </>
      )}
      {tab === 1 && (
        <section className="mv-panel mv-matriz">
          <div className="mv-panel-heading">
            <div>
              <span className="mv-eyebrow">COMPARA EN UNA SOLA VISTA</span>
              <h2>Matriz de evaluación</h2>
              <p>
                Cumplimiento por criterio, riesgo normalizado y aporte al
                resultado.
              </p>
            </div>
            <div className="mv-escala">
              <span>
                <i className="bajo" />
                Bajo
              </span>
              <span>
                <i className="medio" />
                Medio
              </span>
              <span>
                <i className="alto" />
                Alto
              </span>
            </div>
          </div>
          <div className="mv-matriz-scroll">
            <table>
              <thead>
                <tr>
                  <th>Servicio</th>
                  {criterios.map((c, i) => (
                    <th key={c.codigo}>
                      {CORTOS[i]}
                      <small>
                        {Math.round(Number(c.peso) * 100)}% del puntaje
                      </small>
                    </th>
                  ))}
                  <th>Criticidad</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tabla.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.servicio}</strong>
                      <small>{s.cliente}</small>
                    </td>
                    {s.criterios.map((c) => (
                      <td key={c.codigo}>
                        <div
                          className={`mv-heat-cell ${c.riesgo >= 60 ? 'alto' : c.riesgo >= 30 ? 'medio' : 'bajo'}`}
                        >
                          <strong>{c.tasa === null ? c.estado : porcentaje(c.tasa)}</strong>
                          <span>Riesgo {numero(c.riesgo)}</span>
                          <small>{numero(c.aporte)} pts aportados</small>
                        </div>
                      </td>
                    ))}
                    <td>
                      <div className={`mv-matriz-score ${s.nivel}`}>
                        <strong>{numero(s.puntaje)}</strong>
                        <Nivel nivel={s.nivel} />
                      </div>
                    </td>
                    <td>
                      <BotonAccion etiqueta="Ver cálculo del servicio" icono={<IconoMonitor nombre="calculo" tamano={17}/>} onClick={() => calculo(s)}/>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {tab === 2 && (
        <>
          <GraficoEvolucion
            datos={data?.evolucion || []}
            criterios={criterios}
          />
          <div className="mv-evolucion-resumen">
            {totales.map((c, i) => (
              <article className="mv-panel" key={c.codigo}>
                <span>
                  <i style={{ background: COLORES[i] }} />
                  {CORTOS[i]}
                </span>
                <strong>{porcentaje(c.tasa)}</strong>
                <MiniLinea
                  valores={(data?.evolucion || []).map(
                    (d) => d.criterios[i].tasa
                  )}
                  color={COLORES[i]}
                />
                <small>
                  Primer KPI: {c.primero.n}/{c.primero.d} · Segundo KPI: {c.segundo.n}/{c.segundo.d}
                </small>
              </article>
            ))}
          </div>
          <details className="mv-panel mv-tabla-diaria">
            <summary>
              Consultar el detalle diario de los indicadores
              <span>{data?.evolucion.length ?? 0} días</span>
            </summary>
            <Table
              datos={data?.evolucion || []}
              columnas={[
                { llave: 'dia', titulo: 'Fecha' },
                { llave: 'turnos', titulo: 'Turnos' },
                ...criterios.map((c, i) => ({
                  llave: c.codigo,
                  titulo: CORTOS[i],
                  render: (d) =>
                    `${porcentaje(d.criterios[i].tasa)} · KPI: ${d.criterios[i].kpi01.numerador}/${d.criterios[i].kpi01.denominador} y ${d.criterios[i].kpi02.numerador}/${d.criterios[i].kpi02.denominador}`,
                })),
              ]}
            />
          </details>
        </>
      )}
      {tab === 3 && (
        <section className="mv-panel mv-metodo">
          <div className="mv-panel-heading">
            <div>
              <span className="mv-eyebrow">TRANSPARENCIA EN CADA DECISIÓN</span>
              <h2>El método detrás del monitor</h2>
              <p>De los hechos operativos a una prioridad explicable.</p>
            </div>
            <span className="mv-version">MODELO V2</span>
          </div>
          <div className="mv-metodo-flujo">
            {[
              [
                '01',
                'Datos operativos',
                'Turnos, asistencia, evidencias e incidencias.',
                'personal',
              ],
              [
                '02',
                'Indicadores',
                'Cantidades verificadas y tasas de cumplimiento.',
                'tendencia',
              ],
              [
                '03',
                'Evaluación',
                'Desviación, normalización y suma ponderada.',
                'calculo',
              ],
              [
                '04',
                'Seguimiento',
                'Prioridades, responsables y acciones.',
                'escudo',
              ],
            ].map(([n, t, d, icono]) => (
              <article key={n}>
                <span>
                  {n}
                  <IconoMonitor nombre={icono} tamano={23} />
                </span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
          <div className="mv-formula">
            <span>EL CÁLCULO</span>
            <p>Riesgo = mín(100, desviación ÷ umbral × 100)</p>
            <small>
              Aporte = riesgo × peso. Criticidad = suma de los cinco aportes.
            </small>
          </div>
          <div className="mv-definiciones">
            {[
              ['Puntualidad y asistencia', 'KPI 01: asistencia validada. KPI 02: ingresos puntuales entre las asistencias.'],
              ['Cumplimiento de protocolos y consignas', 'KPI 03: verificaciones conformes. KPI 04: consignas cumplidas entre las verificadas.'],
              ['Cumplimiento de actividades y rondas', 'KPI 05: actividades completadas. KPI 06: rondas completadas entre las exigibles.'],
              ['Cumplimiento de reportes operativos', 'KPI 07: reportes entregados. KPI 08: entregados dentro del plazo entre los requeridos exigibles.'],
              ['Gestión de incidencias', 'KPI 09: resolución. KPI 10: primera atención en plazo, con exigibilidad independiente.'],
            ].map(([t, d], i) => (
              <article key={t}>
                <span style={{ color: COLORES[i] }}>C0{i + 1}</span>
                <div>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
                <b>{Math.round(Number(criterios[i]?.peso || 0.2) * 100)}%</b>
              </article>
            ))}
          </div>
          <div className="mv-validacion">
            <div>
              <IconoMonitor nombre="escudo" tamano={23} />
              <h3>Fuentes y validación</h3>
              <p>
                Los cálculos utilizan programación, asistencia validada,
                verificaciones de protocolos y consignas, actividades, rondas, reportes y plazos de atención y resolución. Las
                instantáneas conservan filtros, pesos y resultados. Los
                parámetros deben revisarse con el responsable operativo.
              </p>
            </div>
            <div>
              <h3>Cómo interpretar la prioridad</h3>
              <p>
                <b>0–29.9</b> Bajo control · <b>30–59.9</b> En seguimiento ·{' '}
                <b>60–100</b> Prioridad alta.
              </p>
              <p>
                Los turnos futuros no se penalizan. Sin casos aplicables, el
                criterio no aporta riesgo. Los datos pendientes de verificación
                no se sustituyen por porcentajes ficticios.
              </p>
            </div>
          </div>
          {['administrador', 'jefe_operaciones'].includes(usuario?.rol) && (
            <Button
              tipo="button"
              variante="secundario"
              onClick={() =>
                abrirModal({
                  tipo: 'formulario',
                  tamano: 'lg',
                  titulo: 'Configurar pesos y umbrales',
                  contenido: (
                    <Configuracion
                      criterios={criterios}
                      onGuardar={async (items) => {
                        await actualizarPesosCriterios({ criterios: items });
                        cerrarModal();
                        await cargar();
                      }}
                    />
                  ),
                })
              }
            >
              Configurar el modelo
            </Button>
          )}
        </section>
      )}
      <footer className="mv-footer">
        <div>
          <IconoMonitor nombre="escudo" tamano={16} />
          <span>
            {data?.demo ? 'Datos de demostración' : 'Información operativa'}
            <i />
            Modelo {data?.version || 'operativo-v4'}
            <i />
            {fechaCorte}
          </span>
        </div>
        <Button
          tipo="button"
          disabled={guardando || cargando || !data} motivoDeshabilitado={guardando ? 'Espere a que termine el guardado de la evaluación.' : cargando ? 'Espere mientras se calcula la evaluación.' : 'Primero cargue una evaluación válida antes de guardarla.'}
          title="Conserva una instantánea de los filtros, criterios y puntajes para auditoría"
          onClick={guardar}
        >
          <IconoMonitor nombre="guardar" tamano={16} />
          {guardando ? 'Guardando…' : 'Guardar evaluación'}
        </Button>
      </footer>
    </div>
  );
}
