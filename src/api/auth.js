import { post, get, put } from './cliente';

export const login = (credenciales) => post('/auth/login', credenciales);
export const obtenerPerfil = () => get('/auth/perfil');
export const actualizarPerfil = (datos) => put('/auth/perfil', datos);
export const cambiarClave = (datos) => put('/auth/cambiar-clave', datos);
export const solicitarRecuperacion = (datos) => post('/auth/solicitar-recuperacion', datos);
export const restablecerClave = (datos) => post('/auth/restablecer-clave', datos);
export const logout = () => post('/auth/logout', {});
