import { post, get } from './cliente';

export const login         = (credenciales) => post('/auth/login', credenciales);
export const obtenerPerfil = ()             => get('/auth/perfil');
export const logout        = ()             => post('/auth/logout', {});
