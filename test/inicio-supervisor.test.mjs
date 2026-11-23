import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createElement as h} from 'react';
import {renderToString} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {createServer} from 'vite';

test('Inicio de supervisor muestra su resumen y accesos permitidos',async()=>{
  const vite=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
  try{
    const {default:Inicio}=await vite.ssrLoadModule('/src/pages/inicio/InicioPage.jsx');
    const {AuthContext}=await vite.ssrLoadModule('/src/context/auth.context.js');
    const {ModalContext}=await vite.ssrLoadModule('/src/context/modal.context.js');
    const html=renderToString(h(MemoryRouter,null,
      h(AuthContext.Provider,{value:{usuario:{id:2,rol:'supervisor'}}},
        h(ModalContext.Provider,{value:{informar(){}}},h(Inicio)))));
    assert.match(html,/pagina-titulo">Inicio/);
    assert.match(html,/Resumen de tus servicios y agentes asignados/);
    assert.match(html,/Mi personal/);
    assert.match(html,/Asignar turno/);
    assert.doesNotMatch(html,/Nuevo personal|Registrar ausencia|Importar Excel/);
  }finally{await vite.close();}
});
