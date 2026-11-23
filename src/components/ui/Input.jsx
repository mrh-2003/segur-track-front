import './Input.css';
import {AyudaControl} from './AyudaControl';

export function Input({
  label,
  id,
  nombre,
  tipo = 'text',
  valor,
  onChange,
  onBlur,
  error,
  requerido,
  placeholder,
  disabled,
  motivoDeshabilitado,
  ...resto
}) {
  return (
    <div className="campo">
      {label && (
        <label htmlFor={id || nombre} className="campo-label">
          {label}
          {requerido && <span className="campo-obligatorio" aria-hidden="true"> *</span>}
        </label>
      )}
      <AyudaControl motivo={disabled?motivoDeshabilitado:null} bloque><input
        id={id || nombre}
        name={nombre}
        type={tipo}
        value={valor}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        data-motivo-deshabilitado={disabled?motivoDeshabilitado:undefined}
        aria-invalid={!!error}
        aria-describedby={[error ? `${id || nombre}-error` : '',disabled&&motivoDeshabilitado?`${id || nombre}-bloqueo`:''].filter(Boolean).join(' ')||undefined}
        className={`campo-input ${error ? 'campo-input-error' : ''}`}
        {...resto}
      /></AyudaControl>
      {disabled&&motivoDeshabilitado&&<small id={`${id || nombre}-bloqueo`} className="campo-bloqueo">{motivoDeshabilitado}</small>}
      {error && (
        <p id={`${id || nombre}-error`} className="campo-error" role="alert">{error}</p>
      )}
    </div>
  );
}
