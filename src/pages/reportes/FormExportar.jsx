import { useForm } from '../../hooks/useForm';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

const validar = (v) => {
  const e = {};
  if (!v.tipo) e.tipo = 'El tipo de reporte es obligatorio';
  if (!v.formato) e.formato = 'El formato es obligatorio';
  return e;
};

export default function FormExportar({ onGuardar, onCancelar, cargando }) {
  const { valores, errores, manejarCambio, manejarBlur, validarTodo } = useForm(
    { tipo: '', formato: '' },
    validar
  );

  const manejarSubmit = (e) => {
    e.preventDefault();
    if (!validarTodo()) return;
    const categoria = ['servicios', 'turnos'].includes(valores.tipo)
      ? 'operativos'
      : valores.tipo === 'incidencias'
      ? 'incidencias'
      : 'multicriterio';
    onGuardar({ ...valores, categoria });
  };

  return (
    <form onSubmit={manejarSubmit} noValidate>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
        <Select
          id="exp-tipo"
          label="Tipo de reporte"
          nombre="tipo"
          valor={valores.tipo}
          onChange={manejarCambio}
          onBlur={manejarBlur}
          error={errores.tipo}
          placeholder="Seleccionar tipo de reporte"
          requerido
        >
          <option value="servicios">Servicios</option>
          <option value="turnos">Turnos</option>
          <option value="incidencias">Incidencias</option>
          <option value="bi">Dashboard BI</option>
          <option value="multicriterio">Multicriterio</option>
        </Select>

        <Select
          id="exp-formato"
          label="Formato de exportación"
          nombre="formato"
          valor={valores.formato}
          onChange={manejarCambio}
          onBlur={manejarBlur}
          error={errores.formato}
          placeholder="Seleccionar formato"
          requerido
        >
          <option value="xlsx">Excel (XLSX)</option>
          <option value="pdf">Documento PDF</option>
        </Select>
      </div>

      <div className="form-pie">
        <Button tipo="button" variante="secundario" onClick={onCancelar} disabled={cargando}>
          Cancelar
        </Button>
        <Button tipo="submit" variante="primario" cargando={cargando}>
          Generar reporte
        </Button>
      </div>
    </form>
  );
}
