# Segur Track — Frontend Web

Aplicación web React + Vite para el sistema de monitoreo operativo Segur Track.

## Requisitos

- Node.js 18 o superior
- npm 9 o superior
- Backend `segur-track-back` ejecutándose en el puerto 3001

## Variables de Entorno

Crear un archivo `.env` en la raíz de `segur-track-front` basado en `.env.example`:

```env
VITE_API_URL=http://localhost:3001/api/v1
```

## Ejecución del Frontend

```bash
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

Para validar estilo y reglas de código:
```bash
npm run lint
```

## Credenciales Iniciales

- Administrador: `admin@segurtrack.pe` / `Admin1234`
- Supervisor: `supervisor@segurtrack.pe` / `Supervisor1234`
- Operador: `operador@segurtrack.pe` / `Operador1234`

## Módulos y Características

- **Inicio**: KPIs con variaciones, gráfico SVG de actividad operativa 24h, accesos rápidos y registro de actividad reciente.
- **Personal**: Gestión de supervisores y agentes con KPIs, filtros por estado, búsqueda en tiempo real, cambio de estado y eliminación lógica con confirmación Modal.
- **Turnos**: Planificación semanal con selector de fechas, visualización por franjas horarias con chips de color, panel de alertas del día y asignación con prevención de solapamientos.
- **Servicios**: Control de servicios activos y finalizados, panel de detalle rápido lateral y gestión de supervisores asignados.
- **Incidencias**: Registro de eventos con código autogenerado (`INC-0001`), prioridad, flujo de estados (abierta, en atención, cerrada) y panel de incidencias recientes.
- **Dashboard BI**: Indicadores operativos clave, evolución de cumplimiento semanal con gráfico de 2 líneas SVG, distribución de incidencias con gráfico de dona SVG, tabla de desempeño y visor de reporte Power BI embebido.
- **Monitor Multicriterio**: Evaluación MCDA con método de suma ponderada de 5 criterios normalizados, clasificación en niveles de atención (alta, media, baja), identificación de criterios influyentes y editor modal de pesos para administradores.
- **Reportes**: Generación y exportación de reportes en formatos Excel (XLSX) y PDF, segmentados por categorías operativas, incidencias y multicriterio, con historial de generación.
- **Tema Oscuro y Claro**: Selector dinámico en la barra superior con variables CSS armoniosas y contraste adecuado en ambos modos.
- **Buscador Global**: Búsqueda integrada en la cabecera sobre personal, servicios e incidencias con retraso optimizado de 300 ms.
- **Modales y Diálogos**: Todos los mensajes informativos, de error, confirmaciones y formularios se gestionan mediante el componente Modal accesible (`aria-modal`, cierre con Esc, trampeo de foco).
