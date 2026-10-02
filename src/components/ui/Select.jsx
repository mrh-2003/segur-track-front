import './Input.css';

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
      <select
        id={id || nombre}
        name={nombre}
        value={valor}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${id || nombre}-error` : undefined}
        className={`campo-select ${error ? 'campo-select-error' : ''}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      {error && (
        <p id={`${id || nombre}-error`} className="campo-error" role="alert">{error}</p>
      )}
    </div>
  );
}
