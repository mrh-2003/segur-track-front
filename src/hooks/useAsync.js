import { useState, useCallback, useRef } from 'react';

export function useAsync() {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const enCurso = useRef(false);

  const ejecutar = useCallback(async (fn) => {
    if (enCurso.current) return;
    enCurso.current = true;
    setCargando(true);
    setError(null);
    try {
      const resultado = await fn();
      return resultado;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setCargando(false);
      enCurso.current = false;
    }
  }, []);

  return { cargando, error, ejecutar };
}
