import {ControlConAyuda} from '../../components/ui/AyudaControl';
import { useState, useRef } from 'react';
import { Icono } from '../../components/ui/Icono';
import './InicioOperaciones.css';
import {
  prepararImportacion,
  confirmarImportacion,
  descargarPlantilla,
} from '../../api/operaciones';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
export default function ImportarExcel({ onCompletado }) {
  const selector = useRef(null);
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [lote, setLote] = useState(null),
    [error, setError] = useState(''),
    [ocupado, setOcupado] = useState(false),
    [resultado, setResultado] = useState(null);
  const ejecutar = async (fn) => {
    setOcupado(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  };
  const archivo = async (f) => {
    setLote(null);
    setResultado(null);
    if (!f) return;
    setNombreArchivo(f.name);
    if (!/\.xlsx$/i.test(f.name)) { setError('Seleccione un archivo XLSX'); return; }
    if (f.size > 8 * 1024 * 1024) {
      setError('El archivo excede 8 MB');
      return;
    }
    await ejecutar(async () => {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(f);
      });
      setLote(await prepararImportacion({ nombre: f.name, base64 }));
    });
  };
  return (
    <section className="tarjeta inicio-importar">
      <div className="inicio-panel-cabecera"><div className="inicio-panel-identidad"><span className="inicio-icono-excel"><Icono nombre="reportes" tamano={24} /></span><div><h3>Importar tareaje</h3><p>Tu Excel, conectado a la operación.</p></div></div>
        <Button
          tipo="button"
          variante="secundario"
          disabled={ocupado} motivoDeshabilitado={"Espere a que termine la operación en curso antes de continuar."}
          onClick={() => ejecutar(descargarPlantilla)}
        >
          <Icono nombre="descargar" /> Plantilla
        </Button>
      </div>
      <div className="importar-cuerpo"><ControlConAyuda as="button" type="button" className="importar-selector" disabled={ocupado} motivoDeshabilitado={"Espere a que termine la operación en curso antes de continuar."} onClick={() => selector.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => {e.preventDefault(); if(!ocupado) archivo(e.dataTransfer.files?.[0]);}}><span className="importar-subir"><Icono nombre="subir" tamano={24} /></span><span><strong>{nombreArchivo || 'Seleccionar archivo Excel'}</strong><small>{ocupado ? 'Validando archivo…' : 'Arrastra tu archivo aquí · XLSX hasta 8 MB'}</small></span><span className="importar-elegir">{nombreArchivo ? 'Cambiar' : 'Explorar'}</span></ControlConAyuda>
          <input ref={selector} hidden
            type="file"
            accept=".xlsx"
            disabled={ocupado}
            onChange={(e) => {archivo(e.target.files?.[0]); e.target.value='';}}
          />
      <ol className="importar-pasos"><li className={nombreArchivo ? 'listo' : ''}><b>1</b>Subir</li><li className={lote ? 'listo' : ''}><b>2</b>Revisar</li><li className={resultado || lote?.estado==='importado' ? 'listo' : ''}><b>3</b>Importar</li></ol></div>
      {ocupado && <p role="status">Procesando archivo…</p>}
      {error && (
        <p role="alert" style={{ color: 'var(--color-peligro)' }}>
          {error}
        </p>
      )}
      {lote && (
        <>
          <h4 className="importar-resumen">
            {lote.totalFilas} plazas-turno · {lote.errores.length} errores ·{' '}
            {lote.advertencias.length} advertencias
          </h4>
          {lote.estado === 'importado' ? (
            <p>
              Este archivo ya fue importado. No se duplicarán sus registros.
            </p>
          ) : (
            <>
              {lote.errores.length>0 && <Table
                columnas={[
                  { llave: 'fila', titulo: 'Fila' },
                  { llave: 'columna', titulo: 'Celda / columna' },
                  { llave: 'mensaje', titulo: 'Corrección necesaria' },
                ]}
                datos={lote.errores.slice(0, 100)}
                vacio="Sin errores de estructura"
              />}
              {lote.advertencias.length > 0 && (
                <details>
                  <summary>Ver advertencias de datos pendientes</summary>
                  {lote.advertencias.map((a, i) => (
                    <p key={i}>
                      Fila {a.fila}: {a.mensaje}
                    </p>
                  ))}
                </details>
              )}
              {lote.errores.length>0 && <p className="tarjeta-subtitulo">Se muestran hasta 100 errores. Corrija el Excel y vuelva a cargarlo.</p>}
              <h4>Vista previa</h4>
              <Table
                columnas={[
                  { llave: 'codigoServicio', titulo: 'Servicio' },
                  { llave: 'empresa', titulo: 'Contratante' },
                  { llave: 'dni', titulo: 'DNI' },
                  { llave: 'puesto', titulo: 'Puesto' },
                  { llave: 'inicio', titulo: 'Inicio (UTC)' },
                  { llave: 'estado', titulo: 'Estado' },
                ]}
                datos={lote.muestra}
              />
              <Button
                tipo="button"
                disabled={ocupado || lote.errores.length > 0 || !!resultado} motivoDeshabilitado={ocupado ? 'Espere a que termine la validación o importación.' : lote.errores.length>0 ? 'Corrija los errores del archivo Excel y vuelva a cargarlo antes de importar.' : 'Este lote ya fue importado. Seleccione otro archivo para realizar una nueva importación.'}
                onClick={() =>
                  ejecutar(async () => {
                    const r = await confirmarImportacion(lote.id);
                    setResultado(r);
                    onCompletado?.();
                  })
                }
              >
                Confirmar importación de {lote.totalFilas} filas
              </Button>
            </>
          )}
        </>
      )}
      {(resultado || lote?.resultado) && (
        <p role="status">
          Importación completada: {(resultado || lote.resultado).turnos} turnos,{' '}
          {(resultado || lote.resultado).serviciosNuevos} servicios nuevos y{' '}
          {(resultado || lote.resultado).personalNuevo} personas nuevas.
        </p>
      )}
    </section>
  );
}
