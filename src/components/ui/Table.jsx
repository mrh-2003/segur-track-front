import './Table.css';

export function Table({ columnas, datos, cargando, vacio = 'Sin datos disponibles' }) {
  if (cargando) {
    return (
      <div className="tabla-contenedor">
        <div className="tabla-skeleton">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="tabla-skeleton-fila" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="tabla-contenedor">
      <table className="tabla">
        <thead>
          <tr>
            {columnas.map((col) => (
              <th key={col.llave} className="tabla-th">{col.titulo}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {datos.length === 0 ? (
            <tr>
              <td colSpan={columnas.length} className="tabla-vacio">{vacio}</td>
            </tr>
          ) : (
            datos.map((fila, i) => (
              <tr key={fila.id ?? i} className="tabla-tr">
                {columnas.map((col) => (
                  <td key={col.llave} className="tabla-td">
                    {col.render ? col.render(fila) : fila[col.llave]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
