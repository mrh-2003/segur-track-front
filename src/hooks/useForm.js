import { useState, useCallback } from 'react';

export function useForm(valoresIniciales, validar) {
  const [valores, setValores] = useState(valoresIniciales);
  const [errores, setErrores] = useState({});
  const [tocados, setTocados] = useState({});

  const manejarCambio = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValores((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (tocados[name] && validar) {
      const nuevosErrores = validar({ ...valores, [name]: type === 'checkbox' ? checked : value });
      setErrores((prev) => ({ ...prev, [name]: nuevosErrores[name] }));
    }
  }, [valores, tocados, validar]);

  const manejarBlur = useCallback((e) => {
    const { name } = e.target;
    setTocados((prev) => ({ ...prev, [name]: true }));
    if (validar) {
      const nuevosErrores = validar(valores);
      setErrores((prev) => ({ ...prev, [name]: nuevosErrores[name] }));
    }
  }, [valores, validar]);

  const establecerValor = useCallback((name, value) => {
    setValores((prev) => ({ ...prev, [name]: value }));
  }, []);

  const establecerErroresApi = useCallback((erroresApi = []) => {
    const mapeados = {};
    erroresApi.forEach(({ campo, mensaje }) => { mapeados[campo] = mensaje; });
    setErrores(mapeados);
  }, []);

  const validarTodo = useCallback(() => {
    if (!validar) return true;
    const nuevosErrores = validar(valores);
    setErrores(nuevosErrores);
    setTocados(Object.keys(valores).reduce((a, k) => ({ ...a, [k]: true }), {}));
    return Object.keys(nuevosErrores).length === 0;
  }, [valores, validar]);

  const resetear = useCallback((nuevosValores = valoresIniciales) => {
    setValores(nuevosValores);
    setErrores({});
    setTocados({});
  }, [valoresIniciales]);

  return {
    valores, errores, tocados,
    manejarCambio, manejarBlur,
    establecerValor, establecerErroresApi,
    validarTodo, resetear,
  };
}
