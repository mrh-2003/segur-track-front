import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

test('el detalle del modal se renderiza fuera de Router y recibe la navegación de su página', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  try {
    const { DetallePrioridad } = await vite.ssrLoadModule('/src/pages/monitor-multicriterio/MonitorMulticriterioPage.jsx');
    // ModalProvider muestra el contenido como hermano de AppRouter, fuera de BrowserRouter.
    const html = renderToString(createElement(DetallePrioridad, {
      servicioId: 1,
      filtros: { periodo: '30', turno: 'ambos' },
      onAbrirIncidencia: () => {},
    }));
    assert.match(html, /Cargando análisis/);
  } finally {
    await vite.close();
  }
});
