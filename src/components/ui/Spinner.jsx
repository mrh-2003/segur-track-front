import './Spinner.css';

export function Spinner({ tamano = 'md', texto }) {
  return (
    <div className="spinner-contenedor" role="status" aria-label={texto || 'Cargando'}>
      <div className={`spinner spinner-${tamano}`} />
      {texto && <p className="spinner-texto">{texto}</p>}
    </div>
  );
}
