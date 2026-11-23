export const ubicacionActual = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) return reject(new Error('Tu navegador no permite obtener la ubicación.'));
  navigator.geolocation.getCurrentPosition(
    ({coords}) => resolve({latitud:coords.latitude,longitud:coords.longitude,precision:coords.accuracy}),
    () => reject(new Error('Permite el acceso a tu ubicación y vuelve a marcar asistencia.')),
    {enableHighAccuracy:true,maximumAge:0,timeout:15000}
  );
});
