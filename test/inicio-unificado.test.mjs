import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import {createElement as h} from 'react';
import {renderToString} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {createServer} from 'vite';

test('Inicio reúne resumen e indicadores y no muestra los módulos retirados',async()=>{
 const vite=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
 try{
  const {default:Inicio}=await vite.ssrLoadModule('/src/pages/inicio/InicioPage.jsx');
  const {Sidebar}=await vite.ssrLoadModule('/src/components/layout/Sidebar.jsx');
  const {AuthContext}=await vite.ssrLoadModule('/src/context/auth.context.js');
  const {ModalContext}=await vite.ssrLoadModule('/src/context/modal.context.js');
  const {funcionalidades}=await vite.ssrLoadModule('/src/config/funcionalidades.js');
  const render=(rol,ruta,Componente=Inicio)=>renderToString(h(MemoryRouter,{initialEntries:[ruta]},h(AuthContext.Provider,{value:{usuario:{id:1,rol}}},h(ModalContext.Provider,{value:{informar(){}}},h(Componente)))));
  for(const rol of ['administrador','jefe_operaciones','supervisor']){
   const resumen=render(rol,'/');
   assert.match(resumen,/role="tablist" aria-label="Contenido de Inicio"/);
   assert.match(resumen,/Reportes e indicadores/);
   assert.doesNotMatch(resumen,/Importar tareaje|Seleccionar archivo Excel/);
   const bi=render(rol,'/?vista=indicadores');
   assert.equal((bi.match(/<h1/g)||[]).length,1,'Solo hay una cabecera de página: Inicio');
   assert.match(bi,/role="tabpanel" aria-labelledby="inicio-tab-indicadores"/);
   assert.match(bi,/Periodo BI/);
   assert.doesNotMatch(bi,/Importar tareaje|Disponibilidad del personal/);
   if(rol==='supervisor'){
    assert.match(bi,/tus servicios asignados/);
    assert.doesNotMatch(bi,/Sincronizar datos|Configurar metas/);
   }else assert.match(bi,/Sincronizar datos/);
   const menu=render(rol,'/',Sidebar);
   assert.match(menu,/Inicio/);
   assert.doesNotMatch(menu,/Monitor Operativo|Dashboard BI|href="\/monitor-operativo"|href="\/dashboard-bi"/);
  }
  assert.equal(funcionalidades.importarTareaje,false);
  assert.ok(fs.existsSync('src/pages/inicio/ImportarExcel.jsx'),'El importador debe conservarse');
  assert.ok(!fs.existsSync('src/pages/monitor-operativo/MonitorOperativoPage.jsx'),'La pantalla retirada ya no debe existir');
 }finally{await vite.close();}
});
