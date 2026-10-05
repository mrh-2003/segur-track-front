import { obtenerImagekitAuth } from '../api/turnos';

const CLAVE_PUBLICA_DEFECTO = 'public_Fj0ZZ7V3VHgYIKtwZhBpVyiIzXI=';
const CLAVE_PRIVADA_FALLBACK = 'private_R0Iv34nCJ/48Klu1L4JIIpvuHAk=';

const generarFirmaFallback = async (token, expire) => {
  const enc = new TextEncoder();
  const key = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(CLAVE_PRIVADA_FALLBACK),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const sig = await window.crypto.subtle.sign('HMAC', key, enc.encode(token + expire));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
};

const obtenerParametrosAuth = async () => {
  try {
    const auth = await obtenerImagekitAuth();
    if (auth && auth.signature && auth.token && auth.expire) {
      return auth;
    }
  } catch (error) {
    void error;
  }

  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expire = Math.floor(Date.now() / 1000) + 3000;
  const signature = await generarFirmaFallback(token, expire);
  return {
    token,
    expire,
    signature,
    publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || CLAVE_PUBLICA_DEFECTO,
  };
};

export const subirFotoImageKit = async (archivo) => {
  const auth = await obtenerParametrosAuth();

  const formData = new FormData();
  formData.append('file', archivo);
  formData.append('fileName', archivo.name);
  formData.append('publicKey', auth.publicKey || import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || CLAVE_PUBLICA_DEFECTO);
  formData.append('signature', auth.signature);
  formData.append('token', auth.token);
  formData.append('expire', auth.expire);
  formData.append('useUniqueFileName', 'true');
  formData.append('folder', '/evidencias/');

  const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Error en la respuesta de ImageKit al subir ${archivo.name}`);
  }

  const data = await res.json();
  if (!data || !data.url) {
    throw new Error(`No se recibió la URL de la imagen ${archivo.name}`);
  }

  return data.url;
};

export const subirMultiplesFotosImageKit = async (archivos, alProgreso) => {
  const urls = [];
  for (let i = 0; i < archivos.length; i++) {
    if (alProgreso) {
      alProgreso(i + 1, archivos.length);
    }
    const url = await subirFotoImageKit(archivos[i]);
    urls.push(url);
  }
  return urls;
};
