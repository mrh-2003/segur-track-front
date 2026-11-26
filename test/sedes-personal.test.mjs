import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createElement as h} from 'react';
import {renderToString} from 'react-dom/server';
import {createServer} from 'vite';

test('Personal usa sedes opcionales para administradores y jefes, múltiples para supervisores y única para agentes',async()=>{
 const vite=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
 try{
  const {default:Form}=await vite.ssrLoadModule('/src/pages/personal/FormPersonal.jsx');
  const sedes=[{id:1,nombre:'Sede Norte'},{id:2,nombre:'Sede Sur'}];
  const render=cargo=>renderToString(h(Form,{inicial:{cargo,sede_id:1,sede_ids:[1,2]},sedes}));
  const sup=render('supervisor');
  assert.match(sup,/2 sedes seleccionadas/);
  assert.match(sup,/una o varias sedes, sin límite/);
  assert.match(sup,/type="checkbox" checked=""/);
  const jefe=render('jefe_operaciones');
  assert.match(jefe,/Opcional. El jefe de operaciones mantiene acceso a todas las sedes/);
  const admin=renderToString(h(Form,{inicial:{cargo:'administrador',sede_ids:[]},sedes:[],puedeGestionarAdministradores:true}));
  assert.match(admin,/<option value="administrador" selected="">Administrador/);
  assert.match(admin,/El administrador mantiene acceso a todas las sedes/);
  assert.doesNotMatch(admin,/Cree una sede antes/);
  assert.doesNotMatch(render('jefe_operaciones'),/<option value="administrador"/);
  const agente=render('agente');
  assert.match(agente,/<select[^>]*name="sedeId"/);
  assert.doesNotMatch(agente,/selector-sedes-desplegable/);
  const {default:Sede}=await vite.ssrLoadModule('/src/pages/sedes/FormSede.jsx');
  assert.match(renderToString(h(Sede,{})),/Sin supervisor asignado/);
 }finally{await vite.close();}
});
