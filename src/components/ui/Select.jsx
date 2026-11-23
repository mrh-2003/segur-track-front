import './Input.css';
import {AyudaControl} from './AyudaControl';

export function Select({
  label,
  id,
  nombre,
  valor,
  onChange,
  onBlur,
  error,
  requerido,
  children,
  disabled,
  motivoDeshabilitado,
  placeholder,
}) {
  return (
    <div className="campo">
      {label && (
        <label htmlFor={id || nombre} className="campo-label">
          {label}
          {requerido && <span className="campo-obligatorio" aria-hidden="true"> *</span>}
        </label>
      )}
      <AyudaControl motivo={disabled?motivoDeshabilitado:null} bloque><select
        id={id || nombre}
        name={nombre}
        value={valor}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        data-motivo-deshabilitado={disabled?motivoDeshabilitado:undefined}
        aria-invalid={!!error}
        aria-describedby={[error ? `${id || nombre}-error` : '',disabled&&motivoDeshabilitado?`${id || nombre}-bloqueo`:''].filter(Boolean).join(' ')||undefined}
        className={`campo-select ${error ? 'campo-select-error' : ''}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select></AyudaControl>
      {disabled&&motivoDeshabilitado&&<small id={`${id || nombre}-bloqueo`} className="campo-bloqueo">{motivoDeshabilitado}</small>}
      {error && (
        <p id={`${id || nombre}-error`} className="campo-error" role="alert">{error}</p>
      )}
    </div>
  );
}
