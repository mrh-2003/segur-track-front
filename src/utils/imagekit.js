import { obtenerImagekitAuth } from '../api/turnos';

export const subirFotoImageKit = async (archivo) => {
  const auth = await obtenerImagekitAuth();
  if (!auth?.signature || !auth?.token || !auth?.expire || !auth?.publicKey) throw new Error('No se pudo autorizar la carga de fotografías');

  const formData = new FormData();
  formData.append('file', archivo);
  formData.append('fileName', archivo.name);
  formData.append('publicKey', auth.publicKey);
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
  if (!data || !/^https:\/\//i.test(data.url || '')) {
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
