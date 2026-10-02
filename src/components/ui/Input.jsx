import './Input.css';

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
      <input
        id={id || nombre}
        name={nombre}
        type={tipo}
        value={valor}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${id || nombre}-error` : undefined}
        className={`campo-input ${error ? 'campo-input-error' : ''}`}
        {...resto}
      />
      {error && (
        <p id={`${id || nombre}-error`} className="campo-error" role="alert">{error}</p>
      )}
    </div>
  );
}
